'use strict';
// Main-process source sharing authority. URI data never belongs to project or
// Journal snapshots. Native consent and fetch/content observations are separate.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {canonical}=require('./live-policy.cjs'),policy=require('./byteplus-contract-policy.cjs');
const handles=new WeakMap(),assetAuthorities=new WeakMap(),DAY=86400000;
const sha=v=>crypto.createHash('sha256').update(v).digest('hex'),stamp=v=>sha(canonical(v));
const fail=code=>{throw Object.assign(Error('BytePlus source registration unavailable; no sharing or generation authorized.'),{code});};
function plain(v,seen=new Set(),depth=0){
 if(v===null||['string','boolean'].includes(typeof v)||typeof v==='number'&&Number.isFinite(v))return v;
 if(!v||typeof v!=='object'||seen.has(v)||depth>12||!Array.isArray(v)&&Object.getPrototypeOf(v)!==Object.prototype)fail('BP_CARRIER_SCHEMA');
 const out=Array.isArray(v)?[]:{};seen.add(v);
 for(const k of Reflect.ownKeys(v)){if(Array.isArray(v)&&k==='length')continue;const d=Object.getOwnPropertyDescriptor(v,k);if(typeof k!=='string'||k==='__proto__'||!d.enumerable||!Object.hasOwn(d,'value'))fail('BP_CARRIER_SCHEMA');out[k]=plain(d.value,seen,depth+1);}
 seen.delete(v);return out;
}
function exact(v,required,optional=[]){if(!v||Object.getPrototypeOf(v)!==Object.prototype||required.some(k=>!Object.hasOwn(v,k))||Object.keys(v).some(k=>!required.includes(k)&&!optional.includes(k)))fail('BP_CARRIER_SCHEMA');}
function id(v){if(typeof v!=='string'||!/^carrier-[a-f0-9-]{36}$/.test(v))fail('BP_CARRIER_ID');return v;}
function localIdentity(r){
 const out=Object.fromEntries(['assetNodeId','mediaVersionId','contentSha256','byteSize','mimeType','metadata','mediaKind','role'].map(k=>[k,r?.[k]]));
 if(r?.mediaKind!=='video'||r.role!=='REFERENCE_VIDEO'||!out.assetNodeId||!out.mediaVersionId||!/^[a-f0-9]{64}$/.test(out.contentSha256??'')||!Number.isSafeInteger(out.byteSize)||out.byteSize<1||out.byteSize>200000000||!['video/mp4','video/quicktime'].includes(out.mimeType))fail('BP_CARRIER_IDENTITY');return plain(out);
}
function uri(value,kind){
 if(typeof value!=='string'||value.length<1||value.length>16384||/[\\\s\x00-\x1f\x7f]/.test(value)||/%(?:0[0-9a-f]|1[0-9a-f]|7f)/i.test(value))fail('BP_CARRIER_URI');
 if(kind==='asset'){if(!/^asset:\/\/[-A-Za-z0-9_]{1,128}$/.test(value))fail('BP_CARRIER_ASSET');return value;}
 let u;try{u=new URL(value);}catch{fail('BP_CARRIER_URI');}
 if(u.href!==value||u.protocol!=='https:'||u.username||u.password||u.port||u.hash||u.hostname.endsWith('.')||require('node:net').isIP(u.hostname.replace(/^\[|\]$/g,''))||!u.hostname.includes('.')||u.searchParams.size>64)fail('BP_CARRIER_URI');return value;
}
function tokenHashes(source){
 const values=new Set([source.uri]);if(source.kind==='asset')values.add(source.uri.slice(8));
 for(const value of [source.uri,source.verificationUri])if(value?.startsWith('https:'))for(const v of new URL(value).searchParams.values())if(v)values.add(v);
 return [...values].map(v=>({length:v.length,sha256:sha(v)}));
}
function safeDirectory(root){if(!path.isAbsolute(root))fail('BP_CARRIER_STORAGE');for(let p=path.resolve(root);;p=path.dirname(p)){if(fs.existsSync(p)&&fs.lstatSync(p).isSymbolicLink())fail('BP_CARRIER_STORAGE');if(path.dirname(p)===p)break;}}
const projectKeys=['libraryId','copyId','projectId','graphId'];
function context(value){const c=plain(value);exact(c,['scope','local','guard']);if(c.scope.provider!=='byteplus-modelark'||c.scope.region!=='ap-southeast-1'||c.scope.canonicalModelId!=='dreamina-seedance-2-5-260628'||[...projectKeys,'connectionId','keyEpoch','routingId','selectorValue'].some(k=>typeof c.scope[k]!=='string'||!c.scope[k])||!Number.isSafeInteger(c.scope.configRevision))fail('BP_CARRIER_SCOPE');c.local=localIdentity(c.local);return c;}
function binding(r){return {registrationId:r.registrationId,version:1,revision:r.revision,scopeSha256:stamp(r.scope),sourceIdentitySha256:stamp(r.local),uriSha256:r.uriSha256,verificationUriSha256:r.verificationUriSha256,assetVersionSha256:r.assetVersionSha256,kind:r.kind,expiresAtMs:r.expiresAtMs,createdAtMs:r.createdAtMs,consent:'NATIVE_APPROVED',sourceVerification:'RECHECK_REQUIRED'};}
function createBytePlusInputCarrierRegistry(options={}){
 const {directory,storage,capture,readLocal,decode,clock=Date.now,lookup,open,resolveAsset}=options;
 const injected=lookup!==undefined||open!==undefined;
 if(typeof directory!=='string'||[capture,readLocal,decode,clock].some(f=>typeof f!=='function')||!storage||typeof storage.encryptStringAsync!=='function'||typeof storage.decryptStringAsync!=='function'||injected&&[lookup,open].some(f=>typeof f!=='function')||resolveAsset!==undefined&&typeof resolveAsset!=='function')fail('BP_CARRIER_PORTS');
 const environment=injected?'engineering-fake':'provider',pending=new Map(),observations=new Map(),mediaAuthority=policy.mediaAuthority();let lastTime=0;
 function time(){const t=clock();if(!Number.isSafeInteger(t)||t<lastTime)fail('BP_CARRIER_CLOCK');lastTime=t;return t;}
 function file(registrationId){safeDirectory(directory);return path.join(directory,id(registrationId)+'.json');}
 function write(r,expected){
  safeDirectory(directory);fs.mkdirSync(directory,{recursive:true});const target=file(r.registrationId),lock=target+'.lock',temp=target+'.'+crypto.randomUUID()+'.tmp';let fd;
  try{fd=fs.openSync(lock,'wx');if(expected===undefined&&fs.existsSync(target)||expected!==undefined&&(!fs.existsSync(target)||sha(fs.readFileSync(target))!==expected))fail('BP_CARRIER_CHANGED');const data={...r};delete data.recordSha256;data.recordSha256=stamp(data);const bytes=Buffer.from(JSON.stringify(data));if(bytes.length>65536)fail('BP_CARRIER_STORAGE');const out=fs.openSync(temp,'wx',0o600);try{fs.writeFileSync(out,bytes);fs.fsyncSync(out);}finally{fs.closeSync(out);}fs.renameSync(temp,target);return data;}
  catch(e){if(/^BP_CARRIER_/.test(e?.code??''))throw e;fail('BP_CARRIER_STORAGE');}
  finally{if(fs.existsSync(temp))fs.unlinkSync(temp);if(fd!==undefined){fs.closeSync(fd);fs.unlinkSync(lock);}}
 }
 function read(registrationId){
  const target=file(registrationId);let r,bytes;try{const s=fs.lstatSync(target);if(!s.isFile()||s.isSymbolicLink()||s.nlink!==1||s.size>65536)fail('BP_CARRIER_STORAGE');bytes=fs.readFileSync(target);r=JSON.parse(bytes);}catch(e){if(/^BP_CARRIER_/.test(e?.code??''))throw e;fail('BP_CARRIER_MISSING');}
  const {recordSha256,...rest}=r;if(recordSha256!==stamp(rest)||r.registrationId!==registrationId||r.version!==1||r.consent!=='NATIVE_APPROVED'||!Number.isSafeInteger(r.expiresAtMs)||!Number.isSafeInteger(r.createdAtMs)||r.expiresAtMs<=r.createdAtMs||r.expiresAtMs-r.createdAtMs>7*DAY||!['provider','engineering-fake'].includes(r.environment))fail('BP_CARRIER_STORAGE');
  const now=time();if(now>=r.expiresAtMs&&r.uriCiphertext){r=write({...r,uriCiphertext:null},sha(bytes));bytes=fs.readFileSync(target);}
  return {record:r,diskSha256:sha(bytes)};
 }
 function match(r,c,{active=true}={}){
  if(stamp(r.scope)!==stamp(c.scope)||stamp(r.local)!==stamp(c.local)||r.environment!==environment)fail('BP_CARRIER_IDENTITY');
  if(active&&(r.revokedAtMs!==null||time()>=r.expiresAtMs))fail(r.revokedAtMs!==null?'BP_CARRIER_REVOKED':'BP_CARRIER_EXPIRED');return r;
 }
 async function decrypt(r){
  if(!r.uriCiphertext)fail('BP_CARRIER_EXPIRED');let e;try{const d=await storage.decryptStringAsync(Buffer.from(r.uriCiphertext,'base64'));if(d.shouldReEncrypt===true)fail('BP_CARRIER_STORAGE');e=plain(JSON.parse(d.result));}catch{fail('BP_CARRIER_STORAGE');}
  if(e.bindingSha256!==r.consentSha256||e.bindingSha256!==stamp({...binding(r),revision:1})||sha(e.source.uri)!==r.uriSha256||sha(e.source.verificationUri??e.source.uri)!==r.verificationUriSha256||sha(e.source.assetVersion??'')!==r.assetVersionSha256)fail('BP_CARRIER_STORAGE');return e.source;
 }
 const get=(registrationId,c)=>match(read(registrationId).record,c);
 async function propose(value){
  const input=plain(value);exact(input,['nodeId','expectedRevision','routingId','reference','source','expiresAtMs']);exact(input.source,['kind','uri'],input.source.kind==='asset'?['verificationUri','assetVersion']:[]);
  if(!['url','asset'].includes(input.source.kind))fail('BP_CARRIER_SCHEMA');uri(input.source.uri,input.source.kind);if(input.source.kind==='asset'){uri(input.source.verificationUri,'url');if(typeof input.source.assetVersion!=='string'||!/^[-A-Za-z0-9_.]{1,128}$/.test(input.source.assetVersion))fail('BP_CARRIER_ASSET');}
  const t=time();if(!Number.isSafeInteger(input.expiresAtMs)||input.expiresAtMs<=t+120000||input.expiresAtMs>t+7*DAY)fail('BP_CARRIER_EXPIRY');const c=context(await capture(input));if(stamp(c.local)!==stamp(localIdentity(input.reference)))fail('BP_CARRIER_IDENTITY');
  const bytes=await readLocal(c.local);if(!(bytes instanceof Uint8Array)||bytes.length!==c.local.byteSize||sha(bytes)!==c.local.contentSha256)fail('BP_CARRIER_IDENTITY');
  const decoded=await decode(bytes);if(decoded?.fullyDecoded!==true||decoded.contentSha256!==c.local.contentSha256||decoded.byteSize!==c.local.byteSize||decoded.mimeType!==c.local.mimeType||Object.keys(c.local.metadata).some(k=>decoded[k]!==c.local.metadata[k]))fail('BP_CARRIER_LOCAL_DECODE');
  const proposalId='carrier-'+crypto.randomUUID(),summary={version:1,proposalId,scope:c.scope,local:c.local,kind:input.source.kind,uriSha256:sha(input.source.uri),verificationUriSha256:sha(input.source.verificationUri??input.source.uri),assetVersionSha256:sha(input.source.assetVersion??''),expiresAtMs:input.expiresAtMs,purpose:'SHARE_EXACT_REFERENCE_VIDEO_FOR_GENERATION',environment,consent:'NOT_GRANTED',availability:'NOT_VERIFIED'},digest=stamp(summary);
  pending.set(proposalId,{input,c,summary,digest,createdAtMs:t});return {proposalId,digest,summary};
 }
 async function pendingCurrent(proposalId,digest){const p=pending.get(id(proposalId));if(!p||p.digest!==digest||time()>=Math.min(p.createdAtMs+120000,p.input.expiresAtMs)||stamp(context(await capture(p.input)))!==stamp(p.c))fail('BP_CARRIER_PREVIEW_STALE');return p;}
 async function nativePreview(proposalId,digest){const p=await pendingCurrent(proposalId,digest);return {previewId:proposalId,digest,name:'BytePlus reference source sharing',carrierConsent:p.summary,privateSourceDetails:{uri:p.input.source.uri,verificationUri:p.input.source.verificationUri??null,assetVersion:p.input.source.assetVersion??null},paid:false};}
 async function approveNative(proposalId,digest){
  const p=await pendingCurrent(proposalId,digest);pending.delete(proposalId);const r={version:1,registrationId:proposalId,revision:1,scope:p.c.scope,local:p.c.local,kind:p.input.source.kind,uriSha256:sha(p.input.source.uri),verificationUriSha256:sha(p.input.source.verificationUri??p.input.source.uri),assetVersionSha256:sha(p.input.source.assetVersion??''),createdAtMs:p.createdAtMs,expiresAtMs:p.input.expiresAtMs,environment,consent:'NATIVE_APPROVED',approvedAtMs:time(),revokedAtMs:null,redactionHashes:tokenHashes(p.input.source)};r.consentSha256=stamp(binding(r));
  let ciphertext;try{ciphertext=await storage.encryptStringAsync(JSON.stringify({bindingSha256:r.consentSha256,source:p.input.source}));}catch{fail('BP_CARRIER_STORAGE');}if(!Buffer.isBuffer(ciphertext)||ciphertext.length<16)fail('BP_CARRIER_STORAGE');r.uriCiphertext=ciphertext.toString('base64');write(r);return binding(r);
 }
 function publicBinding(registrationId,value){return binding(get(registrationId,context(value)));}
 async function verify(registrationId,value,{signal}={}){
  const c=context(value),r=get(registrationId,c);if(signal?.aborted)fail('BP_CARRIER_CANCELLED');if(!injected)policy.assertNativeRuntime();const source=await decrypt(r),target=source.kind==='url'?source.uri:source.verificationUri,accountScopeId=stamp({connectionId:r.scope.connectionId,keyEpoch:r.scope.keyEpoch});let assetAuthority;
  if(source.kind==='asset'){
   if(typeof resolveAsset!=='function')fail('BP_CARRIER_ASSET_ADAPTER_UNAVAILABLE');const abort=new AbortController();let timer,onAbort,proof;try{proof=plain(await Promise.race([Promise.resolve().then(()=>resolveAsset(Object.freeze({assetId:source.uri.slice(8),assetVersion:source.assetVersion,accountScopeId,provider:r.scope.provider,region:r.scope.region,canonicalModelId:r.scope.canonicalModelId}),{signal:abort.signal})),new Promise((_,reject)=>{onAbort=()=>{abort.abort();reject(Object.assign(Error('Source verification cancelled'),{code:'BP_CARRIER_CANCELLED'}));};signal?.addEventListener('abort',onAbort,{once:true});if(signal?.aborted)onAbort();timer=setTimeout(()=>{abort.abort();reject(Object.assign(Error('Source verification timed out'),{code:'BP_CARRIER_TIMEOUT'}));},30000);})]));}finally{clearTimeout(timer);signal?.removeEventListener('abort',onAbort);abort.abort();}
   const expected={assetId:source.uri.slice(8),assetVersion:source.assetVersion,accountScopeId,provider:r.scope.provider,region:r.scope.region,canonicalModelId:r.scope.canonicalModelId,contentSha256:r.local.contentSha256,byteSize:r.local.byteSize,mimeType:r.local.mimeType,downloadURL:target};
   if(Object.keys(expected).some(k=>proof[k]!==expected[k])||!Number.isSafeInteger(proof.availableUntilMs)||proof.availableUntilMs<r.expiresAtMs)fail('BP_CARRIER_ASSET_PROOF');assetAuthority=Object.freeze({});assetAuthorities.set(assetAuthority,{registry:api,registrationId,context:c,uri:source.uri,accountScopeId});
  }
  const {createBytePlusMediaBoundary}=await import('./byteplus-media-transport.mjs');const m={...r.local,sourceId:registrationId,sourceVersionId:'source-'+r.consentSha256.slice(0,32),requireAlpha:false};delete m.mediaKind;delete m.role;
  const boundary=createBytePlusMediaBoundary({mode:injected?'offline-mock':'byteplus-https',contractAuthority:mediaAuthority,sourceAuthorization:assetAuthority,retainInlineBase64:false,clock:time,maxAttempts:1,accountScopeId,approvedHosts:[new URL(target).hostname],decode,resolveSource:async()=>{const current=get(registrationId,c);if(stamp(binding(current))!==stamp(binding(r)))fail('BP_CARRIER_CHANGED');return {...m,uri:source.uri,permission:source.kind==='asset'?'asset-authorized':'public',availableFromMs:r.createdAtMs,expiresAtMs:r.expiresAtMs,...(source.kind==='asset'?{assetEntitlement:injected?'VERIFIED_MOCK':'HOST_BOUND',assetScope:{accountScopeId,provider:r.scope.provider,region:r.scope.region,canonicalModelId:r.scope.canonicalModelId,assetId:source.uri.slice(8)},downloadURL:target}:{})};},lookup:lookup??(async host=>{policy.assertNativeRuntime();return require('node:dns/promises').lookup(host,{all:true,verbatim:true});}),open:open??(async request=>{policy.assertNativeRuntime();return require('./byteplus-contract-transport.cjs').openPinnedHTTPS(request);})});
  let prepared;try{prepared=await boundary.prepareSet({contractKind:'byteplus.media-set',contractVersion:1,provider:r.scope.provider,region:r.scope.region,canonicalModelId:r.scope.canonicalModelId,profile:'seedance-input',operation:'single',members:[m]},{signal});}catch(e){if(/^BP_(?:MEDIA|DECODE|CARRIER|NATIVE)_/.test(e?.code??''))throw Object.assign(Error('Registered source verification failed; no generation submitted.'),{code:e.code});fail('BP_CARRIER_VERIFY_FAILED');}
  get(registrationId,c);const result=prepared.results[0];if(result.contentSha256!==r.local.contentSha256)fail('BP_CARRIER_IDENTITY');observations.set(registrationId,time());return {status:'FETCHED_AND_MATCHED',verifiedAtMs:time(),environment,providerFetch:'NOT_VERIFIED',binding:binding(r)};
 }
 async function resolve(reference,value,{executionExpiresAfter=172800,signal}={}){
  const c=context(value),r=get(reference?.source?.sourceId,c);if(stamp(localIdentity(reference))!==stamp(r.local)||reference.source.kind!=='remote'||reference.source.createdAtMs!==r.createdAtMs||reference.source.expiresAtMs!==r.expiresAtMs)fail('BP_CARRIER_IDENTITY');
  if(!Number.isSafeInteger(executionExpiresAfter)||executionExpiresAfter<3600||executionExpiresAfter>259200||r.expiresAtMs<time()+executionExpiresAfter*1000+120000)fail('BP_CARRIER_LIFETIME');await verify(r.registrationId,c,{signal});const source=await decrypt(get(r.registrationId,c)),handle=Object.freeze({});handles.set(handle,{registry:api,registrationId:r.registrationId,context:c,referenceSha256:stamp(reference),uri:source.uri,environment,binding:binding(r)});return handle;
 }
 function reference(registrationId,original,value){const r=get(registrationId,context(value));if(stamp(localIdentity(original))!==stamp(r.local))fail('BP_CARRIER_IDENTITY');return {...plain(original),source:{kind:'remote',sourceId:registrationId,createdAtMs:r.createdAtMs,expiresAtMs:r.expiresAtMs},availability:{availableFromMs:r.createdAtMs,expiresAtMs:r.expiresAtMs}};}
 function revoke(registrationId,value){const c=context(value),{record:r,diskSha256}=read(registrationId);if(projectKeys.some(k=>r.scope[k]!==c.scope[k]))fail('BP_CARRIER_SCOPE');write({...r,revision:r.revision+1,revokedAtMs:time(),uriCiphertext:null},diskSha256);observations.delete(registrationId);return {registrationId,revoked:true};}
 function redactionHashes(registrationIds,value){const c=context(value),out=[];for(const registrationId of registrationIds){let r;try{r=read(registrationId).record;}catch{continue;}if(projectKeys.every(k=>r.scope[k]===c.scope[k]))out.push(...r.redactionHashes);}return plain(out);}
 function status(registrationId,value){const c=context(value),r=read(registrationId).record;if(projectKeys.some(k=>r.scope[k]!==c.scope[k]))fail('BP_CARRIER_SCOPE');return {...binding(r),consent:r.revokedAtMs!==null?'REVOKED':time()>=r.expiresAtMs?'EXPIRED':'NATIVE_APPROVED',availability:observations.has(registrationId)?'FETCHED_AND_MATCHED_AT_TIME':'NOT_VERIFIED',verifiedAtMs:observations.get(registrationId)??null,providerFetch:'NOT_VERIFIED'};}
 function list(value,{offset=0,limit=10}={}){const c=context(value);if(!Number.isSafeInteger(offset)||offset<0||!Number.isSafeInteger(limit)||limit<1||limit>10)fail('BP_CARRIER_SCHEMA');safeDirectory(directory);const items=[];let unavailable=0;if(fs.existsSync(directory))for(const name of fs.readdirSync(directory).sort()){if(!/^carrier-[a-f0-9-]{36}\.json$/.test(name))continue;let r;try{r=read(name.slice(0,-5)).record;}catch{unavailable++;continue;}if(stamp(r.scope)!==stamp(c.scope)||stamp(r.local)!==stamp(c.local)||r.environment!==environment)continue;items.push({registrationId:r.registrationId,kind:r.kind,expiresAtMs:r.expiresAtMs,consent:r.revokedAtMs!==null?'REVOKED':time()>=r.expiresAtMs?'EXPIRED':'NATIVE_APPROVED'});}return {items:items.slice(offset,offset+limit),offset,nextOffset:offset+limit<items.length?offset+limit:null,total:items.length,unavailable};}
 function prune(){safeDirectory(directory);if(!fs.existsSync(directory))return;for(const name of fs.readdirSync(directory)){if(!/^carrier-[a-f0-9-]{36}\.json$/.test(name))continue;const registrationId=name.slice(0,-5),{record:r}=read(registrationId);if(time()>=r.expiresAtMs+7*DAY)fs.unlinkSync(file(registrationId));}}
 const privateDetails=async(registrationId,value)=>{const r=get(registrationId,context(value)),source=await decrypt(r);return {registrationId,uri:source.uri,verificationUri:source.verificationUri??null,assetVersion:source.assetVersion??null,expiresAtMs:r.expiresAtMs,purpose:'SHARE_EXACT_REFERENCE_VIDEO_FOR_GENERATION'};};
 const safeError=e=>Object.assign(Error('Registered source operation failed; no private source details are included.'),{code:/^BP_[A-Z0-9_]{1,80}$/.test(e?.code??'')?e.code:'BP_CARRIER_VERIFY_FAILED'}),protect=fn=>(...args)=>{try{const result=fn(...args);return result?.then?result.catch(e=>{throw safeError(e);}):result;}catch(e){throw safeError(e);}};
 const api=Object.freeze(Object.fromEntries(Object.entries({propose,nativePreview,approveNative,cancelProposal:proposalId=>pending.delete(id(proposalId)),publicBinding,verify,resolve,reference,revoke,status,redactionHashes,privateDetails,list,prune,environment}).map(([k,v])=>[k,typeof v==='function'?protect(v):v])));api.prune();return api;
}
function carrierWire(handle,reference,{environment}={}){const h=handle&&handles.get(handle);if(!h||stamp(reference)!==h.referenceSha256||h.environment!==environment)fail('BP_CARRIER_CAPABILITY');const current=h.registry.publicBinding(h.registrationId,h.context);if(stamp(current)!==stamp(h.binding))fail('BP_CARRIER_CHANGED');return {uri:h.uri,binding:current};}
function isInputAssetAuthority(token,source,accountScopeId){const a=token&&assetAuthorities.get(token);if(!a||a.uri!==source.uri||a.accountScopeId!==accountScopeId)return false;try{return a.registry.publicBinding(a.registrationId,a.context).uriSha256===sha(source.uri);}catch{return false;}}
module.exports={createBytePlusInputCarrierRegistry,carrierWire,isInputAssetAuthority};

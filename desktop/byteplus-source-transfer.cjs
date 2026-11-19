 'use strict';
// User-selected, private, exact-object TOS source upload. Never chooses storage or retries a PUT.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex'),stamp=x=>sha(JSON.stringify(x));
const fail=code=>{throw Object.assign(Error('Source setup did not finish. Original media is retained; check the original upload before retrying.'),{code});};
const exact=(v,keys)=>{if(!v||Object.getPrototypeOf(v)!==Object.prototype||Object.keys(v).sort().join(',')!==[...keys].sort().join(','))fail('BP_SOURCE_FIELDS');};
function presigned(value,method,now){
 if(typeof value!=='string'||value.length>16384||/[\s\\\x00-\x1f\x7f]/.test(value))fail('BP_SOURCE_URL');let u;try{u=new URL(value);}catch{fail('BP_SOURCE_URL');}
 if(u.href!==value||u.protocol!=='https:'||u.username||u.password||u.port||u.hash||!/^[-a-z0-9]{3,63}\.tos-ap-southeast-1\.bytepluses\.com$/.test(u.hostname)||u.pathname==='/'||/%(?:2f|5c|00)/i.test(u.pathname))fail('BP_SOURCE_DESTINATION');
 const required=['X-Tos-Algorithm','X-Tos-Credential','X-Tos-Date','X-Tos-Expires','X-Tos-SignedHeaders','X-Tos-Signature'],allowed=[...required,'X-Tos-Security-Token'];
 if(required.some(k=>!u.searchParams.has(k))||[...u.searchParams.keys()].some(k=>!allowed.includes(k)||u.searchParams.getAll(k).length!==1)||u.searchParams.get('X-Tos-Algorithm')!=='TOS4-HMAC-SHA256'||!/^[-A-Za-z0-9_]+\/[0-9]{8}\/ap-southeast-1\/tos\/request$/.test(u.searchParams.get('X-Tos-Credential'))||!/^[a-fA-F0-9]{64}$/.test(u.searchParams.get('X-Tos-Signature')))fail('BP_SOURCE_SIGNATURE');
 const signed=u.searchParams.get('X-Tos-SignedHeaders');if(signed!==(method==='PUT'?'host;x-tos-forbid-overwrite':'host'))fail('BP_SOURCE_SIGNED_HEADERS');
 const date=u.searchParams.get('X-Tos-Date'),m=/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(date),ttl=Number(u.searchParams.get('X-Tos-Expires'));if(!m||!Number.isSafeInteger(ttl)||ttl<1||ttl>604800)fail('BP_SOURCE_EXPIRY');
 const start=Date.UTC(...m.slice(1).map((v,i)=>Number(v)-(i===1?1:0)));if(new Date(start).toISOString().replace(/[-:]/g,'').replace('.000','')!==date||u.searchParams.get('X-Tos-Credential').split('/')[1]!==date.slice(0,8)||start>now+60000||start+ttl*1000<=now+120000)fail('BP_SOURCE_EXPIRY');return{url:value,object:u.origin+u.pathname,expiresAtMs:start+ttl*1000};
}
function safeDirectory(dir){if(typeof dir!=='string'||!path.isAbsolute(dir))fail('BP_SOURCE_STORAGE');for(let p=path.resolve(dir);;p=path.dirname(p)){if(fs.existsSync(p)&&fs.lstatSync(p).isSymbolicLink())fail('BP_SOURCE_STORAGE');if(path.dirname(p)===p)break;}}
function createSourceTransfer({directory,capture,readLocal,decode,carrier,upload,clock=Date.now}){
 if([capture,readLocal,decode,clock].some(f=>typeof f!=='function')||!carrier||upload!==undefined&&typeof upload!=='function')fail('BP_SOURCE_PORTS');
 const send=upload??(q=>require('./byteplus-source-transport.cjs').uploadPresigned(q));
 const safe=fn=>async(...args)=>{try{return await fn(...args);}catch(e){if(['DRAFT_UNCOMMITTED','PROJECT_SCOPE','EXIT_PENDING','APP_BUSY','HOST_BUSY','MERGE_LOCKED','BP_ENDPOINT_UNCONFIGURED','BP_CONFIRM_ROUTE','BP_CONFIRM_IDENTITY','CREDENTIAL_CONNECTION_INVALID','CREDENTIAL_USE_FORBIDDEN','DEPENDENCY_MISSING','DEPENDENCY_CHANGED','DEPENDENCY_PATH','DEPENDENCY_NAME','DEPENDENCY_CONFIG_INTEGRITY'].includes(e?.code)||/^BP_(?:SOURCE|CARRIER|MEDIA|DECODE|NATIVE)_[A-Z0-9_]{1,70}$/.test(e?.code??''))fail(e.code);fail('BP_SOURCE_FAILED');}};
 return{prepare:safe(async value=>{
  const request=structuredClone(value),identity=structuredClone(await capture(request)),created=clock();let used=false,submitting=false,cancelled=false,result=null;const abort=new AbortController();
  if(identity.scope?.provider!=='byteplus-modelark'||identity.scope.canonicalModelId!=='dreamina-seedance-2-5-260628'||identity.scope.region!=='ap-southeast-1'||identity.local?.mediaKind!=='video'||identity.local.role!=='REFERENCE_VIDEO')fail('BP_SOURCE_IDENTITY');
  const executionExpiresAfter=identity.guard?.executionExpiresAfter??172800;if(!Number.isSafeInteger(executionExpiresAfter)||executionExpiresAfter<3600||executionExpiresAfter>259200)fail('BP_SOURCE_TASK_LIFETIME');
  const current=async()=>{if(cancelled||!used&&clock()>created+120000)fail('BP_SOURCE_CANCELLED');if(stamp(await capture(request))!==stamp(identity))fail('BP_SOURCE_CHANGED');};
  async function bytes(){const b=await readLocal(identity.local);if(!(b instanceof Uint8Array)||b.length!==identity.local.byteSize||b.length<1||b.length>200000000||!['video/mp4','video/quicktime'].includes(identity.local.mimeType)||sha(b)!==identity.local.contentSha256)fail('BP_SOURCE_IDENTITY');const d=await decode(b);if(d?.fullyDecoded!==true||d.contentSha256!==identity.local.contentSha256||d.byteSize!==identity.local.byteSize||d.mimeType!==identity.local.mimeType||Object.keys(identity.local.metadata).some(k=>d[k]!==identity.local.metadata[k]))fail('BP_SOURCE_LOCAL_DECODE');return b;}
  await bytes();await current();
  const preview={previewId:'source-'+crypto.randomUUID(),digest:stamp(identity),sourceSetup:{scope:identity.scope,local:identity.local,region:'ap-southeast-1',executionExpiresAfter,destination:'EXPLICIT_USER_PRESIGNED_TOS_OBJECT',noOverwrite:true,noAutomaticRetry:true,separateGenerationConfirmation:true}};
  return{preview,status:()=>result??{status:used?'upload-may-have-been-sent':cancelled?'cancelled':'awaiting-native-confirmation',noAutomaticRetry:true},cancel:()=>{cancelled=true;abort.abort();},submit:safe(async fields=>{
   if(used||submitting)fail('BP_SOURCE_USED');submitting=true;try{exact(fields,['putURL','getURL']);const now=clock(),put=presigned(fields.putURL,'PUT',now),get=presigned(fields.getURL,'GET',now);if(put.object!==get.object)fail('BP_SOURCE_OBJECT_MISMATCH');if(get.expiresAtMs<now+executionExpiresAfter*1000+120000)fail('BP_SOURCE_TASK_LIFETIME');
   await current();const body=await bytes();await current();
   // Reserve the destination before the first network await. A crash/ambiguous response must not re-PUT.
   let target,fd;try{safeDirectory(directory);fs.mkdirSync(directory,{recursive:true});target=path.join(directory,sha(put.object)+'.json');fd=fs.openSync(target,'wx',0o600);const row={version:1,requestId:preview.previewId,objectSha256:sha(put.object),identitySha256:stamp(identity),createdAtMs:now,status:'UPLOAD_MAY_BE_SENT',noAutomaticRetry:true};fs.writeFileSync(fd,JSON.stringify(row));fs.fsyncSync(fd);}catch(e){if(e.code==='EEXIST')fail('BP_SOURCE_PRIOR_UPLOAD');fail('BP_SOURCE_STORAGE');}finally{if(fd!==undefined)fs.closeSync(fd);}used=true;
   let response;try{response=await send({url:put.url,body,headers:{'x-tos-forbid-overwrite':'true','Content-Type':identity.local.mimeType},signal:abort.signal,assertCurrent:current});}catch{fail('BP_SOURCE_UPLOAD_UNKNOWN');}
   if(!Number.isInteger(response?.status)||response.status<200||response.status>=300)fail(response?.status===409?'BP_SOURCE_OBJECT_EXISTS':'BP_SOURCE_UPLOAD_FAILED');
   await current();const proposal=await carrier.propose({...request,source:{kind:'url',uri:get.url},expiresAtMs:get.expiresAtMs});let approved=false;
   try{await current();await carrier.approveNative(proposal.proposalId,proposal.digest);approved=true;await carrier.verify({...request,registrationId:proposal.proposalId});await current();result={status:'source-verified',registrationId:proposal.proposalId,expiresAtMs:get.expiresAtMs,providerFetch:'NOT_VERIFIED',generationSubmitted:false};return structuredClone(result);}
   finally{if(!approved)carrier.cancelProposal(proposal.proposalId);}
   }finally{submitting=false;}
  })};
 })};
}
module.exports={createSourceTransfer,presigned};

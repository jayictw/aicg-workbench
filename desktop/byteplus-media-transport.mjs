// BP-02-B5 opt-in offline boundary. No HTTP implementation, credentials, graph,
// Journal, upload, POST or publication. Adapters below are TRUSTED local seams.
import {createHash} from 'node:crypto';
import contractPolicy from './byteplus-contract-policy.cjs';
import inputCarriers from './byteplus-input-carrier.cjs';
import {isIP} from 'node:net';
import {parseBytePlusImageResponse,prepareBytePlusImageResults} from './byteplus-image-contract.mjs';

const hash=b=>createHash('sha256').update(b).digest('hex');
const int=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const id=s=>typeof s==='string'&&/^[-a-zA-Z0-9_.]{1,128}$/.test(s);
const fail=code=>Object.assign(Error('BytePlus media rejected; no submission or publication authorized.'),{code});
function reject(code){throw fail(code);}
function freeze(v){if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;}
function data(v,seen=new Set(),depth=0){
 if(v===null||['string','boolean'].includes(typeof v)||typeof v==='number'&&Number.isFinite(v))return v;
 if(!v||typeof v!=='object'||seen.has(v)||depth>16)reject('BP_MEDIA_SCHEMA');
 const array=Array.isArray(v),keys=Reflect.ownKeys(v);
 if(!array&&Object.getPrototypeOf(v)!==Object.prototype||array&&(v.length>1000||keys.length!==v.length+1))reject('BP_MEDIA_SCHEMA');
 const out=array?[]:{};seen.add(v);
 for(const k of keys){if(array&&k==='length')continue;const d=Object.getOwnPropertyDescriptor(v,k);if(typeof k!=='string'||k==='__proto__'||!d.enumerable||!Object.hasOwn(d,'value')||array&&!/^(0|[1-9][0-9]*)$/.test(k))reject('BP_MEDIA_SCHEMA');out[k]=data(d.value,seen,depth+1);}
 seen.delete(v);return out;
}
function exact(v,required,optional=[]){if(!v||Object.getPrototypeOf(v)!==Object.prototype||required.some(k=>!Object.hasOwn(v,k))||Object.keys(v).some(k=>!required.includes(k)&&!optional.includes(k)))reject('BP_MEDIA_SCHEMA');}
function same(a,b){if(a===b)return true;if(!a||!b||typeof a!=='object'||typeof b!=='object')return false;const keys=Object.keys(a);return keys.length===Object.keys(b).length&&keys.every(k=>Object.hasOwn(b,k)&&same(a[k],b[k]));}

/** Conservative public-unicast subset; IPv4-mapped, transition and special
 * IPv6 allocations are deliberately refused, even if their tail is public. */
export function isPublicMediaAddress(address){
 const family=typeof address==='string'?isIP(address):0;
 if(family===4){
  const [a,b,c]=address.split('.').map(Number);
  return !(a===0||a===10||a===127||a>=224||a===100&&b>=64&&b<=127||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&(b===0||b===168||b===88&&c===99)||a===198&&(b===18||b===19||b===51&&c===100)||a===203&&b===0&&c===113);
 }
 if(family!==6||address.includes('%')||address.includes('.'))return false;
 const parts=address.toLowerCase().split('::');if(parts.length>2)return false;
 const left=parts[0]?parts[0].split(':'):[],right=parts[1]?parts[1].split(':'):[];
 const words=(parts.length===2?[...left,...Array(8-left.length-right.length).fill('0'),...right]:left).map(x=>parseInt(x,16));
 if(words.length!==8)return false;
 const [a,b]=words;
 return a>=0x2000&&a<=0x3fff&&a!==0x2002&&!(a===0x2001&&b<0x0200)&&!(a===0x2001&&b===0x0db8)&&!(a===0x3fff&&b<0x1000);
}
const profiles={
 'seedance-input':{model:'dreamina-seedance-2-5-260628',input:true,group:256*1024*1024,mimes:['image/png','image/jpeg','image/webp','video/mp4','video/quicktime','audio/wav','audio/mpeg']},
 'seedance-output':{model:'dreamina-seedance-2-5-260628',input:false,group:128*1024*1024,mimes:['video/mp4','video/quicktime','image/jpeg']},
 'seedream-input':{model:'dola-seedream-5-0-pro-260628',input:true,group:256*1024*1024,mimes:['image/png','image/jpeg','image/webp']},
 'seedream-output':{model:'dola-seedream-5-0-pro-260628',input:false,group:128*1024*1024,mimes:['image/png','image/jpeg']}
};
function cap(profile,mime){return mime.startsWith('image/')?(profile.input?30000000:32*1024*1024):mime.startsWith('audio/')?15000000:profile.input?200000000:128*1024*1024;}
function member(m,p){
 exact(m,['assetNodeId','mediaVersionId','sourceId','sourceVersionId','contentSha256','byteSize','mimeType','metadata','requireAlpha'],['z_index','expectedUri']);
 if(!['assetNodeId','mediaVersionId','sourceId','sourceVersionId'].every(k=>id(m[k]))||!p.mimes.includes(m.mimeType)||typeof m.requireAlpha!=='boolean'||(m.contentSha256===null?p.input:typeof m.contentSha256!=='string'||!/^[a-f0-9]{64}$/.test(m.contentSha256)))reject('BP_MEDIA_MEMBER');
 if(m.byteSize===null?p.input:!int(m.byteSize,1,cap(p,m.mimeType))||p.input&&p.model.startsWith('dreamina')&&m.mimeType.startsWith('image/')&&m.byteSize===30000000)reject('BP_MEDIA_MEMBER');
 const image=m.mimeType.startsWith('image/'),video=m.mimeType.startsWith('video/');
 exact(m.metadata,image?['width','height']:video?['width','height','durationMs','fps']:['durationMs']);
 if(image||video){const {width:w,height:h}=m.metadata;if(!int(w,1,100000)||!int(h,1,100000)||w*h>36000000)reject('BP_MEDIA_MEMBER');
  if(p.input&&p.model.startsWith('dreamina')&&(w<300||h<300||w>6000||h>6000||w/h<.4||w/h>2.5||video&&(w*h<407696||w*h>8295044)))reject('BP_MEDIA_MEMBER');
  if(p.input&&p.model.startsWith('dola')&&(w*h<196||w/h<1/16||w/h>16))reject('BP_MEDIA_MEMBER');
 }
 if(!image&&(!int(m.metadata.durationMs,p.input?2000:1,p.input?30000:120000)||video&&(!Number.isFinite(m.metadata.fps)||m.metadata.fps<=0||m.metadata.fps>60||p.input&&m.metadata.fps<24)))reject('BP_MEDIA_MEMBER');
 if(m.requireAlpha&&m.mimeType!=='image/png')reject('BP_MEDIA_MEMBER');
 if(m.expectedUri!==undefined&&(typeof m.expectedUri!=='string'||m.expectedUri.length>16384))reject('BP_MEDIA_MEMBER');
}
function set(value){
 const r=data(value);exact(r,['contractKind','contractVersion','provider','region','canonicalModelId','profile','operation','members']);
 const p=profiles[r.profile];
 if(!p||r.contractKind!=='byteplus.media-set'||r.contractVersion!==1||r.provider!=='byteplus-modelark'||r.region!=='ap-southeast-1'||r.canonicalModelId!==p.model||!['single','collection','layer_decomposition'].includes(r.operation)||!Array.isArray(r.members)||!int(r.members.length,1,50))reject('BP_MEDIA_SET');
 r.members.forEach(m=>member(m,p));
 if(r.operation==='single'&&r.members.length!==1)reject('BP_MEDIA_SET');
 if(r.operation==='layer_decomposition'&&(r.profile!=='seedream-output'||!int(r.members.length,2,17)||r.members.some((m,i)=>m.z_index!==i||m.mimeType!==(i?'image/png':m.mimeType)||i>0&&!m.requireAlpha)))reject('BP_MEDIA_SET');
 const identities=new Set(r.members.map(m=>JSON.stringify([m.assetNodeId,m.mediaVersionId,m.z_index??null])));if(identities.size!==r.members.length)reject('BP_MEDIA_SET');
 const counts={image:0,video:0,audio:0},duration={video:0,audio:0};let total=0;
 for(const m of r.members){const kind=m.mimeType.split('/')[0];counts[kind]++;if(kind!=='image')duration[kind]+=m.metadata.durationMs;total+=m.byteSize??0;}
 if(total>p.group||r.profile==='seedance-input'&&(counts.image>30||counts.video>10||counts.audio>10||duration.video>30000||duration.audio>30000)||r.profile==='seedream-input'&&r.members.length>10)reject('BP_MEDIA_SET');
 return freeze(r);
}
function url(value,hosts){
 if(typeof value!=='string'||value.length>16384||/[\s\\\x00-\x1f\x7f]/.test(value)||/%(?:0[0-9a-f]|1[0-9a-f]|7f)/i.test(value))reject('BP_MEDIA_URL');
 let u;try{u=new URL(value);}catch{reject('BP_MEDIA_URL');}
 if(u.protocol!=='https:'||u.username||u.password||u.hash||u.port||!hosts.has(u.hostname)||u.hostname.endsWith('.')||isIP(u.hostname.replace(/^\[|\]$/g,'')))reject('BP_MEDIA_URL');
 return u;
}
function headers(raw){const h=data(raw);if(!h||Array.isArray(h))reject('BP_MEDIA_HEADERS');const out={};for(const [k,v] of Object.entries(h)){const key=k.toLowerCase();if(Object.hasOwn(out,key)||typeof v!=='string'||/[\r\n]/.test(v))reject('BP_MEDIA_HEADERS');out[key]=v;}return out;}
export function encodeBytePlusMediaBody(value){
 const body=data(value),json=JSON.stringify(body),byteLength=Buffer.byteLength(json,'utf8');if(byteLength>64000000)reject('BP_BODY_LIMIT');
 return freeze({body,json,byteLength,bodySha256:hash(json),submissionAuthorization:'BLOCK',uploadAuthorization:'BLOCK',autoPostRetry:false,requiresNewPaidConfirmation:true});
}

/** All adapters are privileged host configuration, never Provider response
 * fields. Production mode is explicitly unavailable in this offline task. */
export function createBytePlusMediaBoundary(options={}){
 const {mode,clock,resolveSource,lookup,open,decode}=options;
 const retainInlineBase64=options.retainInlineBase64??true;if(typeof retainInlineBase64!=='boolean')reject('BP_MEDIA_CONFIG');
 const timeoutMs=options.timeoutMs??30000,maxAttempts=options.maxAttempts??2;
 if(mode!=='offline-mock'&&(mode!=='byteplus-https'||!contractPolicy.isMediaAuthority(options.contractAuthority)))reject('BP_MEDIA_TRANSPORT_BLOCKED');
 if(![clock,resolveSource,lookup,open,decode].every(f=>typeof f==='function')||!int(timeoutMs,1,30000)||!int(maxAttempts,1,3)||!Array.isArray(options.approvedHosts)||!int(options.approvedHosts.length,1,32)||options.approvedHosts.some(h=>typeof h!=='string'||!/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/.test(h)||h.length>253))reject('BP_MEDIA_CONFIG');
 const hosts=new Set(options.approvedHosts),accountScopeId=options.accountScopeId;let busy=false;
 function time(){const t=clock();if(!int(t,0,Number.MAX_SAFE_INTEGER))reject('BP_MEDIA_CLOCK');return t;}
 async function prepareSetImpl(value,{signal}={}){
  const request=set(value),p=profiles[request.profile],deadline=performance.now()+timeoutMs,controller=new AbortController();
  const abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
  let lastTime=time();
  function check(){if(controller.signal.aborted)reject(signal?.aborted?'BP_MEDIA_CANCELLED':'BP_MEDIA_TIMEOUT');const t=time();if(t<lastTime)reject('BP_MEDIA_CLOCK');lastTime=t;return t;}
  async function call(fn){check();const remaining=deadline-performance.now();if(remaining<=0)reject('BP_MEDIA_TIMEOUT');let timer,onAbort;try{
   return await Promise.race([Promise.resolve().then(fn),new Promise((_,rej)=>{timer=setTimeout(()=>{controller.abort();rej(fail('BP_MEDIA_TIMEOUT'));},remaining);onAbort=()=>rej(fail(signal?.aborted?'BP_MEDIA_CANCELLED':'BP_MEDIA_TIMEOUT'));controller.signal.addEventListener('abort',onAbort,{once:true});})]);
  }finally{clearTimeout(timer);controller.signal.removeEventListener('abort',onAbort);}}
  async function source(m,expected){
   let s;try{s=data(await call(()=>resolveSource(freeze({assetNodeId:m.assetNodeId,mediaVersionId:m.mediaVersionId,sourceId:m.sourceId,sourceVersionId:m.sourceVersionId}))));}catch(e){if(['BP_MEDIA_TIMEOUT','BP_MEDIA_CANCELLED','BP_MEDIA_CLOCK'].includes(e?.code))throw e;reject('BP_MEDIA_SOURCE');}
   exact(s,['assetNodeId','mediaVersionId','sourceId','sourceVersionId','contentSha256','byteSize','mimeType','metadata','requireAlpha','uri','permission','availableFromMs','expiresAtMs'],['z_index','expectedUri','assetEntitlement','assetScope','downloadURL']);
   if(expected&&!same(s,expected))reject('BP_MEDIA_SOURCE_CHANGED');
   if(Object.keys(m).some(k=>k!=='expectedUri'&&!same(m[k],s[k]))||m.expectedUri!==undefined&&s.uri!==m.expectedUri||typeof s.uri!=='string')reject('BP_MEDIA_SOURCE');
   const t=check();if(!int(s.availableFromMs,0,Number.MAX_SAFE_INTEGER)||!int(s.expiresAtMs,1,Number.MAX_SAFE_INTEGER)||s.availableFromMs>t||s.expiresAtMs<=t||s.expiresAtMs<=s.availableFromMs)reject('BP_MEDIA_EXPIRED');
   if(s.uri.startsWith('asset://')){
    if(!/^asset:\/\/[-a-zA-Z0-9_]{1,128}$/.test(s.uri)||s.permission!=='asset-authorized'||!(s.assetEntitlement==='VERIFIED_MOCK'&&mode==='offline-mock'||s.assetEntitlement==='HOST_BOUND'&&inputCarriers.isInputAssetAuthority(options.sourceAuthorization,s,accountScopeId))||!s.downloadURL||!id(accountScopeId)||!same(s.assetScope,{accountScopeId,provider:request.provider,region:request.region,canonicalModelId:request.canonicalModelId,assetId:s.uri.slice(8)}))reject('BP_MEDIA_ASSET');url(s.downloadURL,hosts);
   }else{if(s.permission!=='public'||s.assetEntitlement!==undefined||s.assetScope!==undefined||s.downloadURL!==undefined)reject('BP_MEDIA_PERMISSION');url(s.uri,hosts);}
   return freeze(s);
  }
  async function download(m,s){
   const target=url(s.downloadURL??s.uri,hosts),limit=Math.min(cap(p,m.mimeType),m.byteSize??Infinity);
   for(let attempt=0;attempt<maxAttempts;attempt++){
    await source(m,s);let response=null,iterator=null;
    try{
     let addresses;try{addresses=data(await call(()=>lookup(target.hostname,{signal:controller.signal})));}catch(e){if(e?.code?.startsWith('BP_MEDIA_'))throw e;reject('BP_MEDIA_DNS');}
     if(!Array.isArray(addresses)||!int(addresses.length,1,32)||addresses.some(a=>!isPublicMediaAddress(a.address)||a.family!==isIP(a.address)))reject('BP_MEDIA_DNS');
     const pin=addresses[0];
     try{response=await call(async()=>{const r=await open(Object.freeze({url:target.href,address:pin.address,family:pin.family,method:'GET',headers:Object.freeze({Accept:m.mimeType,'Accept-Encoding':'identity'}),credentials:'omit',redirect:'manual',signal:controller.signal}));if(controller.signal.aborted){try{r?.close?.();}catch{}reject('BP_MEDIA_TIMEOUT');}return r;});}catch(e){if(e?.code?.startsWith('BP_MEDIA_'))throw e;throw fail('BP_MEDIA_IO');}
     if(!response||typeof response.close!=='function'||!int(response.status,100,599))reject('BP_MEDIA_RESPONSE');
     if(response.peerAddress!==pin.address)reject('BP_MEDIA_PEER');
     if(response.status>=300&&response.status<400)reject('BP_MEDIA_REDIRECT');
     if(response.status!==200){const e=fail('BP_MEDIA_HTTP');e.retryable=[408,429,500,502,503,504].includes(response.status);throw e;}
     const h=headers(response.headers),mime=h['content-type']?.split(';')[0].trim().toLowerCase();
     if(mime!==m.mimeType||h['content-encoding']!==undefined&&h['content-encoding']!=='identity')reject('BP_MEDIA_MIME');
     let length=null;if(h['content-length']!==undefined){if(!/^[1-9][0-9]{0,9}$/.test(h['content-length']))reject('BP_MEDIA_BYTES');length=Number(h['content-length']);if(length>limit||m.byteSize!==null&&length!==m.byteSize)reject('BP_MEDIA_BYTES');}
     if(typeof response.body?.[Symbol.asyncIterator]!=='function')reject('BP_MEDIA_RESPONSE');
     iterator=response.body[Symbol.asyncIterator]();const chunks=[];let size=0;
     for(;;){let next;try{next=await call(()=>iterator.next());}catch(e){if(e?.code?.startsWith('BP_MEDIA_'))throw e;throw fail('BP_MEDIA_IO');}if(next.done)break;if(!(next.value instanceof Uint8Array)||next.value.length===0)reject('BP_MEDIA_BYTES');size+=next.value.length;if(size>limit||length!==null&&size>length)reject('BP_MEDIA_BYTES');chunks.push(Buffer.from(next.value));}
     if(size===0||length!==null&&size!==length||m.byteSize!==null&&size!==m.byteSize)throw fail('BP_MEDIA_TRUNCATED');
     const bytes=Buffer.concat(chunks,size);if(m.contentSha256!==null&&hash(bytes)!==m.contentSha256)reject('BP_MEDIA_SHA256');
     await source(m,s);return bytes;
    }catch(e){const retry=e?.retryable===true||['BP_MEDIA_IO','BP_MEDIA_TRUNCATED'].includes(e?.code);if(retry&&attempt+1<maxAttempts)continue;if(typeof e?.code==='string'&&/^BP_MEDIA_[A-Z0-9_]+$/.test(e.code))throw Object.assign(fail(e.code),e.code==='BP_MEDIA_RESPONSE'&&e.phase==='download'&&Number.isInteger(e.httpStatus)&&e.httpStatus>=100&&e.httpStatus<=599?{phase:'download',httpStatus:e.httpStatus}:{});reject('BP_MEDIA_IO');}
    finally{try{response?.close?.();}catch{}try{Promise.resolve(iterator?.return?.()).catch(()=>{});}catch{}}
   }
  }
  try{
   // Preflight ALL members before reading any bytes. Recheck every binding once
   // more after the last decode, so expiry/replacement cannot publish a prefix.
   const sources=[];for(const m of request.members)sources.push(await source(m));
   const results=[];let total=0;
   for(let i=0;i<request.members.length;i++){
    const m=request.members[i],s=sources[i],bytes=await download(m,s),contentSha256=hash(bytes);
    total+=bytes.length;if(total>p.group)reject('BP_MEDIA_BYTES');let decoded;
    try{decoded=data(await call(()=>decode(bytes,{signal:controller.signal})));}catch(e){if(['BP_MEDIA_TIMEOUT','BP_MEDIA_CANCELLED','BP_MEDIA_CLOCK'].includes(e?.code))throw e;reject('BP_MEDIA_DECODE');}
    if(!decoded||decoded.fullyDecoded!==true||decoded.mimeType!==m.mimeType||decoded.byteSize!==bytes.length||decoded.contentSha256!==contentSha256||hash(bytes)!==contentSha256||Object.keys(m.metadata).some(k=>decoded[k]!==m.metadata[k])||m.requireAlpha&&decoded.hasAlpha!==true)reject('BP_MEDIA_DECODE');
    results.push({...m,carrier:s.uri,source:s,byteSize:bytes.length,contentSha256,...(retainInlineBase64?{b64_json:bytes.toString('base64')}:{}),decoded,fullyDecoded:true});
   }
   for(let i=0;i<request.members.length;i++)await source(request.members[i],sources[i]);check();
   return freeze({contractKind:'byteplus.prepared-media-set',contractVersion:1,status:'prepared',profile:request.profile,operation:request.operation,results,totalBytes:total,verifiedAtMs:lastTime,executionEnvironment:mode,submissionAuthorization:'BLOCK',publishAuthorization:'BLOCK',uploadAuthorization:'BLOCK',accountEntitlement:'UNKNOWN',requiresRevalidation:true,autoPostRetry:false});
  }finally{controller.abort();signal?.removeEventListener('abort',abort);}
 }
 async function prepareImageResponseImpl(response,artifact,{locateOutput,signal}={}){
  const parsed=parseBytePlusImageResponse(response,artifact);if(parsed.status!=='parsed')reject('BP_MEDIA_IMAGE_RESULT');
  if(parsed.results.every(r=>r.b64_json))return prepareBytePlusImageResults(parsed,{decodeImage:b=>{if(signal?.aborted)reject('BP_MEDIA_CANCELLED');return decode(b,{signal});}});
  if(typeof locateOutput!=='function'||parsed.results.some(r=>!r.url))reject('BP_MEDIA_IMAGE_RESULT');
  const members=[];
  for(const r of parsed.results){let m;try{m=data(await locateOutput(r));}catch(e){if(e?.code==='BP_MEDIA_RESPONSE'&&e.phase==='download'&&Number.isInteger(e.httpStatus)&&e.httpStatus>=100&&e.httpStatus<=599)throw Object.assign(fail('BP_MEDIA_RESPONSE'),{phase:'download',httpStatus:e.httpStatus});reject('BP_MEDIA_SOURCE');}
   if(!same(m.metadata,{width:r.width,height:r.height})||m.mimeType!==r.mimeType||m.requireAlpha!==(parsed.requiresAlpha||parsed.operation==='layer_decomposition'&&r.z_index>0))reject('BP_MEDIA_IMAGE_RESULT');
   members.push({...m,expectedUri:r.url,...(parsed.operation==='layer_decomposition'?{z_index:r.z_index}:{})});
  }
  // B4's URL lifetime is an upper bound; source registry may grant less.
  const boundedResolve=async identity=>{const s=await resolveSource(identity),r=parsed.results.find((_,i)=>members[i].sourceId===identity.sourceId);if(!r||s?.expiresAtMs>r.expiresAtMs)reject('BP_MEDIA_EXPIRED');return s;};
  const boundary=createBytePlusMediaBoundary({mode,contractAuthority:options.contractAuthority,clock,lookup,open,decode,timeoutMs,maxAttempts,accountScopeId,approvedHosts:[...hosts],resolveSource:boundedResolve});
  const prepared=await boundary.prepareSet({contractKind:'byteplus.media-set',contractVersion:1,provider:'byteplus-modelark',region:'ap-southeast-1',canonicalModelId:'dola-seedream-5-0-pro-260628',profile:'seedream-output',operation:parsed.operation==='layer_decomposition'?'layer_decomposition':'single',members},{signal});
  return freeze({...parsed,status:'prepared',results:parsed.results.map((r,i)=>{const {url,...rest}=r;const m=prepared.results[i];return {...rest,b64_json:m.b64_json,byteSize:m.byteSize,contentSha256:m.contentSha256,hasAlpha:m.decoded.hasAlpha,sourceId:m.sourceId,sourceVersionId:m.sourceVersionId,sourceExpiresAtMs:m.source.expiresAtMs,fullyDecoded:true};}),requiresDecode:false,publishAuthorization:'BLOCK',submissionAuthorization:'BLOCK',executionEnvironment:mode});
 }
 async function prepareSet(value,context){if(busy)reject('BP_MEDIA_BUSY');busy=true;try{return await prepareSetImpl(value,context);}finally{busy=false;}}
 async function prepareImageResponse(response,artifact,context={}){
  if(busy)reject('BP_MEDIA_BUSY');busy=true;const controller=new AbortController(),abort=()=>controller.abort();let timer,onAbort;
  context.signal?.addEventListener('abort',abort,{once:true});if(context.signal?.aborted)abort();
  try{
   if(controller.signal.aborted)reject('BP_MEDIA_CANCELLED');
   return await Promise.race([prepareImageResponseImpl(response,artifact,{...context,signal:controller.signal}),new Promise((_,rej)=>{timer=setTimeout(()=>{controller.abort();rej(fail('BP_MEDIA_TIMEOUT'));},timeoutMs);onAbort=()=>rej(fail(context.signal?.aborted?'BP_MEDIA_CANCELLED':'BP_MEDIA_TIMEOUT'));controller.signal.addEventListener('abort',onAbort,{once:true});})]);
  }catch(e){if(typeof e?.code==='string'&&/^BP_MEDIA_[A-Z0-9_]+$/.test(e.code))throw Object.assign(fail(e.code),e.code==='BP_MEDIA_RESPONSE'&&e.phase==='download'&&Number.isInteger(e.httpStatus)&&e.httpStatus>=100&&e.httpStatus<=599?{phase:'download',httpStatus:e.httpStatus}:{});reject('BP_MEDIA_IMAGE_RESULT');}
  finally{clearTimeout(timer);controller.signal.removeEventListener('abort',onAbort);controller.abort();context.signal?.removeEventListener('abort',abort);busy=false;}
 }
 return Object.freeze({prepareSet,prepareImageResponse,mode,productionTransport:mode==='byteplus-https'?'HOST_PINNED_HTTPS':'BLOCK',uploadAuthorization:'BLOCK'});
}

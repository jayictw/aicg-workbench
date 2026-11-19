// BP-02-B2: opt-in internal contract only. No graph mutation, route operation,
// provider serializer, credentials, transport, confirmation or Journal access.
// See byteplus-media-contract.d.mts for the public discriminated media types.
const modes=['TEXT_TO_VIDEO','FIRST_FRAME','FIRST_LAST_FRAME','MULTI_IMAGE_REFERENCE','VIDEO_REFERENCE'];
const operations=['generate','reference','edit','extend'];
const kinds=['image','video','audio'];
const mimes={image:['image/jpeg','image/png','image/webp','image/bmp','image/tiff','image/gif','image/heic','image/heif'],video:['video/mp4','video/quicktime'],audio:['audio/wav','audio/mpeg']};
function freeze(value){if(value&&typeof value==='object'){for(const item of Object.values(value))freeze(item);Object.freeze(value);}return value;}
export const BYTEPLUS_MEDIA_LIMITS=freeze({
 contractKind:'byteplus.video-input',contractVersion:1,provider:'byteplus-modelark',region:'ap-southeast-1',canonicalModelId:'dreamina-seedance-2-5-260628',
 modes,operations,maxReferences:{image:30,video:10,audio:10},
 maxFileBytes:{image:30000000,video:200000000,audio:15000000},imageFileLimitExclusive:true,
 minDurationMs:2000,maxDurationMs:30000,editVideoMinDurationMs:4000,totalDurationMs:{video:30000,audio:30000},
 requestBodyMaxBytes:64000000,
 sourceRefs:['https://docs.byteplus.com/en/docs/modelark/seedance-2-5','https://docs.byteplus.com/en/docs/modelark/create-video-generation-task-api']
});
function reject(code,fieldPath){throw Object.assign(Error('BytePlus input rejected; review the indicated field. No submission is authorized.'),{code,fieldPath});}
const integer=x=>Number.isSafeInteger(x)&&x>=0;
const text=x=>typeof x==='string'&&x.length>0&&x.length<=512&&!x.includes('\0');
const id=x=>typeof x==='string'&&/^[-a-zA-Z0-9]{1,90}$/.test(x);

// Copy plain JSON data without running getters, toJSON, class methods or caller
// mutation after the first await. Reject hidden fields, holes and cycles too.
function copyData(value,path='input',ancestors=new Set(),depth=0){
 if(value===null||typeof value==='boolean'||typeof value==='string'||(typeof value==='number'&&Number.isFinite(value)))return value;
 if(!value||typeof value!=='object'||depth>12||ancestors.has(value))reject('BP_INPUT_SCHEMA',path);
 const array=Array.isArray(value);
 if(!array&&Object.getPrototypeOf(value)!==Object.prototype)reject('BP_INPUT_SCHEMA',path);
 if(array&&value.length>1000)reject('BP_INPUT_SCHEMA',path);
 const keys=Reflect.ownKeys(value),expected=array?Array.from({length:value.length},(_,i)=>String(i)).concat('length'):keys;
 if(array&&(keys.length!==expected.length||keys.some(k=>!expected.includes(k))))reject('BP_INPUT_SCHEMA',path);
 const out=array?[]:{};ancestors.add(value);
 for(const key of keys){
  if(array&&key==='length')continue;
  const d=Object.getOwnPropertyDescriptor(value,key);
  if(typeof key!=='string'||!d?.enumerable||!Object.hasOwn(d,'value')||key==='__proto__')reject('BP_INPUT_SCHEMA',path);
  out[key]=copyData(d.value,path+'.'+key,ancestors,depth+1);
 }
 ancestors.delete(value);return out;
}
function exact(value,required,optional=[],path='input'){
 if(!value||Object.getPrototypeOf(value)!==Object.prototype||required.some(k=>!Object.hasOwn(value,k))||Object.keys(value).some(k=>!required.includes(k)&&!optional.includes(k)))reject('BP_INPUT_SCHEMA',path);
}
function timestampWindow(value,path){
 exact(value,['availableFromMs','expiresAtMs'],[],path);
 if(!integer(value.availableFromMs)||(value.expiresAtMs!==null&&(!integer(value.expiresAtMs)||value.expiresAtMs<=value.availableFromMs)))reject('BP_MEDIA_SOURCE',path);
}
function validateReference(r,index,operation){
 const path='mediaReferences.'+index;
 exact(r,['assetNodeId','mediaVersionId','contentSha256','mimeType','byteSize','mediaKind','role','sequenceIndex','source','availability','metadata'],[],path);
 if(!id(r.assetNodeId)||!id(r.mediaVersionId)||typeof r.contentSha256!=='string'||!/^[a-f0-9]{64}$/.test(r.contentSha256)||!kinds.includes(r.mediaKind))reject('BP_MEDIA_IDENTITY',path);
 if(r.sequenceIndex!==index)reject('BP_MEDIA_SEQUENCE',path+'.sequenceIndex');
 if(!mimes[r.mediaKind].includes(r.mimeType))reject('BP_MEDIA_MIME',path+'.mimeType');
 if(!Number.isSafeInteger(r.byteSize)||r.byteSize<=0||r.byteSize>BYTEPLUS_MEDIA_LIMITS.maxFileBytes[r.mediaKind]||(r.mediaKind==='image'&&r.byteSize===BYTEPLUS_MEDIA_LIMITS.maxFileBytes.image))reject('BP_MEDIA_BYTES',path+'.byteSize');
 exact(r.source,['kind','sourceId','createdAtMs','expiresAtMs'],[],path+'.source');
 if(!['project','upload','remote'].includes(r.source.kind)||!text(r.source.sourceId)||!integer(r.source.createdAtMs)||(r.source.expiresAtMs===null?r.source.kind!=='project':!integer(r.source.expiresAtMs)||r.source.expiresAtMs<=r.source.createdAtMs))reject('BP_MEDIA_SOURCE',path+'.source');
 timestampWindow(r.availability,path+'.availability');
 const fields=r.mediaKind==='image'?['width','height']:r.mediaKind==='video'?['width','height','durationMs','fps']:['durationMs'];
 exact(r.metadata,fields,[],path+'.metadata');
 if(r.mediaKind!=='image'){
  const min=r.mediaKind==='video'&&operation==='edit'?4000:2000;
  if(!Number.isSafeInteger(r.metadata.durationMs)||r.metadata.durationMs<min||r.metadata.durationMs>30000)reject('BP_MEDIA_DURATION',path+'.metadata.durationMs');
 }
 if(r.mediaKind!=='audio'){
  const {width:w,height:h}=r.metadata;
  if(!Number.isSafeInteger(w)||!Number.isSafeInteger(h)||w<300||h<300||w>6000||h>6000||w/h<.4||w/h>2.5||
   (r.mediaKind==='video'&&(w*h<407696||w*h>8295044||!Number.isFinite(r.metadata.fps)||r.metadata.fps<24||r.metadata.fps>60)))reject('BP_MEDIA_GEOMETRY',path+'.metadata');
 }
}

/** Validate the new contract only. This does not attest availability or bytes. */
export function validateBytePlusVideoInput(value){
 const input=copyData(value);
 exact(input,['contractKind','contractVersion','provider','region','canonicalModelId','mode','operation','mediaReferences','parameters'],['prompt']);
 if(['contractKind','contractVersion','provider','region','canonicalModelId'].some(k=>input[k]!==BYTEPLUS_MEDIA_LIMITS[k]))reject('BP_INPUT_CONTRACT','input');
 if(!modes.includes(input.mode))reject('BP_INPUT_MODE','mode');
 const referenceMode=['MULTI_IMAGE_REFERENCE','VIDEO_REFERENCE'].includes(input.mode);
 if(!operations.includes(input.operation)||(referenceMode?input.operation==='generate':input.operation!=='generate'))reject('BP_INPUT_OPERATION','operation');
 if(Object.hasOwn(input,'prompt')&&(typeof input.prompt!=='string'||input.prompt.includes('\0')||new TextEncoder().encode(input.prompt).length>16000))reject('BP_INPUT_SCHEMA','prompt');
 if(!Array.isArray(input.mediaReferences))reject('BP_INPUT_SCHEMA','mediaReferences');
 if(input.mediaReferences.length===0&&(input.mode!=='TEXT_TO_VIDEO'||!input.prompt?.trim()))reject('BP_INPUT_EMPTY','mediaReferences');
 const counts={image:0,video:0,audio:0},totalDurationMs={video:0,audio:0},seen=new Set();
 input.mediaReferences.forEach((r,i)=>{
  validateReference(r,i,input.operation);counts[r.mediaKind]++;
  const key=JSON.stringify([r.assetNodeId,r.mediaVersionId,r.role]);
  if(seen.has(key))reject('BP_MEDIA_DUPLICATE','mediaReferences.'+i);seen.add(key);
  if(r.mediaKind!=='image')totalDurationMs[r.mediaKind]+=r.metadata.durationMs;
 });
 if(kinds.some(k=>counts[k]>BYTEPLUS_MEDIA_LIMITS.maxReferences[k]))reject('BP_MEDIA_COUNT','mediaReferences');
 if(['video','audio'].some(k=>totalDurationMs[k]>30000))reject('BP_MEDIA_TOTAL_DURATION','mediaReferences');
 const refs=input.mediaReferences;
 if(input.mode==='TEXT_TO_VIDEO'&&refs.length)reject('BP_MODE_ROLES','mediaReferences');
 if(input.mode==='FIRST_FRAME'&&(refs.length!==1||refs[0].mediaKind!=='image'||refs[0].role!=='FIRST_FRAME'))reject('BP_MODE_ROLES','mediaReferences');
 if(input.mode==='FIRST_LAST_FRAME'&&(refs.length!==2||refs.some(r=>r.mediaKind!=='image')||['FIRST_FRAME','LAST_FRAME'].some(role=>refs.filter(r=>r.role===role).length!==1)))reject('BP_MODE_ROLES','mediaReferences');
 if(referenceMode&&refs.some(r=>r.role!=={image:'REFERENCE_IMAGE',video:'REFERENCE_VIDEO',audio:'REFERENCE_AUDIO'}[r.mediaKind]))reject('BP_MODE_ROLES','mediaReferences');
 if(input.mode==='VIDEO_REFERENCE'&&!counts.video)reject('BP_MODE_VIDEO_REQUIRED','mediaReferences');
 if(['edit','extend'].includes(input.operation)&&!counts.video)reject('BP_OPERATION_VIDEO_REQUIRED','mediaReferences');
 if(['edit','extend'].includes(input.operation)&&!input.prompt?.trim())reject('BP_OPERATION_PROMPT','prompt');
 exact(input.parameters,['duration','ratio'],[],'parameters');
 const {duration,ratio}=input.parameters;
 if(!Number.isSafeInteger(duration)||(duration!==-1&&(duration<4||duration>30))||!['adaptive','16:9','4:3','1:1','3:4','9:16','21:9'].includes(ratio)||
  ((['FIRST_FRAME','FIRST_LAST_FRAME'].includes(input.mode)||['edit','extend'].includes(input.operation))&&ratio!=='adaptive')||(input.operation==='edit'&&duration!==-1))reject('BP_OPERATION_PARAMETERS','parameters');
 return freeze({contract:input,validationLevel:'schema-only',counts,totalDurationMs,inputCapacity:{...BYTEPLUS_MEDIA_LIMITS.maxReferences},
  accountEntitlement:'UNKNOWN',submissionAuthorization:'BLOCK',requestBodyMaxBytes:64000000,requestBodyValidation:'DEFERRED_TO_B3_SERIALIZATION',
  providerPromptIntent:'NOT_EVALUATED',sourceRefs:[...BYTEPLUS_MEDIA_LIMITS.sourceRefs]});
}
function same(a,b){
 if(a===b)return true;
 if(!a||!b||typeof a!=='object'||typeof b!=='object')return false;
 const keys=Object.keys(a);return keys.length===Object.keys(b).length&&keys.every(k=>Object.hasOwn(b,k)&&same(a[k],b[k]));
}

/** Verify actual bytes via an injected local fixed-version resolver. No I/O of
 * its own. The resolver is a trusted adapter: decoded metadata must describe
 * these bytes. B3 must repeat validation at future serialization/dispatch. */
export async function prepareBytePlusVideoInput(value,{resolveMedia,nowMs}={}){
 const checked=validateBytePlusVideoInput(value);
 if(!integer(nowMs))reject('BP_MEDIA_TIME','nowMs');
 if(typeof resolveMedia!=='function')reject('BP_MEDIA_RESOLVER','resolveMedia');
 for(const r of checked.contract.mediaReferences){
  const path='mediaReferences.'+r.sequenceIndex;
  if(r.source.createdAtMs>nowMs||r.availability.availableFromMs>nowMs)reject('BP_MEDIA_UNAVAILABLE',path);
  if([r.source.expiresAtMs,r.availability.expiresAtMs].some(t=>t!==null&&t<=nowMs))reject('BP_MEDIA_EXPIRED',path);
  let resolved;
  try{resolved=await resolveMedia(Object.freeze({assetNodeId:r.assetNodeId,mediaVersionId:r.mediaVersionId}));}
  catch{reject('BP_MEDIA_UNAVAILABLE',path);}
  if(!resolved||resolved.status!=='available')reject('BP_MEDIA_UNAVAILABLE',path);
  if(resolved.assetNodeId!==r.assetNodeId||!resolved.version)reject('BP_MEDIA_IDENTITY',path);
  if(resolved.currentMediaVersionId!==r.mediaVersionId)reject('BP_MEDIA_VERSION_CHANGED',path);
  const expected=Object.fromEntries(Object.entries(r).filter(([k])=>!['assetNodeId','role','sequenceIndex'].includes(k)));
  if(!same(expected,copyData(resolved.version,path+'.version')))reject('BP_MEDIA_IDENTITY',path);
  if(!(resolved.bytes instanceof Uint8Array)||resolved.bytes.byteLength!==r.byteSize)reject('BP_MEDIA_BYTES',path);
  // Snapshot before await. Never hash a shared mutable view or fall back to the
  // current source version; no raw media bytes are exposed in the JSON result.
  const bytes=new Uint8Array(resolved.bytes);
  const digest=await globalThis.crypto.subtle.digest('SHA-256',bytes);
  const sha256=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
  if(sha256!==r.contentSha256)reject('BP_MEDIA_SHA256',path);
 }
 return freeze({...checked,validationLevel:'verified-bytes',verifiedAtMs:nowMs});
}

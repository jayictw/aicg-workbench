// BP-02-B3: opt-in offline contracts. No credential, HTTP, IPC, confirmation,
// Journal or downloader imports. A serialized artifact never authorizes a POST.
import {byteplusCapabilities} from '../shared/byteplus-route-contract.mjs';
import {validateBytePlusVideoInput,prepareBytePlusVideoInput} from '../shared/byteplus-media-contract.mjs';
import {createHash} from 'node:crypto';
import inputCarriers from './byteplus-input-carrier.cjs';

const MODEL='dreamina-seedance-2-5-260628',BODY_MAX=64000000,DAY=86400000;
const DRAFT_CUTOFF=Date.parse('2026-10-28T02:00:00Z');
function reject(code){throw Object.assign(Error('BytePlus video contract rejected. No credential read or submission is authorized.'),{code});}
function freeze(v){if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;}
// Plain data snapshots prevent getters/toJSON and mutation across awaits.
function data(v,seen=new Set(),depth=0){
 if(v===null||['string','boolean'].includes(typeof v)||typeof v==='number'&&Number.isFinite(v))return v;
 if(!v||typeof v!=='object'||seen.has(v)||depth>15)reject('BP_VIDEO_SCHEMA');
 const array=Array.isArray(v);
 if(!array&&Object.getPrototypeOf(v)!==Object.prototype||array&&v.length>1000)reject('BP_VIDEO_SCHEMA');
 const out=array?[]:{},keys=Reflect.ownKeys(v);seen.add(v);
 if(array&&(keys.length!==v.length+1||keys.some(k=>k!=='length'&&!/^(0|[1-9][0-9]*)$/.test(String(k)))))reject('BP_VIDEO_SCHEMA');
 for(const k of keys){if(array&&k==='length')continue;const d=Object.getOwnPropertyDescriptor(v,k);if(typeof k!=='string'||k==='__proto__'||!d.enumerable||!Object.hasOwn(d,'value'))reject('BP_VIDEO_SCHEMA');out[k]=data(d.value,seen,depth+1);}
 seen.delete(v);return out;
}
function exact(v,required,optional=[]){if(!v||Object.getPrototypeOf(v)!==Object.prototype||required.some(k=>!Object.hasOwn(v,k))||Object.keys(v).some(k=>!required.includes(k)&&!optional.includes(k)))reject('BP_VIDEO_SCHEMA');}
function now(clock){if(typeof clock!=='function')reject('BP_VIDEO_CLOCK');const t=clock();if(!Number.isSafeInteger(t)||t<0)reject('BP_VIDEO_CLOCK');return t;}
const timestamp=v=>Number.isSafeInteger(v)&&v>=0&&Number.isSafeInteger(v*1000+14*DAY);
const taskId=v=>typeof v==='string'&&/^[-a-zA-Z0-9]{1,128}$/.test(v);
function route(endpointSelector){
 const c=byteplusCapabilities(),m=c.models.find(m=>m.canonicalModelId===MODEL);
 const selector=endpointSelector===undefined?m?.selectorValue:endpointSelector;
 if(selector===null||selector==='')reject('BP_ENDPOINT_UNCONFIGURED');
 if(c.contractVersion!==3||c.provider!=='byteplus-modelark'||c.region!=='ap-southeast-1'||!m||m.selectorKind!=='endpoint_id'||typeof selector!=='string'||!/^ep-[A-Za-z0-9][A-Za-z0-9-]{0,124}$/.test(selector))reject('BP_VIDEO_ROUTE');
 return {provider:c.provider,region:c.region,canonicalModelId:MODEL,selectorKind:m.selectorKind,selectorValue:selector,contractVersion:c.contractVersion};
}
function output(v,final=false){
 exact(v,final?['resolution']:['resolution','generate_audio','watermark','output_format'],final?['watermark','output_format']:[]);
 if(!['480p','720p','1080p'].includes(v.resolution)||Object.hasOwn(v,'generate_audio')&&typeof v.generate_audio!=='boolean'||Object.hasOwn(v,'watermark')&&typeof v.watermark!=='boolean'||Object.hasOwn(v,'output_format')&&!['mp4','mov'].includes(v.output_format))reject('BP_VIDEO_OUTPUT');
 if(final&&v.resolution!=='1080p')reject('BP_VIDEO_FINAL_RESOLUTION');
 return v;
}
function task(v={}){
 exact(v,[],['return_last_frame','priority','execution_expires_after','service_tier','safety_identifier']);
 if(Object.hasOwn(v,'return_last_frame')&&typeof v.return_last_frame!=='boolean'||Object.hasOwn(v,'priority')&&(!Number.isSafeInteger(v.priority)||v.priority<0||v.priority>9)||Object.hasOwn(v,'execution_expires_after')&&(!Number.isSafeInteger(v.execution_expires_after)||v.execution_expires_after<3600||v.execution_expires_after>259200)||Object.hasOwn(v,'service_tier')&&v.service_tier!=='default'||Object.hasOwn(v,'safety_identifier')&&(typeof v.safety_identifier!=='string'||!/^[-a-zA-Z0-9_.]{1,64}$/.test(v.safety_identifier)))reject('BP_VIDEO_TASK');
 return v;
}
function encode(body,metadata,rt){
 const json=JSON.stringify(body),byteLength=Buffer.byteLength(json,'utf8');
 if(byteLength>BODY_MAX)reject('BP_BODY_LIMIT');
 return freeze({body,json,byteLength,bodySha256:createHash('sha256').update(json,'utf8').digest('hex'),...metadata,
  route:rt,accountEntitlement:'UNKNOWN',endpointBinding:'UNKNOWN',submissionAuthorization:'BLOCK',requiresRevalidation:true,requiresNewPaidConfirmation:true,autoPostRetry:false});
}
const inlinePrefix=r=>'data:'+(r.mimeType==='audio/mpeg'?'audio/mp3':r.mimeType)+';base64,';
const mockVideoURL=r=>'https://byteplus-b3-mock.invalid/'+encodeURIComponent(r.assetNodeId)+'/'+encodeURIComponent(r.mediaVersionId)+'/'+r.contentSha256;
function mediaContent(r,url){const type=r.mediaKind+'_url';return {type,[type]:{url},role:r.role.toLowerCase()};}
function videoBody(input,opts,taskOptions,lifecycle,content,rt){
 const body={model:rt.selectorValue,content,duration:input.parameters.duration,ratio:input.parameters.ratio,...opts,...taskOptions};
 if(input.operation!=='generate')body.omni_reference_task_type=input.operation;
 if(lifecycle==='draft')body.draft=true;
 return body;
}
function rejectProvenOversize(input,opts,taskOptions,lifecycle,mock,rt){
 // Only metadata is used: empty inline payloads retain every data URL prefix,
 // JSON delimiter/escape, UTF-8 prompt byte and known task/output option.
 const content=input.prompt?[{type:'text',text:input.prompt}]:[];
 for(const r of input.mediaReferences)content.push(mediaContent(r,r.mediaKind==='video'?(mock?mockVideoURL(r):''):inlinePrefix(r)));
 let overhead=0;
 try{
  const measured=Buffer.byteLength(JSON.stringify(videoBody(input,opts,taskOptions,lifecycle,content,rt)),'utf8');
  if(Number.isSafeInteger(measured)&&measured>=0)overhead=measured;
 }catch{/* Unknown overhead contributes zero; final actual JSON check still runs. */}
 let minimum=BigInt(overhead);
 for(const r of input.mediaReferences)if(r.mediaKind!=='video')minimum+=4n*((BigInt(r.byteSize)+2n)/3n);
 // Base64 is ASCII with no JSON escaping. Unknown video carriers contribute
 // only their empty-string wrapper, never raw-video bytes or invented URLs.
 if(minimum>BigInt(BODY_MAX))reject('BP_BODY_LIMIT');
}
async function serialize(value,context,mock){
 const request=data(value);exact(request,['input','output','lifecycle'],['task']);
 const checked=validateBytePlusVideoInput(request.input),input=checked.contract,opts=output(request.output),taskOptions=task(request.task);
  // Fail unconfigured installation before any resolver/carrier work.
  const rt=route(context?.endpointSelector);
 if(!['standard','draft'].includes(request.lifecycle))reject('BP_VIDEO_SCHEMA');
 if(request.lifecycle==='draft'&&opts.resolution!=='480p')reject('BP_VIDEO_DRAFT_RESOLUTION');
 // The API still accepts legacy prompt switches; reject that second parameter
 // channel rather than allowing it to contradict the explicit output contract.
 if(/(?:^|\s)--(?:[a-z_]+)\b/i.test(input.prompt??''))reject('BP_VIDEO_PROMPT_PARAMETERS');
 const clock=context?.clock,started=now(clock),captured=new Map();
 if(typeof context?.resolveMedia!=='function')reject('BP_MEDIA_RESOLVER');
 rejectProvenOversize(input,opts,taskOptions,request.lifecycle,mock,rt);
 await prepareBytePlusVideoInput(input,{nowMs:started,resolveMedia:async identity=>{
  const resolved=await context.resolveMedia(identity);
  if(!resolved)return resolved;
  // Snapshot exactly the bytes and trusted metadata passed to B2's verifier.
  const {bytes,...rest}=resolved,result={...data(rest),bytes:bytes instanceof Uint8Array?new Uint8Array(bytes):null};
  captured.set(identity.assetNodeId+'\0'+identity.mediaVersionId,result.bytes);return result;
 }});
 const verifiedAtMs=now(clock);
 if(verifiedAtMs<started)reject('BP_VIDEO_CLOCK');
 for(const r of input.mediaReferences){
  if(r.source.createdAtMs>verifiedAtMs||r.availability.availableFromMs>verifiedAtMs)reject('BP_MEDIA_UNAVAILABLE');
  if([r.source.expiresAtMs,r.availability.expiresAtMs].some(t=>t!==null&&t<=verifiedAtMs))reject('BP_MEDIA_EXPIRED');
 }
 const content=input.prompt?[{type:'text',text:input.prompt}]:[],bindings=[];
 for(const r of input.mediaReferences){
  const bytes=captured.get(r.assetNodeId+'\0'+r.mediaVersionId),kind=r.mediaKind;let url;
  if(kind==='video'){
   if(r.source.kind==='remote'&&typeof context.resolveVideoCarrier==='function'){
    const resolved=inputCarriers.carrierWire(await context.resolveVideoCarrier(r,{executionExpiresAfter:taskOptions.execution_expires_after??172800}),r,{environment:mock?'engineering-fake':'provider'});url=resolved.uri;bindings.push({...r,carrier:resolved.binding,wireContentIndex:content.length});
   }else{if(!mock)reject('BP_MEDIA_TRANSPORT_BLOCKED');
    // Reserved .invalid fixtures retain no production availability meaning.
    url=mockVideoURL(r);
   }
  }else {
   // Official data:audio/<format> uses mp3; retain B2's MIME identity audio/mpeg.
   url=inlinePrefix(r)+Buffer.from(bytes).toString('base64');
  }
  content.push(mediaContent(r,url));
  if(!bindings.some(b=>b.wireContentIndex===content.length-1))bindings.push({...r,wireContentIndex:content.length-1});
 }
 const body=videoBody(input,opts,taskOptions,request.lifecycle,content,rt);
 return encode(body,{executionEnvironment:mock?'contract-mock':'contract-only',mediaTransport:bindings.some(b=>b.carrier)?(mock?'MOCK_REGISTERED_SOURCE':'HOST_REGISTERED_SOURCE_REVALIDATED'):(mock?'MOCK_ONLY_NOT_USABLE':'VERIFIED_INLINE_ONLY'),mediaBindings:bindings,verifiedAtMs,operation:input.operation,mode:input.mode,billingStep:request.lifecycle==='draft'?'draft-separate-task':'standard-separate-task'},rt);
}
/** Contract-only serializer. Videos fail closed until a B5 transport exists. */
export function serializeBytePlusVideoRequest(request,context){return serialize(request,context,false);}
/** Explicitly synthetic fixture wire; NEVER an available/authorized media grant. */
export function serializeBytePlusVideoMock(request,context){return serialize(request,context,true);}
function expiry(created_at,draft){return created_at*1000+(draft&&created_at*1000>=DRAFT_CUTOFF?14:7)*DAY;}
/** Offline Final contract only. B6 must independently requery and confirm it. */
export function serializeBytePlusFinalRequest(value,{clock,endpointSelector}={}){
 const rt=route(endpointSelector),request=data(value);exact(request,['draftTask','output'],['task']);
 const d=request.draftTask,opts=output(request.output,true),taskOptions=task(request.task),t=now(clock);
 exact(d,['taskId','model','status','draft','created_at']);
 if(!taskId(d.taskId)||d.model!==MODEL||d.status!=='succeeded'||d.draft!==true||!timestamp(d.created_at)||d.created_at*1000>t)reject('BP_VIDEO_DRAFT_IDENTITY');
 const draftTaskExpiresAtMs=expiry(d.created_at,true);if(t>=draftTaskExpiresAtMs)reject('BP_VIDEO_DRAFT_EXPIRED');
 return encode({model:rt.selectorValue,content:[{type:'draft_task',draft_task:{id:d.taskId}}],...opts,...taskOptions},
  {executionEnvironment:'contract-only',mediaTransport:'DRAFT_TASK_REQUIRES_REQUERY',mediaBindings:[],verifiedAtMs:t,billingStep:'final-separate-task',draftTaskId:d.taskId,draftCreatedAt:d.created_at,draftTaskExpiresAtMs,requiresDraftRequery:true},rt);
}

// Preserve bounded, non-sensitive diagnostics; this is not a download validator
// or a success-publication decision. All parsed output URLs remain untrusted.
function safeText(s,redactValues){
 for(const secret of redactValues)if(secret)s=s.split(secret).join('[REDACTED]');
 return s.replace(/\bBearer\s+[^\s"'<>]+/gi,'Bearer [REDACTED]').replace(/\b(?:sk-|eyJ)[A-Za-z0-9_.-]+/g,'[REDACTED]').replace(/(?:https?:\/\/|data:)[^\s"'<>]+/gi,'[URL REDACTED]').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,'').slice(0,4096);
}
function sanitized(v,secrets,depth=0){
 if(depth>10)return '[DEPTH LIMIT]';
 if(typeof v==='string')return safeText(v,secrets);
 if(v===null||typeof v==='number'||typeof v==='boolean')return v;
 if(Array.isArray(v))return v.slice(0,100).map(x=>sanitized(x,secrets,depth+1));
 const out={};for(const [k,w] of Object.entries(v??{}).slice(0,100)){
  if(/authorization|credential|password|secret|api.?key|access.?token|prompt|cookie|^headers$|^request$/i.test(k)||['__proto__','constructor','prototype'].includes(k))continue;
  out[safeText(k,secrets)]=sanitized(w,secrets,depth+1);
 }return out;
}
function outputURL(v){if(typeof v!=='string'||v.length>16384)return null;try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password?v:null;}catch{return null;}}
/** Offline HTTP response parsing only; unknown submit outcome never means retry. */
export function parseBytePlusVideoResponse(response,{phase,expectedTaskId,nowMs,redactValues=[]}={}){
 if(!['submit','query'].includes(phase)||!Number.isSafeInteger(nowMs)||nowMs<0||expectedTaskId!==undefined&&!taskId(expectedTaskId)||!Array.isArray(redactValues)||redactValues.some(s=>typeof s!=='string'))reject('BP_VIDEO_PARSE_CONTEXT');
 const httpStatus=Number.isInteger(response?.status)&&response.status>=100&&response.status<=599?response.status:null;
 let parsed=null,parseError=null;
 try{
  const body=response?.body;
  if(Buffer.isBuffer(body)||typeof body==='string'){
   if(Buffer.byteLength(body)>1048576)throw Error();
   const text=Buffer.isBuffer(body)?new TextDecoder('utf-8',{fatal:true}).decode(body):body;parsed=data(JSON.parse(text));
  }else {parsed=data(body);if(Buffer.byteLength(JSON.stringify(parsed))>1048576)throw Error();}
  exact(parsed,[],Object.keys(parsed));
 }catch{parseError='BP_VIDEO_RESPONSE_SCHEMA';parsed={};}
 // Do not adopt a malformed success projection. Unknown enum strings remain
 // available in rawDiagnostics, while malformed values mark observation unknown.
 if(!parseError&&(
  ['created_at','updated_at'].some(k=>Object.hasOwn(parsed,k)&&!timestamp(parsed[k]))||
  ['draft','generate_audio','watermark'].some(k=>Object.hasOwn(parsed,k)&&typeof parsed[k]!=='boolean')||
  ['duration','framespersecond','frames','execution_expires_after'].some(k=>Object.hasOwn(parsed,k)&&(typeof parsed[k]!=='number'||parsed[k]<=0))||
  Object.hasOwn(parsed,'usage')&&parsed.usage!==null&&(typeof parsed.usage!=='object'||Array.isArray(parsed.usage))||
  Object.hasOwn(parsed,'content')&&(parsed.content===null||typeof parsed.content!=='object'||Array.isArray(parsed.content)||['video_url','last_frame_url'].some(k=>parsed.content[k]!==undefined&&parsed.content[k]!==null&&typeof parsed.content[k]!=='string'))||
  ['status','model','resolution','ratio','output_format'].some(k=>Object.hasOwn(parsed,k)&&typeof parsed[k]!=='string')
 ))parseError='BP_VIDEO_RESPONSE_CONTRACT';
 const rawDiagnostics=sanitized(parsed,redactValues),id=taskId(parsed.id)?parsed.id:null;
 const identityMatched=expectedTaskId===undefined||id===expectedTaskId;
 const successfulHTTP=httpStatus!==null&&httpStatus>=200&&httpStatus<300;
 const accepted=successfulHTTP&&!parseError&&id!==null&&identityMatched;
 const status=typeof rawDiagnostics.status==='string'?rawDiagnostics.status:null,knownStatus=['queued','running','succeeded','failed','expired','cancelled'].includes(status);
 const created_at=timestamp(parsed.created_at)?parsed.created_at:null,draft=typeof parsed.draft==='boolean'?parsed.draft:null;
 const actualOutput={};for(const k of ['duration','resolution','ratio','framespersecond','generate_audio','watermark','output_format','frames'])if(Object.hasOwn(rawDiagnostics,k))actualOutput[k]=rawDiagnostics[k];
 const content={video_url:outputURL(parsed.content?.video_url),last_frame_url:outputURL(parsed.content?.last_frame_url)};
 const execution=Number.isSafeInteger(parsed.execution_expires_after)&&parsed.execution_expires_after>0?parsed.execution_expires_after:null;
 const taskExpiresAtMs=created_at===null||draft===null?null:expiry(created_at,draft);
 return freeze({taskId:id,status,knownStatus,identityMatched,httpStatus,created_at,updated_at:timestamp(parsed.updated_at)?parsed.updated_at:null,
  model:typeof rawDiagnostics.model==='string'?rawDiagnostics.model:null,usage:rawDiagnostics.usage??null,actualOutput,content,draft,draft_task_id:taskId(parsed.draft_task_id)?parsed.draft_task_id:null,
  taskExpiresAtMs,taskExpired:taskExpiresAtMs===null?null:nowMs>=taskExpiresAtMs,execution_expires_after:execution,executionDeadlineMs:created_at!==null&&execution!==null?(created_at+execution)*1000:null,
  outputURLValiditySeconds:86400,outputURLExpiresAtMs:null,outputURLExpiryBasis:'NOT_PROVIDED_BY_API_DO_NOT_INFER_FROM_CREATED_AT',downloadAuthorized:false,
  error:rawDiagnostics.error??null,rawDiagnostics,requestId:safeText(String(response?.headers?.['x-request-id']??response?.headers?.['x-tt-logid']??parsed.request_id??''),redactValues)||null,
  parseError,outcome:accepted?(phase==='submit'?'accepted':knownStatus?'observed':'queryUnknown'):phase==='submit'?'submissionUnknown':'queryUnknown',autoPostRetry:false,submissionAuthorization:'BLOCK'});
}

'use strict';
// Mock response/transport subset only. No native transport or result publication.
const {canonical}=require('./live-policy.cjs'),{hash}=require('./media.cjs');
const {timedNext}=require('./stream-download.cjs'),diagnostics=require('./byteplus-diagnostics.cjs');
const fail=code=>Object.assign(new Error(code),{code});
function mockURL(value,{signed=false}={}){let u;try{u=new URL(value);}catch{throw fail('MOCK_URL_INVALID');}if(u.protocol!=='https:'||!u.hostname.endsWith('.example.invalid')||u.username||u.password||u.hash||!signed&&u.search)throw fail('MOCK_URL_INVALID');return u;}
function safeURL(value){const u=mockURL(value,{signed:true});return u.origin+u.pathname;}
function header(r,name){const k=Object.keys(r?.headers??{}).find(k=>k.toLowerCase()===name);return k?r.headers[k]:null;}
function safeDiagnostic(response,containsKnownSecret=()=>false,code=null){
 const body=response?.body&&!Buffer.isBuffer(response.body)?response.body:null;
 const d=diagnostics.normalize({httpStatus:response?.status,supplierCode:body?.error?.code,supplierMessage:body?.error?.message,requestId:header(response,'x-request-id')??body?.request_id});
 for(const k of ['supplierCode','supplierMessage','requestId'])if(d[k]!==null&&containsKnownSecret(d[k]))d[k]=null;
 return {...d,...(code?{code}:{})};
}
const CREATE_OPTIONS=Object.freeze({retry:Object.freeze({limit:0}),maxRetries:0,proxyRetries:0,automaticPostRetries:0});
async function noCreateRetries(client,request){
 mockURL(request.url);if(request.method!=='POST'||typeof client?.request!=='function')throw fail('MOCK_CREATE_CONTRACT');
 return client.request({...request,operationKind:'submit'},CREATE_OPTIONS);
}
async function readBytes(response,{maxBytes,waitMs,clock=Date.now,deadlineAt=Infinity}){
 if(!Number.isSafeInteger(maxBytes)||maxBytes<1||!Number.isSafeInteger(waitMs)||waitMs<1)throw fail('MOCK_BODY_LIMIT');
 const chunks=[];let count=0;const endAt=Math.min(deadlineAt,clock()+waitMs);if(clock()>=endAt)throw fail('BODY_DEADLINE');
 const body=response?.body;
 if(Buffer.isBuffer(body)){count=body.length;chunks.push(body);}else{
  if(!body||typeof body[Symbol.asyncIterator]!=='function')throw fail('BODY_FORMAT');const iterator=body[Symbol.asyncIterator]();
  try{while(true){if(clock()>=endAt)throw fail('BODY_DEADLINE');const value=await timedNext(iterator,{ms:Math.max(1,endAt-clock())});if(clock()>=endAt)throw fail('BODY_DEADLINE');if(value.done)break;const b=Buffer.from(value.value);count+=b.length;if(count>maxBytes)throw fail('BODY_LIMIT');chunks.push(b);}}catch(e){try{Promise.resolve(iterator.return?.()).catch(()=>{});}catch{}throw fail(['BODY_LIMIT','BODY_DEADLINE'].includes(e.code)?e.code:e.code==='STREAM_WAIT_TIMEOUT'?'BODY_DEADLINE':'BODY_INTERRUPTED');}
 }
 if(count>maxBytes)throw fail('BODY_LIMIT');const length=header(response,'content-length');if(length!==null&&(!/^\d+$/.test(String(length))||Number(length)!==count))throw fail('BODY_INCOMPLETE');return Buffer.concat(chunks);
}
class SyncObservation{
 constructor({journal,operationId,request,current,limits,containsKnownSecret=()=>false}){Object.assign(this,{journal,operationId,request:structuredClone(request),current:structuredClone(current),limits:structuredClone(limits),containsKnownSecret});mockURL(request.url);if(containsKnownSecret(request)||request.method!=='POST'||request.body?.n!==1||!Number.isSafeInteger(limits?.maxBytes)||limits.maxBytes<1||!Number.isSafeInteger(limits.waitMs)||limits.waitMs<1)throw fail('MOCK_SYNC_CONTRACT');}
 async run(client){
  const old=this.journal.query(this.operationId),digest=hash(canonical(this.request));
  if(old.state!=='not-found'){if(old.digest!==digest)throw fail('IDEMPOTENCY_CONFLICT');if(!old.observation)throw fail('MOCK_SYNC_JOURNAL');return structuredClone(old.observation);}
  const observation={state:'SUBMISSION_UNKNOWN',code:'AWAITING_COMPLETE_RESPONSE',currentResultVersion:'V1',resultVersions:{V1:this.current},automaticRetry:false,cost:'UNKNOWN'};
  this.journal.reserve({operationId:this.operationId,owner:{nodeId:this.operationId},environment:'engineering-fake',digest,plan:this.request,observation});this.journal.dispatch(this.operationId);
  try{
   const r=await noCreateRetries(client,this.request);if(r?.status!==200)throw fail('SYNC_RESPONSE_UNKNOWN');const bytes=await readBytes(r,this.limits),type=String(header(r,'content-type')??'').split(';')[0];let final=false;
   if(type==='text/event-stream')for(const block of bytes.toString('utf8').split(/\r?\n\r?\n/)){const data=block.split(/\r?\n/).find(s=>s.startsWith('data:'));if(data)try{if(JSON.parse(data.slice(5).trim()).type==='final')final=true;}catch{}}
   else if(type==='application/json'){try{JSON.parse(bytes.toString('utf8'));final=true;}catch{}}
   observation.state=final?'VERIFYING':'SUBMISSION_UNKNOWN';observation.code=final?'FINAL_REQUIRES_SEPARATE_VALIDATION':'PARTIAL_WITHOUT_FINAL';
  }catch{observation.state='SUBMISSION_UNKNOWN';observation.code='SYNC_RESPONSE_INTERRUPTED';}
  this.journal.change(this.operationId,{state:'submissionUnknown',observation});return structuredClone(observation);
 }
}
module.exports={mockURL,safeURL,header,safeDiagnostic,noCreateRetries,readBytes,SyncObservation};

'use strict';
// Finite, isolated Mock read lifecycle. Reuses the original journal/decoder and
// poll scheduler. No create port, native network, result commit or current switch.
const fs=require('node:fs'),path=require('node:path'),{randomUUID}=require('node:crypto');
const {freeze}=require('./live-policy.cjs'),poll=require('./video-poll.cjs'),media=require('./media.cjs'),audio=require('./video-audio.cjs');
const {mockURL,safeURL,header,safeDiagnostic,readBytes}=require('./api-mock-response.cjs');
const fail=code=>Object.assign(new Error(code),{code});
const integer=n=>Number.isSafeInteger(n)&&n>=0;
function retryAfter(value,now,fallback){const text=typeof value==='string'?value.trim():'';if(/^\d+$/.test(text)){const ms=Number(text)*1000;return Number.isSafeInteger(ms)?ms:fallback;}if(!/^[A-Za-z]{3}, \d{2} [A-Za-z]{3} \d{4} \d{2}:\d{2}:\d{2} GMT$/.test(text))return fallback;const date=Date.parse(text);return Number.isFinite(date)?Math.max(0,date-now):fallback;}
class MockObservation{
 constructor({journal,operationId,root,request,clock,wait,containsKnownSecret=()=>false,resultHandle=null}){
  Object.assign(this,{journal,operationId,root,request,clock,wait,containsKnownSecret});const a=journal.query(operationId);this.contract=freeze(structuredClone(a.readContract));const c=this.contract;
  if(!a.observation||!a.taskId||!c?.sourceRefs?.length||c.query?.readOnly!==true||c.query.operationKind!=='query'||!['GET','POST'].includes(c.query.method)||!integer(c.retry?.maxAttempts)||c.retry.maxAttempts<1||c.retry.maxAttempts>60||!integer(c.retry.intervalMs)||c.retry.intervalMs<1||!['executionDeadlineAt','queryRetentionUntil','mediaUrlExpiresAt'].every(k=>integer(c.lifetimes?.[k]))||!integer(c.limits?.maxDownloadBytes)||c.limits.maxDownloadBytes<1||!integer(c.limits.maxBodyWaitMs)||c.limits.maxBodyWaitMs<1||!integer(c.limits.maxOperations)||c.limits.maxOperations<1||!['width','height','durationMs'].every(k=>integer(c.output?.[k])&&c.output[k]>0)||!integer(c.output?.durationToleranceMs)||typeof c.output.generate_audio!=='boolean'||containsKnownSecret(c))throw fail('MOCK_READ_CONTRACT');
  const queryURL=c.query.url??c.query.urlTemplate?.replace('{id}',encodeURIComponent(a.taskId));mockURL(queryURL);if(/(?:generate|predict)(?:[/:]|$)/i.test(new URL(queryURL).pathname))throw fail('MOCK_READ_CONTRACT');
  if(c.query.method==='POST'&&(!/^projects\/[^/]+\/locations\/[^/]+\/.+\/operations\/[^/]+$/.test(c.query.operationName??'')||a.observation.remoteIdentity.operationName!==c.query.operationName))throw fail('MOCK_READ_CONTRACT');
  this.handle=resultHandle?{url:resultHandle.url,expiresAt:resultHandle.expiresAt}:null;if(this.handle)mockURL(this.handle.url,{signed:true});
 }
 projection(){return structuredClone(this.journal.query(this.operationId).observation);}
 save(state,patch={}){const old=this.projection(),next={...old,...structuredClone(patch),state,cost:'UNKNOWN',refund:'UNKNOWN'};if(this.containsKnownSecret(next))throw fail('MOCK_SENSITIVE_PROJECTION');this.journal.change(this.operationId,{observation:next});return this.projection();}
 record(row){const p=this.projection();if(p.operations.length>=this.contract.limits.maxOperations)throw fail('MOCK_OPERATION_LIMIT');if(this.containsKnownSecret(row))throw fail('MOCK_SENSITIVE_DIAGNOSTIC');this.journal.change(this.operationId,{observation:{...p,operations:[...p.operations,row]}});}
 paused(code,state='PAUSED_LOCAL'){return this.save(state,{lastDiagnostic:{code},automaticRetry:false});}
 blockedRead(kind){const p=this.projection(),now=this.clock();if(p.localStopped||['PAUSED_LOCAL','CANCEL_REQUESTED'].includes(p.state))return p;if(kind==='query'&&now>=p.lifetimes.queryRetentionUntil)return this.paused('QUERY_RETENTION_EXPIRED','QUERY_EXPIRED');if(kind==='query'&&!p.remoteTerminal&&now>=p.lifetimes.executionDeadlineAt)return this.paused('EXECUTION_DEADLINE');return null;}
 async read(kind,req,endAt){
  const c=this.contract,p={maxQueries:c.retry.maxAttempts,intervalMs:c.retry.intervalMs,windowMs:Math.max(0,endAt-this.clock()),initialDelayMs:0},session=poll.session('mock-'+kind,this.clock(),p);
  while(await poll.next(session,p,{clock:this.clock,wait:this.wait,stopped:()=>this.projection().localStopped})){
   let response;try{response=await this.request(kind,{...req,operationKind:kind,options:{retry:{limit:0},maxRetries:0,proxyRetries:0}});}catch{this.record({kind,method:req.method,url:safeURL(req.url),attempt:session.queries,at:this.clock(),httpStatus:null,code:'READ_INTERRUPTED'});return {failed:'READ_INTERRUPTED'};}
   const diag=safeDiagnostic(response,this.containsKnownSecret),row={kind,method:req.method,url:safeURL(req.url),body:req.body??null,attempt:session.queries,at:this.clock(),httpStatus:response?.status??null,diagnostic:diag};this.record(row);if(this.clock()>=endAt)return {failed:'READ_DEADLINE'};
   if(response?.status!==429)return {response};
   if(session.queries>=p.maxQueries)return {failed:'READ_RETRY_LIMIT'};
   const delay=Math.max(c.retry.intervalMs,retryAfter(header(response,'retry-after'),this.clock(),c.retry.intervalMs));session.nextQueryAt=Math.min(endAt,this.clock()+delay);
  }return {failed:'READ_DEADLINE'};
 }
 async query(){
  const blocked=this.blockedRead('query');if(blocked)return blocked;const p=this.projection(),q=this.contract.query,id=p.remoteIdentity.taskId,req={method:q.method,url:q.url??q.urlTemplate.replace('{id}',encodeURIComponent(id)),...(q.method==='POST'?{body:{operationName:q.operationName}}:{})};
  const endAt=Math.min(p.lifetimes.queryRetentionUntil,p.remoteTerminal?p.lifetimes.queryRetentionUntil:p.lifetimes.executionDeadlineAt),r=await this.read('query',req,endAt);if(r.failed)return this.paused(r.failed);
  const response=r.response,body=response?.body,validIdentity=q.method==='POST'?body?.name===p.remoteIdentity.operationName:body?.id===id,normalized=validIdentity&&response.status===200?this.contract.stateMap?.[body?.status]:null;
  const revision=body?.revision,old=this.projection();if(old.remoteTerminal&&normalized!==old.remoteState||integer(revision)&&integer(old.lastSequence)&&revision<old.lastSequence){const ops=old.operations;ops[ops.length-1]={...ops.at(-1),disposition:'IGNORED_STALE'};return this.save(old.state,{operations:ops});}
  if(!['QUEUED','RUNNING','REMOTE_SUCCEEDED','FAILED_REMOTE'].includes(normalized))return this.save('PROVIDER_STATE_UNKNOWN',{lastDiagnostic:safeDiagnostic(response,this.containsKnownSecret,'PROVIDER_STATE_UNKNOWN')});
  const terminal=['REMOTE_SUCCEEDED','FAILED_REMOTE'].includes(normalized),patch={remoteState:normalized,remoteTerminal:terminal,lastSequence:integer(revision)?revision:old.lastSequence,lastDiagnostic:safeDiagnostic(response,this.containsKnownSecret)};
  if(normalized==='REMOTE_SUCCEEDED'&&body.content?.video_url){
   try{mockURL(body.content.video_url,{signed:true});if(!integer(body.content.expiresAt))throw fail('MOCK_RESULT_EXPIRY');this.handle={url:body.content.video_url,expiresAt:body.content.expiresAt};patch.lifetimes={...old.lifetimes,mediaUrlExpiresAt:this.handle.expiresAt};}catch{return this.save('PROVIDER_STATE_UNKNOWN',{lastDiagnostic:{code:'RESULT_HANDLE_INVALID'}});}
  }
  return this.save(normalized,patch);
 }
 stopLocal(){return this.save('PAUSED_LOCAL',{localStopped:true,lastDiagnostic:{code:'USER_STOPPED_LOCAL'},automaticRetry:false});}
 async cancel(){
  const c=this.contract.cancel,p=this.projection();if(!c?.confirmedSupport)return this.paused('CANCEL_UNSUPPORTED');const url=c.urlTemplate.replace('{id}',encodeURIComponent(p.remoteIdentity.taskId));mockURL(url);let response;try{response=await this.request('cancel',{operationKind:'cancel',method:c.method,url,options:{retry:{limit:0},maxRetries:0,proxyRetries:0}});}catch{}
  this.record({kind:'cancel',method:c.method,url:safeURL(url),at:this.clock(),httpStatus:response?.status??null,diagnostic:safeDiagnostic(response,this.containsKnownSecret)});return this.save('CANCEL_REQUESTED',{cancelConfirmed:false,automaticRetry:false});
 }
 async download(){
  let p=this.projection();if(p.localStopped||['PAUSED_LOCAL','CANCEL_REQUESTED','FAILED_REMOTE','QUERY_EXPIRED'].includes(p.state))return p;if(!p.remoteTerminal||p.remoteState!=='REMOTE_SUCCEEDED')return p;
  if(!this.handle||this.clock()>=this.handle.expiresAt){
   if(!this.contract.canRefreshResult)return this.paused('MEDIA_URL_EXPIRED');await this.query();p=this.projection();if(p.state!=='REMOTE_SUCCEEDED')return p;if(!this.handle||this.clock()>=this.handle.expiresAt)return this.paused('MEDIA_URL_EXPIRED');
  }
  const url=this.handle.url,deadlineAt=this.handle.expiresAt,r=await this.read('download',{method:'GET',url},deadlineAt);if(r.failed)return this.paused(r.failed);
  let bytes,metadata;
  try{
   if(r.response?.status!==200||!/^video\/mp4(?:;|$)/i.test(String(header(r.response,'content-type')??'')))throw fail('TRANSFER_MIME');bytes=await readBytes(r.response,{maxBytes:this.contract.limits.maxDownloadBytes,waitMs:this.contract.limits.maxBodyWaitMs,clock:this.clock,deadlineAt});if(bytes.toString('ascii',4,8)!=='ftyp')throw fail('TRANSFER_SIGNATURE');
   const file=path.join(this.root,'candidate-'+randomUUID()+'.mp4'),fd=fs.openSync(file,'wx');try{fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}metadata=await media.inspect(file);
  }catch(e){if(e.code==='BODY_DEADLINE'||this.clock()>=deadlineAt)return this.paused('READ_DEADLINE');return this.save('TRANSFER_FAILED',{lastDiagnostic:{code:'TRANSFER_VALIDATION_FAILED'},resultVersions:{...p.resultVersions,V2:{id:'V2',status:'TRANSFER_FAILED'}}});}
  if(this.clock()>=deadlineAt)return this.paused('READ_DEADLINE');
  const expected=this.contract.output,code=metadata.width!==expected.width||metadata.height!==expected.height?'OUTPUT_GEOMETRY':Math.abs(metadata.durationMs-expected.durationMs)>expected.durationToleranceMs?'OUTPUT_DURATION':!audio.matches(metadata,{generate_audio:expected.generate_audio})?'OUTPUT_AUDIO':null;
  const version={id:'V2',status:code?'OUTPUT_REVIEW_REQUIRED':'VERIFIED_PENDING_COMMIT',metadata};
  return this.save(code?'OUTPUT_REVIEW_REQUIRED':'VERIFYING',{lastDiagnostic:{code:code??'VERIFIED_NOT_PUBLISHED',expected,observed:{width:metadata.width,height:metadata.height,durationMs:metadata.durationMs,audioCodec:metadata.audioCodec}},resultVersions:{...p.resultVersions,V2:version}});
 }
}
module.exports={MockObservation,retryAfter};

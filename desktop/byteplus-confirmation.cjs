'use strict';
// B6 offline opt-in on the existing controller. This module has no network or
// credential client, graph mutation, result publication, or recovery sender.
const crypto=require('node:crypto'),path=require('node:path'),{hash,error}=require('./media.cjs');
const clone=structuredClone,fail=code=>{throw error(code,'本次离线确认无效；未授权真实请求或自动重试');};
function plain(v,seen=new Set()){
 if(v===null||['string','boolean'].includes(typeof v)||typeof v==='number'&&Number.isFinite(v))return v;
 if(!v||typeof v!=='object'||seen.has(v)||!Array.isArray(v)&&Object.getPrototypeOf(v)!==Object.prototype)fail('BP_CONFIRM_SCHEMA');
 seen.add(v);const out=Array.isArray(v)?[]:{};
 for(const k of Reflect.ownKeys(v)){if(Array.isArray(v)&&k==='length')continue;const d=Object.getOwnPropertyDescriptor(v,k);if(typeof k!=='string'||k==='__proto__'||!d.enumerable||!Object.hasOwn(d,'value'))fail('BP_CONFIRM_SCHEMA');out[k]=plain(d.value,seen);}
 seen.delete(v);return out;
}
class OfflineBytePlusConfirmation{
 #records=new WeakMap();#jobs=new Set();
 constructor(controller,ports){this.formal=require('./byteplus-contract-policy.cjs').isContractPorts(ports,controller.s);if(!this.formal&&(controller.environment!=='engineering-fake'||ports?.mode!=='offline-mock'||['capture','resolveMedia','post','credentialUse','admit'].some(k=>typeof ports[k]!=='function')))fail('BP_OFFLINE_ONLY');this.c=controller;this.ports=ports;}
 get jobs(){return this.#jobs.size;}
 has(p){return !!p&&this.#records.has(p);}
 owner(nodeId){const {s}=this.c;s.requireWritable();if(this.c.closed||s.host.activeProjectId!==s.graph.projectId)fail('PROJECT_SCOPE');const n=s.graph.nodes.find(n=>n.id===nodeId);if(!n||!['generate.image','generate.video'].includes(n.kind)||n.dependencyIssues.length||(s.graph.reviews[nodeId]?.length??0))fail('DEPENDENCY_REVIEW');return {libraryId:s.host.repo.identity.libraryId,copyId:hash(path.resolve(s.host.root)),projectId:s.graph.projectId,graphId:s.graph.graphId,nodeId,contentRevision:n.contentRevision,graphRevision:s.graph.revision};}
 pending(nodeId){if(this.c.journal.list().some(a=>a.owner.nodeId===nodeId&&['reserved','dispatching','queued','submissionUnknown'].includes(a.state))||Object.values(this.c.s.graph.runs).some(r=>r.nodeId===nodeId&&['running','submissionUnknown'].includes(r.state)))fail('RUN_UNKNOWN_PENDING');}
 capture(nodeId,request){const owner=this.owner(nodeId),connection=plain(this.ports.capture(nodeId,clone(request)));for(const k of ['connectionId','keyEpoch','configRevision','routingId','region','canonicalModelId','selectorValue','contractVersion'])if(connection[k]===undefined||connection[k]===null||connection[k]==='')fail('BP_CONFIRM_IDENTITY');require('./secret-policy.cjs').assertSafe(connection);return {owner,connection};}
 stamp(v){return hash(this.c.s.core.canonical(v));}
 async serialize(request,nodeId,connection){
  const availability=[];
  const context={clock:this.c.clock,endpointSelector:connection?.selectorValue,...(this.formal&&typeof this.ports.resolveVideoCarrier==='function'?{resolveVideoCarrier:(ref,options)=>this.ports.resolveVideoCarrier(nodeId,ref,request,options)}:{}),resolveMedia:async id=>{const v=await this.ports.resolveMedia(id,request);availability.push({assetNodeId:id.assetNodeId,mediaVersionId:id.mediaVersionId,expiresAtMs:v?.expiresAtMs??null});return v;}};
  let artifact;
  if(request.contractKind==='byteplus.image-input')artifact=await (await import('./byteplus-image-contract.mjs')).serializeBytePlusImageRequest(request,context);
  else{
   const video=await import('./byteplus-video-contract.mjs');
   if(request.draftTask){if(typeof this.ports.queryDraft!=='function')fail('BP_DRAFT_REQUERY_REQUIRED');const actual=await this.ports.queryDraft(request.draftTask.taskId);if(this.stamp(actual)!==this.stamp(request.draftTask))fail('BP_DRAFT_CHANGED');artifact=video.serializeBytePlusFinalRequest(request,context);}
   else artifact=await (this.formal&&this.ports.executionEnvironment==='provider'?video.serializeBytePlusVideoRequest:video.serializeBytePlusVideoMock)(request,context);
  }
  if(this.formal)require('./byteplus-contract-policy.cjs').sealArtifact(artifact,request.contractKind==='byteplus.image-input'?'image':'video');const deadlines=[artifact.draftTaskExpiresAtMs,...availability.map(v=>v.expiresAtMs),...(request.input?.mediaReferences??[]).flatMap(r=>[r.source.expiresAtMs,r.availability.expiresAtMs])].filter(Number.isSafeInteger);
  return {...artifact,originalArtifact:artifact,materialAvailability:availability,confirmationExpiresAtMs:deadlines.length?Math.min(...deadlines):null};
 }
 async preview(req){
  this.c.s.core.exact(req,['nodeId','expectedRevision','request']);if(req.expectedRevision!==this.c.s.graph.revision)fail('REVISION_CONFLICT');
  const request=plain(req.request),before=this.capture(req.nodeId,request);this.pending(req.nodeId);
  const artifact=await this.serialize(request,req.nodeId,before.connection),after=this.capture(req.nodeId,request);if(this.stamp(before)!==this.stamp(after))fail('REVISION_CONFLICT');
  const route=artifact.route;if(['region','canonicalModelId','selectorValue','contractVersion'].some(k=>route[k]!==after.connection[k]))fail('BP_CONFIRM_ROUTE');
  const kind=request.contractKind==='byteplus.image-input'?'image':'video';if(this.c.s.graph.nodes.find(n=>n.id===req.nodeId).kind!=='generate.'+kind)fail('MODEL_MEDIA_MISMATCH');
  const confirmationSummary={version:this.formal?4:2,owner:after.owner,connection:after.connection,route,request,materials:artifact.mediaBindings,materialAvailability:artifact.materialAvailability,parameters:clone(request.output),outputs:{min:request.operation==='layer_decomposition'?2:1,max:request.operation==='layer_decomposition'?17:1},bodySha256:artifact.bodySha256,byteLength:artifact.byteLength,execution:this.formal?'byteplus-contract/4':'offline-mock-only',...(this.formal?{environment:this.c.environment,transportKind:this.ports.transportKind,executionEnvironment:this.ports.executionEnvironment}:{}),accountEntitlement:this.formal?'NOT_VERIFIED':'UNKNOWN',endpointBinding:this.formal?'NOT_VERIFIED':'UNKNOWN',productionAuthorization:this.formal?'NATIVE_CONFIRMATION_REQUIRED':'BLOCK',automaticRetry:false};
  require('./secret-policy.cjs').assertSafe(confirmationSummary);
  const previewId='preview-'+crypto.randomUUID(),digest=this.stamp(confirmationSummary),p={previewId,digest,owner:after.owner,name:this.c.s.graph.nodes.find(n=>n.id===req.nodeId).label,environment:this.formal?this.c.environment:'engineering-fake',paid:this.formal&&this.ports.transportKind==='native-byteplus-https',expiresAt:this.c.clock()+120000,confirmationSummary};
  this.c.previews.set(previewId,p);this.#records.set(p,{request,snapshot:after,summaryHash:digest,createdAt:this.c.clock(),bodySha256:artifact.bodySha256,validUntil:Math.min(p.expiresAt,artifact.confirmationExpiresAtMs??Infinity),confirming:false});return clone(p);
 }
 startNative(p,digest){let scheduled;const dispatched=new Promise(resolve=>scheduled=resolve),work=this.confirm(p,digest,scheduled);work.catch(()=>{});return Promise.race([dispatched,work]);}
 hasJob(id){return [...this.#jobs].some(a=>a.operationId===id);}
 stop(id){for(const a of this.#jobs)if(a.operationId===id)a.abort();}
 async confirm(p,digest,onDispatch){
  const record=this.#records.get(p);if(!record||record.confirming)fail('PAID_PREVIEW_EXPIRED');record.confirming=true;
  const assert=()=>{if(this.c.previews.get(p.previewId)!==p||this.c.closed||this.c.clock()<record.createdAt||this.c.clock()>=record.validUntil||digest!==p.digest||this.stamp(p.confirmationSummary)!==record.summaryHash||this.stamp(this.capture(p.owner.nodeId,record.request))!==this.stamp(record.snapshot))fail('REVISION_CONFLICT');};
  let release,operationId,abort=new AbortController();this.#jobs.add(abort);
  try{
   assert();release=this.ports.admit(record.snapshot.owner);this.pending(p.owner.nodeId);
   const artifact=await this.serialize(record.request,p.owner.nodeId,record.snapshot.connection);record.validUntil=Math.min(record.validUntil,artifact.confirmationExpiresAtMs??Infinity);assert();if(artifact.bodySha256!==record.bodySha256)fail('REVISION_CONFLICT');
   if(this.formal)this.ports.beforeReserve(record.snapshot.connection);operationId='generation-'+crypto.randomUUID();abort.operationId=operationId;const taskSnapshot=clone(p.confirmationSummary);
   this.c.journal.reserve({operationId,digest,recordVersion:this.formal?4:2,...(this.formal?{attemptAuthorization:'ATTEMPT_AUTHORIZED',supplierDecision:'NOT_VERIFIED'}:{}),owner:p.owner,plan:{model:artifact.route.canonicalModelId,mediaKind:record.request.contractKind==='byteplus.image-input'?'image':'video',operation:artifact.operation??'final'},environment:this.formal?this.c.environment:'engineering-fake',name:p.name,...(this.c.b7?{b7Version:1,runId:'run-b7-'+hash(operationId).slice(0,32),submissionId:'submission-b7-'+hash(operationId).slice(0,32)}:{}),taskSnapshot,snapshotSha256:this.stamp(taskSnapshot)});
   const proofContext=this.c.b7?.proofContext(operationId);
   const result=await this.ports.credentialUse(record.snapshot.connection,async proof=>{
    // FIFO credential wait is a dependency boundary. capture rechecks local
    // versions AND bytes synchronously. Dispatch fsync happens before POST.
    if(typeof this.ports.revalidateCarriers==='function')await this.ports.revalidateCarriers(p.owner.nodeId,record.request,record.snapshot.connection,{signal:abort.signal});assert();if(abort.signal.aborted)fail('BP_CONFIRM_CANCELLED');this.pendingExcept(operationId,p.owner.nodeId);
    if(this.c.b7){this.c.b7.acceptProof(operationId,proof);this.c.b7.bindRun(operationId);}this.c.journal.dispatch(operationId);this.c.previews.delete(p.previewId);
    const response=this.ports.post(clone(artifact.body),{signal:abort.signal,operationId,mediaKind:record.request.contractKind==='byteplus.image-input'?'image':'video',...(this.formal?{artifact:artifact.originalArtifact}: {})});onDispatch?.({operationId,scheduled:true,submitted:true,environment:this.formal?this.c.environment:'engineering-fake'});return response;
   },proofContext);
   if(this.c.b7)await this.c.b7.accept(operationId,result,{artifact:artifact.originalArtifact,signal:abort.signal});else if(result?.status==='failed')this.c.journal.change(operationId,{state:'failed',reason:'OFFLINE_MOCK_REJECTED'});
   else if(result?.status==='queued'&&/^mock-[-a-zA-Z0-9]{1,80}$/.test(result.taskId??''))this.c.journal.change(operationId,{state:'queued',taskId:result.taskId});
   else this.c.journal.change(operationId,{state:'submissionUnknown',reason:this.formal?'BP_SUBMISSION_UNKNOWN_NO_RETRY':'OFFLINE_MOCK_UNKNOWN_NO_RETRY'});
   this.c.notify();return this.c.journal.query(operationId);
  }catch(e){
   if(this.c.journal.failed){this.c.s.readOnly=true;this.c.s.loadError={code:'BYTEPLUS_JOURNAL_FAILED',message:'Submission facts require inspection; writes stopped'};}
   if(operationId&&!this.c.journal.failed&&!this.c.journal.query(operationId).resultSet){const a=this.c.journal.query(operationId);try{this.c.journal.change(operationId,{state:a.submissions?'submissionUnknown':'cancelled-before-send',...(a.recordVersion===4?{supplierDecision:a.submissions?'UNKNOWN':'NOT_VERIFIED'}:{}),reason:a.submissions?'OFFLINE_SUBMISSION_UNKNOWN':'DEPENDENCY_OR_CREDENTIAL_CHANGED'});}catch{this.c.s.readOnly=true;}}
   throw error(/^[-A-Z_0-9]+$/.test(e?.code??'')?e.code:'BP_CONFIRM_FAILED','本次离线操作未完成；保留提交事实，不自动重试');
  }finally{if(operationId)this.c.b7?.finishSubmission(operationId);this.c.previews.delete(p.previewId);this.#records.delete(p);this.#jobs.delete(abort);release?.();}
 }
 pendingExcept(operationId,nodeId){if(this.c.journal.list().some(a=>a.operationId!==operationId&&a.owner.nodeId===nodeId&&['reserved','dispatching','queued','submissionUnknown'].includes(a.state)))fail('RUN_UNKNOWN_PENDING');}
 close(){for(const abort of this.#jobs)abort.abort();}
}
module.exports={OfflineBytePlusConfirmation};

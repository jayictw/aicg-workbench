'use strict';
const {hash,error}=require('./media.cjs'),{canonical}=require('./live-policy.cjs'),crypto=require('node:crypto');
const {BytePlusResultStore}=require('./byteplus-result-store.cjs');
const safeId=v=>typeof v==='string'&&/^[-a-zA-Z0-9_.]{1,128}$/.test(v);
const fail=code=>{throw error(code,'原任务未完成核对；不重新生成，旧成果保留');};
const stamp=v=>hash(canonical(v));
// Cold-open evidence is minted by the BytePlus ProjectService init path, never
// from a renderer flag. It is an observation, not paid/recovery authorization.
const coldOpens=new WeakMap();
function captureColdOpen(service){
 if(service.readOnly&&service.loadError?.code==='VIDEO_WORKER_LOCKED'&&service.dirty&&service.graph&&service.host)
  coldOpens.set(service,{host:service.host,graph:service.graph,digest:stamp(service.graph),rootDigest:stamp(service.host.data),savedRevision:service.host.savedRevision});
}
function verifyColdOpenUncertainty(service){
 const cold=coldOpens.get(service),h=service.host;
 if(!cold||cold.host!==h||cold.graph!==service.graph||cold.digest!==stamp(service.graph)||cold.rootDigest!==stamp(h.data)||cold.savedRevision!==h.savedRevision||h.services.get(service.projectId)!==service||h.activeProjectId!==service.projectId||!service.lockOwned||service.closed||service.issues?.length)fail('RECOVERY_DIRTY');
 // CanvasRepository.load reads the live in-memory graph. Use the unchanged
 // SQLite repository instead, whose load verifies the committed SHA/media.
 const disk=h.repo.load(),saved=disk.data?.business?.canvasSection?.graphs?.[service.projectId];
 if(disk.revision!==cold.savedRevision||!saved||disk.data.libraryId!==h.repo.identity.libraryId||saved.graphId!==service.graph.graphId||saved.projectId!==service.projectId)fail('RECOVERY_DIRTY');
 const stored=disk.data.business.canvasSection.graphs,current=h.data.business.canvasSection.graphs;
 if(stamp(Object.keys(stored).sort())!==stamp(Object.keys(current).sort()))fail('RECOVERY_DIRTY');
 for(const [id,g]of Object.entries(stored))if(id!==service.projectId&&stamp(h.services.get(id)?.graph??current[id])!==stamp(g))fail('RECOVERY_DIRTY');
 if(h.originChanges(service.projectId,service.graph).length)fail('RECOVERY_DIRTY');
 service.verifyGraph(saved);
 const {BytePlusJournal}=require('./byteplus-journal.cjs'),fs=require('node:fs'),path=require('node:path');
 if(!fs.existsSync(path.join(service.repo.root,'byteplus-attempts.json')))fail('RECOVERY_DIRTY');
 const journal=new BytePlusJournal(service.repo.root,{libraryId:h.repo.identity.libraryId,copyId:hash(path.resolve(h.root)),projectId:service.projectId,graphId:saved.graphId},{reopen:false}),expected=structuredClone(saved);let count=0;
 for(const run of Object.values(saved.runs))if(run.state==='running'){
  const a=journal.privateAttempt(run.snapshot?.capability?.operationId),now=service.graph.runs[run.id];
  if(!['byteplus-workbench/generation/2','byteplus-workbench/generation/3','byteplus-workbench/generation/4'].includes(run.snapshot?.capability?.id)||!a||a.b7Version!==1||!require('./byteplus-contract-policy.cjs').compatible(a,run.snapshot.capability.environment)||a.submissions!==1||a.restoredReadOnly||!journal.hasContinuity(a.operationId)||a.runId!==run.id||a.submissionId!==run.submissionId||a.snapshotSha256!==stamp(a.taskSnapshot)||a.digest!==a.snapshotSha256||stamp(run.snapshot.capability.contractSnapshot)!==a.digest||a.owner.nodeId!==run.nodeId||a.owner.contentRevision!==run.nodeContentRevision||!['queued','submissionUnknown','succeeded'].includes(a.state)||!a.resultSet&&!safeId(a.taskId))fail('RECOVERY_DIRTY');
  const event=now?.events?.at(-1);
  if(now.state!=='submissionUnknown'||now.events.length!==run.events.length+1||!event||Object.keys(event).sort().join(',')!=='at,eventId,ignored,reason,state'||!/^event-[a-f0-9-]{36}$/.test(event.eventId)||event.state!=='submissionUnknown'||event.ignored!==false||!Number.isFinite(Date.parse(event.at))||event.reason!=='新進程重開；原執行結果未知，未恢復提交權或重送')fail('RECOVERY_DIRTY');
  const node=service.graph.nodes.find(n=>n.id===a.owner.nodeId);if(!node||node.contentRevision!==a.owner.contentRevision)fail('RECOVERY_DIRTY');
  const selected=service.core.effectiveInput(service.graph,node).media;
  for(const m of a.taskSnapshot.connection.materials??[]){const meta=service.graph.mediaVersions[m.version],source=service.graph.nodes.find(n=>n.id===m.nodeId),result=source?.payload.selectedResultId&&service.graph.results[source.payload.selectedResultId];
   const linked=selected.some(x=>x.sourceNodeId===m.nodeId&&x.mediaRef.mediaVersionId===m.version),owned=source?.kind.startsWith('asset.')&&source.payload.mediaVersionId===m.version&&meta?.assetId===source.payload.assetId||result?.acceptance&&result.mediaVersionId===m.version&&meta?.resultId===result.id;
   if(!linked&&(![3,4].includes(a.recordVersion)||!owned)||!meta||stamp(meta)!==stamp(m.metadata))fail('RECOVERY_DIRTY');service.checkMediaBytes(meta);}
  expected.runs[run.id].state='submissionUnknown';expected.runs[run.id].events.push(structuredClone(event));count++;
 }
 if(!count)fail('RECOVERY_DIRTY');expected.revision++;
 if(stamp(expected)!==cold.digest)fail('RECOVERY_DIRTY');
 for(const meta of Object.values(service.graph.mediaVersions))service.checkMediaBytes(meta);
 return true;
}
function usage(v){if(v===undefined||v===null)return null;const allowed=['generated_images','input_images','output_tokens','completion_tokens','total_tokens'],out={};for(const [k,n]of Object.entries(v)){if(!allowed.includes(k)||!Number.isSafeInteger(n)||n<0)fail('BP_TASK_USAGE');out[k]=n;}return out;}
function continuityContext(a,nonce,sessionId){if(a?.b7Version!==1||a.snapshotSha256!==stamp(a.taskSnapshot)||!/^[-a-zA-Z0-9]{1,90}$/.test(a.operationId??'')||!/^[a-f0-9]{64}$/.test(nonce??'')||!/^[-a-zA-Z0-9]{1,90}$/.test(sessionId??''))fail('BP_RECOVERY_PROOF');return canonical({domain:'aicg.byteplus.continuity/1',nonce,sessionId,operationId:a.operationId,snapshotSha256:a.snapshotSha256,owner:a.owner,connection:a.taskSnapshot.connection});}
class BytePlusRecovery{
 constructor(c,ports,backend){const formal=require('./byteplus-contract-policy.cjs').isContractPorts(ports,c.s);if((formal?backend?.mode!=='formal-contract':c.environment!=='engineering-fake'||backend?.mode!=='offline-mock')||typeof backend.decode!=='function'||typeof backend.queryTask!=='function'||!backend.media)fail('BP_OFFLINE_ONLY');if(typeof ports.captureRecovery!=='function'||typeof ports.recoveryUse!=='function')fail('BP_D1_REQUIRED');this.c=c;this.ports=ports;this.backend=backend;this.store=new BytePlusResultStore(c,backend);this.liveBindings=new Map();this.proofNonces=new Map();}
 proofContext(operationId){const nonce=crypto.randomBytes(32).toString('hex');this.proofNonces.set(operationId,nonce);return Object.freeze({operationId,nonce});}
 acceptProof(operationId,proof){if(proof?.version!==1||proof.nonce!==this.proofNonces.get(operationId)||!/^[a-f0-9]{64}$/.test(proof.digest??'')||!/^[-a-zA-Z0-9]{1,90}$/.test(proof.sessionId??''))fail('BP_RECOVERY_PROOF');this.c.journal.change(operationId,{_continuity:{version:1,nonce:proof.nonce,digest:proof.digest,sessionId:proof.sessionId}});this.liveBindings.set(operationId,stamp(this.ports.captureRecovery(operationId)));}
 finishSubmission(operationId){this.liveBindings.delete(operationId);this.proofNonces.delete(operationId);this.backend.releaseOperation?.(operationId);}
 async withCredential(operationId,invoke){return this.ports.recoveryUse(operationId,async connection=>{this.liveBindings.set(operationId,stamp(connection));try{this.check(this.c.journal.query(operationId));return await invoke();}finally{this.liveBindings.delete(operationId);}});}
 bindRun(operationId){const a=this.c.journal.query(operationId),s=this.c.s;const receipt=require('./byteplus-project.cjs').startGeneration(s,{commandVersion:1,commandId:'cmd-b7-'+hash(operationId).slice(0,32),projectId:a.owner.projectId,graphId:a.owner.graphId,expectedRevision:s.graph.revision,operation:{type:'byteplus.run',nodeId:a.owner.nodeId,operationId,environment:[3,4].includes(a.recordVersion)?a.environment:'engineering-fake',contractSnapshot:a.taskSnapshot}});const run=s.graph.runs[receipt.createdIds[0]];this.c.journal.change(operationId,{originalRun:structuredClone(run)});}
 check(a,{requireTask=false}={}){
  this.c.s.requireWritable();if(this.c.closed||a?.b7Version!==1||!require('./byteplus-contract-policy.cjs').compatible(a,this.c.environment)||a.restoredReadOnly||this.c.s.host.activeProjectId!==a.owner.projectId||this.c.s.graph.graphId!==a.owner.graphId||a.owner.copyId!==this.c.journal.identity.copyId)fail('BP_RECOVERY_IDENTITY');
  if(!this.c.journal.hasContinuity(a.operationId))fail('BP_RECOVERY_PROOF');
  const connection=this.ports.captureRecovery(a.operationId);for(const k of ['connectionId','configRevision','routingId','region','canonicalModelId','selectorValue','contractVersion'])if(connection[k]!==a.taskSnapshot.connection[k])fail('BP_RECOVERY_CONNECTION');
  if(this.c.journal.privateAttempt(a.operationId)._continuity.sessionId===connection.recoverySession&&connection.keyEpoch!==a.taskSnapshot.connection.keyEpoch)fail('BP_RECOVERY_CONNECTION');
  if(this.liveBindings.has(a.operationId)&&this.liveBindings.get(a.operationId)!==stamp(connection))fail('BP_RECOVERY_CONNECTION');
  if(stamp(connection.materials??[])!==stamp(a.taskSnapshot.connection.materials??[]))fail('BP_RECOVERY_SOURCE');
  if(requireTask&&!safeId(a.taskId))fail('BP_TASK_UNKNOWN');
  if(!a.resultSet)for(const k of ['taskExpiresAtMs','draftExpiresAtMs'])if(Number.isSafeInteger(a.remoteFacts?.[k])&&a.remoteFacts[k]<=this.c.clock())fail(k==='taskExpiresAtMs'?'BP_TASK_EXPIRED':'BP_DRAFT_EXPIRED');
  return a;
 }
 facts(a,patch){const old=a.remoteFacts??{},next={...old,...patch};for(const k of ['remoteCreatedAtMs','taskExpiresAtMs','draftExpiresAtMs','executionDeadlineMs','outputURLExpiresAtMs'])if(next[k]!==null&&next[k]!==undefined&&(!Number.isSafeInteger(next[k])||next[k]<0))fail('BP_TASK_FACTS');if(old.remoteCreatedAtMs!=null&&patch.remoteCreatedAtMs!=null&&old.remoteCreatedAtMs!==patch.remoteCreatedAtMs)fail('BP_TASK_IDENTITY');return next;}
 downloadObservation(e){return e?.code==='BP_MEDIA_RESPONSE'&&e.phase==='download'&&Number.isInteger(e.httpStatus)&&e.httpStatus>=100&&e.httpStatus<=599?{downloadDiagnostics:{phase:'download',code:'BP_MEDIA_RESPONSE',httpStatus:e.httpStatus,observedAtMs:this.c.clock()}}:{};}
 async accept(operationId,response,{artifact,signal}={}){
  const a=this.check(this.c.journal.query(operationId));
  if(a.recordVersion===4&&response?.status==='unknown'&&Number.isInteger(response.httpStatus)){this.c.journal.change(operationId,{state:'submissionUnknown',supplierDecision:'UNKNOWN',reason:'BP_HTTP_UNKNOWN_NO_RETRY',lastHttpStatus:response.httpStatus,diagnostics:require('./byteplus-diagnostics.cjs').normalize(response.diagnostics)});return;}
  if(response?.status==='failed'&&!response.body){const formal=[3,4].includes(a.recordVersion);this.c.journal.change(operationId,{state:'failed',...(a.recordVersion===4?{supplierDecision:'PROVIDER_REJECTED'}:{}),reason:formal?'BP_HTTP_FAILED':'OFFLINE_MOCK_REJECTED',...(formal?{lastHttpStatus:response.httpStatus,diagnostics:require('./byteplus-diagnostics.cjs').normalize(response.diagnostics)}:{})});this.c.event(a,'failed',null,formal?'BP_HTTP_FAILED':'OFFLINE_MOCK_REJECTED');return;}
  if(response?.status==='queued'&&safeId(response.taskId)){this.c.journal.change(operationId,{state:'queued',taskId:response.taskId,...(a.recordVersion===4?{supplierDecision:'ACCEPTED_FOR_THIS_TASK'}:{}),remoteFacts:this.facts(a,{remoteCreatedAtMs:null,taskExpiresAtMs:null,usage:null,status:'queued'})});return;}
  if(a.plan.mediaKind==='image'){
   if(!artifact)fail('BP_IMAGE_SYNC_UNKNOWN');
   const body=response?.body??response;const mod=await import('./byteplus-image-contract.mjs'),parsed=mod.parseBytePlusImageResponse(body,artifact);if(parsed.status!=='parsed')fail(parsed.errorCode??'BP_IMAGE_RESULT');
   if(parsed.operation==='layer_decomposition'&&parsed.results.some((r,i)=>r.wireIndex!==i))fail('BP_RESULT_ORDER');
   this.c.journal.change(operationId,{...(a.recordVersion===4?{supplierDecision:'ACCEPTED_FOR_THIS_TASK'}:{}),remoteFacts:this.facts(a,{remoteCreatedAtMs:parsed.created*1000,taskExpiresAtMs:null,outputURLExpiresAtMs:parsed.results.some(r=>Number.isSafeInteger(r.expiresAtMs))?Math.min(...parsed.results.filter(r=>Number.isSafeInteger(r.expiresAtMs)).map(r=>r.expiresAtMs)):null,outputURLExpiryBasis:parsed.results.some(r=>Number.isSafeInteger(r.expiresAtMs))?'RESPONSE_CREATED_PLUS_86400_SECONDS':'INLINE_BASE64',usage:usage(parsed.usage),status:'succeeded'})});
   const {createBytePlusMediaBoundary}=await import('./byteplus-media-transport.mjs');const boundary=createBytePlusMediaBoundary(this.backend.mediaFor?.(operationId)??this.backend.media),prepared=await boundary.prepareImageResponse(body,artifact,{signal,locateOutput:r=>this.backend.locateOutput(r,a,{signal})}).catch(e=>{const observation=this.downloadObservation(e);if(observation.downloadDiagnostics)this.c.journal.change(operationId,observation);throw e;});
   const rows=prepared.results.map(r=>({...r,requireAlpha:parsed.requiresAlpha||parsed.operation==='layer_decomposition'&&r.z_index>0}));
   return this.store.commit(operationId,rows,{signal,operation:parsed.operation==='layer_decomposition'?'layer_decomposition':'single',revalidate:()=>{this.check(this.c.journal.query(operationId));if(rows.some(r=>Number.isSafeInteger(r.sourceExpiresAtMs)&&r.sourceExpiresAtMs<=this.c.clock()))fail('BP_URL_EXPIRED');}});
  }
  return this.observe(operationId,response,{signal});
 }
 async observe(operationId,response,{signal}={}){
  const a=this.check(this.c.journal.query(operationId),{requireTask:true}),{parseBytePlusVideoResponse}=await import('./byteplus-video-contract.mjs');
  const parsed=parseBytePlusVideoResponse(response,{phase:'query',expectedTaskId:a.taskId,nowMs:this.c.clock()});
  const diag=require('./byteplus-diagnostics.cjs').capture({status:response?.status,headers:response?.headers,body:Buffer.from(JSON.stringify(response?.body??{}))},null);
  this.c.journal.change(operationId,{diagnostics:diag,lastHttpStatus:parsed.httpStatus});
  if(parsed.httpStatus===404)fail('BP_TASK_UNKNOWN');if(parsed.outcome!=='observed'||!parsed.identityMatched||!parsed.knownStatus)fail('BP_TASK_QUERY_UNKNOWN');
  if(parsed.model!==a.plan.model)fail('BP_TASK_MODEL');
  const remoteFacts=this.facts(a,{remoteCreatedAtMs:parsed.created_at===null?null:parsed.created_at*1000,taskExpiresAtMs:parsed.taskExpiresAtMs,draftExpiresAtMs:parsed.draft?parsed.taskExpiresAtMs:null,executionDeadlineMs:parsed.executionDeadlineMs,executionExpiresAfterSeconds:parsed.execution_expires_after,outputURLExpiresAtMs:parsed.outputURLExpiresAtMs,outputURLExpiryBasis:parsed.outputURLExpiryBasis,usage:usage(parsed.usage),status:parsed.status,requestId:diag?.requestId??null});
  this.c.journal.change(operationId,{remoteFacts});this.check(this.c.journal.query(operationId));
  if(['failed','expired','cancelled'].includes(parsed.status)){this.c.journal.change(operationId,{state:'failed',reason:parsed.status==='expired'?'BP_TASK_EXPIRED':diag?.supplierCode??'BP_TASK_FAILED'});this.c.event(a,'failed',null,'Original provider terminal status '+parsed.status);return;}
  if(parsed.status!=='succeeded'){this.c.journal.change(operationId,{state:'queued',localPhase:'poll-paused'});return;}
  if(!parsed.content.video_url||typeof this.backend.locateVideo!=='function')fail('BP_VIDEO_RESULT');
  const request=await this.backend.locateVideo(parsed,a);if(!request?.members||request.members.length!==1||request.members[0].expectedUri!==parsed.content.video_url)fail('BP_RECOVERY_SOURCE');
  const {createBytePlusMediaBoundary}=await import('./byteplus-media-transport.mjs'),prepared=await createBytePlusMediaBoundary(this.backend.mediaFor?.(operationId)??this.backend.media).prepareSet(request,{signal});
  const rows=prepared.results.map(r=>({...r,width:r.decoded.width,height:r.decoded.height,sourceExpiresAtMs:r.source.expiresAtMs}));
  const expected=a.taskSnapshot.request.output,actual=parsed.actualOutput;
  if(expected.output_format&&actual.output_format&&expected.output_format!==actual.output_format||expected.resolution&&actual.resolution&&expected.resolution!==actual.resolution)fail('BP_VIDEO_OUTPUT');
  const d=prepared.results[0].decoded;if(expected.output_format==='mov'&&d.mimeType!=='video/quicktime'||expected.output_format==='mp4'&&d.mimeType!=='video/mp4'||expected.generate_audio===false&&d.audioCodec!==null||Number.isFinite(actual.duration)&&Math.abs(d.durationMs-actual.duration*1000)>1000/d.fps+5)fail('BP_VIDEO_OUTPUT');
  return this.store.commit(operationId,rows,{signal,revalidate:()=>{this.check(this.c.journal.query(operationId));if(rows.some(r=>r.sourceExpiresAtMs<=this.c.clock()))fail('BP_URL_EXPIRED');}});
 }
 recover(operationId){
  const a=this.check(this.c.journal.query(operationId));if(this.c.work.has(operationId))return this.c.query(operationId);
  if(!a.resultSet)this.check(a,{requireTask:true});
  if(['failed','cancelled-before-send'].includes(a.state)||a.cloudRecordDeleted)fail('BP_TASK_TERMINAL');
  const abort=new AbortController(),release=this.ports.admitRecovery?this.ports.admitRecovery(operationId):this.ports.admit(a.owner),entry={abort,promise:null};
  entry.promise=this.withCredential(operationId,async()=>{this.c.journal.change(operationId,{lastLocalStop:false});if(a.resultSet)return this.store.publish(operationId,{signal:abort.signal});const maxQueries=this.backend.poll?.maxQueries??120,intervalMs=this.backend.poll?.intervalMs??30000;if(!Number.isSafeInteger(maxQueries)||maxQueries<1||maxQueries>120||!Number.isSafeInteger(intervalMs)||intervalMs<0||intervalMs>30000)fail('BP_POLL_POLICY');
   for(let i=0;i<maxQueries;i++){if(abort.signal.aborted)fail('BP_LOCAL_STOPPED');this.check(this.c.journal.query(operationId),{requireTask:true});const response=await this.backend.queryTask(a.taskId,{signal:abort.signal});if(abort.signal.aborted)fail('BP_LOCAL_STOPPED');this.check(this.c.journal.query(operationId),{requireTask:true});await this.observe(operationId,response,{signal:abort.signal});const current=this.c.journal.query(operationId);this.c.notify();if(current.state!=='queued'||current.resultSet)return;if(i+1<maxQueries&&intervalMs)await new Promise(resolve=>{let timer;const done=()=>{clearTimeout(timer);abort.signal.removeEventListener('abort',done);resolve();};abort.signal.addEventListener('abort',done,{once:true});timer=setTimeout(done,intervalMs);if(abort.signal.aborted)done();});}
  }).catch(e=>{if(!this.c.journal.failed)this.c.journal.change(operationId,{reason:/^(?:BP|CREDENTIAL)_[A-Z0-9_]+$/.test(e?.code??'')?e.code:'BP_RECOVERY_LOCAL',localPhase:'paused',...this.downloadObservation(e)});else this.c.s.readOnly=true;}).finally(()=>{release?.();this.backend.releaseOperation?.(operationId);this.c.work.delete(operationId);this.c.notify();});this.c.work.set(operationId,entry);return this.c.query(operationId);
 }
 list(){return {items:this.c.journal.list().map(a=>({operationId:a.operationId,taskId:a.taskId,state:a.state,remoteFacts:a.remoteFacts??null,submissions:a.submissions,localWaitStopped:!!a.lastLocalStop,cloudRecordDeleted:!!a.cloudRecordDeleted,resultPreserved:!!(a.resultSet||a.result),automaticRetry:false})),rangeResumeSupported:false};}
 async statusOnly(operationId,signal){const a=this.check(this.c.journal.query(operationId),{requireTask:true});if(a.cloudRecordDeleted)fail('BP_TASK_UNKNOWN');const r=await this.backend.queryTask(a.taskId,{signal});this.check(this.c.journal.query(operationId),{requireTask:true});if(signal?.aborted)fail('BP_LOCAL_STOPPED');const {parseBytePlusVideoResponse}=await import('./byteplus-video-contract.mjs'),v=parseBytePlusVideoResponse(r,{phase:'query',expectedTaskId:a.taskId,nowMs:this.c.clock()});if(v.outcome!=='observed'||v.model!==a.plan.model)fail('BP_TASK_QUERY_UNKNOWN');const facts=this.facts(a,{remoteCreatedAtMs:v.created_at===null?null:v.created_at*1000,taskExpiresAtMs:v.taskExpiresAtMs,usage:usage(v.usage),status:v.status});this.c.journal.change(operationId,{remoteFacts:facts});return this.c.journal.query(operationId);}
 async reconcile(operationId){this.check(this.c.journal.query(operationId),{requireTask:true});if(this.c.work.has(operationId))fail('BP_TASK_BUSY');return this.withCredential(operationId,()=>this.statusOnly(operationId));}
 async listRemote(operationId){this.check(this.c.journal.query(operationId),{requireTask:true});if(typeof this.backend.listTasks!=='function')fail('BP_CLOUD_UNSUPPORTED');return this.withCredential(operationId,async()=>{const response=await this.backend.listTasks(),items=response?.items;if(!Array.isArray(items)||items.length>100)fail('BP_TASK_LIST');const result=[];for(const item of items){if(!safeId(item.id)||typeof item.model!=='string'||!['queued','running','succeeded','failed','expired','cancelled'].includes(item.status))fail('BP_TASK_LIST');const local=this.c.journal.list().find(a=>a.taskId===item.id&&a.plan.model===item.model);result.push({taskId:item.id,status:item.status,knownLocalOperation:local?.operationId??null,canAdopt:false});}this.check(this.c.journal.query(operationId));return {items:result,automaticAdoption:false};});}
 async cloudAction(operationId,action){
  if(!['cancel-queued','delete-record'].includes(action)||typeof this.backend.deleteTask!=='function')fail('BP_CLOUD_UNSUPPORTED');if(this.c.work.has(operationId))fail('BP_TASK_BUSY');
  const before=this.check(this.c.journal.query(operationId),{requireTask:true});if(before.cloudActionIntent?.status==='unknown')fail('BP_CLOUD_OUTCOME_UNKNOWN');const release=this.ports.admitRecovery?this.ports.admitRecovery(operationId):this.ports.admit(before.owner),abort=new AbortController(),entry={abort,promise:null};
  const work=this.withCredential(operationId,async()=>{const a=await this.statusOnly(operationId,abort.signal),status=a.remoteFacts.status;
   if(action==='cancel-queued'?status!=='queued':!['succeeded','failed','cancelled','expired'].includes(status))fail('BP_CLOUD_STATUS');
   this.c.journal.change(operationId,{cloudActionIntent:{action,taskId:a.taskId,status:'unknown'}});
   try{await this.backend.deleteTask(a.taskId,{action,signal:abort.signal});this.check(this.c.journal.query(operationId));if(abort.signal.aborted)fail('BP_LOCAL_STOPPED');this.c.journal.change(operationId,{cloudActionIntent:{action,taskId:a.taskId,status:'acknowledged'},...(action==='cancel-queued'?{remoteFacts:{...a.remoteFacts,status:'cancelled'},state:'failed',reason:'BP_CLOUD_CANCELLED'}:{cloudRecordDeleted:true})});if(action==='cancel-queued')this.c.event(a,'failed',null,'Original queued task cancellation acknowledged');}catch{fail('BP_CLOUD_OUTCOME_UNKNOWN');}
   return {localPaidFactsPreserved:true,localResultPreserved:true,providerCancellation:action==='cancel-queued',cloudRecordDeleted:action==='delete-record',refundGuaranteed:false};
  });entry.promise=work;this.c.work.set(operationId,entry);try{return await work;}finally{release?.();this.backend.releaseOperation?.(operationId);this.c.work.delete(operationId);this.c.notify();}
 }
}
module.exports={BytePlusRecovery,continuityContext,captureColdOpen,verifyColdOpenUncertainty};

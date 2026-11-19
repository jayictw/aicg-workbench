'use strict';
const path=require('node:path'),crypto=require('node:crypto'),fs=require('node:fs');
const {BytePlusJournal}=require('./byteplus-journal.cjs'),{prepare}=require('./bfl-provider.cjs');
const {RequestConfirmations}=require('./api-request-guard.cjs'),{canonical,freeze}=require('./live-policy.cjs'),secrets=require('./secret-policy.cjs');
const hash=v=>crypto.createHash('sha256').update(canonical(v)).digest('hex'),fail=code=>{throw Object.assign(Error(code),{code});};
const scope=c=>({connectionId:c.connectionId,providerId:c.providerId,baseUrl:c.baseUrl,protocolId:c.protocolId,protocolVersion:c.protocolVersion,region:c.region,authType:c.authType});
class BflAttempt{
 constructor({root,identity,provider,authorize,readAsset,inspectAsset,onUpdate}){this.root=root;this.identity=structuredClone(identity);this.journal=Object.assign(Object.create(BytePlusJournal.prototype),{root:path.resolve(root),file:path.join(path.resolve(root),'byteplus-attempts.json'),identity:this.identity,data:{version:1,identity:this.identity,attempts:{}},failed:false});this.withJournal(()=>{let changed=false;for(const a of Object.values(this.journal.data.attempts))if(a.state==='reserved'){a.state='cancelled-before-send';a.reason='process-reopened-before-dispatch-no-confirmation-revival';changed=true;}if(changed)this.journal.write();});this.provider=provider;this.authorize=authorize;this.onUpdate=onUpdate??(()=>{});this.ports={readAsset,inspectAsset};this.previews=new Map();this.activeTasks=new Set();}
 acquireJournal(){
  for(let p=path.resolve(this.root);;p=path.dirname(p)){if(fs.existsSync(p)&&fs.lstatSync(p).isSymbolicLink())fail('BFL_PERSISTENCE_BLOCKED');if(path.dirname(p)===p)break;}
  fs.mkdirSync(this.root,{recursive:true});const file=path.join(this.root,'bfl-journal-lock.sqlite');if(fs.existsSync(file)){const s=fs.lstatSync(file);if(!s.isFile()||s.isSymbolicLink()||s.nlink!==1)fail('BFL_PERSISTENCE_BLOCKED');}
  let db;try{db=new(require('node:sqlite').DatabaseSync)(file);db.exec('PRAGMA busy_timeout=1000; BEGIN IMMEDIATE;');}catch(e){db?.close();fail(e.errcode===5?'ONE_TASK_AT_A_TIME':'BFL_PERSISTENCE_BLOCKED');}
  return ()=>{try{db.exec('ROLLBACK;');}finally{db.close();}};
 }
 readJournal(){
  for(let p=path.resolve(this.root);;p=path.dirname(p)){if(fs.existsSync(p)&&fs.lstatSync(p).isSymbolicLink())fail('BFL_PERSISTENCE_BLOCKED');if(path.dirname(p)===p)break;}
  if(!fs.existsSync(this.journal.file))return {version:1,identity:structuredClone(this.identity),attempts:{}};
  try{const s=fs.lstatSync(this.journal.file);if(!s.isFile()||s.isSymbolicLink()||s.nlink!==1||s.size>16*1024*1024)fail('BFL_PERSISTENCE_BLOCKED');const data=JSON.parse(fs.readFileSync(this.journal.file,'utf8'));if(data.version!==1||canonical(data.identity)!==canonical(this.identity)||!data.attempts||typeof data.attempts!=='object'||Array.isArray(data.attempts))fail('BFL_PERSISTENCE_BLOCKED');
   for(const [id,a]of Object.entries(data.attempts))if(!a||id!==a.operationId||!['reserved','dispatching','queued','succeeded','failed','submissionUnknown','cancelled-before-send'].includes(a.state)||!['provider','engineering-fake'].includes(a.environment)||!/^[-a-zA-Z0-9]{1,90}$/.test(id)||!Number.isSafeInteger(a.submissions)||a.submissions<0||a.submissions>1||!/^[a-f0-9]{64}$/.test(a.digest))fail('BFL_PERSISTENCE_BLOCKED');for(const a of Object.values(data.attempts))if(a.plan?.summary?.protocol!=='BFL_OFFICIAL'||a.plan.summary.requestSHA256!==a.digest||!['IMAGE','VIDEO'].includes(a.plan.mediaKind)||!a.owner||!['libraryId','projectId','graphId','nodeId'].every(k=>typeof a.owner[k]==='string'&&a.owner[k]))fail('BFL_PERSISTENCE_BLOCKED');for(const a of Object.values(data.attempts)){if(!/^[a-f0-9]{64}$/.test(a.plan.credentialEpoch)||a.plan.origin!=='https://api.bfl.ai')fail('BFL_PERSISTENCE_BLOCKED');if(a.taskId){require('./bfl-provider.cjs').taskId(a.taskId);if(a.origin!==a.plan.origin)fail('BFL_PERSISTENCE_BLOCKED');if(a.queryBlocked){if(a.pollingURL!==null)fail('BFL_PERSISTENCE_BLOCKED');}else require('./bfl-provider.cjs').pollingURL(a.pollingURL,a.taskId,a.origin);}}for(const a of Object.values(data.attempts))if(a.plan.admission){const d=a.plan.admission,r=d.runtime,s=a.plan.summary,binding={routingId:s.routingId,connectionId:s.connectionId,configRevision:s.configRevision,routingRevision:s.routingRevision,connectionRevision:s.connectionRevision,runtimeAdmission:r,credentialEpoch:a.plan.credentialEpoch};if(d.version!==1||d.attemptAuthorization!=='ATTEMPT_AUTHORIZED'||d.accountEntitlement!=='NOT_VERIFIED'||r?.version!==1||r.enabled!==true||!['native-bfl-https','injected-offline'].includes(r.transportKind)||r.executionEnvironment!==a.environment||!['integration-build','injected-policy'].includes(r.source)||a.environment==='provider'&&(r.source!=='integration-build'||r.transportKind!=='native-bfl-https')||canonical(r)!==canonical(s.runtimeAdmission)||!['NOT_VERIFIED','ACCEPTED_FOR_THIS_TASK','PROVIDER_REJECTED','UNKNOWN'].includes(a.supplierDecision)||d.confirmationSha256!==hash({summary:s,binding,owner:a.owner}))fail('BFL_PERSISTENCE_BLOCKED');}return data;
  }catch{fail('BFL_PERSISTENCE_BLOCKED');}
 }
 // Keep the existing Journal format/methods, but do not run its crash recovery
 // over another task/process's live dispatch whenever this connection reloads.
 refresh(){if(this.journal.failed)fail('BFL_PERSISTENCE_BLOCKED');this.journal.data=this.readJournal();}
 withJournal(action){const release=this.acquireJournal();try{this.refresh();return action();}finally{release();}}
 change(operationId,patch){const row=this.withJournal(()=>{const current=this.journal.query(operationId);return current.result?current:this.journal.change(operationId,patch);});this.onUpdate(this.view(row),row.owner);return row;}
 taskKey(owner){return hash({libraryId:owner.libraryId,projectId:owner.projectId,graphId:owner.graphId,nodeId:owner.nodeId});}
 async preview(config,req,context,defaults){
  this.withJournal(()=>{});
  if(!context?.owner)return {ok:false,code:'PROJECT_REQUIRED'};const key=this.taskKey(context.owner);if(this.activeTasks.has(key))return {ok:false,code:'ONE_TASK_AT_A_TIME'};for(const [token,p]of this.previews)if(this.taskKey(p.owner)===key)this.previews.delete(token);
  const original=await prepare(config,req,context,defaults,{...this.ports,readAsset:asset=>{const a=context.assets.find(a=>a.assetId===asset.assetId&&a.url===asset.url);if(!a)fail('INPUT_REFERENCE_MISSING');return this.ports.readAsset({...asset,version:a.version,sha256:a.sha256},context);}});if(!original.ok)return original;const runtimeAdmission=this.provider.admissionSnapshot(),prepared=freeze({...original,summary:{...original.summary,runtimeAdmission}});
  const p=prepared.plan,binding={routingId:p.routingId,connectionId:p.connectionId,configRevision:p.configRevision,routingRevision:p.routingRevision,connectionRevision:p.connectionRevision,runtimeAdmission,credentialEpoch:await this.provider.binding()},versions=Object.fromEntries(prepared.images.map(a=>[a.assetId,context.owner.graphRevision]));
  const confirmations=new RequestConfirmations(),token=confirmations.preview(prepared,versions,binding);this.previews.set(token,{prepared,binding,versions,confirmations,contextHash:hash(context),configHash:hash(config),serviceRevision:this.currentRevision?.(),owner:structuredClone(context.owner),createdAt:Date.now(),connectionScope:scope(config.connections.find(c=>c.connectionId===p.connectionId))});
  return {ok:true,previewId:token,summary:{...prepared.summary,executionEnvironment:this.provider.injected?'ENGINEERING_MOCK_WIRE':'NATIVE_CONFIRMATION_REQUIRED'}};
 }
 validateCurrent(p,config,context){if(canonical(this.provider.admissionSnapshot())!==canonical(p.binding.runtimeAdmission)||hash(config)!==p.configHash||hash(context)!==p.contextHash||this.currentConfig&&hash(this.currentConfig())!==p.configHash||this.currentContext&&hash(this.currentContext(p.owner))!==p.contextHash||this.currentRevision&&this.currentRevision()!==p.serviceRevision)fail('PREVIEW_STALE');}
 async submit(req,config,context){
  if(!req||Object.keys(req).some(k=>k!=='previewId'))fail('UI_FIELD_UNSUPPORTED');const p=this.previews.get(req.previewId);this.previews.delete(req.previewId);
  if(!p||this.activeTasks.has(this.taskKey(p.owner))||Date.now()-p.createdAt>300000)fail('PREVIEW_STALE');this.validateCurrent(p,config,context);
  if(this.journal.failed)fail('BFL_PERSISTENCE_BLOCKED');this.assertTask?.(p.owner);this.provider.assertDispatchEnabled(p.binding.runtimeAdmission);const key=this.taskKey(p.owner);this.activeTasks.add(key);
  try{if(await this.authorize(p.prepared.summary)!==true)fail('BFL_CONFIRMATION_CANCELLED');this.validateCurrent(p,config,context);this.provider.assertDispatchEnabled(p.binding.runtimeAdmission);
   const binding={...p.binding,credentialEpoch:await this.provider.binding()};p.confirmations.consume(req.previewId,p.prepared,p.versions,binding);this.validateCurrent(p,config,context);this.provider.assertDispatchEnabled(p.binding.runtimeAdmission);
   const operationId='bfl-'+crypto.randomUUID(),plan={summary:p.prepared.summary,connectionScope:p.connectionScope,mediaKind:p.prepared.plan.mediaKind,credentialEpoch:p.binding.credentialEpoch,origin:p.prepared.plan.baseUrl,admission:{version:1,attemptAuthorization:'ATTEMPT_AUTHORIZED',accountEntitlement:'NOT_VERIFIED',runtime:p.binding.runtimeAdmission,confirmationSha256:hash({summary:p.prepared.summary,binding:p.binding,owner:p.owner})}};secrets.assertSafe(plan);
   // Persist the existing shared task projection BEFORE any dispatch fact/POST.
   // A crash between this projection and Journal reservation remains safely pending.
   this.onUpdate(this.view({operationId,taskId:null,state:'dispatching',plan,environment:this.provider.injected?'engineering-fake':'provider',createdAt:new Date().toISOString()}),p.owner);
   this.withJournal(()=>{this.journal.reserve({operationId,owner:p.owner,environment:this.provider.injected?'engineering-fake':'provider',digest:p.prepared.summary.requestSHA256,plan,supplierDecision:'NOT_VERIFIED'});this.journal.dispatch(operationId);});
   let r;try{r=await this.provider.submit(p.prepared,p.binding.credentialEpoch,()=>this.validateCurrent(p,config,context));this.change(operationId,{state:r.queryBlocked?'submissionUnknown':'queued',supplierDecision:'ACCEPTED_FOR_THIS_TASK',taskId:r.taskId,pollingURL:r.pollingURL,origin:r.origin,queryBlocked:r.queryBlocked,diagnostics:{httpStatus:r.httpStatus,code:r.queryBlocked?'BFL_POLL_SCOPE':null},remoteStatus:r.remoteStatus,updatedAt:Date.now()});}
   catch(e){if(this.journal.failed)return {operationId,status:'PERSISTENCE_BLOCKED',taskId:null,result:null,realAPI:'NOT_RUN',automaticRetry:false,diagnostic:'提交事实未可靠保存；保留原记录，禁止重新 POST。'};
    const definitive=e.code==='BFL_REJECTED'||e.code==='BFL_HTTP'&&[400,401,402,403,404,422,429].includes(e.httpStatus);this.change(operationId,{state:definitive?'failed':'submissionUnknown',supplierDecision:definitive?'PROVIDER_REJECTED':'UNKNOWN',diagnostics:this.error(e),remoteStatus:null});return this.view(this.journal.query(operationId));}
   if(!r.queryBlocked){try{const remote=await this.provider.query(r.taskId,r.pollingURL,p.prepared.summary,p.binding.credentialEpoch);this.change(operationId,{remoteStatus:remote.remoteStatus,diagnostics:remote});await this.acceptResult(operationId,remote);}catch(e){this.change(operationId,{diagnostics:this.error(e)});}}return this.view(this.journal.query(operationId));
  }finally{this.activeTasks.delete(key);}
 }
 error(e){return {code:/^BFL_[A-Z_]+$/.test(e?.code??'')?e.code:'BFL_FAILED',httpStatus:Number.isInteger(e?.httpStatus)?e.httpStatus:null,providerCode:e?.providerCode??null,requestId:e?.requestId??null};}
 async acceptResult(operationId,r){
  const a=this.withJournal(()=>this.journal.query(operationId));if(a.result)return;if(['failed','cancelled','incomplete','requires_action','requires_continuation'].includes(r.remoteStatus)){this.change(operationId,{state:'failed',downloadPending:false});return;}
  if(r.hasOutput){try{const result=await this.provider.download(a.taskId,path.join(this.root,'results'),a.plan.mediaKind,{...a.plan.summary.parameters,family:a.plan.summary.family,mode:a.plan.summary.mode,inputWidth:a.plan.summary.images[0]?.width,inputHeight:a.plan.summary.images[0]?.height,...(['FIRST_FRAME','FIRST_LAST_FRAME'].includes(a.plan.summary.mode)?{inputAspectRatio:a.plan.summary.images[0].width/a.plan.summary.images[0].height}:{})});this.change(operationId,{state:'succeeded',result,downloadPending:false});}
   catch(e){if(this.journal.failed)throw e;this.change(operationId,{downloadPending:true,diagnostics:{...a.diagnostics,...this.error(e),httpStatus:a.diagnostics?.httpStatus??null,requestId:a.diagnostics?.requestId??null}});}}
 }
 view(a){
  const status=a.result?'COMPLETED':a.state==='cancelled-before-send'?'CANCELLED':a.downloadPending?'DOWNLOAD_PENDING':a.state==='queued'?'ACCEPTED':a.state==='failed'?'FAILED':a.state==='succeeded'?'COMPLETED':'SUBMISSION_UNKNOWN';
  return secrets.assertSafe({operationId:a.operationId,taskId:a.taskId,status,updatedAt:a.updatedAt??Date.parse(a.createdAt),remoteStatus:a.remoteStatus??null,snapshot:structuredClone(a.plan.summary),...(a.plan.admission?{attemptAuthorization:a.plan.admission.attemptAuthorization,supplierDecision:a.supplierDecision??'NOT_VERIFIED'}:{}),result:a.result??null,...a.diagnostics,automaticRetry:false,realAPI:a.environment==='engineering-fake'?'NOT_RUN':'UNVERIFIED',taskIdKind:'REMOTE_TASK_ID',diagnostic:status==='COMPLETED'?'BFL 结果已解码核验并保存；原任务及快照已保留。':status==='SUBMISSION_UNKNOWN'?'提交结果未知；保留原操作，禁止重新 POST。':status==='DOWNLOAD_PENDING'?'原操作已保存，结果尚未验证；仅查询原任务 ID，不重新提交。':status==='FAILED'?'BFL 原任务未成功或审核拒绝；请查看错误详情。':'原任务 ID 已保存；恢复仅查询原 ID，不重新 POST。'});
 }
 list(owner){return this.withJournal(()=>Object.values(this.journal.data.attempts).filter(a=>!owner||['libraryId','projectId','graphId','nodeId'].every(k=>a.owner[k]===owner[k])).map(a=>this.view(a)));}
 hasPendingTask(owner){
  return Object.values(this.readJournal().attempts).some(a=>['libraryId','projectId','graphId','nodeId'].every(k=>a.owner?.[k]===owner[k])&&(['reserved','dispatching','queued','submissionUnknown'].includes(a.state)||a.downloadPending));
 }
 async recover(operationId,config,context){
  return this.recoverCurrent(operationId,config,context);
 }
 async recoverCurrent(operationId,config,context){
  const a=this.withJournal(()=>this.journal.query(operationId));if(a.state==='not-found')fail('BFL_OPERATION_MISSING');
  if(['libraryId','projectId','graphId','nodeId'].some(k=>a.owner[k]!==context?.owner?.[k])||a.environment!==this.provider.executionEnvironment)fail('BFL_RECOVERY_SCOPE');
  const c=config.connections.find(c=>c.connectionId===a.plan.summary.connectionId),p=config.providers.find(p=>p.providerId===c?.providerId);
  if(!c||c.archivedAt||canonical(scope(c))!==canonical(a.plan.connectionScope)||p?.kind!=='ORIGINAL'||p.archivedAt)fail('BFL_RECOVERY_SCOPE');
  if(!a.taskId||a.queryBlocked||a.result||a.state==='failed'||a.state==='cancelled-before-send')return this.view(a);
  const key=this.taskKey(context.owner);if(this.activeTasks.has(key))fail('ONE_TASK_AT_A_TIME');this.activeTasks.add(key);
  try{let remote;try{this.provider.assertDispatchEnabled(a.plan.admission?.runtime);remote=await this.provider.query(a.taskId,a.pollingURL,a.plan.summary,a.plan.credentialEpoch);}catch(e){this.change(operationId,{diagnostics:{...a.diagnostics,...this.error(e)}});return this.view(this.journal.query(operationId));}
   this.change(operationId,{state:remote.remoteStatus==='pending'?'queued':a.state,remoteStatus:remote.remoteStatus,diagnostics:remote,updatedAt:Date.now()});await this.acceptResult(operationId,remote);return this.view(this.journal.query(operationId));
  }finally{this.activeTasks.delete(key);}
 }
}
module.exports={BflAttempt};

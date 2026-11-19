'use strict';
const path=require('node:path'),crypto=require('node:crypto'),fs=require('node:fs');
const {BytePlusJournal}=require('./byteplus-journal.cjs'),{prepare}=require('./gemini-provider.cjs');
const {RequestConfirmations}=require('./api-request-guard.cjs'),{canonical}=require('./live-policy.cjs'),secrets=require('./secret-policy.cjs');
const hash=v=>crypto.createHash('sha256').update(canonical(v)).digest('hex'),fail=code=>{throw Object.assign(Error(code),{code});};
const scope=c=>({connectionId:c.connectionId,providerId:c.providerId,baseUrl:c.baseUrl,protocolId:c.protocolId,protocolVersion:c.protocolVersion,region:c.region,authType:c.authType});
class GeminiAttempt{
 constructor({root,identity,provider,authorize,readAsset,inspectAsset}){this.root=root;this.identity=structuredClone(identity);this.journal=Object.assign(Object.create(BytePlusJournal.prototype),{root:path.resolve(root),file:path.join(path.resolve(root),'byteplus-attempts.json'),identity:this.identity,data:{version:1,identity:this.identity,attempts:{}},failed:false});this.withJournal(()=>{let changed=false;for(const a of Object.values(this.journal.data.attempts))if(a.state==='reserved'){a.state='cancelled-before-send';a.reason='process-reopened-before-dispatch-no-confirmation-revival';changed=true;}if(changed)this.journal.write();});this.provider=provider;this.authorize=authorize;this.ports={readAsset,inspectAsset};this.previews=new Map();this.activeTasks=new Set();}
 acquireJournal(){
  for(let p=path.resolve(this.root);;p=path.dirname(p)){if(fs.existsSync(p)&&fs.lstatSync(p).isSymbolicLink())fail('GEMINI_PERSISTENCE_BLOCKED');if(path.dirname(p)===p)break;}
  fs.mkdirSync(this.root,{recursive:true});const file=path.join(this.root,'gemini-journal-lock.sqlite');if(fs.existsSync(file)){const s=fs.lstatSync(file);if(!s.isFile()||s.isSymbolicLink()||s.nlink!==1)fail('GEMINI_PERSISTENCE_BLOCKED');}
  let db;try{db=new(require('node:sqlite').DatabaseSync)(file);db.exec('PRAGMA busy_timeout=1000; BEGIN IMMEDIATE;');}catch(e){db?.close();fail(e.errcode===5?'ONE_TASK_AT_A_TIME':'GEMINI_PERSISTENCE_BLOCKED');}
  return ()=>{try{db.exec('ROLLBACK;');}finally{db.close();}};
 }
 readJournal(){
  if(!fs.existsSync(this.journal.file))return {version:1,identity:structuredClone(this.identity),attempts:{}};
  try{const s=fs.lstatSync(this.journal.file);if(!s.isFile()||s.isSymbolicLink()||s.nlink!==1||s.size>16*1024*1024)fail('GEMINI_PERSISTENCE_BLOCKED');const data=JSON.parse(fs.readFileSync(this.journal.file,'utf8'));if(data.version!==1||canonical(data.identity)!==canonical(this.identity)||!data.attempts||typeof data.attempts!=='object'||Array.isArray(data.attempts))fail('GEMINI_PERSISTENCE_BLOCKED');
   for(const [id,a]of Object.entries(data.attempts))if(!a||id!==a.operationId||!['reserved','dispatching','queued','succeeded','failed','submissionUnknown','cancelled-before-send'].includes(a.state)||!['provider','engineering-fake'].includes(a.environment)||!/^[-a-zA-Z0-9]{1,90}$/.test(id)||!Number.isSafeInteger(a.submissions)||a.submissions<0||a.submissions>1||!/^[a-f0-9]{64}$/.test(a.digest))fail('GEMINI_PERSISTENCE_BLOCKED');return data;
  }catch{fail('GEMINI_PERSISTENCE_BLOCKED');}
 }
 // Keep the existing Journal format/methods, but do not run its crash recovery
 // over another task/process's live dispatch whenever this connection reloads.
 refresh(){if(this.journal.failed)fail('GEMINI_PERSISTENCE_BLOCKED');this.journal.data=this.readJournal();}
 withJournal(action){const release=this.acquireJournal();try{this.refresh();return action();}finally{release();}}
 change(operationId,patch){return this.withJournal(()=>{const current=this.journal.query(operationId);return current.result?current:this.journal.change(operationId,patch);});}
 taskKey(owner){return hash({libraryId:owner.libraryId,projectId:owner.projectId,graphId:owner.graphId,nodeId:owner.nodeId});}
 async preview(config,req,context,defaults){
  if(!context?.owner)return {ok:false,code:'PROJECT_REQUIRED'};const key=this.taskKey(context.owner);if(this.activeTasks.has(key))return {ok:false,code:'ONE_TASK_AT_A_TIME'};for(const [token,p]of this.previews)if(this.taskKey(p.owner)===key)this.previews.delete(token);
  const prepared=await prepare(config,req,context,defaults,{...this.ports,readAsset:asset=>{const a=context.assets.find(a=>a.assetId===asset.assetId&&a.url===asset.url);if(!a)fail('INPUT_REFERENCE_MISSING');return this.ports.readAsset({...asset,version:a.version,sha256:a.sha256},context);}});if(!prepared.ok)return prepared;
  const p=prepared.plan,binding={routingId:p.routingId,connectionId:p.connectionId,configRevision:p.configRevision,routingRevision:p.routingRevision,connectionRevision:p.connectionRevision,credentialEpoch:await this.provider.binding()},versions=Object.fromEntries(prepared.images.map(a=>[a.assetId,context.owner.graphRevision]));
  const confirmations=new RequestConfirmations(),token=confirmations.preview(prepared,versions,binding);this.previews.set(token,{prepared,binding,versions,confirmations,contextHash:hash(context),configHash:hash(config),serviceRevision:this.currentRevision?.(),owner:structuredClone(context.owner),createdAt:Date.now(),connectionScope:scope(config.connections.find(c=>c.connectionId===p.connectionId))});
  return {ok:true,previewId:token,summary:{...prepared.summary,executionEnvironment:this.provider.injected?'ENGINEERING_MOCK_WIRE':'NATIVE_CONFIRMATION_REQUIRED'}};
 }
 validateCurrent(p,config,context){if(hash(config)!==p.configHash||hash(context)!==p.contextHash||this.currentConfig&&hash(this.currentConfig())!==p.configHash||this.currentContext&&hash(this.currentContext(p.owner))!==p.contextHash||this.currentRevision&&this.currentRevision()!==p.serviceRevision)fail('PREVIEW_STALE');}
 async submit(req,config,context){
  if(!req||Object.keys(req).some(k=>k!=='previewId'))fail('UI_FIELD_UNSUPPORTED');const p=this.previews.get(req.previewId);this.previews.delete(req.previewId);
  if(!p||this.activeTasks.has(this.taskKey(p.owner))||Date.now()-p.createdAt>300000)fail('PREVIEW_STALE');this.validateCurrent(p,config,context);
  if(this.journal.failed)fail('GEMINI_PERSISTENCE_BLOCKED');this.provider.assertDispatchEnabled();const key=this.taskKey(p.owner);this.activeTasks.add(key);
  try{if(await this.authorize(p.prepared.summary)!==true)fail('GEMINI_CONFIRMATION_CANCELLED');this.validateCurrent(p,config,context);
   const binding={...p.binding,credentialEpoch:await this.provider.binding()};p.confirmations.consume(req.previewId,p.prepared,p.versions,binding);this.validateCurrent(p,config,context);this.provider.assertDispatchEnabled();
   const operationId='gemini-'+crypto.randomUUID(),plan={summary:p.prepared.summary,connectionScope:p.connectionScope,mediaKind:p.prepared.plan.mediaKind};secrets.assertSafe(plan);
   this.withJournal(()=>{this.journal.reserve({operationId,owner:p.owner,environment:this.provider.injected?'engineering-fake':'provider',digest:p.prepared.summary.requestSHA256,plan});this.journal.dispatch(operationId);});
   let r;try{r=await this.provider.submit(p.prepared,p.binding.credentialEpoch,()=>this.validateCurrent(p,config,context));this.change(operationId,{state:'queued',taskId:r.taskId,diagnostics:r,remoteStatus:r.remoteStatus,updatedAt:Date.now()});}
   catch(e){if(this.journal.failed)return {operationId,status:'PERSISTENCE_BLOCKED',taskId:null,result:null,realAPI:'NOT_RUN',automaticRetry:false,diagnostic:'提交事实未可靠保存；保留原记录，禁止重新 POST。'};
    const definitive=e.code==='GEMINI_HTTP'&&[400,401,403,404,422,429].includes(e.httpStatus);this.change(operationId,{state:definitive?'failed':'submissionUnknown',diagnostics:this.error(e),remoteStatus:null});return this.view(this.journal.query(operationId));}
   await this.acceptResult(operationId,r);return this.view(this.journal.query(operationId));
  }finally{this.activeTasks.delete(key);}
 }
 error(e){return {code:/^GEMINI_[A-Z_]+$/.test(e?.code??'')?e.code:'GEMINI_FAILED',httpStatus:Number.isInteger(e?.httpStatus)?e.httpStatus:null,providerCode:e?.providerCode??null,requestId:e?.requestId??null};}
 async acceptResult(operationId,r){
  const a=this.withJournal(()=>this.journal.query(operationId));if(a.result)return;if(['failed','cancelled','incomplete','requires_action','requires_continuation'].includes(r.remoteStatus)){this.change(operationId,{state:'failed'});return;}
  if(r.hasOutput){try{const result=await this.provider.download(a.taskId,path.join(this.root,'results'),a.plan.mediaKind,a.plan.summary.parameters);this.change(operationId,{state:'succeeded',result,downloadPending:false});}
   catch(e){if(this.journal.failed)throw e;this.change(operationId,{downloadPending:true,diagnostics:{...a.diagnostics,...this.error(e),httpStatus:a.diagnostics?.httpStatus??null,requestId:a.diagnostics?.requestId??null}});}}
 }
 view(a){
  const status=a.result?'COMPLETED':a.downloadPending?'DOWNLOAD_PENDING':a.state==='queued'?'ACCEPTED':a.state==='failed'?'FAILED':a.state==='succeeded'?'COMPLETED':'SUBMISSION_UNKNOWN';
  return secrets.assertSafe({operationId:a.operationId,taskId:a.taskId,status,updatedAt:a.updatedAt??Date.parse(a.createdAt),remoteStatus:a.remoteStatus??null,snapshot:structuredClone(a.plan.summary),result:a.result??null,...a.diagnostics,automaticRetry:false,realAPI:a.environment==='engineering-fake'?'NOT_RUN':'UNVERIFIED',diagnostic:status==='COMPLETED'?'Gemini 结果已解码核验并保存；原任务及快照已保留。':status==='SUBMISSION_UNKNOWN'?'提交结果未知；保留原操作，禁止重新 POST。':status==='DOWNLOAD_PENDING'?'原 interaction ID 已保存，媒体验证未完成；可明确查询原 ID 恢复，不重新提交。':status==='FAILED'?'Gemini 原任务未成功；请查看状态码和错误详情。':'已保存原 interaction ID；可明确查询，不会重新 POST。'});
 }
 list(owner){return this.withJournal(()=>Object.values(this.journal.data.attempts).filter(a=>!owner||['libraryId','projectId','graphId','nodeId'].every(k=>a.owner[k]===owner[k])).map(a=>this.view(a)));}
 hasPendingTask(owner){
  return Object.values(this.readJournal().attempts).some(a=>['libraryId','projectId','graphId','nodeId'].every(k=>a.owner?.[k]===owner[k])&&(['reserved','dispatching','queued','submissionUnknown'].includes(a.state)||a.downloadPending));
 }
 async recover(operationId,config,context){
  return this.recoverCurrent(operationId,config,context);
 }
 async recoverCurrent(operationId,config,context){
  const key=this.taskKey(context.owner);if(this.activeTasks.has(key))fail('ONE_TASK_AT_A_TIME');const a=this.withJournal(()=>this.journal.query(operationId));if(a.state==='not-found')fail('GEMINI_OPERATION_MISSING');
  if(['libraryId','projectId','graphId','nodeId'].some(k=>a.owner[k]!==context?.owner?.[k]))fail('GEMINI_RECOVERY_SCOPE');
  const c=config.connections.find(c=>c.connectionId===a.plan.summary.connectionId),p=config.providers.find(p=>p.providerId===c?.providerId);
  if(!c||c.archivedAt||canonical(scope(c))!==canonical(a.plan.connectionScope)||p?.kind!=='ORIGINAL'||p.archivedAt)fail('GEMINI_RECOVERY_SCOPE');
  if(!a.taskId||a.result||a.state==='failed')return this.view(a);this.activeTasks.add(key);
  try{let r;try{r=await this.provider.query(a.taskId,a.plan.summary.wireSelector.wireModelId);}catch(e){this.change(operationId,{diagnostics:this.error(e)});return this.view(this.journal.query(operationId));}
   this.change(operationId,{remoteStatus:r.remoteStatus,diagnostics:r,updatedAt:Date.now()});await this.acceptResult(operationId,r);return this.view(this.journal.query(operationId));
  }finally{this.activeTasks.delete(key);}
 }
}
module.exports={GeminiAttempt};

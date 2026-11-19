'use strict';
const path=require('node:path'),crypto=require('node:crypto'),fs=require('node:fs');
const {BytePlusJournal}=require('./byteplus-journal.cjs'),{prepare,resolve}=require('./runway-provider.cjs');
const {RequestConfirmations}=require('./api-request-guard.cjs'),{canonical}=require('./live-policy.cjs'),secrets=require('./secret-policy.cjs');
const hash=v=>crypto.createHash('sha256').update(canonical(v)).digest('hex');
const fail=code=>{throw Object.assign(Error(code),{code});};
const scope=c=>({connectionId:c.connectionId,providerId:c.providerId,baseUrl:c.baseUrl,protocolId:c.protocolId,protocolVersion:c.protocolVersion,region:c.region,authType:c.authType});
class RunwayAttempt{
 constructor({root,identity,provider,authorize,readAsset,inspectAsset}){this.root=root;this.journal=new BytePlusJournal(root,identity);this.provider=provider;this.authorize=authorize;this.ports={readAsset,inspectAsset};this.confirmations=new RequestConfirmations();this.previews=new Map();this.active=false;}
 async preview(config,req,context,defaults){
  if(this.active)return {ok:false,code:'ONE_TASK_AT_A_TIME'};
  // Only the latest preview in this connection may retain encoded image bytes.
  this.previews.clear();this.confirmations=new RequestConfirmations();
  const prepared=await prepare(config,req,context,defaults,{...this.ports,readAsset:asset=>{const authorized=context.assets.find(a=>a.assetId===asset.assetId&&a.url===asset.url);if(!authorized)fail('INPUT_REFERENCE_MISSING');return this.ports.readAsset({...asset,version:authorized.version,sha256:authorized.sha256},context);}});if(!prepared.ok)return prepared;
  const credentialEpoch=await this.provider.binding(),p=prepared.plan,binding={routingId:p.routingId,connectionId:p.connectionId,configRevision:p.configRevision,routingRevision:p.routingRevision,connectionRevision:p.connectionRevision,credentialEpoch},versions=Object.fromEntries(prepared.images.map(a=>[a.assetId,context.owner.graphRevision]));
  const token=this.confirmations.preview(prepared,versions,binding);this.previews.set(token,{prepared,binding,versions,contextHash:hash(context),configHash:hash(config),owner:structuredClone(context.owner),createdAt:Date.now(),connectionScope:scope(config.connections.find(c=>c.connectionId===p.connectionId))});
  return {ok:true,previewId:token,summary:{...prepared.summary,executionEnvironment:this.provider.injected?'ENGINEERING_MOCK_WIRE':'NATIVE_CONFIRMATION_REQUIRED'}};
 }
 async submit(req,config,context){
  if(!req||Object.keys(req).some(k=>k!=='previewId'))fail('UI_FIELD_UNSUPPORTED');
  const p=this.previews.get(req.previewId);this.previews.delete(req.previewId);
  if(!p||this.active||Date.now()-p.createdAt>300000||hash(config)!==p.configHash||hash(context)!==p.contextHash)fail('PREVIEW_STALE');
  if(this.journal.failed)fail('RUNWAY_PERSISTENCE_BLOCKED');
  this.provider.assertDispatchEnabled();
  this.active=true;
  try{
   if(await this.authorize(p.prepared.summary)!==true)fail('RUNWAY_CONFIRMATION_CANCELLED');
   if(hash(config)!==p.configHash||hash(context)!==p.contextHash)fail('PREVIEW_STALE');
   const binding={...p.binding,credentialEpoch:await this.provider.binding()};
   this.confirmations.consume(req.previewId,p.prepared,p.versions,binding);
   this.provider.assertDispatchEnabled();
   const operationId='runway-'+crypto.randomUUID(),plan={summary:p.prepared.summary,connectionScope:p.connectionScope,mediaKind:p.prepared.plan.mediaKind};
   secrets.assertSafe(plan);
   this.journal.reserve({operationId,owner:p.owner,environment:this.provider.injected?'engineering-fake':'provider',digest:p.prepared.summary.requestSHA256,plan});
   this.journal.dispatch(operationId);
   try{
    const response=await this.provider.submit(p.prepared);
    this.journal.change(operationId,{state:'queued',taskId:response.taskId,diagnostics:response,remoteStatus:null,updatedAt:Date.now()});
   }catch(e){
    if(this.journal.failed)return {operationId,status:'PERSISTENCE_BLOCKED',taskId:null,result:null,realAPI:'NOT_RUN',automaticRetry:false,diagnostic:'提交事实未可靠保存；保留原记录，禁止重新 POST。'};
    const definitive=e.code==='RUNWAY_HTTP'&&[400,401,403,404,422,429].includes(e.httpStatus);
    this.journal.change(operationId,{state:definitive?'failed':'submissionUnknown',diagnostics:this.error(e),remoteStatus:null});
   }
   return this.view(this.journal.query(operationId));
  }finally{this.active=false;}
 }
 error(e){return {code:/^RUNWAY_[A-Z_]+$/.test(e?.code??'')?e.code:'RUNWAY_FAILED',httpStatus:Number.isInteger(e?.httpStatus)?e.httpStatus:null,providerCode:e?.providerCode??null,requestId:e?.requestId??null};}
 view(a){
  const status=a.result?'COMPLETED':a.downloadPending?'DOWNLOAD_PENDING':a.state==='queued'?'ACCEPTED':a.state==='failed'?'FAILED':a.state==='succeeded'?'COMPLETED':'SUBMISSION_UNKNOWN';
  return secrets.assertSafe({operationId:a.operationId,taskId:a.taskId,status,updatedAt:a.updatedAt??Date.parse(a.createdAt),remoteStatus:a.remoteStatus??null,snapshot:structuredClone(a.plan.summary),result:a.result??null,...a.diagnostics,automaticRetry:false,realAPI:a.environment==='engineering-fake'?'NOT_RUN':'UNVERIFIED',diagnostic:status==='COMPLETED'?'结果已下载并解码核验；原任务及快照已保留。':status==='SUBMISSION_UNKNOWN'?'提交结果未知；只核对原操作，禁止重新 POST。':status==='DOWNLOAD_PENDING'?'下载未完成，原结果保留；可查询原 taskId 并重试下载。':status==='FAILED'?'原任务未成功；请查看状态码和错误详情。':'已保存原 taskId；可明确查询原任务，不会重新 POST。'});
 }
 list(owner){return Object.values(this.journal.data.attempts).filter(a=>!owner||['libraryId','projectId','graphId','nodeId'].every(k=>a.owner[k]===owner[k])).map(a=>this.view(a));}
 hasPendingTask(owner){
  // A second service can have cached this connection before another dispatch.
  // Inspect the committed facts without reopening/mutating its live journal.
  if(!fs.existsSync(this.journal.file))return false;
  try{const s=fs.lstatSync(this.journal.file);if(!s.isFile()||s.isSymbolicLink()||s.nlink!==1||s.size>16*1024*1024)fail('RUNWAY_PERSISTENCE_BLOCKED');const data=JSON.parse(fs.readFileSync(this.journal.file,'utf8'));if(data.version!==1||canonical(data.identity)!==canonical(this.journal.identity)||!data.attempts||Array.isArray(data.attempts))fail('RUNWAY_PERSISTENCE_BLOCKED');return Object.values(data.attempts).some(a=>['libraryId','projectId','graphId','nodeId'].every(k=>a.owner?.[k]===owner[k])&&['reserved','dispatching','queued','submissionUnknown'].includes(a.state));}
  catch{fail('RUNWAY_PERSISTENCE_BLOCKED');}
 }
 async recover(operationId,config,context){
  if(this.active)fail('ONE_TASK_AT_A_TIME');
  const a=this.journal.query(operationId);if(a.state==='not-found')fail('RUNWAY_OPERATION_MISSING');
  if(['libraryId','projectId','graphId','nodeId'].some(k=>a.owner[k]!==context?.owner?.[k]))fail('RUNWAY_RECOVERY_SCOPE');
  const c=config.connections.find(c=>c.connectionId===a.plan.summary.connectionId);
  if(!c||c.archivedAt||canonical(scope(c))!==canonical(a.plan.connectionScope))fail('RUNWAY_RECOVERY_SCOPE');
  // Do not adopt subsequently edited model/route/input parameters for old tasks.
  const p=config.providers.find(p=>p.providerId===c.providerId);if(p?.kind!=='ORIGINAL'||p.archivedAt)fail('RUNWAY_RECOVERY_SCOPE');
  if(!a.taskId||a.result||a.state==='failed')return this.view(a);
  this.active=true;
  try{
   let r;try{r=await this.provider.query(a.taskId);}catch(e){this.journal.change(operationId,{diagnostics:this.error(e)});return this.view(this.journal.query(operationId));}
   this.journal.change(operationId,{remoteStatus:r.remoteStatus,diagnostics:r,updatedAt:Date.now(),...(['FAILED','CANCELLED'].includes(r.remoteStatus)?{state:'failed'}:{})});
   if(r.hasOutput){
    try{const result=await this.provider.download(a.taskId,path.join(this.root,'results'),a.plan.mediaKind,a.plan.summary.parameters);this.journal.change(operationId,{state:'succeeded',result,downloadPending:false});}
    catch(e){this.journal.change(operationId,{downloadPending:true,diagnostics:this.error(e)});}
   }
   return this.view(this.journal.query(operationId));
  }finally{this.active=false;}
 }
}
module.exports={RunwayAttempt};

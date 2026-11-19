'use strict';
const fs=require('node:fs'),path=require('node:path');
const {hash}=require('./media.cjs');
const {PLAN_HASH,canonical,freeze,fail,loadPlan,account,localDirectory}=require('./live-policy.cjs');
const {parseLive}=require('./ark-http-transport.cjs');
const {parseDiagnostic,isDiagnostic}=require('./network-diagnostic.cjs');
const SAFE_ERRORS=new Set(['LIVE_SUBMISSION_UNKNOWN','LIVE_STOPPED_BEFORE_POST','LIVE_TRANSPORT_NOT_SUBMITTED','LIVE_RESPONSE_ENCODING','LIVE_RESPONSE_LIMIT','LIVE_RESPONSE_TRUNCATED','LIVE_CREDENTIAL_INVALID','LIVE_APPROVAL_REQUIRED','LIVE_BATCH_EXPIRED','LIVE_BATCH_INPUT_CHANGED','LIVE_HOST_OWNERSHIP_LOST','LIVE_JOURNAL_FAILED','LIVE_ACCOUNT_CONSUME_FAILED','LIVE_ACCOUNT_BINDING_CHANGED','LIVE_ACCOUNT_OR_PRICE_UNVERIFIED','LIVE_OUTPUT_INVALID','LIVE_RESPONSE_INVALID','LIVE_BUDGET','LIVE_ENVIRONMENT_CHANGED','LIVE_JSON_FORMAT','LIVE_MODEL_MISMATCH','LIVE_BASE64_FORMAT','LIVE_PNG_DECODE_FAILED']);
// All live accounting is separate from the ¥1.20 offline rehearsal ledger.
class LiveBatch{
 constructor(broker){
  this.b=broker;this.s=broker.s;this.config=this.s.options.liveRuntime??null;this.plan=loadPlan();this.file=path.join(localDirectory(this.s.repo.root),'image-live-batches.json');this.records={};this.grants=new Map();this.active=new Map();this.controllers=new Map();this.approvals=new Set();this.failed=false;this.diskHash=null;
  if(this.configured)this.acquireHost();
  if(fs.existsSync(this.file)){try{
   const st=fs.lstatSync(this.file);if(!st.isFile()||st.isSymbolicLink()||st.nlink!==1||st.size>2*1024*1024)fail('LIVE_JOURNAL_INVALID');const bytes=fs.readFileSync(this.file);this.diskHash=hash(bytes);const v=JSON.parse(bytes.toString('utf8'));
   if(v.version!==1||v.mode!=='live'||v.planSha256!==PLAN_HASH||!v.records||Object.keys(v.records).length>1)fail('LIVE_JOURNAL_INVALID');
   this.records=v.records;for(const r of Object.values(this.records)){this.validateRecord(r);freeze(r.binding);if(['approved','executing'].includes(r.state)){r.state='submissionUnknown';r.reason='PROCESS_REOPEN_NO_REPLAY';for(const i of r.items)if(['reserved','submitted'].includes(i.state))i.state='submissionUnknown';}}
  }catch{this.failed=true;this.s.readOnly=true;this.s.loadError={code:'LIVE_JOURNAL_INVALID',message:'真實批次日誌無法核對；禁止重建、重送或覆寫'};}}
 }
 get configured(){return !!(['mock-http','provider'].includes(this.config?.environment)&&this.config?.transport&&this.config?.credentialProvider?.describe&&this.config?.credentialProvider?.consume&&this.config?.approvalProvider?.authorize);}
 acquireHost(){this.lockFile=path.join(this.s.repo.root,'image-live-owner.lock');this.lockBytes=Buffer.from(JSON.stringify({version:1,pid:process.pid,instance:require('node:crypto').randomUUID()}));try{this.lockFd=fs.openSync(this.lockFile,'wx');fs.writeFileSync(this.lockFd,this.lockBytes);fs.fsyncSync(this.lockFd);}catch{if(this.lockFd!==undefined)fs.closeSync(this.lockFd);this.lockFd=undefined;fail('LIVE_HOST_ALREADY_OWNED');}}
 assertHost(){localDirectory(this.s.repo.root);if(this.lockFd===undefined||!fs.existsSync(this.lockFile))fail('LIVE_HOST_OWNERSHIP_LOST');const st=fs.lstatSync(this.lockFile);if(!st.isFile()||st.isSymbolicLink()||st.nlink!==1||!fs.readFileSync(this.lockFile).equals(this.lockBytes))fail('LIVE_HOST_OWNERSHIP_LOST');}
 validateRecord(r){
  account(r.binding.account,this.b.clock(),true);
  if(!r||r.id!=='live-'+hash(r.binding.projectId+'\0'+r.binding.graphId+'\0'+PLAN_HASH).slice(0,32)||r.binding.planSha256!==PLAN_HASH||hash(canonical(r.binding))!==r.bindingDigest||r.binding.nodes.length!==4||r.items.length!==4||r.binding.maxSubmissions!==4||r.binding.unitCapMinor!==12||r.binding.capMinor!==60||r.binding.mode!=='live'||r.binding.model!==this.plan.model||r.binding.endpoint!==this.plan.endpoint||r.binding.concurrency!==1||r.binding.automaticPostRetries!==0||!['proposed','approved','executing','completed','failed','cancelled','submissionUnknown','partial'].includes(r.state))fail('LIVE_JOURNAL_INVALID');
  if(!['mock-http','provider'].includes(r.binding.environment))fail('LIVE_JOURNAL_INVALID');for(let k=0;k<4;k++){const n=r.binding.nodes[k],i=this.plan.items[k];if(n.plan.prompt!==i.prompt||n.plan.originalPrompt!==i.originalPrompt||n.purpose!==i.purpose||n.label!==i.label||n.plan.images.length||canonical(n.plan.parameters)!==canonical(this.plan.parameters)||n.plan.model!==this.plan.model||n.planHash!==hash(canonical(n.plan))||n.promptUtf8Sha256!==i.promptUtf8Sha256)fail('LIVE_JOURNAL_INVALID');}
  let posts=0,reserved=0;for(let k=0;k<4;k++){const i=r.items[k];if(i.caseId!==this.plan.items[k].caseId||i.nodeId!==r.binding.nodes[k].nodeId||!Number.isInteger(i.submissions)||i.submissions<0||i.submissions>1||![0,12].includes(i.reservedMinor)||i.actualChargedMinor!==null&&i.actualChargedMinor!==0)fail('LIVE_JOURNAL_INVALID');posts+=i.submissions;reserved+=i.reservedMinor;}
  if(posts>4||reserved>60)fail('LIVE_BUDGET');
 }
 write(){
  if(this.failed)fail('LIVE_JOURNAL_FAILED');this.assertHost();for(const r of Object.values(this.records))this.validateRecord(r);
  const tmp=this.file+'.'+require('node:crypto').randomUUID()+'.tmp';let fd;
  try{if(this.readDiskHash()!==this.diskHash)fail('LIVE_JOURNAL_CONFLICT');fd=fs.openSync(tmp,'wx');const bytes=Buffer.from(JSON.stringify({version:1,mode:'live',planSha256:PLAN_HASH,records:this.records},null,2));fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);fs.closeSync(fd);fd=undefined;this.assertHost();if(this.readDiskHash()!==this.diskHash)fail('LIVE_JOURNAL_CONFLICT');fs.renameSync(tmp,this.file);this.diskHash=hash(bytes);}catch{if(fd!==undefined)fs.closeSync(fd);this.failed=true;this.grants.clear();fail('LIVE_JOURNAL_FAILED');}
 }
 readDiskHash(){if(!fs.existsSync(this.file))return null;const st=fs.lstatSync(this.file);if(!st.isFile()||st.isSymbolicLink()||st.nlink!==1||st.size>2*1024*1024)fail('LIVE_JOURNAL_INVALID');return hash(fs.readFileSync(this.file));}
 assert(r){if(this.failed)fail('LIVE_JOURNAL_FAILED');if(!r)fail('LIVE_BATCH_NOT_FOUND');if(r.binding.authority==='native-owner-batch'){const c=this.ownerContext;if(!c||c.session!==r.binding.session||c.epoch!==r.binding.epoch||this.b.clock()>=r.binding.expiresAt||this.s.graph.projectId!==r.binding.projectId||this.s.graph.graphId!==r.binding.graphId)fail('LIVE_BATCH_EXPIRED');return;}this.b.assert(this.b.session,{scope:this.b.scope?.handle,projectId:r.binding.projectId,graphId:r.binding.graphId});if(r.binding.session!==this.b.session||r.binding.epoch!==this.b.epoch||this.b.clock()>=r.binding.expiresAt)fail('LIVE_BATCH_EXPIRED');}
 assertRead(r){if(!r)fail('LIVE_BATCH_NOT_FOUND');this.b.assert(this.b.session,{scope:this.b.scope?.handle,projectId:r.binding.projectId,graphId:r.binding.graphId});}
 node(nodeId,index){
  const n=this.s.graph.nodes.find(n=>n.id===nodeId),item=this.plan.items[index];if(!n||n.kind!=='generate.image'||n.payload.intentPurpose!==item.purpose||n.label!==item.label||(this.s.graph.reviews[n.id]?.length??0)||n.dependencyIssues.length)fail('LIVE_BATCH_INPUT_CHANGED');
  const p=this.s.core.imagePlan(this.s.graph,n,this.s.core.effectiveInput(this.s.graph,n));
  if(p.prompt!==item.prompt||p.originalPrompt!==item.originalPrompt||p.images.length||p.model!==this.plan.model||canonical(p.parameters)!==canonical(this.plan.parameters))fail('LIVE_BATCH_INPUT_CHANGED');
  return {nodeId:n.id,label:n.label,purpose:item.purpose,nodeContentRevision:n.contentRevision,plan:p,planHash:hash(canonical(p)),promptUtf8Sha256:hash(p.prompt)};
 }
 validateInputs(r){for(let k=0;k<4;k++)if(canonical(this.node(r.binding.nodes[k].nodeId,k))!==canonical(r.binding.nodes[k]))fail('LIVE_BATCH_INPUT_CHANGED');}
 async describeAccount(){try{return account(await this.config.credentialProvider.describe(),this.b.clock());}catch{fail('LIVE_ACCOUNT_OR_PRICE_UNVERIFIED');}}
 async previewOwner(nodeIds){
  if(!this.configured||this.config.nativeOwnerEnabled!==true)fail('LIVE_OWNER_APPROVAL_MISSING');this.s.requireWritable();if(nodeIds.length!==4||new Set(nodeIds).size!==4||this.s.graph.nodes.length!==4)fail('LIVE_EXACT_FOUR_REQUIRED');
  const id='live-'+hash(this.s.graph.projectId+'\0'+this.s.graph.graphId+'\0'+PLAN_HASH).slice(0,32);if(Object.keys(this.records).length)fail('LIVE_ORIGINAL_BATCH_EXISTS');const nodes=nodeIds.map((n,k)=>this.node(n,k)),descriptor=await this.describeAccount(),context={session:'owner-'+require('node:crypto').randomUUID(),epoch:1,expiresAt:Math.min(this.b.clock()+7200000,descriptor.expiresAt)};
  const binding=freeze({version:1,mode:'live',authority:'native-owner-batch',environment:this.config.environment,planSha256:PLAN_HASH,projectId:this.s.graph.projectId,graphId:this.s.graph.graphId,...context,nodes,account:descriptor,model:this.plan.model,endpoint:this.plan.endpoint,maxSubmissions:4,maxOutputImages:4,unitCapMinor:12,capMinor:60,currency:'CNY',concurrency:1,automaticPostRetries:0});
  const r={id,requestHash:hash(canonical(binding)),binding,bindingDigest:hash(canonical(binding)),state:'proposed',approvalId:null,items:this.plan.items.map((i,k)=>({caseId:i.caseId,nodeId:nodes[k].nodeId,runId:null,state:'not-submitted',submissions:0,reservedMinor:0,actualChargedMinor:0,providerRequestId:null}))};this.ownerContext=context;this.records[id]=r;this.write();return this.summary(r);
 }
 async preview(a){
  if(!this.configured)fail('MCP_LIVE_BATCH_NOT_AUTHORIZED');this.s.requireWritable();if(a.nodeIds.length!==4||new Set(a.nodeIds).size!==4)fail('LIVE_EXACT_FOUR_REQUIRED');
  const id='live-'+hash(this.s.graph.projectId+'\0'+this.s.graph.graphId+'\0'+PLAN_HASH).slice(0,32),old=this.records[id],requestHash=hash(canonical(a));
  if(old){if(old.requestHash!==requestHash)fail('LIVE_ORIGINAL_BATCH_EXISTS');this.assertRead(old);return this.summary(old);}
  if(a.expectedRevision!==this.s.graph.revision)fail('MCP_REVISION_CONFLICT');const nodes=a.nodeIds.map((id,k)=>this.node(id,k)),session=this.b.session,epoch=this.b.epoch;
  const descriptor=await this.describeAccount();
  this.b.assert(session,{scope:a.scope,projectId:a.projectId,graphId:a.graphId},true);if(epoch!==this.b.epoch||a.expectedRevision!==this.s.graph.revision)fail('LIVE_BATCH_INPUT_CHANGED');
  const binding=freeze({version:1,mode:'live',environment:this.config.environment,planSha256:PLAN_HASH,projectId:this.s.graph.projectId,graphId:this.s.graph.graphId,session,epoch,expiresAt:Math.min(this.b.scope.expiresAt,descriptor.expiresAt),nodes,account:descriptor,model:this.plan.model,endpoint:this.plan.endpoint,maxSubmissions:4,maxOutputImages:4,unitCapMinor:12,capMinor:60,currency:'CNY',concurrency:1,automaticPostRetries:0});
  const r={id,requestHash,binding,bindingDigest:hash(canonical(binding)),state:'proposed',approvalId:null,items:this.plan.items.map((i,k)=>({caseId:i.caseId,nodeId:nodes[k].nodeId,runId:null,state:'not-submitted',submissions:0,reservedMinor:0,actualChargedMinor:0,providerRequestId:null}))};
  this.records[id]=r;this.write();return this.summary(r);
 }
 async approve(req){
  const r=this.records[req?.batchId];this.assert(r);const native=req.confirmation==='verified-owner-input/1'&&r.binding.authority==='native-owner-batch'&&this.config?.nativeOwnerEnabled===true;if(!this.configured||!native&&req.confirmation!=='trusted-image-batch-click/1'||req.manifestDigest!==r.bindingDigest||r.state!=='proposed'||this.approvals.has(r.id))fail('LIVE_APPROVAL_REQUIRED');this.validateInputs(r);this.approvals.add(r.id);
  // This host-only injected provider must verify the Owner's external one-batch approval.
  // A UI click, JSON capApproved field or C3 read/draft scope cannot mint paid authority.
  let receipt;try{receipt=await this.config.approvalProvider.authorize(freeze(structuredClone(r.binding)),r.bindingDigest);}catch{fail('LIVE_OWNER_APPROVAL_MISSING');}finally{this.approvals.delete(r.id);}
  this.assert(r);this.validateInputs(r);if(r.state!=='proposed')fail('LIVE_APPROVAL_REQUIRED');
  if(!receipt||Object.keys(receipt).some(k=>!['approvalId','bindingDigest','approvedAt','expiresAt'].includes(k))||!/^[-a-zA-Z0-9]{1,90}$/.test(receipt.approvalId)||receipt.bindingDigest!==r.bindingDigest||!Number.isSafeInteger(receipt.approvedAt)||receipt.approvedAt>this.b.clock()||!Number.isSafeInteger(receipt.expiresAt)||receipt.expiresAt<=this.b.clock()||receipt.expiresAt>r.binding.expiresAt)fail('LIVE_OWNER_APPROVAL_MISSING');
  r.state='approved';r.approvalId=receipt.approvalId;r.approvalOrigin=native?'verified-owner-input':'trusted-native-batch-click';this.write();this.grants.set(r.id,freeze({...receipt,epoch:r.binding.epoch,session:r.binding.session}));return this.summary(r);
 }
 authorize(r){
  this.assert(r);this.assertHost();const g=this.grants.get(r.id);if(!g||g.bindingDigest!==r.bindingDigest||g.epoch!==r.binding.epoch||g.session!==r.binding.session||this.b.clock()>=g.expiresAt)fail('LIVE_APPROVAL_REQUIRED');
  this.s.requireWritable();if(this.config.environment!==r.binding.environment)fail('LIVE_ENVIRONMENT_CHANGED');this.validateInputs(r);if(this.s.closed)fail('LIVE_STOPPED_BEFORE_POST');
 }
 execute(a){
  const r=this.records[a.batchId];this.assert(r);if(['executing','completed','failed','cancelled','submissionUnknown','partial'].includes(r.state))return this.summary(r);
  this.authorize(r);if(r.state!=='approved')fail('LIVE_APPROVAL_REQUIRED');
  if(r.items.some(i=>i.submissions||i.runId)||Object.values(this.s.graph.runs).some(x=>r.binding.nodes.some(n=>n.nodeId===x.nodeId)&&['running','submissionUnknown'].includes(x.state)))fail('LIVE_ORIGINAL_PENDING');
  if(r.items.length*12>60||r.items.length>4||r.binding.account.unitMinor>12)fail('LIVE_BUDGET');
  for(const i of r.items){i.reservedMinor=12;i.state='reserved';}r.state='executing';this.write();
  const work=Promise.resolve().then(()=>this.work(r)).catch(()=>{r.state='submissionUnknown';r.reason='LIVE_WORKER_STOPPED';try{this.write();}catch{}}).finally(()=>{this.grants.delete(r.id);this.active.delete(r.id);try{this.config.credentialProvider.clear?.();}catch{}this.b.notify();});this.active.set(r.id,work);return this.summary(r);
 }
 async work(r){
  for(let k=0;k<4;k++){
   const item=r.items[k];let run,controller;
   try{
    this.authorize(r);const current=await this.describeAccount();if(canonical(current)!==canonical(r.binding.account))fail('LIVE_ACCOUNT_BINDING_CHANGED');this.authorize(r);
    run=this.s.startApprovedLive({commandId:'cmd-'+r.id+'-'+k,nodeId:item.nodeId,planHash:r.binding.nodes[k].planHash});item.runId=run.id;this.write();
    controller=new AbortController();this.controllers.set(run.id,controller);const body=require('./image-adapter.cjs').body(run.snapshot.capability.plan,()=>fail('LIVE_NO_REFERENCE_UPLOAD'));
    const response=await this.config.transport.send({body,bodyHash:hash(JSON.stringify(body)),credentialProvider:this.config.credentialProvider,expectedAccount:r.binding.account,signal:controller.signal,onDiagnostic:d=>{if(!isDiagnostic(d))fail('LIVE_RESPONSE_INVALID');item.networkDiagnostic=d;item.providerRequestId=d.providerRequestId;this.write();},
     authorize:()=>{this.authorize(r);if(this.s.graph.runs[run.id]?.state!=='running')fail('LIVE_STOPPED_BEFORE_POST');},
     onDispatch:()=>{this.authorize(r);if(item.submissions!==0||r.items.reduce((v,i)=>v+i.submissions,0)>=4||r.items.reduce((v,i)=>v+i.reservedMinor,0)>60||item.reservedMinor!==12)fail('LIVE_BUDGET');item.submissions=1;item.actualChargedMinor=null;item.state='submitted';this.write();}});
    item.networkDiagnostic=parseDiagnostic(response.diagnostic,'parse-started');this.write();const parsed=parseLive(response);item.providerRequestId=parsed.requestId??null;item.providerUsage=parsed.usage??null;
    if(parsed.state!=='succeeded'){item.networkDiagnostic=parseDiagnostic(item.networkDiagnostic,'http-error',response.status===407?'proxy':'http');item.state=parsed.state;item.reason=parsed.reason;this.write();this.s.acceptApprovedLive(run.id,parsed.state,null,null,parsed.reason);r.state=parsed.state;this.write();return;}
    item.networkDiagnostic=parseDiagnostic(item.networkDiagnostic,'media-persisting');this.write();
    const simulated=this.config.environment==='mock-http',metadata=await this.s.persistLiveBytes(parsed.bytes),source={platform:simulated?'local-synthetic':'ark-cn',model:simulated?'mock-http-fixture':this.plan.model,generationMode:simulated?'synthetic-fixture':'text-to-image',executionEnvironment:this.config.environment,generatedAt:parsed.generatedAt,timeBasis:parsed.timeBasis,accountScope:r.binding.account.accountScope,accountBindingVersion:r.binding.account.bindingVersion,providerRequestId:parsed.requestId,portraitAuthorization:'unknown',videoAdmission:'not-evaluated'};
    if(metadata.sha256!==parsed.m8Validation.sha256||metadata.size!==parsed.m8Validation.size)fail('LIVE_OUTPUT_INVALID');this.s.acceptApprovedLive(run.id,'succeeded',metadata,source,'M8 PNG完整驗證及本地解碼／原始字節核對；未自授影片受信');
    item.networkDiagnostic=parseDiagnostic(item.networkDiagnostic,'media-persisted');item.state=this.s.graph.runs[run.id].state==='succeeded'?'succeeded':'cancelled';item.resultSha256=metadata.sha256;this.write();if(item.state!=='succeeded'){r.state='cancelled';this.write();return;}
   }catch(e){
    if(isDiagnostic(e.diagnostic))item.networkDiagnostic=e.diagnostic;if(isDiagnostic(item.networkDiagnostic)&&e.safeParseCategory)item.networkDiagnostic=parseDiagnostic(item.networkDiagnostic,'response-invalid',e.safeParseCategory);else if(isDiagnostic(item.networkDiagnostic)&&item.networkDiagnostic.parseOutcome==='media-persisting')item.networkDiagnostic=parseDiagnostic(item.networkDiagnostic,'media-write-failed','local-persistence');
    const submitted=item.submissions===1||!!e.submissionAttempted;item.state=submitted?'submissionUnknown':'not-submitted';item.reason=SAFE_ERRORS.has(e?.code)?e.code:'LIVE_OPERATION_FAILED';if(!submitted){item.reservedMinor=0;item.actualChargedMinor=0;}
    if(run){try{this.s.acceptApprovedLive(run.id,submitted?'submissionUnknown':'failed',null,null,item.reason);}catch{this.s.readOnly=true;this.s.loadError={code:'LIVE_EVENT_DURABILITY',message:'原操作狀態無法可靠記錄，禁止重送'};}}
    r.state=submitted?'submissionUnknown':'partial';try{this.write();}catch{}return;
   }finally{if(run)this.controllers.delete(run.id);this.b.notify();}
  }
  r.state='completed';this.write();
 }
 cancelRun(id){this.controllers.get(id)?.abort();}
 invalidate(reason='all'){if(reason==='collaboration'&&this.config?.nativeOwnerEnabled===true)return;this.ownerContext=null;this.grants.clear();for(const c of this.controllers.values())c.abort();try{this.config?.credentialProvider.clear?.();}catch{}}
 summary(r){const runs=r.items.filter(i=>i.runId).map(i=>{const run=this.s.graph?.runs[i.runId],ready=run?.resultIds.some(id=>this.s.graph.results[id]?.mediaVersionId);return {runId:i.runId,nodeId:i.nodeId,state:i.state==='succeeded'&&!ready?'result-not-saved':i.state,orphan:!run,submissions:i.submissions,actualChargedMinor:i.actualChargedMinor,providerRequestId:i.providerRequestId};}),grant=this.grants.get(r.id);const out={batchId:r.id,manifestDigest:r.bindingDigest,planSha256:PLAN_HASH,status:r.state==='completed'&&runs.some(i=>i.state==='result-not-saved')?'results-not-saved':r.state,mode:'live',environment:r.binding.environment,model:r.binding.model,outputCount:4,actualCostMinor:r.items.some(i=>i.submissions)?null:0,actualCostStatus:r.items.some(i=>i.submissions)?'unreconciled':'not-submitted',reservedMinor:r.items.reduce((v,i)=>v+i.reservedMinor,0),maxSubmissions:4,submissions:r.items.reduce((v,i)=>v+i.submissions,0),unitCapMinor:12,batchCapMinor:60,currency:'CNY',automaticPostRetries:0,expiresAt:r.binding.expiresAt,approvalValid:!!grant&&grant.epoch===r.binding.epoch&&grant.session===r.binding.session&&this.b.clock()<grant.expiresAt,account:r.binding.account,items:r.binding.nodes.map(n=>({nodeId:n.nodeId,label:n.label,purpose:n.purpose,prompt:n.plan.prompt,size:'1024x1024',inputImageCount:0})),runs,queryKind:'local-journal-only',remoteQueryAvailable:false};return require('./resume-history.cjs').merge(this.s,r,out);}
 status(a){const r=this.records[a.batchId];this.assertRead(r);return this.summary(r);}
 list(){return Object.values(this.records).filter(r=>r.binding.projectId===this.s.graph?.projectId&&r.binding.graphId===this.s.graph?.graphId).map(r=>this.summary(r));}
 async close(){this.invalidate();await Promise.allSettled([...this.active.values()]);if(this.lockFd!==undefined){let own=false;try{this.assertHost();own=true;}catch{}fs.closeSync(this.lockFd);this.lockFd=undefined;if(own)try{fs.unlinkSync(this.lockFile);}catch{}}}
}
module.exports={LiveBatch};

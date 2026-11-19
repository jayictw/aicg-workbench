'use strict';
const fs=require('node:fs'),path=require('node:path'),c=require('./d1-json.cjs'),{writeJSON,review,observeTransport}=require('./studio-six-runner.cjs'),pm=require('./batch2-policy.cjs');
const fail=code=>{throw Object.assign(Error(code),{code})};
function preflight({service,source,policy,config,credential,owner,viewId,cap,quote}){
 const before=policy.check();if(before.attempts.length!==38)fail('B2_ALREADY_STARTED');
 const sourceBefore=source.read(),capacity=require('./execution-capacity.cjs');if(sourceBefore.rows.length+11>capacity.LIMITS.attempts)fail('B2_SOURCE_CAPACITY');
 const result=policy.projectCapacity({config,credential,owner,viewId,cap,bindingGeneration:source.bindingGeneration,kind:policy.test?'ark-image-qa-confirmed':'ark-image-provider',quote,credentialDisplay:{credentialName:credential.displayName,accountAlias:credential.accountAlias}});
 const finalReservedBytes=capacity.finalReservation(result.sizes.at(-1),11),disk=fs.statfsSync(pm.ROOT),freeBytes=Number(disk.bavail)*Number(disk.bsize),diskReservation=11*64*1024*1024+128*1024*1024;
 if(freeBytes<diskReservation)fail('B2_DISK_CAPACITY');if(!c.same(before,service.ledger.read())||!c.same(sourceBefore,source.read()))fail('B2_PREFLIGHT_MUTATED');
 return {status:'PASS',batch:2,historicalAttempts:38,historicalSubmits:38,priorRoundPosts:25,maxNewPosts:11,maxCumulativeRoundPosts:36,predictedAttempts:49,predictedSourceRows:sourceBefore.rows.length+11,initialLedgerBytes:result.beforeBytes,predictedLedgerBytesByStep:result.sizes,finalReservedBytes,completionReserveBytes:11*capacity.LIMITS.completionReserveEach,limits:capacity.LIMITS,freeDiskBytes:freeBytes,diskReservationBytes:diskReservation,sourceAndLedgerUnchanged:true,priorUnknownPreserved:true,officialRequestsDuringPreflight:0,scope:'Journal plus per-result final overhead; original media stay outside formal library; no maximum-size business-library claim'};
}
async function runBatch2({pipeline,service,source,scope,configId,policy,quote,root,onStatus=()=>{}}){
 if(!pm.branded(policy))fail('B2_POLICY');policy.check();if(fs.existsSync(path.join(root,'execution-record.json'))||service.ledger.read().attempts.length!==38)fail('B2_ALREADY_STARTED');
 const report={version:1,batch:2,batchId:require('../integration-build.json').buildId,sourceRunId:'20261028-studio-input36-9e2b',status:'RUNNING',controlFingerprint:require('./batch2-freeze.cjs').fingerprint(),originalProductFingerprint:require('./batch2-seal.cjs').originalProductFingerprint,planSha256:require('./batch2-seal.cjs').planSha256,model:policy.plan.model,service:policy.plan.origin,maxNewPosts:11,priorPosts:25,maxCumulativePosts:36,excludedUnknown:{caseId:'S2-D-2',status:'submission-unknown',providerRequestId:'021793169115076cf23db4d38572816d86b7975cf989d613c2058'},budgetScope:policy.approval.budgetScope,approvedBudgetMinor:policy.approval.budgetMinor,batchBudgetMinor:policy.approval.batchBudgetMinor,priorSpendCeilingMinor:policy.approval.priorSpendCeilingMinor,currency:'CNY',referenceUnitMinor:12,referencePriceDate:'2026-10-26',actualBilledMinor:null,firstBatchActualBilledMinor:null,billingState:'UNKNOWN_USER_BILL_CHECK_REQUIRED',startedAt:new Date().toISOString(),records:policy.plan.cases.map((x,i)=>({batch:2,batchOrdinal:i+1,ordinal:x.ordinal,caseId:x.caseId,camera:x.camera,group:x.group,repeat:x.repeat,blindId:x.blindId,status:'NOT_RUN',referenceSha256:x.referenceSha256,wireBodySha256:x.wireBodySha256,estimatedMinor:12,actualBilledMinor:null}))};
 const publish=()=>{writeJSON(path.join(root,'execution-record.json'),report);onStatus(structuredClone(report))};publish();let read;
 try{
  read=await service.vault.read();const config=read.data.configs.find(x=>x.configId===configId),credential=read.data.credentials.find(x=>x.credentialId===config?.credentialId);if(!config||!credential)fail('B2_CONFIG');
  writeJSON(path.join(root,'capacity-preflight.json'),preflight({service,source,policy,config,credential,owner:source.view(scope.cap,scope.taskId,scope.viewId),viewId:scope.viewId,cap:scope.cap,quote}));
 }catch(e){policy.stop();report.status='STOPPED';report.stopReason=/^(B2_|C_|UK_)/.test(e.code||e.message)?e.code||e.message:'PREFLIGHT_FAILURE';report.actualRequestCount=0;report.successCount=0;report.finishedAt=new Date().toISOString();publish();return report}
 finally{for(const x of read?.data?.credentials||[])x.secret=undefined;read=undefined}
 try{
  for(const [i,cell]of policy.plan.cases.entries()){
   const row=report.records[i],p=await pipeline.prepare({...scope,configId,prompt:policy.plan.originalText,studio:cell.packet,studioCaseId:cell.caseId});
   Object.assign(row,{attemptId:p.attemptId,requestDigest:p.digest,effective:structuredClone(p.effective),status:'PREPARED'});publish();
   const a=service.ledger.row(p.attemptId);if(!policy.matches(a,cell))fail('B2_INPUT_DRIFT');
   const approved=await pipeline.approveOnce({...scope,attemptId:p.attemptId,confirmationId:p.confirmationId,confirmationHash:p.confirmationHash},review(a,quote));row.startedAt=new Date().toISOString();row.status='SENDING';publish();const start=performance.now();
   const r=await pipeline.execute({...scope,attemptId:approved.attemptId,confirmationId:approved.confirmationId,confirmationHash:approved.confirmationHash}),actual=service.ledger.row(p.attemptId),ob=pipeline.transport.sixObservations.get(p.attemptId);
   Object.assign(row,{elapsedMs:Math.round(performance.now()-start),finishedAt:new Date().toISOString(),status:r.phase,code:r.code,submitCount:actual.actions.submit.count,httpStatus:ob?.httpStatus??null,dispatched:!!require('./uk-network.cjs').dispatchFor(p.attemptId),requestId:actual.execution.request.requestId,transportFailureCode:ob?.failureCode??null});if(require('./provider-errors.cjs').valid(ob?.providerDiagnostic))row.providerDiagnostic=structuredClone(ob.providerDiagnostic);
   if(r.phase==='completed'){
    if(!r.candidate)fail('B2_CANDIDATE_MISSING');const pkg=source.take({...scope,candidateHandle:r.candidate.candidateHandle}),m=pkg.media.find(m=>m.id===pkg.result.original.mediaId),bytes=Buffer.from(m.base64,'base64');if(c.hash(bytes)!==pkg.result.original.sha256)fail('B2_OUTPUT_HASH');
    const out=path.join(root,'originals',cell.caseId+'.png');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,bytes,{flag:'wx'});Object.assign(row,{status:'COMPLETED',outputFile:out,outputSha256:c.hash(bytes),outputBytes:bytes.length,sourceKind:pkg.result.source.kind});policy.check();
   }else{report.status='STOPPED';report.stopReason=r.code||r.phase;publish();break}
   publish();
  }
  if(report.status==='RUNNING')report.status='COMPLETED';
 }catch(e){report.status='STOPPED';report.stopReason=/^(B2_|C_|UK_)/.test(e.code||e.message)?e.code||e.message:'RUN_FAILURE'}
 finally{policy.stop();report.finishedAt=new Date().toISOString();const ledger=service.ledger.read();report.ledgerSubmitCount=ledger.attempts.reduce((n,a)=>n+a.actions.submit.count,0);report.actualRequestCount=report.records.filter(r=>r.attemptId&&require('./uk-network.cjs').dispatchFor(r.attemptId)).length;report.cumulativeRoundRequestCount=25+report.actualRequestCount;report.successCount=report.records.filter(r=>r.status==='COMPLETED').length;report.estimatedAttemptedMinor=report.actualRequestCount*12;report.dispatchMeaning='Entered fixed HTTPS dispatch; not evidence of supplier receipt or actual billing';report.priorRowHashesUnchanged=c.same(ledger.attempts.slice(0,38).map(a=>c.hash(c.jcs(a))),policy.historyHashes);publish()}
 return report;
}
module.exports={preflight,runBatch2,observeTransport,writeJSON};

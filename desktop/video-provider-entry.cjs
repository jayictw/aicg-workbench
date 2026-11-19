'use strict';
const {error}=require('./media.cjs');
// Private parent→child bootstrap. No secret is accepted here; the fresh native
// account window is the only secret input and the only batch-approval gesture.
async function activateApprovedProvider({service,accountWindow,approval,observationOnly=false,requestFactory,pollWait,clock=Date.now}){
 require('./video-roots.cjs').assertRoots();if(observationOnly)return activateOriginalObservation({service,accountWindow,reference:approval,requestFactory,pollWait,clock});if(!approval||Object.keys(approval).some(k=>!['nativeExactBatchAuthorization','currency','approvalId','batchId','manifestDigest','model','outputCount','totalCapMinor','unitCapMinor','expiresAt'].includes(k)))throw error('VIDEO_REAL_BOOTSTRAP','批准包不接受Key、路徑或其他權限');const record=service.videoBatches?.records[approval.batchId];require('./video-single-retry.cjs').assertRetryRecord(record);if(record.manifest.syntheticOnly===false&&record.manifest.round2?.version===2)require('./round2-owner-binding.cjs').assert(record);if(approval.approvalId!==record.manifest.retry.preparedApprovalId||approval.currency!=='USD'||!record||record.manifest.currency!=='USD'||record.manifest.apiOrigin!==require('./video-adapter.cjs').ORIGIN||record.manifest.environment!=='provider-live'||record.manifest.projectId!==service.graph.projectId||record.manifest.graphId!==service.graph.graphId||record.manifestDigest!==approval.manifestDigest||approval.model!==record.manifest.model||approval.outputCount!==record.manifest.outputCount||approval.totalCapMinor!==100||approval.unitCapMinor!==100||!Number.isSafeInteger(approval.expiresAt)||approval.expiresAt!==record.expiresAt||approval.expiresAt<=Date.now()||approval.expiresAt>Date.now()+7200000||approval.nativeExactBatchAuthorization!==true||!/^video-approval-[a-f0-9-]{36}$/.test(approval.approvalId??''))throw error('VIDEO_REAL_BOOTSTRAP','本次批准須匹配已保存原批次／畫布及新期限');if(service.videoBatches.active.size)throw error('VIDEO_BATCH_ORIGINAL_PENDING','先查原批次，不能切換執行器');await service.videoBatches.close();const next=new(require('./video-batch.cjs').VideoBatch)(service,{environment:'provider-live',realPermit:Object.freeze({...approval}),requestFactory,pollWait,clock,notify:()=>accountWindow.notify()});service.videoBatches=next;accountWindow.batches=next;return accountWindow.open(approval.batchId,{observationOnly});
}
async function activateOriginalObservation({service,accountWindow,reference,requestFactory,pollWait,clock=Date.now}){
 require('./video-roots.cjs').assertRoots();
 if(!reference||Object.keys(reference).sort().join(',')!=='batchId,manifestDigest')throw error('VIDEO_OBSERVATION_SCOPE','原任務恢復只接受batchId與manifestDigest；不接受POST批准或新素材');
 const record=service.videoBatches?.records[reference.batchId];
 require('./video-single-retry.cjs').assertRetryRecord(record,{observationOnly:true});if(record.manifest.syntheticOnly===false&&record.manifest.round2?.version===2)require('./round2-owner-binding.cjs').assert(record);
 if(record.manifestDigest!==reference.manifestDigest||record.manifest.projectId!==service.graph.projectId||record.manifest.graphId!==service.graph.graphId||!record.items.some(i=>i.taskId)||service.videoBatches.active.size)throw error('VIDEO_OBSERVATION_SCOPE','只能恢復已綁定的原task；沒有新POST權限');
 await service.videoBatches.close();
 const next=new(require('./video-batch.cjs').VideoBatch)(service,{environment:'provider-live',recoveryOnly:true,requestFactory,pollWait,clock,notify:()=>accountWindow.notify()});
 service.videoBatches=next;accountWindow.batches=next;
 return accountWindow.open(record.id,{observationOnly:true});
}
module.exports={activateApprovedProvider,activateOriginalObservation};

'use strict';
const {error}=require('./media.cjs');
async function performRecovery({request,service,hasDraft,agent,afterRecovery}){
 if(!request||Object.keys(request).some(k=>!['expectedDigest','confirmation'].includes(k))||request.confirmation!=='trusted-video-lock-recovery-click/1')throw error('VIDEO_LOCK_CLICK_REQUIRED','請在唯讀診斷頁按恢復原記錄');
 if(typeof request.expectedDigest!=='string'||!/^[a-f0-9]{64}$/.test(request.expectedDigest))throw error('VIDEO_LOCK_DIGEST','缺少目前工作鎖指紋');
 if(!service||!service.readOnly||service.loadError?.code!=='VIDEO_WORKER_LOCKED')throw error('VIDEO_LOCK_RECOVERY_SCOPE','目前不是可恢復的影片鎖狀態');
 if(hasDraft()||service.importing||service.stages?.size||service.renderer?.active||agent?.host?.inFlight)throw error('RECOVERY_DIRTY','現有修改或工作尚未處理，未恢復或覆蓋');
 if(service.dirty){try{require('./byteplus-recovery.cjs').verifyColdOpenUncertainty(service);}catch{throw error('RECOVERY_DIRTY','Only the verified original BytePlus cold-open uncertainty may retain dirty during lock recovery');}}
 agent?.close({reason:'video-lock-recovery',stopRun:false});
 await service.recoverVideoLock(request.expectedDigest);
 await afterRecovery();
 return {recovered:true,paidAuthorityRestored:false,automaticSubmission:false};
}
async function recover(options){try{return await performRecovery(options);}finally{options.notify?.();}}
module.exports={recover};

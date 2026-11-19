'use strict';
const {error}=require('./media.cjs'),config=require('./byteplus25-config.cjs');
async function approveFromLocalEnv({batches,permit,request,syntheticReadText,nativeStartPermit}){
 const r=batches.records[request?.batchId],p=batches.inputPermits.get(permit);batches.s.requireWritable();
 if(!r||!p||p.used||permit.batchId!==r.id||permit.manifestDigest!==request.manifestDigest||r.manifestDigest!==request.manifestDigest||permit.expiresAt<=batches.clock()||request.confirmation!=='trusted-native-video-batch/1')throw error('VIDEO_NATIVE_APPROVAL_REQUIRED','本次輸入許可不符');
 require('./seedance25-plan.cjs').assertRetryRecord(r,{observationOnly:permit.observationOnly===true});
 if(request.credentialSource!=='env.local-once'||request.acknowledgePlaintextRisk!==true)throw error('LOCAL_ENV_CONSENT_REQUIRED','需本人同意明文檔案與本次讀取');
 // Must fail BEFORE even opening .env.local when old charges leave no allocation.
 if(!permit.observationOnly){batches.assertInputs(r);require('./video-budget.cjs').checkpoint(r,batches.s.videoJournal,0);}
 if(r.manifest.syntheticOnly!==!!syntheticReadText)throw error('LOCAL_ENV_EXECUTION_MODE','合成批次不能讀真檔；正式批次不能替換讀檔來源');if(syntheticReadText&&typeof batches.requestFactory!=='function')throw error('LOCAL_ENV_SYNTHETIC_ONLY','合成檔案讀取必須配合注入HTTP');
 return config.withLocalCredential({explicitPlaintextConsent:true,confirmationSource:'trusted-native-env-local-once',budgetReady:true,syntheticReadText,nativeStartPermit},secret=>batches.acceptAndApprove({batchId:r.id,manifestDigest:r.manifestDigest,permit,secret,confirmation:request.confirmation}));
}
module.exports={approveFromLocalEnv};

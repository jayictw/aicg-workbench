'use strict';
const {error}=require('./media.cjs');
// Historical monetary fields stay in signed manifests and journals unchanged.
// Runtime admission depends on original submission facts, never local dollars.
function publicUsage(){return null;}
function checkpoint(record,journal,nextIndex){
 if(!Number.isSafeInteger(nextIndex)||nextIndex<0||nextIndex>record.items.length)throw error('VIDEO_BATCH_STATE','原任務序號無效');
 for(const item of record.items.filter(i=>i.index<nextIndex)){
  const a=journal.data.attempts[item.runId];
  if(item.submissions!==1||item.state!=='completed'||!a||a.state!=='completed'||typeof a.taskId!=='string')throw error('VIDEO_BATCH_ORIGINAL_PENDING','原任務未完成或未知；不建立替代提交');
 }
 return {actualCharge:null,costStatus:'unknown',limitEnforced:false,source:'supplier invoice only; no local dollar estimate or cap'};
}
module.exports={publicUsage,checkpoint};

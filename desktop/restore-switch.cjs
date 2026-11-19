'use strict';
const {error}=require('./media.cjs');
function assertQuiet(host,hasDraft){
 host.assertContentWritable?.();host.refresh();
 if(host.isDirty()||hasDraft())throw error('DRAFT_UNSAVED','請先手動保存整庫並處理未套用草稿；原工作庫保持');
 if([...host.services.values()].some(s=>s.renderer?.active||s.timers?.size||s.videoActive?.size||s.importing||s.stages?.size||Object.values(s.graph?.runs??{}).some(r=>r.state==='running')))throw error('RESTORE_WORK_ACTIVE','請等候本地任務或編碼完成／停止，再開啟恢復副本');
}
async function prepareRestore({host,agent,hasDraft,openNext,activate}){
 assertQuiet(host,hasDraft);
 if(agent?.host?.inFlight)throw error('AGENT_OPERATION_BUSY','Codex 操作尚在途，請等候回執後再切換；沒有丟棄原工作');
 // Revoke synchronously before the first await. Native writes are held by the
 // main IPC exclusive gate/modal; external writes must lose their old scope.
 agent?.close({reason:'library-switch',stopRun:false});
 const revision=host.data.editRevision;let next;
 try{next=await openNext();assertQuiet(host,hasDraft);if(host.data.editRevision!==revision)throw error('RESTORE_STATE_CHANGED','準備期間原工作庫已改變，已取消切換並保留修改');await activate();return next;}
 catch(e){await next?.close();e.message+='；原工作庫保留，本次 Codex 連線已中止，沒有自動重新授權';throw e;}
}
module.exports={assertQuiet,prepareRestore};

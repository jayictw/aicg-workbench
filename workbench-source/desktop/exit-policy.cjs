 'use strict';
function decide(s,{blocked=false,hasLibrary=false,libraryId=null,proposals=0}={}){
 if(blocked)return {kind:'block',message:'正在处理工作库、姿势或保存操作，请完成并确认结果后再关闭。'};
 if(!s||s.version!==1||!Number.isSafeInteger(s.inputRevision)||s.inputRevision<0||!Number.isSafeInteger(s.revision)||s.revision<0||typeof s.libraryId!=='string'||hasLibrary&&!s.libraryId||libraryId!==null&&hasLibrary&&s.libraryId!==libraryId||!['gate','loading','ready','saving','unknown','failed'].includes(s.phase)||!['ready','saving','unknown','failed'].includes(s.posePhase)||!Number.isSafeInteger(s.generation)||!Number.isSafeInteger(s.savedGeneration)||!Array.isArray(s.editors)||typeof s.selectionBusy!=='boolean'||s.editors.some(e=>!e||typeof e.label!=='string'||typeof e.pending!=='boolean'||typeof e.busy!=='boolean'))return {kind:'block',message:'无法可靠取得退出状态，已保留当前窗口；请核对状态后再试。'};
 if(s.selectionBusy||['loading','saving','unknown'].includes(s.phase)||['saving','unknown'].includes(s.posePhase)||s.editors.some(e=>e.busy)||hasLibrary&&s.phase==='gate')return {kind:'block',message:'正在处理、保存结果未知或工作库状态未确认；请先完成或查询原操作。'};
 const reasons=[];
 if(hasLibrary&&s.generation!==s.savedGeneration)reasons.push('工作库有尚未手动保存的修改'+(s.phase==='failed'?'（上次保存失败）':''));
 if(s.phase==='failed'&&!reasons.length)reasons.push('上次保存失败，请核对后决定是否退出');
 if(s.posePhase==='failed')reasons.push('姿势提交未完成，请核对原编辑');
 reasons.push(...s.editors.filter(e=>e.pending).map(e=>e.label));
 if(proposals)reasons.push(proposals+' 项会话草稿尚未确认，关闭后不恢复；它们尚未修改业务资料');
 return reasons.length?{kind:'confirm',message:reasons.join('。')+'。关闭不会自动保存、套用或生成。',businessDirty:hasLibrary&&s.generation!==s.savedGeneration}:{kind:'clean'};
}
function controller({read,context,confirm,notify,commit,release}){
 let running=false;
 return {get running(){return running},async request(action){if(running)return false;running=true;try{
  const a=await read(),ctx=context(),v=decide(a,ctx);if(v.kind==='block'){await notify(v.message);return false}
  if(v.kind==='confirm'&&!await confirm(v))return false;
  const b=await read(),next=context();if(JSON.stringify(a)!==JSON.stringify(b)||JSON.stringify(ctx)!==JSON.stringify(next)||decide(b,next).kind==='block'){await notify('关闭确认期间状态发生变化；已取消退出，请重新核对。');return false}
  await commit(action);return true;
 }catch{await notify('退出状态读取失败或未确认，当前工作已保留。');return false}finally{running=false;release()}}}
}
module.exports={decide,controller};

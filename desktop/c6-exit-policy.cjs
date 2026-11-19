'use strict';
const fs=require('node:fs'),path=require('node:path'),{ExitController}=require('./exit-controller.cjs');
function install({app,win,ipcMain,trusted,host,getHost=()=>host,getAgent,getAppControl=()=>null,nativeWindows,memory,busy,hasDraft,qa,qaRoot,trace=()=>{},showMessageBox,uiText=s=>s}){
 let stopped=false;
 const message=async options=>{if(showMessageBox)return showMessageBox(options);if(qa&&qa!=='p8v5-studio'){let response=options.cancelId??0;try{const v=JSON.parse(fs.readFileSync(path.join(qaRoot,'qa-exit-choice.json'),'utf8'));if(Number.isInteger(v.response)&&v.response>=0&&v.response<options.buttons.length)response=v.response;}catch{}trace('exit-dialog-fixture',{kind:options.type??'info',response,nativeAppearanceVerified:false});return {response};}return require('electron').dialog.showMessageBox(win,options);};
 const activeWork=()=>getAppControl()?.active()||busy()||getAgent()?.host?.inFlight||[...getHost().services.values()].some(s=>s.importing||s.renderer?.active);
 const closeBasis=()=>{const h=getHost();return JSON.stringify({activeProjectId:h.activeProjectId,savedRevision:h.savedRevision,editRevision:h.data?.editRevision,dirty:h.isDirty(),draft:hasDraft(),services:[...h.services].map(([id,s])=>({id,graphId:s.graph?.graphId,revision:s.graph?.revision,dirty:s.dirty,stages:s.stages?.size,closed:s.closed,readOnly:s.readOnly}))});};
 const controller=new ExitController({check:async()=>{
  const targetHost=getHost(),services=[...targetHost.services.values()];if(activeWork()){trace('exit-blocked-active-work');await message({message:uiText('操作或編碼正在完成，請稍後退出'),buttons:[uiText('繼續編輯')]});return false;}
  const basis=closeBasis();
  if(targetHost.isDirty()||hasDraft()||services.some(s=>s.stages?.size)){
   const r=await message({type:'warning',message:uiText('工程有未保存修改'),detail:uiText('保存並退出會在保存成功後關閉；不保存並退出會丟失未保存修改。未套用的素材或草稿請先返回處理。'),buttons:[uiText('保存並退出'),uiText('不保存並退出'),uiText('取消')],defaultId:2,cancelId:2,noLink:true});
   if(r.response===2){trace('exit-cancelled-unsaved');return false;}
   if(getHost()!==targetHost||activeWork()||closeBasis()!==basis){trace('exit-cancelled-basis-changed');return false;}
   if(r.response===0){
    if(hasDraft()||services.some(s=>s.stages?.size)){await message({type:'warning',message:uiText('請先套用或取消未提交的素材／草稿'),detail:uiText('視窗和現有修改已保留，沒有自動套用或丟棄。'),buttons:[uiText('繼續編輯')],cancelId:0});return false;}
    const businessBasis=()=>JSON.stringify({project:targetHost.activeProjectId,edit:targetHost.data.editRevision,graphs:[...targetHost.services].map(([id,s])=>[id,s.graph.graphId,s.graph.revision])});
    const before=businessBasis(),operationId='save-'+require('node:crypto').randomUUID();
    try{
     const service=targetHost.active(),revision=service.graph.revision;
     const receipt=await service.save({operationId,expectedRevision:revision}).catch(async error=>{const known=await service.querySave(operationId);if(known.status!=='committed')throw error;return known;});
     const committed=await service.querySave(operationId);
     if(committed.status!=='committed'||committed.capturedRevision!==revision||receipt.capturedRevision!==revision||getHost()!==targetHost||businessBasis()!==before||targetHost.isDirty()||hasDraft()||activeWork()||[...targetHost.services.values()].some(s=>s.stages?.size))throw Object.assign(new Error('Saved snapshot no longer matches current project'),{code:'EXIT_SAVE_NOT_CURRENT'});
     trace('exit-save-committed',{operationId,capturedRevision:receipt.capturedRevision});return true;
    }catch(e){trace('exit-save-failed',{operationId,code:e.code??'SAVE_FAILED'});win.webContents.send('c3:changed');await message({type:'error',message:uiText('保存未確認成功，已取消退出'),detail:(e.code??'SAVE_FAILED')+uiText(' · 視窗和現有修改保留。請檢查保存狀態後再操作；不會自動重試。'),buttons:[uiText('繼續編輯')],cancelId:0});return false;}
   }
   if(r.response!==1)return false;
   const discard=await message({type:'warning',message:uiText('確認不保存並退出？'),detail:uiText('本次未保存修改將丟失，已保存版本和原素材保留。'),buttons:[uiText('取消'),uiText('確認不保存並退出')],defaultId:0,cancelId:0,noLink:true});
   if(discard.response!==1)return false;
  }
  if(getHost()!==targetHost||activeWork()||closeBasis()!==basis){trace('exit-cancelled-basis-changed');await message({message:uiText('關閉確認期間工程或工作已變更，本次退出已取消'),detail:uiText('新修改與在途操作保留。請處理完成後再決定退出。'),buttons:[uiText('繼續編輯')]});return false;}
  return true;
 },dispose:async()=>{stopped=true;trace('shutdown-begin');getAppControl()?.close();getAgent()?.close();trace('scope-revoked');memory.clear();nativeWindows.close();trace('host-close-start');await getHost().close();trace('host-close-end');},approve:()=>{trace('close-approved');win.close();},onError:error=>{trace('shutdown-error',{code:error.code});if(!win.isDestroyed()){win.webContents.send('c3:changed');void message({type:'error',message:uiText('退出清理尚未完成'),detail:error.code+uiText(' · 未強行關閉視窗，請保留現場供檢查。'),buttons:[uiText('保留視窗')],defaultId:0,cancelId:0}).catch(()=>{});}}});
 ipcMain.on('canvas:can-unload',event=>{let allowed=false;try{trusted(event);allowed=controller.approved===true;}catch{}event.returnValue=allowed;trace('renderer-unload-check',{allowed});});
 win.on('close',event=>{trace('close-guard-enter',{...controller.status(),busy:busy(),viewDraft:hasDraft()});if(controller.approved)return;event.preventDefault();void controller.request();});
 app.on('before-quit',event=>{if(!controller.approved&&!win.isDestroyed()){event.preventDefault();win.close();}});
 return {blocksWrites:()=>stopped,status:()=>({...controller.status(),writesStopped:stopped}),request:()=>controller.request()};
}
module.exports={install};

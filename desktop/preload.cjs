const {contextBridge,ipcRenderer,webUtils}=require('electron');
let droppedSelection=null;
document.addEventListener('drop',event=>{droppedSelection=null;if(!event.isTrusted||!event.dataTransfer||(event.target?.closest?.('.react-flow__node,.react-flow__edge'))||!event.target?.closest?.('.flow-container'))return;const files=event.dataTransfer.files;if(files.length!==1){droppedSelection={error:'DROP_SINGLE_FILE',at:performance.now()};return;}try{const filePath=webUtils.getPathForFile(files[0]);if(filePath)droppedSelection={filePath,at:performance.now()};}catch{}},true);
// A real click on the displayed preview is the sole application confirmation.
// This state lives in the isolated preload world, never in renderer data or MCP.
let previewGesture=null,batchGesture=null,videoLockGesture=null,nativeVideoGesture=null;
document.addEventListener('click',event=>{
 previewGesture=null;batchGesture=null;videoLockGesture=null;nativeVideoGesture=null;const launch=event.target?.closest?.('button[data-native-video-command="true"]');if(event.isTrusted&&launch&&!launch.disabled)nativeVideoGesture={at:performance.now()};const recovery=event.target?.closest?.('button[data-video-lock-recover="true"]');if(event.isTrusted&&recovery&&!recovery.disabled)videoLockGesture={at:performance.now(),digest:recovery.dataset.lockDigest};
 const batch=event.target?.closest?.('button[data-c4-approve-batch="true"]');if(event.isTrusted&&batch&&!batch.disabled&&/^(batch|live)-[-a-zA-Z0-9]+$/.test(batch.dataset.c4BatchId||'')&&/^[a-f0-9]{64}$/.test(batch.dataset.c4ManifestDigest||''))batchGesture={batchId:batch.dataset.c4BatchId,manifestDigest:batch.dataset.c4ManifestDigest,at:performance.now()};
 const button=event.target?.closest?.('button[data-c3-confirm-preview="true"]');
 if(!event.isTrusted||!button||button.disabled)return;
 const {c3ProposalId,c3ExpectedRevision,c3PreviewDigest}=button.dataset;
 if(!/^proposal-[-a-zA-Z0-9]+$/.test(c3ProposalId||'')||!/^\d+$/.test(c3ExpectedRevision||'')||!/^[a-f0-9]{64}$/.test(c3PreviewDigest||''))return;
 previewGesture={proposalId:c3ProposalId,expectedRevision:Number(c3ExpectedRevision),previewDigest:c3PreviewDigest,at:performance.now()};
},true);
function confirmPreview(request){
 const gesture=previewGesture;previewGesture=null;
 if(!gesture||!request||typeof request!=='object'||Object.keys(request).length!==3||request.proposalId!==gesture.proposalId||request.expectedRevision!==gesture.expectedRevision||request.previewDigest!==gesture.previewDigest||performance.now()-gesture.at<0||performance.now()-gesture.at>2000)return Promise.resolve({ok:false,error:{code:'PREVIEW_CLICK_REQUIRED',message:'請從修改預覽按「確認修改」'}});
 return ipcRenderer.invoke('c3:apply',{proposalId:gesture.proposalId,expectedRevision:gesture.expectedRevision,previewDigest:gesture.previewDigest,confirmation:'trusted-preview-click/1'});
}
// No generic IPC, filesystem, URL, shell, or supplier capability crosses this bridge.
contextBridge.exposeInMainWorld('canvasAPI',Object.freeze({
 chooseCodexAttachment:()=>ipcRenderer.invoke('c3:choose-attachment'),cancelCodexAttachment:token=>ipcRenderer.invoke('c3:cancel-attachment',token),sendCodexAttachment:token=>ipcRenderer.invoke('c3:send-attachment',token),
 openOwnerAccount:()=>ipcRenderer.invoke('c4:open-account'),
 c4ApproveBatch:request=>{const g=batchGesture;batchGesture=null;if(!g||!request||Object.keys(request).length!==2||request.batchId!==g.batchId||request.manifestDigest!==g.manifestDigest||performance.now()-g.at<0||performance.now()-g.at>2000)return Promise.resolve({ok:false,error:{code:'MCP_BATCH_CONFIRM_REQUIRED',message:'請從批次預覽批准這一批'}});return ipcRenderer.invoke('c4:approve-batch',{batchId:g.batchId,manifestDigest:g.manifestDigest,confirmation:'trusted-image-batch-click/1'});},
 c3LaunchVideo:()=>{const g=nativeVideoGesture;nativeVideoGesture=null;if(!g||performance.now()-g.at>2000)return Promise.resolve({ok:false,error:{code:'MCP_NATIVE_LAUNCH_CLICK_REQUIRED'}});return ipcRenderer.invoke('c3:launch-video',{confirmation:'trusted-native-video-command/1'});},c3Status:()=>ipcRenderer.invoke('c3:status'),c3Prepare:()=>ipcRenderer.invoke('c3:prepare'),c3Launch:()=>ipcRenderer.invoke('c3:launch'),c3Grant:request=>ipcRenderer.invoke('c3:grant',request),c3Revoke:()=>ipcRenderer.invoke('c3:revoke'),c3Disconnect:()=>ipcRenderer.invoke('c3:disconnect'),c3Apply:confirmPreview,c3Reject:id=>ipcRenderer.invoke('c3:reject',id),onC3Change:callback=>{const handler=()=>callback();ipcRenderer.on('c3:changed',handler);return()=>ipcRenderer.removeListener('c3:changed',handler);},
 videoPreview:r=>ipcRenderer.invoke('canvas:video-preview',r),videoOpenInput:r=>ipcRenderer.invoke('canvas:video-open-input',r),videoLockStatus:()=>ipcRenderer.invoke('canvas:video-lock-status'),videoLockRecover:r=>{const g=videoLockGesture;videoLockGesture=null;if(!g||r.expectedDigest!==g.digest||performance.now()-g.at>2000)return Promise.resolve({ok:false,error:{code:'VIDEO_LOCK_CLICK_REQUIRED'}});return ipcRenderer.invoke('canvas:video-lock-recover',r);},
 queryRun:id=>ipcRenderer.invoke('canvas:query-run',id),
 queryCommand:id=>ipcRenderer.invoke('canvas:query-command',id),
 listBackups:()=>ipcRenderer.invoke('canvas:list-backups'),backup:()=>ipcRenderer.invoke('canvas:backup'),restoreBackup:id=>ipcRenderer.invoke('canvas:restore-backup',id),openRestored:id=>ipcRenderer.invoke('canvas:open-restored',id),
 read:()=>ipcRenderer.invoke('canvas:read'),
 imagePreview:id=>ipcRenderer.invoke('canvas:image-preview',id),
 imageLive:()=>ipcRenderer.invoke('canvas:image-live'),
 command:request=>ipcRenderer.invoke('canvas:command',request),
 chooseImport:()=>ipcRenderer.invoke('canvas:choose-import'),
 chooseDroppedImport:()=>{const selected=droppedSelection;droppedSelection=null;if(!selected||performance.now()-selected.at<0||performance.now()-selected.at>2000)return Promise.resolve({ok:false,error:{code:'DROP_GESTURE_REQUIRED',message:'請將一個本機檔案拖到畫布空白處'}});if(selected.error)return Promise.resolve({ok:false,error:{code:'DROP_SINGLE_FILE',message:'一次請拖入一個素材；取消不會修改畫布'}});return ipcRenderer.invoke('canvas:drop-import',{filePath:selected.filePath});},
 confirmImport:request=>ipcRenderer.invoke('canvas:confirm-import',request),
 cancelImport:token=>ipcRenderer.invoke('canvas:cancel-import',token),
 save:request=>ipcRenderer.invoke('canvas:save',request),
 querySave:operationId=>ipcRenderer.invoke('canvas:query-save',operationId),
 draft:dirty=>ipcRenderer.send('canvas:draft',dirty),
 exit:()=>ipcRenderer.invoke('canvas:exit')
}));

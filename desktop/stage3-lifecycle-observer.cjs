'use strict';
const fs=require('node:fs'),path=require('node:path');
// Engineering diagnostics only. No business mutation, grants, contents or keys.
function attach({app,win,host,getHost=()=>host,getAgent,root,qa}){
 if(!qa)return ()=>{};const file=path.join(root,'stage3-lifecycle.jsonl');
 const state=()=>{const host=getHost();return ({root:host.root,dirty:host.isDirty(),libraryRevision:host.savedRevision??null,services:[...host.services.values()].map(s=>({projectId:s.projectId,revision:s.graph?.revision??null,dirty:!!s.dirty,readOnly:!!s.readOnly,closed:!!s.closed,videoLockHeld:!!s.videoJournal?.workerLock.held,videoLockExists:s.videoJournal?fs.existsSync(s.videoJournal.workerLock.file):null,c5LockOwned:!!s.lockOwned})),codex:{state:getAgent()?.host?.state??'absent',inFlight:!!getAgent()?.host?.inFlight},sqliteOpen:typeof host.repo?.db?.isOpen==='boolean'?host.repo.db.isOpen:null});};
 const emit=(event,details={})=>{try{fs.appendFileSync(file,JSON.stringify({at:new Date().toISOString(),monoNs:process.hrtime.bigint().toString(),pid:process.pid,event,...details,state:state()})+'\n');}catch{}};
 emit('observer-attached',{qa});win.on('close',()=>emit('window-close-event'));win.on('closed',()=>emit('window-closed'));win.webContents.on('destroyed',()=>emit('contents-destroyed'));win.webContents.on('render-process-gone',(_e,d)=>emit('renderer-gone',{reason:d.reason,exitCode:d.exitCode}));win.webContents.on('will-prevent-unload',()=>emit('contents-will-prevent-unload'));app.on('before-quit',()=>emit('app-before-quit'));app.on('will-quit',()=>emit('app-will-quit'));app.on('window-all-closed',()=>emit('app-window-all-closed'));process.on('exit',code=>emit('process-exit',{code}));return emit;
}
module.exports={attach};

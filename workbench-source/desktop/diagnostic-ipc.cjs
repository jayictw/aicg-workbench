'use strict';
const path=require('node:path'),crypto=require('node:crypto');
const {Worker}=require('node:worker_threads');
const {target}=require('./diagnostic-reader.cjs');
const fixed=new Set(['D_SCHEMA','D_ORIGIN','D_HANDLE_EXPIRED','D_BUSY','D_PATH_REJECTED','D_ACCESS_DENIED','D_TYPE_INVALID','D_IO_ERROR','D_RESOURCE_LIMIT']);
const fail=c=>Object.assign(Error(c),{diagnosticCode:c});
function shape(r,keys){if(!r||Object.getPrototypeOf(r)!==Object.prototype||Object.keys(r).length!==keys.length||Object.keys(r).some(k=>!keys.includes(k)))throw fail('D_SCHEMA')}
function installDiagnostics({ipcMain,dialog,paths,sender,window,current}){
 let row=null,choosing=false;
 const owner=()=>JSON.stringify([current().cap,current().selected]);
 function ready(){if(current().blocked||row||choosing)throw fail('D_BUSY')}
 function get(r,keys=['handle'],allowExpiredCleanup=false){
  shape(r,keys);
  if(!row||typeof r.handle!=='string'||r.handle!==row.handle||row.owner!==owner()||(Date.now()>row.until&&!allowExpiredCleanup))throw fail('D_HANDLE_EXPIRED');
  return row;
 }
 function summary(x){return {handle:x.handle,state:x.report?.state||'running',location:x.location,...(x.report?{...x.report,items:undefined}:{}),pages:Math.ceil((x.report?.items.length||0)/20)}}
 const wrap=fn=>async(e,r,...extra)=>{
  try{
   sender(e);const u=new URL(e.senderFrame.url);
   if(u.host!=='app'||extra.length)throw fail('D_ORIGIN');
   return {ok:true,value:await fn(r)};
  }catch(e){const c=e.diagnosticCode||(/SENDER_REJECTED|ORIGIN_REJECTED/.test(e.message)?'D_ORIGIN':undefined);return {ok:false,code:fixed.has(c)?c:'D_IO_ERROR'}}
 };
 async function release(x){
  if(x.releasing)return x.releasing;
  x.releasing=(async()=>{
   Atomics.store(x.cancel,0,1);await x.done;
   const consistency=x.worker.threadId===-1?'unavailable':await new Promise(resolve=>{
    const timer=setTimeout(()=>resolve('unavailable'),60000);timer.unref();
    x.worker.once('message',m=>{clearTimeout(timer);resolve(m.kind==='released'?m.consistency:'unavailable')});
    x.worker.postMessage({kind:'release'});
   });
   clearTimeout(x.timer);await x.worker.terminate();if(row===x)row=null;
   return {released:true,consistency,overall:'unconfirmed'};
  })();return x.releasing;
 }
 ipcMain.handle('diagnostic:choose',wrap(async r=>{
  shape(r,[]);ready();choosing=true;
  try{
   const own=owner(),chosen=await dialog.showOpenDialog(window(),{title:'只读诊断工作库 · 测试资料',defaultPath:paths.librariesRoot,properties:['openDirectory','dontAddToRecent'],buttonLabel:'仅诊断，不打开'});
   if(chosen.canceled)return null;
   if(own!==owner()||current().blocked)throw fail('D_BUSY');
   const dir=target(paths.librariesRoot,chosen.filePaths?.[0]);
   if(current().cap&&path.resolve(current().selected).toLowerCase()===dir.toLowerCase())throw fail('D_BUSY');
   const cancel=new Int32Array(new SharedArrayBuffer(4));
   const worker=new Worker(path.join(__dirname,'diagnostic-worker.cjs'),{workerData:{runtimeMode:paths.mode,dir,librariesRoot:paths.librariesRoot,identityKind:paths.identityKind,proofSha:paths.sourceEvidence.sha256,cancelBuffer:cancel.buffer},resourceLimits:{maxOldGenerationSizeMb:256,stackSizeMb:4}});
   let done;const completion=new Promise(r=>done=r);
   const x={handle:crypto.randomUUID(),location:dir,owner:own,until:Date.now()+300000,worker,cancel,done:completion};
   row=x;
   worker.on('message',m=>{
    if(m.kind==='result'){x.report=m.report;done()}
    else if(m.kind==='fatal'){x.report={state:'stopped',overall:'unconfirmed',consistency:'unavailable',checked:0,total:null,unchecked:null,issues:[{code:'D_IO_ERROR'}],items:[],unknown:['诊断worker失败；影响范围未确认']};done()}
   });
   worker.on('error',e=>{x.report={state:'stopped',overall:'unconfirmed',consistency:'unavailable',checked:0,total:null,unchecked:null,issues:[{code:e.code==='ERR_WORKER_OUT_OF_MEMORY'?'D_RESOURCE_LIMIT':'D_IO_ERROR'}],items:[],unknown:['诊断worker失败／资源不足；影响范围未确认']};done()});
   x.timer=setTimeout(()=>{release(x).catch(()=>{})},300000);x.timer.unref();
   return summary(x);
  }finally{choosing=false}
 }));
 ipcMain.handle('diagnostic:status',wrap(r=>summary(get(r))));
 ipcMain.handle('diagnostic:page',wrap(r=>{const x=get(r,['handle','page']);if(!Number.isSafeInteger(r.page)||r.page<0||r.page>204)throw fail('D_SCHEMA');return {page:r.page,items:(x.report?.items||[]).slice(r.page*20,r.page*20+20)}}));
 ipcMain.handle('diagnostic:cancel',wrap(r=>{const x=get(r);Atomics.store(x.cancel,0,1);return {cancelRequested:true}}));
 ipcMain.handle('diagnostic:release',wrap(r=>release(get(r,['handle'],true))));
 return {get active(){return choosing||!!row},reset(){if(row)void release(row).catch(()=>{})}};
}
module.exports={installDiagnostics};

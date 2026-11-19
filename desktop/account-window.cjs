'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {loadPlan,fail}=require('./live-policy.cjs');
const SAFE_CODES=new Set(['LIVE_BATCH_METADATA_INVALID','LIVE_ACCOUNT_OR_PRICE_UNVERIFIED','LIVE_CREDENTIAL_INVALID','LIVE_INPUT_NOT_AUTHORIZED','LIVE_INPUT_GESTURE_REQUIRED','LIVE_ORIGINAL_BATCH_EXISTS','LIVE_INPUT_ALREADY_OPEN','LIVE_BATCH_INPUT_CHANGED','LIVE_OWNER_APPROVAL_ALREADY_BOUND','LIVE_JOURNAL_FAILED']);
class AccountWindow{
 constructor({electron,parent,service,broker,ownerRuntime,onState=()=>{},engineering=false}){Object.assign(this,{electron,parent,s:service,b:broker,ownerRuntime,onState,engineering});this.win=null;this.phase='ready';this.message='僅需本機既有Key，不需帳號ID或控制台登入。本修正版真實執行仍凍結。';this.accepted=false;this.cancelled=false;this.plan=loadPlan();this.nonce=crypto.randomUUID();
  const {ipcMain}=electron;
  const handler=fn=>async(event,request)=>{try{this.trusted(event);return {ok:true,value:await fn(request)};}catch(e){return {ok:false,code:SAFE_CODES.has(e?.code)?e.code:'LIVE_INPUT_REJECTED'};}};
  ipcMain.handle('c4-account:ready',handler(()=>({nonce:this.nonce,state:this.publicState()})));
  ipcMain.handle('c4-account:connect',handler(r=>this.connect(r)));
  ipcMain.handle('c4-account:cancel',handler(()=>{this.cancel();return {cancelled:true};}));
 }
 trusted(e){if(!this.win||this.win.isDestroyed()||e.sender!==this.win.webContents||e.senderFrame!==this.win.webContents.mainFrame||e.senderFrame.url!=='canvas://account/index.html')fail('LIVE_INPUT_NOT_AUTHORIZED');}
 nodeIds(){if(this.s.graph?.nodes.length!==4)fail('LIVE_BATCH_INPUT_CHANGED');return this.plan.items.map(i=>{const found=this.s.graph.nodes.filter(n=>n.label===i.label&&n.payload.intentPurpose===i.purpose);if(found.length!==1)fail('LIVE_BATCH_INPUT_CHANGED');const n=found[0],p=this.s.core.imagePlan(this.s.graph,n,this.s.core.effectiveInput(this.s.graph,n));if(p.prompt!==i.prompt||p.originalPrompt!==i.originalPrompt||p.images.length)fail('LIVE_BATCH_INPUT_CHANGED');return n.id;});}
 assertCanOpen(){this.nodeIds();if(Object.keys(this.b.imageBatches.live.records).length)fail('LIVE_ORIGINAL_BATCH_EXISTS');}
 async open(){
  if(this.win&&!this.win.isDestroyed()){this.win.focus();return {opened:true,title:this.win.getTitle()};}if(this.cancelled||this.accepted)fail('LIVE_INPUT_ALREADY_OPEN');this.s.requireWritable();this.assertCanOpen();
  const {BrowserWindow,session,screen}=this.electron,partition=session.fromPartition('c4-account-'+crypto.randomUUID());
  partition.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));partition.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*','ws://*/*','wss://*/*']},(_d,callback)=>callback({cancel:true}));
  partition.protocol.handle('canvas',async req=>{try{const u=new URL(req.url),files={'/index.html':['index.html','text/html'],'/account.js':['account.js','application/javascript'],'/account.css':['account.css','text/css']},f=files[u.pathname];if(req.method!=='GET'||u.hostname!=='account'||!f||u.search)return new Response(null,{status:403});return new Response(fs.readFileSync(path.join(__dirname,this.assetDirectory??'account-ui',f[0])),{headers:{'Content-Type':f[1]+'; charset=utf-8','Cache-Control':'no-store'}});}catch{return new Response(null,{status:403});}});
  const area=screen.getPrimaryDisplay().workAreaSize;this.permit=this.ownerRuntime.openPermit();this.deadlineTimer=setTimeout(()=>{this.message='本次輸入窗已到期，已清除引用。';this.cancel();},Math.max(1,this.permit.expiresAt-Date.now()));this.deadlineTimer.unref?.();
  this.win=new BrowserWindow({parent:this.parent,modal:true,title:this.engineering?'C4 工程假Key測試｜請勿輸入真Key':this.nativeTitle??'C4 · 本機一次性方舟帳戶（僅四圖）',width:Math.min(640,area.width-20),height:Math.min(900,area.height-40),minWidth:360,minHeight:600,backgroundColor:'#111214',show:false,webPreferences:{preload:path.join(__dirname,'account-preload.cjs'),session:partition,contextIsolation:true,sandbox:true,nodeIntegration:false,devTools:false,webSecurity:true,spellcheck:false,webviewTag:false}});
  const win=this.win;win.setMenu(null);win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',(e,url)=>{if(url!=='canvas://account/index.html')e.preventDefault();});win.webContents.on('will-attach-webview',e=>e.preventDefault());win.webContents.on('page-title-updated',e=>e.preventDefault());win.webContents.on('before-input-event',(e,input)=>{if(input.key==='F12'||input.control&&input.shift&&['i','j','c'].includes(input.key.toLowerCase()))e.preventDefault();});
  win.on('closed',()=>{this.cancel(false);this.win=null;partition.clearStorageData().catch(()=>{});partition.clearCache().catch(()=>{});});
  await win.loadURL('canvas://account/index.html');this.notify();if(!this.engineering)win.show();return {opened:true,title:win.getTitle()};
 }
 publicState(){let batch=null;if(this.batchId){try{batch=this.b.imageBatches.live.summary(this.b.imageBatches.live.records[this.batchId]);}catch{}}return {phase:this.phase,message:this.message,batch,account:this.ownerRuntime.publicState().verification,environment:this.ownerRuntime.runtime.environment,expiresAt:this.permit?.expiresAt??null};}
 publishState(){if(this.win&&!this.win.isDestroyed())this.win.webContents.send('c4-account:state',this.publicState());}
 notify(){this.publishState();this.onState();}
 async connect(r){
  if(!r||Object.keys(r).sort().join(',')!=='metadata,nonce,secret'||r.nonce!==this.nonce||this.accepted||this.cancelled||this.connecting)fail('LIVE_INPUT_NOT_AUTHORIZED');const nodeIds=this.nodeIds();this.connecting=true;
  try{
   await this.ownerRuntime.accept(r.secret,r.metadata,this.permit);r.secret=undefined;this.accepted=true;
   const p=await this.b.imageBatches.live.previewOwner(nodeIds);this.batchId=p.batchId;await this.b.imageBatches.live.approve({batchId:p.batchId,manifestDigest:p.manifestDigest,confirmation:'verified-owner-input/1'});this.b.imageBatches.live.execute({batchId:p.batchId});
   this.phase='running';this.message='已接收本次輸入，正在依序生成已批准的四圖。';this.notify();
   const work=this.b.imageBatches.live.active.get(p.batchId);Promise.resolve(work).then(()=>{const status=this.b.imageBatches.live.summary(this.b.imageBatches.live.records[p.batchId]);this.phase='finished';this.message=status.status==='completed'?'本批四圖已回到畫布。憑據引用已清除，請手動保存。':'本批已停止：'+status.status+'。憑據引用已清除，請查原操作；不會自動重送。';this.notify();}).catch(()=>{this.ownerRuntime.revoke();this.phase='finished';this.message='本批結果待查，已清除憑據引用；沒有重新提交。';this.notify();});
   return this.publicState();
  }catch(e){if(this.accepted){this.ownerRuntime.revoke();this.b.imageBatches.live.invalidate('all');this.phase='blocked';this.message='本次接入已停止，沒有自動重新提交；請查原操作。';this.notify();}throw e;}finally{r.secret=undefined;this.connecting=false;}
 }
 cancel(close=true){if(this.cancelled)return;this.cancelled=true;clearTimeout(this.deadlineTimer);this.ownerRuntime.revoke();this.b.imageBatches.live.invalidate('all');this.message='已關閉輸入並清除憑據引用；已送出的費用仍須核對。';if(close&&this.win&&!this.win.isDestroyed())this.win.close();this.onState();}
 close(){this.cancel();}
}
module.exports={AccountWindow,SAFE_CODES};

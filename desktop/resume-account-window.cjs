'use strict';
const {AccountWindow}=require('./account-window.cjs'),{fail}=require('./live-policy.cjs');
class ResumeAccountWindow extends AccountWindow{
 constructor(options){super(options);this.resume=options.resume;this.assetDirectory='resume-account-ui';this.nativeTitle='C4 · 原批剩餘三圖（T02–T04）';this.message='原T01未知且不重送。只用原批剩餘三次；請在本機輸入同一帳戶既有Key。';}
 assertCanOpen(){this.nodeIds();this.resume.assertReady();}
 publicState(){return {phase:this.phase,message:this.message,batch:this.resume?.summary()??null,account:this.ownerRuntime.publicState().verification,environment:this.ownerRuntime.runtime.environment,expiresAt:this.permit?.expiresAt??null};}
 async connect(r){
  if(!r||Object.keys(r).sort().join(',')!=='metadata,nonce,secret'||r.nonce!==this.nonce||this.accepted||this.cancelled||this.connecting)fail('LIVE_INPUT_NOT_AUTHORIZED');this.resume.assertReady();this.connecting=true;
  try{await this.ownerRuntime.accept(r.secret,r.metadata,this.permit);r.secret=undefined;this.accepted=true;this.resume.assertReady();this.resume.execute();this.phase='running';this.message='只依序執行原批產品、場景、風格三張；原人物請求不重送。';this.notify();
   this.resume.active.then(()=>{const s=this.resume.summary();this.phase='finished';this.message=s.status==='completed-with-original-unknown'?'剩餘三圖已回到原框。T01仍待查；憑據引用已清除，請手動保存。':'本批剩餘項已停止；沒有繼續提交或自動重送。原T01仍待查。';this.notify();}).catch(()=>{this.ownerRuntime.revoke();this.phase='finished';this.message='結果待查，已停止；不會重送。';this.notify();});return this.publicState();
  }catch(e){if(this.accepted){this.resume.stop();this.ownerRuntime.revoke();this.phase='blocked';this.message='接入已停止，不會重新提交。';this.notify();}throw e;}finally{r.secret=undefined;this.connecting=false;}
 }
 cancel(close=true){if(this.cancelled)return;this.cancelled=true;clearTimeout(this.deadlineTimer);this.resume?.stop();this.ownerRuntime.revoke();if(close&&this.win&&!this.win.isDestroyed())this.win.close();this.onState();}
}
module.exports={ResumeAccountWindow};

'use strict';
// One promise per close attempt. Authority remains with the main process.
class ExitController{
 constructor({check,dispose,approve,onError=()=>{}}){this.check=check;this.dispose=dispose;this.approve=approve;this.onError=onError;this.pending=null;this.approved=false;this.phase='open';this.lastError=null;}
 status(){return {phase:this.phase,pending:!!this.pending,approved:this.approved,lastError:this.lastError};}
 request(){if(this.approved)return Promise.resolve({approved:true,reused:true});if(this.pending)return this.pending;this.pending=Promise.resolve().then(async()=>{this.phase='checking';this.lastError=null;if(!(await this.check())){this.phase='open';return {approved:false,blocked:true};}this.phase='cleaning';await this.dispose();this.approved=true;this.phase='approved';this.approve();return {approved:true};}).catch(e=>{this.approved=false;this.phase='failed';this.lastError={code:/^[A-Z][A-Z0-9_]{1,70}$/.test(e?.code??'')?e.code:'EXIT_CLEANUP_FAILED',message:'退出清理未完成；未強行關閉視窗，請保留現場供檢查。'};try{this.onError(this.lastError);}catch{}return {approved:false,failed:true,error:this.lastError};}).finally(()=>{this.pending=null;});return this.pending;}
}
module.exports={ExitController};

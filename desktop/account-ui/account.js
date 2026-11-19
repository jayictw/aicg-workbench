'use strict';
const $=id=>document.getElementById(id),api=window.accountAPI;let busy=false;
const errors={LIVE_BATCH_METADATA_INVALID:'不需帳號ID或控制台登入。',LIVE_ACCOUNT_OR_PRICE_UNVERIFIED:'本次憑據會話參數或期限無法核對，已停止；不會重新提交。',LIVE_CREDENTIAL_INVALID:'Key格式不完整，請只在此本機欄位填入既有Key。',LIVE_INPUT_GESTURE_REQUIRED:'請由本視窗的按鈕提交。',LIVE_ORIGINAL_BATCH_EXISTS:'已有原批次紀錄，已停止；請查原操作，不會重送。'};
function state(s){if(s.phase==='running'||s.phase==='finished'){$('account-form').hidden=true;$('progress').hidden=false;$('status').textContent=s.message;}else if(s.phase==='blocked'){$('error').textContent=s.message;}}
api.onState(state);api.ready().then(r=>{if(r.ok)state(r.value.state);else $('error').textContent='本機輸入入口無法核對，請關閉。';});
$('account-form').addEventListener('submit',async e=>{e.preventDefault();if(busy)return;busy=true;$('submit').disabled=true;$('error').textContent='';const metadata={};
 const pending=api.connect({secret:$('key').value,metadata});$('key').value='';
 try{const r=await pending;if(!r.ok){$('error').textContent=errors[r.code]||'本次接入已停止，未重新提交；請關閉後查原操作。';}else state(r.value);}catch{$('error').textContent='本次接入結果不明，請查原操作，不要重送。';}finally{busy=false;$('submit').disabled=false;}
});
for(const id of ['cancel','close'])$(id).addEventListener('click',()=>{$('key').value='';api.cancel();});
window.addEventListener('pagehide',()=>{$('key').value='';});

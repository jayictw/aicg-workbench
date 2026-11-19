'use strict';
let uiState={language:'zh-CN',messages:{}},localeSerial=0;
const ui=raw=>{if(typeof raw!=='string')return raw;const key=raw.replace(/\s+/g,' ').trim();return (raw.match(/^\s*/)[0])+(uiState.messages[key]??key)+(raw.match(/\s*$/)[0]);};
function setUi(value){uiState=value??uiState;document.documentElement.lang=uiState.language;for(const e of document.querySelectorAll('[data-ui]'))e.textContent=ui(e.getAttribute('data-ui'));const control=document.getElementById('ui-language');if(control){control.value=uiState.language;control.setAttribute('aria-label',ui('Interface language'));}}

const api=window.byteplusNative,by=id=>document.getElementById(id);
let lastError=null;
function showError(error){lastError=error;const raw=String(error?.message??''),code=/^[A-Z][A-Z0-9_]{0,79}$/.test(error?.code??'')?error.code:'NATIVE_FAILED';const known=Object.hasOwn(uiState.messages,raw);by('error').textContent=(known?ui(raw):Object.hasOwn(uiState.messages,code)?ui(code):ui('Operation did not finish. Your input and previous results are preserved.'))+' ('+code+')'+(/UNKNOWN|UNCERTAIN/.test(code)?' '+ui('Check the original operation before trying again. An unknown receipt must not be resubmitted.'):'');const details=by('error-details');if(details){details.hidden=false;by('error-original').textContent=raw.replace(/https?:\/\/[^\s<>"']+/gi,'[private URL]').replace(/\bBearer\s+[^\s"']+/gi,'Bearer [redacted]').replace(/\bsk-[A-Za-z0-9_-]{12,}/g,'[redacted]');}}
let mode=null,busy=false;
let readyValue=null;
function renderReady(){if(!readyValue)return;const r={value:readyValue};by('details').replaceChildren();
mode=r.value.mode;
 if(mode==='connect'){
  by('title').textContent=ui('連接 BytePlus');
  by('description').textContent=ui('Key僅保留在目前本機程序記憶體；不寫入工程、不交給Codex或日誌。此步只設定連接，不提交生成或測試API。關閉工作台或清除連接後需重新輸入。');
  by('key-label').hidden=false;by('secret').required=true;by('submit').textContent=ui('設定本機連接');by('secret').focus();return;
 }
 const p=r.value.preview;
 const detail=(label,value)=>{const item=document.createElement('details');item.open=!['任务身份','连接 / Key epoch','请求 SHA256'].map(ui).includes(label);item.append(Object.assign(document.createElement('summary'),{textContent:label}),Object.assign(document.createElement('pre'),{textContent:JSON.stringify(value,null,2)}));by('details').append(item);};
 if(mode==='asset-source'){by('title').textContent=ui('Read and share this private asset as a temporary HTTPS source');by('description').textContent=ui('This reads only the exact asset in your project and group. The downloaded video must fully match the fixed local version. No upload, generation or account permission is created. You explicitly choose the task lifetime below; apply it in the workbench before generation.');by('asset-fields').hidden=false;by('asset-cost-warning').hidden=false;for(const id of ['asset-id','asset-project','asset-group','asset-ak','asset-sk','asset-ttl'])by(id).required=true;detail(ui('Fixed video and destination region'),p.sourceSetup);by('submit').textContent=ui('Read, verify and authorize this temporary source');return;}
 if(mode==='source'){by('title').textContent=ui('Upload and share this exact reference video');by('description').textContent=ui('Only continue if you own these private TOS links and may share this exact video with BytePlus. Upload does not generate video. Generation requires another native confirmation. An uncertain upload is never sent again.');by('source-fields').hidden=false;by('source-cancel-warning').hidden=false;by('source-put').required=true;by('source-get').required=true;detail(ui('Fixed video and destination region'),p.sourceSetup);by('submit').textContent=ui('Upload, verify and authorize this source');return;}
 if(mode==='carrier'){
  by('title').textContent=ui('授權分享這份參考影片來源');
  by('description').textContent=ui('僅授權將以下精確來源與固定素材用於指定 BytePlus 生成。此步不提交生成、不讀取 API Key、不收費。來源會在生成確認及提交前重新讀取並比對內容；此處不保證供應商日後能取用。您必須具有分享這份來源的權利。');
  detail(ui('分享目的地 / 範圍 / 素材 / 到期'),p.carrierConsent);detail(ui('精確來源（私密，請勿分享截圖）'),p.privateSourceDetails);
  by('submit').textContent=ui('授權分享這一份來源');return;
 }
 if(r.value.privateSourceDetails?.length)detail(ui('本次將分享的精確來源（私密，請勿分享截圖）'),r.value.privateSourceDetails);
 if(p.confirmationSummary){
  const q=p.confirmationSummary;
  const current=q.version===4,synthetic=q.executionEnvironment==='engineering-fake',enabled=q.connection?.runtimeAdmission?.enabled===true;
  if(current){by('title').textContent=synthetic?ui('核对 BytePlus 离线单次尝试'):ui('核对 BytePlus 单次付费尝试');by('description').textContent=p.name+(synthetic?ui('；外部传输为合成注入，不扣费。'):ui('；账户与 Endpoint 尚未预验，供应商依本次请求决定权限，可能计费。'))+(enabled?ui(' 原生确认只授权这一个请求；未知结果不自动重送。'):ui(' 当前隔离环境禁止真实请求，不会读取凭据或发送。'));}
  else by('title').textContent=q.version===3?(p.paid?ui('确认 BytePlus 正式合同'):ui('确认 BytePlus 离线注入请求')):ui('确认 BytePlus 离线 Mock 请求');
  if(!current)by('description').textContent=p.name+(q.version===3&&p.paid?ui('；账户与 Endpoint 资格尚未核实，当前真实提交受阻；不会读取凭据或发送。'):ui('；本次仅使用离线注入传输，不扣费，不自动重试。'));
  for(const [label,value]of [[ui('授权与资格'),{accountEntitlement:q.accountEntitlement,endpointBinding:q.endpointBinding,productionAuthorization:q.productionAuthorization,executionEnvironment:q.executionEnvironment,runtimeAdmission:q.connection?.runtimeAdmission}],[ui('任务身份'),q.owner],[ui('连接 / Key epoch'),q.connection],[ui('固定模型 / Endpoint / 合同版本'),q.route],[ui('操作 / 参数'),q.request],[ui('有序固定素材'),q.materials],[ui('输出图层数量范围'),q.outputs],[ui('请求 SHA256'),q.bodySha256]]){
   const item=document.createElement('details');item.open=!['任务身份','连接 / Key epoch','请求 SHA256'].map(ui).includes(label);item.append(Object.assign(document.createElement('summary'),{textContent:label}),Object.assign(document.createElement('pre'),{textContent:typeof value==='string'?value:JSON.stringify(value,null,2)}));by('details').append(item);
  }
  by('submit').textContent=current?(synthetic?ui('确认一次合成注入尝试'):enabled?ui('授权本次付费请求尝试'):ui('核对确认（隔离环境禁止发送）')):q.version===3&&p.paid?ui('核对原生确认（真实提交受阻）'):ui('确认一次离线提交');return;
 }
 const video=!!p.plan.frames;
 by('title').textContent=ui('確認這次收費生成');
 by('description').textContent=p.name+' · '+p.code+ui('；只送出本次1個')+(video?ui('影片'):ui('圖片'))+ui('任務，沒有自動重試。');
 const roles={product:ui('產品'),scene:ui('場景'),character:ui('人物'),style:ui('風格'),studio:ui('攝影棚構圖'),reference:ui('一般參考'),first_frame:ui('首幀'),last_frame:ui('尾幀'),reference_image:ui('影片參考')};
 const refs=p.plan.images??p.plan.frames??[],list=document.createElement('ol');
 for(const ref of refs)list.append(Object.assign(document.createElement('li'),{textContent:ref.name+' · '+(ref.purposes??[ref.purpose??ref.role]).map(x=>roles[x]??x).join('、')+ui(' · 固定版本')}));
 const request=document.createElement('details');request.append(Object.assign(document.createElement('summary'),{textContent:ui('實際送出的需求')}),Object.assign(document.createElement('pre'),{textContent:p.plan.prompt??p.plan.originalPrompt}));
 const quote=p.paid?ui('實際費用未知，以供應商帳單為準；本機不估價或設定美元消費上限。'):ui('工程替身 · 不收費；沒有發送真實 API');
 by('details').append(
  Object.assign(document.createElement('p'),{textContent:'BytePlus · '+(video?'Seedance 2.5 · '+(p.plan.mode==='reference'?ui('多圖參考 · ')+p.plan.parameters.ratio:ui('首尾幀 · 依首幀比例'))+ui(' · 4秒 · 480p · ')+(p.plan.parameters.generate_audio?ui('模型音訊開啟（實際由模型決定）'):ui('聲音已關閉'))+ui(' · 水印'):(p.imageModel?.label??p.plan.model)+' · '+p.plan.parameters.size.replace('x','×')+' PNG · '+(p.imageSize?.ratio??'1:1')+ui(' · 1張 · 水印')+(p.plan.parameters.watermark?ui('開啟'):ui('關閉')))}),
  Object.assign(document.createElement('p'),{textContent:video?ui('影片模型：')+p.plan.model+' · '+p.requestRouting.region+ui(' · API model實際送出：')+p.requestRouting.requestModel+' · '+p.requestRouting.apiDomain+ui(' · 此帳戶Endpoint權限與目前對應模型尚未真測'):ui('模型 ID：')+p.plan.model+' · '+(p.imageModel?.region??p.plan.region)+(p.requestRouting?.kind==='endpoint'?ui(' · API model實際送出：')+p.requestRouting.requestModel+ui(' · Project（使用者提供，Key歸屬未驗證）：')+p.requestRouting.declaredProject+ui(' · Endpoint對應模型尚未真測'):ui(' · 官方模型 ID 路由；未設定指定接入點'))}),
  Object.assign(document.createElement('p'),{textContent:quote}),list,request,
  Object.assign(document.createElement('small'),{textContent:ui('選定素材與提示詞將提交BytePlus。')+p.cost.status+ui('。停止本地等待不保證平台取消或退款。人物只用身體局部也不保證平台允許；拒絕不會改道或自動重送。')})
 );
 by('submit').textContent=p.paid?ui('確認並送出這次收費生成'):ui('執行工程替身 · 不收費');

}
api.ready().then(r=>{if(!r.ok){showError(r.error);return;}readyValue=r.value;setUi(r.value.ui);renderReady();});
by('ui-language').addEventListener('change',async e=>{if(busy)return;const ticket=++localeSerial,previous=document.activeElement;try{const out=await api.language(e.target.value);if(ticket!==localeSerial)return;if(!out.ok){showError(out.error);return;}const open=[...by('details').children].map(x=>x.open);setUi(out.value);renderReady();[...by('details').children].forEach((x,i)=>{if(i<open.length)x.open=open[i];});if(lastError)showError(lastError);}catch{if(ticket!==localeSerial)return;showError({code:'UI_LOCALE',message:ui('Native dialogs could not switch language. Current input is preserved.')});}finally{if(ticket===localeSerial){by('ui-language').value=uiState.language;previous?.focus();}}});

document.querySelector('form').addEventListener('submit',async e=>{
 e.preventDefault();if(busy)return;busy=true;by('submit').disabled=true;by('ui-language').disabled=true;
 const secret=mode==='connect'?by('secret').value:mode==='source'?{putURL:by('source-put').value,getURL:by('source-get').value}:mode==='asset-source'?{assetId:by('asset-id').value,projectName:by('asset-project').value,groupId:by('asset-group').value,accessKeyId:by('asset-ak').value,secretAccessKey:by('asset-sk').value,executionExpiresAfter:Number(by('asset-ttl').value)}:undefined,r=await api.submit(secret);by('secret').value='';by('asset-ak').value='';by('asset-sk').value='';
 if(!r.ok){showError(r.error);busy=false;by('submit').disabled=false;by('ui-language').disabled=false;}
});
by('cancel').onclick=()=>{by('secret').value='';by('source-put').value='';by('source-get').value='';by('asset-ak').value='';by('asset-sk').value='';api.cancel();};
window.addEventListener('beforeunload',()=>{by('secret').value='';by('source-put').value='';by('source-get').value='';by('asset-ak').value='';by('asset-sk').value='';});


by('source-reveal').onclick=()=>{const show=by('source-put').type==='password';by('source-put').type=by('source-get').type=show?'text':'password';by('source-reveal').setAttribute('aria-pressed',String(show));by('source-reveal').setAttribute('data-ui',show?'Hide private URLs':'Show private URLs');by('source-reveal').textContent=ui(show?'Hide private URLs':'Show private URLs');};

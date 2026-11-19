'use strict';
const $=id=>document.getElementById(id);
function render(s){
 $('target').textContent=s.service+' · '+s.model+' · '+s.url;
 $('state').textContent=s.running?'本轮串行执行中，请等待当前请求；不会根据结果补送。':s.report?'执行状态：'+s.report.status+'；已进入发送 '+s.report.actualRequestCount+'；返回原图 '+s.report.successCount+'；'+(s.report.stopReason||''):s.credentialState+'；未获本轮新批准前不读取Key、不发送。';
 $('budget').textContent='2026-10-26参考价：本批11张估1.32 CNY；第一批实际费用及本批实际扣费未知。预算范围：'+(s.budgetScope||'待批准')+'；批准上限：'+(s.budgetMinor===null?'尚未提供':(s.budgetMinor/100).toFixed(2)+' CNY')+'；本批可用上限：'+(s.batchBudgetMinor===null?'尚未提供':(s.batchBudgetMinor/100).toFixed(2)+' CNY');
 $('cases').replaceChildren();$('results').replaceChildren();
 for(const cell of s.cases){
  const b=document.createElement('button');b.textContent=cell.caseId+' · 实际请求预览';b.onclick=async()=>{const r=await window.chinaSix.preview(cell.caseId);if(!r.ok)return;const v=r.value;$('preview').hidden=false;$('name').textContent=cell.caseId;$('wire').textContent=v.url+' · '+v.body.model+' · 请求SHA256 '+v.wireBodySha256;$('prompt').textContent=v.body.prompt;$('hash').textContent=v.referenceSha256||'不带参考图';$('ref').hidden=!v.referenceDataUrl;if(v.referenceDataUrl)$('ref').src=v.referenceDataUrl;else $('ref').removeAttribute('src');$('preview').scrollIntoView({block:'start'})};$('cases').append(b);
  const row=s.report?.records?.find(x=>x.caseId===cell.caseId),box=document.createElement('article'),label=document.createElement('p');label.textContent=cell.caseId+' · '+(row?.status||'NOT_RUN');box.append(label);
  const found=s.images.find(x=>x.caseId===cell.caseId);if(found){const img=document.createElement('img');img.src=found.src;img.style.width='100%';img.alt=cell.caseId+'原图等比预览';box.append(img)}$('results').append(box);
 }
}
window.chinaSix.onStatus(render);window.chinaSix.status().then(r=>{if(r.ok)render(r.value)});

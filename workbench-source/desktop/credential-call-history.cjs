'use strict';
// Read-only display evidence. Never a verification, authorization or credential mutation.
const REF=['credentialId','secretVersion','bindingEpoch','accountScopeId','serviceId','serviceRevision','apiOrigin'];
function callHistory(credential,attempts){
 const completed=attempts.filter(a=>a.ref?.credentialId===credential.credentialId&&a.execution?.phase==='completed'&&a.actions?.submit?.status==='done'&&a.actions.submit.count===1);
 const official=a=>['ark-image-provider','ark-video-provider'].includes(a.execution.kind)&&a.execution.request?.executionMode==='provider'&&a.execution.outcome?.provenance?.responseDeclaredModel===a.execution.config?.exactModelId;
 const same=a=>REF.every(k=>a.ref[k]===credential[k]);
 const current=completed.filter(a=>same(a)&&official(a)),historical=completed.filter(a=>!same(a)&&official(a)),local=completed.filter(a=>same(a)&&['ark-image-qa-confirmed','ark-image-controlled','ark-image-offline','ark-video-qa-confirmed'].includes(a.execution.kind));
 const latest=current.slice().sort((a,b)=>(b.execution.outcome.observedAt||b.createdAt)-(a.execution.outcome.observedAt||a.createdAt))[0];
 return {officialSuccesses:current.length,priorVersionOfficialSuccesses:historical.length,controlledSuccesses:local.length,lastOfficial:latest?{at:latest.execution.outcome.observedAt||latest.createdAt,model:latest.execution.config.exactModelId}:null};
}
module.exports={callHistory};

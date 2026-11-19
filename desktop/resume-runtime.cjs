'use strict';
const crypto=require('node:crypto'),{sessionCredentials}=require('./session-credentials.cjs'),{verifyMetadata,INPUT_APPROVAL}=require('./owner-runtime.cjs'),{ArkHttpTransport}=require('./ark-http-transport.cjs'),{fail}=require('./live-policy.cjs');
function createResumeRuntime({request,clock=Date.now}={}){
 const environment=request?'mock-http':'provider';let permit=null,confirmation=null;
 const credentials=sessionCredentials({maxUses:3,clock,authorizeInput:p=>!!permit&&p===permit&&clock()<permit.expiresAt,verifyDescriptor:m=>{if(!m||Object.keys(m).sort().join(',')!=='sameAccountConfirmed'||m.sameAccountConfirmed!==true)fail('RESUME_SAME_ACCOUNT_CONFIRMATION_REQUIRED');const d=verifyMetadata({},clock(),permit.credentialSessionId);d.expiresAt=Math.min(d.expiresAt,permit.expiresAt);confirmation={sameAccountConfirmedByOwner:true,providerIdentityVerified:false,accountIdentity:'unknown',basis:'owner-confirmation-only',credentialSessionId:d.accountScope};return d;}});
 return {runtime:{environment,credentialProvider:credentials,transport:new ArkHttpTransport({request}),originalBatchResume:true,nativeOwnerEnabled:true},inputApproval:INPUT_APPROVAL,
  openPermit(){if(permit)fail('LIVE_INPUT_ALREADY_OPEN');permit=Object.freeze({id:crypto.randomUUID(),credentialSessionId:'credential-session-'+crypto.randomUUID(),createdAt:clock(),expiresAt:clock()+7200000});return permit;},
  async accept(secret,metadata,p){if(p!==permit)fail('LIVE_INPUT_NOT_AUTHORIZED');if(environment==='mock-http'?!/^C4_FAKE_ONLY_[A-Z0-9_]{12,}$/.test(secret):/^C4_FAKE_ONLY_/.test(secret))fail('LIVE_CREDENTIAL_INVALID');return credentials.acceptInput(secret,metadata,p);},
  revoke(){permit=null;credentials.clear();},publicState(){return {environment,credential:credentials.state(),verification:confirmation,inputApproval:INPUT_APPROVAL.messageId};}
 };
}
module.exports={createResumeRuntime};

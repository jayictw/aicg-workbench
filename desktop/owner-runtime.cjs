'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {sessionCredentials}=require('./session-credentials.cjs'),{ArkHttpTransport}=require('./ark-http-transport.cjs'),{ownerBatchAuthority,mockOwnerBatchAuthority}=require('./owner-batch-authority.cjs'),{MODEL,fail}=require('./live-policy.cjs');
const INPUT_APPROVAL=Object.freeze({messageId:'Sentinel_5523c5a8edbc81918a239b980278880e',approvedAt:'2026-11-01T02:44:30Z',purpose:'one local process-memory-only input for the already approved four-image batch'});
function verifyMetadata(m,now=Date.now(),sessionId='credential-session-'+crypto.randomUUID()){
 if(!m||typeof m!=='object'||Array.isArray(m)||Object.keys(m).length||!/^credential-session-[a-f0-9-]{36}$/.test(sessionId))fail('LIVE_BATCH_METADATA_INVALID');
 return {accountScope:sessionId,accountScopeKind:'credential-session',accountIdentityVerified:false,bindingVersion:1,provider:'ark-cn',region:'cn-beijing',model:MODEL,unitMinor:12,currency:'CNY',priceVerified:false,priceBasis:'approved-manifest-cap',accountPriceVerified:false,verifiedAt:now,expiresAt:now+7200000,verificationMethod:'credential-session-only'};
}
function createOwnerRuntime({request,clock=Date.now,approvalDirectory}={}){
 if(!request&&fs.existsSync(path.join(__dirname,'../RECOVERY-FROZEN.json')))fail('ORIGINAL_REQUEST_UNKNOWN_FROZEN');
 const environment=request?'mock-http':'provider';let permit=null,verification=null,authority=null;
 const credentials=sessionCredentials({clock,authorizeInput:p=>!!permit&&p===permit&&clock()<permit.expiresAt,verifyDescriptor:m=>{const d=verifyMetadata(m,clock(),permit?.credentialSessionId);d.expiresAt=Math.min(d.expiresAt,permit?.expiresAt??0);verification={credentialSessionId:d.accountScope,accountIdentity:'unknown',accountPriceVerification:'unknown',providerAccountIdentityVerified:false,verificationMethod:'credential-session-only',priceBasis:'approved-manifest-cap',unitCapMinor:12,region:d.region,model:d.model,sessionCreatedAt:new Date(clock()).toISOString(),inputApproval:INPUT_APPROVAL.messageId};return d;}});
 const runtime={nativeOwnerEnabled:true,environment,credentialProvider:credentials,transport:new ArkHttpTransport({request}),approvalProvider:{authorize(binding,digest){const account=credentials.describe();if(!authority)authority=environment==='provider'?ownerBatchAuthority({accountScope:account.accountScope,clock}):mockOwnerBatchAuthority({directory:approvalDirectory??path.join(__dirname,'../qa/owner-claims',crypto.randomUUID()),accountScope:account.accountScope,clock});return authority.authorize(binding,digest);}}};
 return {runtime,inputApproval:INPUT_APPROVAL,
  openPermit(){if(permit||credentials.state().configured)fail('LIVE_INPUT_ALREADY_OPEN');permit=Object.freeze({id:crypto.randomUUID(),credentialSessionId:'credential-session-'+crypto.randomUUID(),createdAt:clock(),expiresAt:clock()+7200000});return permit;},
  async accept(secret,metadata,p){if(p!==permit)fail('LIVE_INPUT_NOT_AUTHORIZED');if(environment==='mock-http'?!/^C4_FAKE_ONLY_[A-Z0-9_]{12,}$/.test(secret):/^C4_FAKE_ONLY_/.test(secret))fail('LIVE_CREDENTIAL_INVALID');return credentials.acceptInput(secret,metadata,p);},
  revoke(){permit=null;credentials.clear();},
  publicState(){return {credential:credentials.state(),verification,environment,inputApproval:INPUT_APPROVAL.messageId};}
 };
}
module.exports={createOwnerRuntime,verifyMetadata,INPUT_APPROVAL};

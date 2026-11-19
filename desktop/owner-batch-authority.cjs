'use strict';
const fs=require('node:fs'),path=require('node:path'),{hash}=require('./media.cjs');
const {PLAN_HASH,canonical,freeze,fail,localDirectory}=require('./live-policy.cjs');
// The approved human instruction is fixed in source, not accepted from model/tool JSON.
const EVIDENCE=freeze({approvalId:'owner-C4-four-images-20261101T022031Z',messageId:'Sentinel_e8e6038a62a88191bce88f9e726b4e1a',approvedAt:'2026-11-01T02:20:31Z',planSha256:PLAN_HASH});
function factory({directory,accountScope,environment,clock=Date.now}){
 let claimed=null;
 return Object.freeze({authorize(binding,digest){
  if(binding.planSha256!==PLAN_HASH||binding.environment!==environment||binding.account.accountScope!==accountScope||binding.maxSubmissions!==4||binding.unitCapMinor!==12||binding.capMinor!==60||binding.concurrency!==1||binding.automaticPostRetries!==0||hash(canonical(binding))!==digest||binding.expiresAt<=clock())fail('LIVE_OWNER_APPROVAL_MISSING');
  const evidence=environment==='provider'?EVIDENCE:{approvalId:'fake-only-approval',messageId:null,planSha256:PLAN_HASH},receipt={approvalId:evidence.approvalId,bindingDigest:digest,approvedAt:clock(),expiresAt:binding.expiresAt};
  const claim={version:1,evidence,bindingDigest:digest,projectId:binding.projectId,graphId:binding.graphId,accountScope,environment,receipt};
  localDirectory(directory);fs.mkdirSync(directory,{recursive:true});localDirectory(directory);const file=path.join(directory,'C4-DIALOGUE-TEXT-ONLY-s8q2-b1.claim.json');
  // One durable claim across all project roots, before any network authorization.
  // A stale/different claim is never deleted/reassigned automatically.
  if(claimed){if(claimed.bindingDigest!==digest)fail('LIVE_OWNER_APPROVAL_ALREADY_BOUND');return structuredClone(claimed.receipt);}
  let fd;try{fd=fs.openSync(file,'wx');fs.writeFileSync(fd,JSON.stringify(claim,null,2));fs.fsyncSync(fd);}catch{fail('LIVE_OWNER_APPROVAL_ALREADY_BOUND');}finally{if(fd!==undefined)fs.closeSync(fd);}
  claimed=claim;return structuredClone(receipt);
 }});
}
function ownerBatchAuthority({accountScope,clock}={}){if(typeof accountScope!=='string'||!/^[-a-zA-Z0-9]{1,90}$/.test(accountScope))fail('LIVE_ACCOUNT_OR_PRICE_UNVERIFIED');return factory({directory:path.join(__dirname,'../runtime/live-authorization'),accountScope,environment:'provider',clock});}
// Test factory can only authorize mock-http bindings, never provider bindings.
function mockOwnerBatchAuthority({directory,accountScope,clock}){return factory({directory,accountScope,environment:'mock-http',clock});}
module.exports={ownerBatchAuthority,mockOwnerBatchAuthority,EVIDENCE};

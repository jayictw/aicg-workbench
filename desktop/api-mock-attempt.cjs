'use strict';
// MOCK ONLY. Isolated adapter around the existing durable BytePlusJournal.
// Refuses real hosts; not connected to any formal generation entry point.
const {BytePlusJournal}=require('./byteplus-journal.cjs');
const {canonical,freeze}=require('./live-policy.cjs');
const {parseBoundedJson}=require('./api-request-guard.cjs');
const {createHash}=require('node:crypto');
const hash=x=>createHash('sha256').update(x).digest('hex');
const err=code=>Object.assign(new Error(code),{code});
function safeSnapshot(value,containsKnownSecret){
 const s=structuredClone(value),keys=['schemaVersion','route','request','query'];
 if(!s||Object.keys(s).some(k=>!keys.includes(k))||s.schemaVersion!==1||!s.route||!s.request||!s.query||containsKnownSecret(s))throw err('MOCK_SNAPSHOT_INVALID');
 const routeKeys=['providerId','connectionId','routingId','modelId','canonicalModel','region','adapterId','adapterVersion','authType','configRevision','connectionRevision','routingRevision'];
 if(Object.keys(s.route).some(k=>!routeKeys.includes(k))||routeKeys.some(k=>!Object.hasOwn(s.route,k))||Object.keys(s.request).sort().join(',')!=='json,method,url'||Object.keys(s.query).sort().join(',')!=='method,urlTemplate')throw err('MOCK_SNAPSHOT_INVALID');
 let post,get;try{post=new URL(s.request.url);get=new URL(s.query.urlTemplate.replace('{id}','mock-id'));}catch{throw err('MOCK_SNAPSHOT_INVALID');}
 if(s.request.method!=='POST'||s.query.method!=='GET'||post.protocol!=='https:'||!post.hostname.endsWith('.example.invalid')||get.origin!==post.origin||post.username||post.password||post.search||post.hash||get.username||get.password||get.search||get.hash||s.query.urlTemplate!==s.request.url+'/{id}')throw err('MOCK_SNAPSHOT_INVALID');
 const body=parseBoundedJson(s.request.json);if(!body||typeof body.model!=='string'||!Array.isArray(body.content))throw err('MOCK_SNAPSHOT_INVALID');
 return freeze(s);
}
class MockAttempt{
 constructor(root,identity,{submit,query,afterSubmitting=()=>{},containsKnownSecret=()=>false}={}){
  this.journal=new BytePlusJournal(root,identity);this.submitPort=submit;this.queryPort=query;this.afterSubmitting=afterSubmitting;this.containsKnownSecret=containsKnownSecret;this.stop=null;
 }
 view(a){
  if(a.state==='queued'&&a.taskId)return {state:'ACCEPTED',remoteId:a.taskId,durableRemoteIdentity:true,canRecover:true,automaticRetry:false,cost:'UNKNOWN'};
  return {state:'SUBMISSION_UNKNOWN',requiresRemoteCheck:true,canRecover:false,automaticRetry:false,cost:'UNKNOWN',reason:'Check original remote state manually; do not create another task.'};
 }
 blocked(remoteId=null){this.stop={state:'PERSISTENCE_BLOCKED',code:remoteId?'REMOTE_ID_NOT_DURABLE':'JOURNAL_UNAVAILABLE',remoteId,durableRemoteIdentity:false,canRecover:false,automaticRetry:false,requiresRemoteCheck:true,cost:'UNKNOWN'};return {...this.stop};}
 unknown(id,reason){try{return this.view(this.journal.change(id,{state:'submissionUnknown',reason}));}catch{return this.blocked();}}
 async start({operationId,owner,snapshot,authorize}){
  if(this.stop)return {...this.stop};if(this.journal.failed)return this.blocked();const old=this.journal.query(operationId);
  const plan=safeSnapshot(snapshot,this.containsKnownSecret),digest=hash(canonical(plan));
  // Check durable operation identity BEFORE consuming another confirmation.
  if(old.state!=='not-found'){if(old.digest!==digest||old.owner.nodeId!==owner.nodeId)throw err('IDEMPOTENCY_CONFLICT');return this.view(old);}
  if(typeof authorize!=='function')throw err('MOCK_CONFIRMATION_REQUIRED');authorize();
  try{this.journal.reserve({operationId,owner:{nodeId:owner.nodeId},environment:'engineering-fake',digest,plan,confirmationConsumed:1});this.journal.dispatch(operationId);}catch{return this.blocked();}
  await this.afterSubmitting();
  let response;
  try{response=await this.submitPort(plan);}catch(e){return this.unknown(operationId,['ETIMEDOUT','ECONNRESET'].includes(e?.code)?e.code:'SUBMIT_TRANSPORT_UNKNOWN');}
  if(!response||![200,201,202].includes(response.status)||typeof response.body?.id!=='string'||!/^[-A-Za-z0-9_.]{1,128}$/.test(response.body.id))return this.unknown(operationId,'SUBMIT_RESPONSE_UNKNOWN');
  const remoteId=response.body.id;if(this.containsKnownSecret(remoteId))return this.unknown(operationId,'SUBMIT_ID_REDACTED');
  try{return this.view(this.journal.change(operationId,{state:'queued',taskId:remoteId}));}catch{return this.blocked(remoteId);}
 }
 async recover(operationId){
  if(this.stop)return {...this.stop};const a=this.journal.query(operationId);
  if(a.state==='not-found')throw err('MOCK_OPERATION_MISSING');
  const plan=safeSnapshot(a.plan,this.containsKnownSecret);if(hash(canonical(plan))!==a.digest)throw err('MOCK_SNAPSHOT_INVALID');
  if(a.state!=='queued'||!a.taskId)return this.view(a);
  const url=plan.query.urlTemplate.replace('{id}',encodeURIComponent(a.taskId));
  const response=await this.queryPort({method:'GET',url,route:plan.route,taskId:a.taskId});
  const status=response?.status===200&&response.body?.id===a.taskId&&['queued','running','succeeded','failed'].includes(response.body.status)?response.body.status:'UNKNOWN';
  return {...this.view(a),remoteState:status};
 }
}
module.exports={MockAttempt};

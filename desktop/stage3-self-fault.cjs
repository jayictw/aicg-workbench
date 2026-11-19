'use strict';
// Test-only inherited parent IPC. No renderer/MCP or production fault endpoint.
function install({qa,host,agent,busy,hasDraft,trace,processObject=process}){
 const nonce=processObject.env.AICG_STAGE3_QA_FAULT_NONCE;
 if(!/^s3-a-abnormal-[a-f0-9-]{36}$/.test(qa??'')||!processObject.connected||!/^[a-f0-9]{64}$/.test(nonce??''))return false;
 let used=false;
 processObject.on('message',message=>{
  if(used||!message||Object.keys(message).sort().join(',')!=='expectedGraphId,expectedGraphRevision,expectedLibraryRevision,kind,nonce'||message.kind!=='stage3-saved-idle-self-exit'||message.nonce!==nonce)return;
  const service=host.services.get(host.activeProjectId),services=[...host.services.values()];
  if(!service||host.isDirty()||busy()||hasDraft()||agent()?.host?.inFlight||host.savedRevision!==message.expectedLibraryRevision||service.graph.graphId!==message.expectedGraphId||service.graph.revision!==message.expectedGraphRevision||services.some(s=>s.readOnly||s.importing||s.stages?.size||s.renderer?.active||s.dirty||Object.values(s.graph?.runs??{}).some(r=>!['succeeded','failed','cancelled'].includes(r.state)))){
   trace('qa-self-fault-rejected',{reason:'not-the-exact-saved-idle-fixture'});return;
  }
  used=true;trace('qa-controlled-self-exit',{controlledFault:true,savedLibraryRevision:host.savedRevision,graphId:service.graph.graphId,graphRevision:service.graph.revision,notANormalExitPass:true});
  processObject.exit(86);
 });return true;
}
module.exports={install};

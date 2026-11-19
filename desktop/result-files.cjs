 'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),{error,hash}=require('./media.cjs');
const keys=['projectId','graphId','nodeId','resultId','mediaVersionId','expectedRevision','confirmation'];
const fail=(code='RESULT_FILE_SCOPE')=>{throw error(code,'此明確結果的本地檔案不可用或歸屬已變更；原成果保留');};
class ResultFiles{
 constructor(getService,{showItem}){this.getService=getService;this.showItem=showItem;}
 async revealAgent(req){if(req.confirmation!==undefined)fail('RESULT_FILE_CLICK_REQUIRED');return this.reveal({...req,confirmation:'agent-authorized-result/1'});}
 resolve(req){
  const s=this.getService();if(!s?.graph)fail();s.core.exact(req,keys);
  for(const k of keys.slice(0,5))s.core.id(req[k]);
  if(!['trusted-result-file-click/1','agent-authorized-result/1'].includes(req.confirmation))fail('RESULT_FILE_CLICK_REQUIRED');
  const g=s.graph;if(req.projectId!==g.projectId||req.graphId!==g.graphId||req.expectedRevision!==g.revision||s.host.activeProjectId!==g.projectId)fail();
  const n=g.nodes.find(n=>n.id===req.nodeId),r=g.results[req.resultId],m=g.mediaVersions[req.mediaVersionId],run=g.runs[r?.runId];
  if(!['generate.image','generate.video'].includes(n?.kind)||r?.producerNodeId!==n.id||r.mediaStatus!=='ready'||r.mediaVersionId!==req.mediaVersionId||m?.resultId!==r.id||run?.nodeId!==n.id||run.state!=='succeeded'||!run.resultIds.includes(r.id)||!['image','video'].includes(m.type)||!Number.isSafeInteger(m.size)||m.size<=0||!(/^[a-f0-9]{64}$/).test(m.sha256))fail();
  if(r.mode.startsWith('byteplus-')){
   const version=run.snapshot?.capability?.id;
   if(version==='byteplus-workbench/generation/1')s.verifyGraph(g);
   else if(['byteplus-workbench/generation/2','byteplus-workbench/generation/3','byteplus-workbench/generation/4'].includes(version))require('./byteplus-result-authority.cjs').verifyRun(s,g,run);
   else fail();
  }
  s.checkMediaBytes(m);return {s,m,target:path.resolve(s.repo.contentPath(m))};
 }
 async verified(req){
  const initial=this.resolve(req),{s,m,target}=initial,root=path.resolve(s.repo.media),relative=path.relative(root,target);
  if(!relative||relative.startsWith('..')||path.isAbsolute(relative))fail('RESULT_FILE_PATH');
  // Inspect every ancestor, including the repository root: junctions must not
  // turn a trusted content name into a different filesystem destination.
  for(let p=target;;p=path.dirname(p)){
   const st=await fs.lstat(p);if(st.isSymbolicLink()||(p===target?!st.isFile():!st.isDirectory()))fail('RESULT_FILE_PATH');
   if(p===path.dirname(p))break;
  }
  if((await fs.realpath(target)).toLowerCase()!==target.toLowerCase())fail('RESULT_FILE_PATH');
  const h=await fs.open(target,'r');try{const st=await h.stat(),bytes=await h.readFile();if(!st.isFile()||st.size!==m.size||bytes.length!==m.size||hash(bytes)!==m.sha256)fail('RESULT_FILE_INTEGRITY');}finally{await h.close();}
  const current=this.resolve(req);if(current.s!==s||current.target!==target||current.m.sha256!==m.sha256||current.m.size!==m.size)fail();
  return current;
 }
 async reveal(req){
  const verified=await this.verified(req),current=this.resolve(req);if(current.s!==verified.s||current.target!==verified.target||current.m.sha256!==verified.m.sha256||current.m.size!==verified.m.size)fail();const {target}=current;
  // No await between the final active-project check and native file-manager API.
  this.showItem(target);return {requested:true,resultId:req.resultId,mediaVersionId:req.mediaVersionId};
 }
}
module.exports={ResultFiles};

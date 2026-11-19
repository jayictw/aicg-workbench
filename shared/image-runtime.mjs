import {exact,fail,makeEdge,validateGraph,effectiveInput,canonical,upgradeReferencePort} from './core.mjs';
import {imagePlan,CAPABILITY} from './image-plan.mjs';
export function imageMutation(input,o,{uid,hash}){
 const g=structuredClone(input),n=g.nodes.find(n=>n.id===o.nodeId);if(!n||n.kind!=='generate.image')fail('IMAGE_ONLY','請選擇圖片框');let created=[];
 if(o.type==='image.inputs'){
  upgradeReferencePort(n);
  exact(o,['type','nodeId','inputs']);if(!Array.isArray(o.inputs)||o.inputs.length>10)fail('IMAGE_TOTAL','最多10項素材用途');
  const port=n.ports.find(p=>p.key==='reference'),old=g.edges.filter(e=>e.target.nodeId===n.id&&e.target.portId===port.id);g.edges=g.edges.filter(e=>!old.includes(e));
  o.inputs.forEach((item,i)=>{exact(item,['edgeId','sourceNodeId','role']);const previous=item.edgeId?old.find(e=>e.id===item.edgeId):null;if(item.edgeId&&!previous)fail('IMAGE_BINDING','固定連線已變更，請重讀');if(previous&&previous.source.nodeId!==item.sourceNodeId)fail('IMAGE_BINDING','不能把舊版本冒充另一來源');
   if(previous){g.edges.push({...previous,role:item.role,inputOrder:i});}else{const src=g.nodes.find(x=>x.id===item.sourceNodeId),sp=src?.ports.find(p=>p.key==='media'&&p.direction==='out');if(!sp)fail('IMAGE_SOURCE','請選擇有圖片輸出的素材');const e=makeEdge(g,{sourceNodeId:src.id,sourcePortId:sp.id,targetNodeId:n.id,targetPortId:port.id,role:item.role,inputOrder:i},uid);g.edges.push(e);created.push(e.id);}});
  n.contentRevision++;g.topologyRevision++;g.revision++;validateGraph(g);return {graph:g,created};
 }
 if(o.type!=='run.start')fail('OPERATION','不支援這個圖片操作');exact(o,['type','nodeId','outcome','executionMode']);if(o.executionMode!==undefined&&o.executionMode!=='live')fail('IMAGE_EXECUTION_MODE','執行模式無效');if(!['success','failed','unknown','slow','malformed','partial'].includes(o.outcome)||o.executionMode==='live'&&o.outcome!=='success')fail('IMAGE_SCENARIO','圖片執行情境不支援');
 if((g.reviews[n.id]?.length??0)||n.dependencyIssues.length)fail('DEPENDENCY_REVIEW','素材有變更，請先查看用途與版本');
 if(Object.values(g.runs).some(r=>r.nodeId===n.id&&['running','submissionUnknown'].includes(r.state)))fail('RUN_IN_PROGRESS','這個圖片框已有進行中或未知提交，請先查原操作');
 const effective=effectiveInput(g,n),plan=imagePlan(g,n,effective),fingerprint=hash(canonical({effective,parameters:plan.parameters,model:plan.model,capability:CAPABILITY})),runId=uid('run');
 const mode=o.executionMode==='live'?'adapter-live':'adapter-offline';
 const snapshot={node:structuredClone(n),projectId:g.projectId,graphId:g.graphId,startGraphRevision:g.revision,effective,parameters:structuredClone(n.payload.parameters),capability:{id:plan.capability,version:1,mode,outcome:o.outcome,plan},scope:{nodeIds:[n.id],automaticDownstream:false},command:{commandId:'pending',channel:'gui',actor:'local-session-unverified'}};
 g.runs[runId]={id:runId,projectId:g.projectId,graphId:g.graphId,nodeId:n.id,nodeContentRevision:n.contentRevision,startGraphRevision:g.revision,mode,snapshot,snapshotHash:hash(canonical(snapshot)),inputFingerprint:fingerprint,state:'running',submissionId:uid('submission'),commandId:'pending',events:[],resultIds:[],createdAt:new Date().toISOString()};n.payload.latestRunId=runId;g.revision++;return {graph:g,created:[runId]};
}

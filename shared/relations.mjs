import {exact,id,fail,makeEdge,validateGraph,mediaRecord,canonical,upgradeReferencePort} from './core.mjs';
import {sourceFor} from './edit-runtime.mjs';
export const RELATION_ROLES=['prompt','reference','product','character','scene','style','studio'];
export function bindingVersion(g,nodeId){const n=g.nodes.find(n=>n.id===nodeId);if(!n)fail('R3_SOURCE_MISSING','來源節點已不存在');if(['text','prompt'].includes(n.kind))return n.payload.currentTextVersionId;return sourceFor(g,nodeId).mediaVersionId;}
const find=(g,nodeId)=>{const n=g.nodes.find(n=>n.id===nodeId);if(!n)fail('R3_TARGET_MISSING','目標節點已不存在');return n;};
// Current task inputs follow their stable asset node. Run/result/composition
// snapshots remain pinned to the immutable media version they captured.
export function syncAssetInputs(before,g){
 const changed=new Map(g.nodes.filter(n=>n.kind.startsWith('asset.')&&before.nodes.some(old=>old.id===n.id&&old.payload.mediaVersionId!==n.payload.mediaVersionId)).map(n=>[n.id,n]));
 for(const e of g.edges){const source=changed.get(e.source.nodeId),target=g.nodes.find(n=>n.id===e.target.nodeId);if(source&&e.relation==='input'&&target?.kind.startsWith('generate.')&&e.binding.mediaRef?.kind==='asset')e.binding.mediaRef={kind:'asset',assetId:source.payload.assetId,mediaVersionId:source.payload.mediaVersionId};}
 return g;
}
function boundEdge(g,{sourceNodeId,targetNodeId,targetPortKey,role,inputOrder,versionId},uid){const s=find(g,sourceNodeId),t=find(g,targetNodeId),tp=t.ports.find(p=>p.key===targetPortKey&&p.direction==='in'),sp=s.ports.find(p=>p.direction==='out'&&p.type===tp?.type&&p.key!=='produces');if(!tp||!sp)fail('R3_PORT','來源或目標端口類型不符');const e=makeEdge(g,{sourceNodeId,sourcePortId:sp.id,targetNodeId,targetPortId:tp.id,role,inputOrder},uid);if(e.resolution!=='resolved')fail('R3_SOURCE_NOT_READY','請使用已有明確固定版本的素材');if((e.binding.mediaRef?.mediaVersionId??e.binding.textVersionId)!==versionId)fail('R3_SOURCE_VERSION','來源固定版本已變，請重讀；不會改用最新版');return e;}
export function relationMutation(input,o,{uid}){
 const g=structuredClone(input),n=find(g,o.nodeId??o.targetNodeId),created=[];
 if(o.type==='frame.set'){
  exact(o,['type','nodeId','role','sourceNodeId','mediaVersionId']);if(n.kind!=='generate.video'||!['firstFrame','lastFrame'].includes(o.role)||o.sourceNodeId!==null&&n.payload.parameters.mode==='reference')fail('R3_FRAME','請選影片任務與明確首／尾幀用途');if(o.role==='lastFrame'&&o.sourceNodeId!==null&&n.payload.parameters.mode!=='first-last')fail('R3_VIDEO_MODE','設定尾幀前須明確選擇首尾幀模式');
  const old=g.edges.find(e=>e.target.nodeId===n.id&&e.role===o.role),index=old?g.edges.indexOf(old):-1;
  if(o.sourceNodeId===null){if(o.mediaVersionId!==null)fail('R3_FRAME','清除來源時版本也須為空');if(!old)return {graph:input,created:[],unchanged:true};g.edges.splice(index,1);}
  else{id(o.sourceNodeId);id(o.mediaVersionId);if(old)g.edges.splice(index,1);const e=boundEdge(g,{sourceNodeId:o.sourceNodeId,targetNodeId:n.id,targetPortKey:o.role,role:o.role,inputOrder:0,versionId:o.mediaVersionId},uid);if(old){e.id=old.id;if(canonical(e)===canonical(old))return {graph:input,created:[],unchanged:true};g.edges.splice(index,0,e);}else{g.edges.push(e);created.push(e.id);}}
 }else if(o.type==='relation.set'){
  upgradeReferencePort(n);
  exact(o,['type','edgeId','targetNodeId','targetPortKey','sourceNodeId','versionId','role','inputOrder']);if(!n.kind.startsWith('generate.')||!['prompt','reference'].includes(o.targetPortKey)||n.kind==='generate.video'&&o.targetPortKey==='reference'&&n.payload.parameters.mode!=='reference'||!RELATION_ROLES.includes(o.role))fail('R3_RELATION','請指定任務、引用端口及實際用途');
  const old=o.edgeId===null?null:g.edges.find(e=>e.id===o.edgeId);if(o.edgeId!==null&&(!old||old.target.nodeId!==n.id||old.relation!=='input'))fail('R3_RELATION_MISSING','原引用已變更，請重讀');const index=old?g.edges.indexOf(old):-1;if(old)g.edges.splice(index,1);
  const e=old&&n.ports.find(p=>p.id===old.target.portId)?.key===o.targetPortKey&&old.source.nodeId===o.sourceNodeId&&(old.binding.mediaRef?.mediaVersionId??old.binding.textVersionId)===o.versionId?{...structuredClone(old),role:o.role,inputOrder:o.inputOrder}:boundEdge(g,{...o},uid);if(old){e.id=old.id;if(canonical(e)===canonical(old))return {graph:input,created:[],unchanged:true};g.edges.splice(index,0,e);}else{g.edges.push(e);created.push(e.id);}
 }else if(o.type==='relation.remove'){
  exact(o,['type','edgeId','targetNodeId']);id(o.edgeId);
  const edge=g.edges.find(e=>e.id===o.edgeId),index=g.edges.indexOf(edge);
  if(edge&&(edge.target.nodeId!==n.id||edge.relation!=='input'))fail('R3_RELATION_MISSING','引用不屬於此任務');
  const stale=n.dependencyIssues.some(i=>i.formerEdgeId===o.edgeId&&i.reason==='来源或连线已明确删除');
  if(edge&&stale)fail('R3_RELATION_AMBIGUOUS','有效連線與歷史斷開記錄衝突，未移除任何內容');
  if(!edge&&!stale)fail('R3_RELATION_MISSING','引用已不存在或不屬於此任務');
  if(edge){g.edges.splice(index,1);const selection=n.payload.videoInputSelection;if(selection&&edge.binding.mediaRef&&!g.edges.some(e=>e.relation==='input'&&e.target.nodeId===n.id&&e.source.nodeId===edge.source.nodeId&&e.binding.mediaRef?.mediaVersionId===edge.binding.mediaRef.mediaVersionId))n.payload.videoInputSelection={...selection,selections:selection.selections.filter(p=>!(p.assetNodeId===edge.source.nodeId&&p.mediaVersionId===edge.binding.mediaRef.mediaVersionId)).map((p,i)=>({...p,sequenceIndex:i}))};}
  n.dependencyIssues=n.dependencyIssues.filter(i=>!(i.formerEdgeId===o.edgeId&&i.reason==='来源或连线已明确删除'));
 }else if(o.type==='asset.use'){
  exact(o,['type','nodeId','sourceNodeId','mediaVersionId']);if(!n.kind.startsWith('asset.'))fail('R3_ASSET','請選已有素材節點');const ref=sourceFor(g,o.sourceNodeId),m=mediaRecord(g,ref);if(ref.mediaVersionId!==o.mediaVersionId)fail('R3_SOURCE_VERSION','指定來源版本已變，請重讀');if(ref.kind==='result'&&!g.results[ref.resultId]?.acceptance)fail('RESULT_NOT_ACCEPTED','請先接受來源結果');if(n.kind!=='asset.'+m.type)fail('MEDIA_TYPE','只能換用相同媒體類型');const current=mediaRecord(g,{kind:'asset',...n.payload});if(n.payload.mediaVersionId===ref.mediaVersionId)return {graph:input,created:[],unchanged:true};const version=uid('media'),metadata=structuredClone(m);delete metadata.resultId;metadata.assetId=n.payload.assetId;g.mediaVersions[version]=metadata;n.payload.mediaVersionId=version;n.contentRevision++;g.revision++;validateGraph(g);return {graph:g,created:[version]};
 }else fail('R3_OPERATION','不支援的素材／關係命令');
 n.contentRevision++;g.topologyRevision++;g.revision++;validateGraph(g);return {graph:g,created};
}

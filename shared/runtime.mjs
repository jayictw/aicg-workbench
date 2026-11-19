import {validateMergeTasks} from './task-video-order.mjs';
import {supportsImageModel,supportsImageSize} from './byteplus-image-models.mjs';
import {nameKey} from './canvas-names.mjs';
import {validateComposition} from './composition.mjs';
import {validateEdit} from './edit-runtime.mjs';
// Closed C2 execution contract; no provider, credentials or network capability.
import {exact,id,str,fail,textRecord,mediaRecord,validateGraph} from './core.mjs';
export const PROMPT_MODES=['inline','external','external-then-inline','inline-then-external'];
export function canonical(v){if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';return JSON.stringify(v);}
export function validateC2(g){
 exact(g.numbering,['next','reserved']);exact(g.numbering.next,Object.keys(g.numbering.next));exact(g.numbering.reserved,Object.keys(g.numbering.reserved));const codes=new Set();for(const [code,nodeId]of Object.entries(g.numbering.reserved)){if(!/^(场景|分镜|文字|素材|输出|成片|圖片任務)\d{2,5}$/.test(code))fail('CODE_SCHEMA','编号格式不支持');id(nodeId);const prefix=code.replace(/\d+$/,''),num=Number(code.match(/\d+$/)[0]);if(!Number.isInteger(g.numbering.next[prefix])||g.numbering.next[prefix]<=num)fail('CODE_COUNTER','编号计数不能倒退');}for(const n of g.nodes){if(!n.humanCode||codes.has(n.humanCode)||g.numbering.reserved[n.humanCode]!==n.id)fail('CODE_CONFLICT','节点编号缺失、重复或归属不符');codes.add(n.humanCode);}
 for(const key of ['runs','results','reviews','operations'])exact(g[key],Object.keys(g[key]));
 if(g.migrationVersion!==1||!Array.isArray(g.reviewHistory)||!Array.isArray(g.audit))fail('HISTORY_LIMIT','历史结构不符合 C2 合同');
 for(const [key,r] of Object.entries(g.runs)){
  id(key);exact(r,['id','projectId','graphId','nodeId','nodeContentRevision','startGraphRevision','mode','snapshot','snapshotHash','inputFingerprint','state','submissionId','commandId','events','resultIds','createdAt']);
  if(r.id!==key||r.projectId!==g.projectId||r.graphId!==g.graphId||!['mock','adapter-offline','adapter-live','video-offline','video-live','byteplus-image','byteplus-video'].includes(r.mode)||!['running','succeeded','failed','cancelled','submissionUnknown'].includes(r.state)||!Array.isArray(r.events)||!Array.isArray(r.resultIds))fail('RUN_SCHEMA','运行身份或状态不符');
  id(r.nodeId);id(r.submissionId);id(r.commandId);if(!/^[a-f0-9]{64}$/.test(r.inputFingerprint)||!/^[a-f0-9]{64}$/.test(r.snapshotHash))fail('SNAPSHOT_HASH','运行摘要无效');
  exact(r.snapshot,['node','projectId','graphId','startGraphRevision','effective','parameters','capability','scope','command']);
  if(r.snapshot.projectId!==g.projectId||r.snapshot.graphId!==g.graphId||r.snapshot.node.id!==r.nodeId||r.snapshot.command.commandId!==r.commandId)fail('SNAPSHOT_OWNER','快照归属不符');
  for(const t of r.snapshot.effective.texts){const v=g.textVersions[t.textVersionId];if(!v||v.sourceNodeId!==t.sourceNodeId||v.sourceContentRevision!==t.sourceContentRevision||v.text!==t.text||v.utf8Sha256!==t.utf8Sha256)fail('TEXT_VERSION_MISSING','运行快照的固定文字缺失或不符');}
  for(const m of r.snapshot.effective.media){const v=mediaRecord(g,m.mediaRef);if(v.sha256!==m.sha256||v.type!==m.type)fail('MEDIA_REFERENCE_MISMATCH','快照媒体身份不符');}
  for(const e of r.snapshot.effective.dependencies){if(e.binding.textVersionId){const v=g.textVersions[e.binding.textVersionId];if(!v||v.sourceNodeId!==e.source.nodeId||v.sourceContentRevision!==e.binding.sourceContentRevision)fail('TEXT_VERSION_MISSING','快照依赖的固定文字缺失');}if(e.binding.mediaRef)mediaRecord(g,e.binding.mediaRef);}
  for(const rid of r.resultIds)if(g.results[rid]?.runId!==key)fail('RESULT_OWNER','运行结果归属不符');
  const events=new Set();for(const e of r.events){exact(e,['eventId','state','at','ignored','reason']);id(e.eventId);if(events.has(e.eventId))fail('EVENT_DUPLICATE','运行事件重复');events.add(e.eventId);}
 }
 for(const [key,r]of Object.entries(g.results)){
  exact(r,['id','runId','producerNodeId','mediaVersionId','mode','mediaStatus','viewedAt','acceptance','createdAt']);
  if(r.id!==key||!['mock','adapter-offline','adapter-live','video-offline','video-live','byteplus-image','byteplus-video'].includes(r.mode)||!g.runs[r.runId]||g.runs[r.runId].nodeId!==r.producerNodeId||!g.runs[r.runId].resultIds.includes(key)||!['pending','ready','missing','corrupt'].includes(r.mediaStatus))fail('RESULT_OWNER','结果归属或媒体状态不符');
  if(r.mediaVersionId){const m=mediaRecord(g,{kind:'result',resultId:r.id,mediaVersionId:r.mediaVersionId});if(m.type!==g.runs[r.runId].snapshot.node.kind.split('.')[1])fail('RESULT_TYPE_MISMATCH','结果媒体类型与生成框类型不符');}
  if(r.acceptance){exact(r.acceptance,['at','mediaVersionId','reviewContext','actor']);if(!r.viewedAt||r.mediaStatus!=='ready'||r.acceptance.mediaVersionId!==r.mediaVersionId)fail('RESULT_NOT_READY','不可接受未查看或不可打开的媒体');}
 }
 for(const [nodeId,rs]of Object.entries(g.reviews)){id(nodeId);if(!Array.isArray(rs))fail('REVIEW_SCHEMA','依赖提示格式无效');for(const r of rs){exact(r,['id','sourceId','oldVersion','newVersion','kind','viaEdgeIds','changeRevision']);id(r.id);id(r.sourceId);if(!Array.isArray(r.viaEdgeIds))fail('REVIEW_SCHEMA','依赖路径无效');}}
 for(const [key,o]of Object.entries(g.operations)){id(key);exact(o,['receipt','patch','type','undoTarget']);if(o.receipt.commandId!==key)fail('OPERATION_OWNER','命令回执归属不符');if(!Array.isArray(o.patch))fail('UNDO_SCHEMA','撤销记录无效');for(const p of o.patch){exact(p,['key','id','before','after']);if(!['nodes','edges','sequence'].includes(p.key))fail('UNDO_SCHEMA','撤销集合不支持');for(const v of [p.before,p.after]){if(!v)continue;if(p.key==='nodes'){if(v.kind==='compose.video')validateComposition(g,v,{history:true});for(const tid of [v.payload.currentTextVersionId,v.payload.inlineTextVersionId].filter(Boolean))textRecord(g,v,tid);if(v.payload.mediaVersionId)mediaRecord(g,{kind:'asset',assetId:v.payload.assetId,mediaVersionId:v.payload.mediaVersionId});for(const rid of [v.payload.previewResultId,v.payload.selectedResultId].filter(Boolean))if(g.results[rid]?.producerNodeId!==v.id)fail('RESULT_OWNER','撤销历史结果归属缺失');}if(p.key==='edges'){if(v.binding.textVersionId){const t=g.textVersions[v.binding.textVersionId];if(!t||t.sourceNodeId!==v.source.nodeId)fail('TEXT_VERSION_MISSING','撤销历史固定文字缺失');}if(v.binding.mediaRef)mediaRecord(g,v.binding.mediaRef);}if(p.key==='sequence'){validateMergeTasks(g,v.mergeTasks);for(const item of v.items)mediaRecord(g,item.mediaRef);validateEdit(g,v.edit,{history:true});}}}}
}
export function effectiveInput(g,n){
 const incoming=g.edges.filter(e=>e.target.nodeId===n.id&&e.relation==='input').sort((a,b)=>a.inputOrder-b.inputOrder||a.id.localeCompare(b.id));
 const ext=incoming.filter(e=>e.binding.portType==='text'),texts=[],media=[],errors=[];
 const take=(tid,sourceNodeId,origin)=>{const v=g.textVersions[tid];if(!v||v.sourceNodeId!==sourceNodeId)fail('TEXT_VERSION_MISSING','有效提示词版本缺失，不会回落最新');const t={textVersionId:tid,sourceNodeId,sourceContentRevision:v.sourceContentRevision,utf8Sha256:v.utf8Sha256,text:v.text,origin};texts.push(t);return v.text;};
 let inline='',external='';const mode=n.payload.promptMode;
 if(mode!=='external'&&n.payload.inlineTextVersionId)inline=take(n.payload.inlineTextVersionId,n.id,'inline');
 if(mode!=='inline'){if(ext.length)external=take(ext[0].binding.textVersionId,ext[0].source.nodeId,'external');else errors.push('所选策略需要外部文字连线');}
 const parts=mode==='inline'?[inline]:mode==='external'?[external]:mode==='external-then-inline'?[external,inline]:[inline,external];
 // Each source is used once. Identical complete texts are deliberately de-duplicated.
 const prompt=[...new Set(parts.filter(x=>x.length>0))].join('\n\n');
 const banks=[n.payload.videoInputSelection,n.payload.imageInputSelection,n.payload.providerInputSelection].filter(Boolean),kind=n.payload.taskModel?.inputKind,ambiguous=!!n.payload.taskModel&&!kind&&banks.length>1;if(ambiguous)errors.push('TASK_MODEL_KIND_REQUIRED');const selection=ambiguous?{selections:[]}:kind==='provider'?n.payload.providerInputSelection:kind==='byteplus-video'?n.payload.videoInputSelection:kind==='byteplus-image'?n.payload.imageInputSelection:n.kind==='generate.video'?(n.payload.videoInputSelection??n.payload.providerInputSelection):n.kind==='generate.image'?(n.payload.imageInputSelection??n.payload.providerInputSelection):null;
 if(selection){for(const [i,pick]of selection.selections.entries()){const m=g.mediaVersions[pick.mediaVersionId];if(!m||m.sha256!==pick.contentSha256)fail('BP_MEDIA_VERSION_CHANGED','固定素材版本已變更');const mediaRef=m.assetId?{kind:'asset',assetId:m.assetId,mediaVersionId:pick.mediaVersionId}:{kind:'result',resultId:m.resultId,mediaVersionId:pick.mediaVersionId};mediaRecord(g,mediaRef);if(m.resultId&&!g.results[m.resultId]?.acceptance)errors.push('参考结果尚未接受');const edge=incoming.find(e=>e.source.nodeId===pick.assetNodeId&&e.binding.mediaRef?.mediaVersionId===pick.mediaVersionId),role=pick.role==='FIRST_FRAME'?'firstFrame':pick.role==='LAST_FRAME'?'lastFrame':(!pick.role||pick.role==='REFERENCE'||pick.role==='REFERENCE_IMAGE')?(edge&&['reference','product','character','scene','style','studio'].includes(edge.role)?edge.role:'reference'):pick.role==='REFERENCE_VIDEO'?'referenceVideo':'referenceAudio';media.push({edgeId:edge?.id??'typed-media-'+i,sourceNodeId:pick.assetNodeId,mediaRef,sha256:m.sha256,type:m.type,role,inputOrder:i});}}
 else { for(const e of incoming.filter(e=>e.binding.portType!=='text')){if(e.resolution!=='resolved'){errors.push('参考媒体尚未就绪：'+e.id);continue;}const m=mediaRecord(g,e.binding.mediaRef);if(e.binding.mediaRef.kind==='result'&&!g.results[e.binding.mediaRef.resultId].acceptance)errors.push('参考结果尚未接受');media.push({edgeId:e.id,sourceNodeId:e.source.nodeId,mediaRef:structuredClone(e.binding.mediaRef),sha256:m.sha256,type:m.type,role:e.role,inputOrder:e.inputOrder});}}
 if(!prompt.trim()&&!media.length)errors.push('请填写完整提示词，或连接可用参考媒体');
 return {prompt,promptMode:mode,texts,media,dependencies:incoming.filter(e=>!selection||e.binding.portType==='text'||selection.selections.some(p=>p.assetNodeId===e.source.nodeId&&p.mediaVersionId===e.binding.mediaRef?.mediaVersionId)).map(e=>structuredClone(e)),errors};
}
export function impact(g,sources,details,uid){
 const changed=[];
 for(const sourceId of sources){const queue=[{id:sourceId,path:[]}],seen=new Set([sourceId]);while(queue.length){const v=queue.shift();for(const e of g.edges.filter(e=>e.source.nodeId===v.id)){const consumer=g.nodes.find(n=>n.id===e.target.nodeId);if(e.binding.portType==='text'&&consumer?.kind.startsWith('generate.')&&consumer.payload.promptMode==='inline')continue;if(seen.has(e.target.nodeId))continue;seen.add(e.target.nodeId);const next={id:e.target.nodeId,path:[...v.path,e.id]};queue.push(next);const target=g.nodes.find(n=>n.id===next.id);if(!target)continue;if(details.onlyIfRun&&!Object.values(g.runs).some(r=>r.nodeId===target.id))continue;const r={id:uid('review'),sourceId,oldVersion:details.oldVersion??null,newVersion:details.newVersion??null,kind:details.kind??'upstream-new-version',viaEdgeIds:next.path,changeRevision:g.revision+1};(g.reviews[target.id]??=[]).push(r);changed.push(target.id);}}}
 return [...new Set(changed)];
}
export function nodeVersion(n){return !n?null:n.kind.startsWith('generate.')?String(n.contentRevision)+':'+(n.payload.selectedResultId??'empty'):n.payload.currentTextVersionId??n.payload.mediaVersionId??n.contentRevision;}
export function diffGraph(before,after){const patch=[];for(const key of ['nodes','edges']){const ids=new Set([...before[key],...after[key]].map(x=>x.id));for(const id of ids){const a=before[key].find(x=>x.id===id)??null,b=after[key].find(x=>x.id===id)??null;if(canonical(a)!==canonical(b))patch.push({key,id,before:structuredClone(a),after:structuredClone(b)});}}if(canonical(before.sequence)!==canonical(after.sequence))patch.push({key:'sequence',id:before.sequence.id,before:structuredClone(before.sequence),after:structuredClone(after.sequence)});return patch;}
function currentAssetEdge(g,e){
 if(!e||e.relation!=='input'||e.binding.mediaRef?.kind!=='asset'||!g.nodes.some(n=>n.id===e.source.nodeId&&n.kind.startsWith('asset.'))||!g.nodes.some(n=>n.id===e.target.nodeId&&n.kind.startsWith('generate.')))return e;
 const copy=structuredClone(e);copy.binding.mediaRef.mediaVersionId='current-asset-version';return copy;
}
export function applyUndo(g,record){
 if(!record?.patch?.length||['run.start','byteplus.run','run.cancel','result.view','result.accept','result.select'].includes(record.type))fail('UNDO_UNSUPPORTED','此操作保留为运行事实，不能撤回；请选择图编辑命令');
 const materialIds=new Set(record.patch.filter(p=>p.key==='nodes'&&p.before?.kind.startsWith('asset.')&&p.after?.kind===p.before.kind&&p.after.payload.mediaVersionId!==p.before.payload.mediaVersionId).map(p=>p.id));
 // These edge changes were derived from the asset change, not independent user
 // edits. Recompute them for the consumers that still reference the asset now.
 const patches=record.patch.filter(p=>!(p.key==='edges'&&p.before&&p.after&&materialIds.has(p.before.source.nodeId)&&canonical(currentAssetEdge(g,p.before))===canonical(currentAssetEdge(g,p.after))));
 for(const p of patches){const current=p.key==='sequence'?g.sequence:g[p.key].find(x=>x.id===p.id)??null,comparable=v=>p.key==='sequence'?{...v,revision:0}:p.key==='edges'?currentAssetEdge(g,v):v;if(canonical(comparable(current))!==canonical(comparable(p.after)))fail('UNDO_CONFLICT','目标字段后来已修改；撤销被整笔拒绝，后来的内容保留');}
 const affected=new Set(record.patch.filter(p=>p.key==='nodes').map(p=>p.id)),remaining=g.nodes.filter(n=>!affected.has(n.id));for(const p of record.patch){if(p.key!=='nodes'||!p.before)continue;if(p.after&&p.before.label===p.after.label&&p.before.humanCode===p.after.humanCode)continue;const wanted=[p.before.label,p.before.humanCode].filter(Boolean).map(nameKey);if(remaining.some(n=>[n.label,n.humanCode].filter(Boolean).some(v=>wanted.includes(nameKey(v)))))fail('UNDO_CONFLICT','要恢復的節點名稱或編號已被其他框使用；整筆撤銷／重做被拒絕，現有內容保留');}
 for(const p of patches){if(p.key==='sequence')g.sequence={...structuredClone(p.before),revision:g.sequence.revision+1};else {g[p.key]=g[p.key].filter(x=>x.id!==p.id);if(p.before)g[p.key].push(structuredClone(p.before));}}
 // Undoing a task rebind restores its source identity and that source's current
 // input version, while retaining immutable versions in old execution records.
 for(const p of patches.filter(p=>p.key==='edges'&&p.before)){const edge=g.edges.find(e=>e.id===p.id),source=edge&&g.nodes.find(n=>n.id===edge.source.nodeId);if(edge&&currentAssetEdge(g,edge)!==edge)edge.binding.mediaRef={kind:'asset',assetId:source.payload.assetId,mediaVersionId:source.payload.mediaVersionId};}
 g.topologyRevision++;g.layoutRevision++;
}
export function c2Mutation(input,o,{uid,hash}){
 const g=structuredClone(input),node=id=>{const n=g.nodes.find(n=>n.id===id);if(!n)fail('REFERENCE_MISSING','节点不存在');return n;};let created=[];
 switch(o.type){
 case 'generation.configure':{
  exact(o,['type','nodeId','text','promptMode','model','size']);const n=node(o.nodeId);if(!n.kind.startsWith('generate.'))fail('NODE_KIND','请选择图片或视频生成框');str(o.text);if(!PROMPT_MODES.includes(o.promptMode))fail('PROMPT_MODE','请选择明确的提示词策略');
  if(o.model!==undefined){if(n.kind!=='generate.image'||!supportsImageModel(o.model))fail('IMAGE_CAPABILITY','只可選已支援的 BytePlus 圖片模型');if(o.model!==n.payload.parameters.model&&Object.values(g.runs).some(r=>r.nodeId===n.id&&['running','submissionUnknown'].includes(r.state)))fail('RUN_UNKNOWN_PENDING','先核對原圖片操作，執行中或結果未知時不能切換模型');}const modelChanged=o.model!==undefined&&o.model!==n.payload.parameters.model,sizeChanged=o.size!==undefined&&o.size!==n.payload.parameters.size;if(o.size!==undefined||modelChanged){if(n.kind!=='generate.image'||!supportsImageSize(o.model??n.payload.parameters.model,o.size??n.payload.parameters.size))fail('IMAGE_CAPABILITY','此模型不支援所選圖片尺寸；先明確選擇相容比例');if((modelChanged||sizeChanged)&&Object.values(g.runs).some(r=>r.nodeId===n.id&&['running','submissionUnknown'].includes(r.state)))fail('RUN_UNKNOWN_PENDING','原圖片操作未結，不能更改尺寸或模型');}
  if(n.payload.inlineTextVersionId&&g.textVersions[n.payload.inlineTextVersionId].text===o.text&&n.payload.promptMode===o.promptMode&&!modelChanged&&!sizeChanged)return {graph:input,created:[],unchanged:true};
  n.contentRevision++;const tid=uid('text');g.textVersions[tid]={sourceNodeId:n.id,sourceContentRevision:n.contentRevision,encoding:'utf-8',text:o.text,utf8Sha256:hash(o.text),byteLength:new TextEncoder().encode(o.text).length};n.payload.inlineTextVersionId=tid;n.payload.promptMode=o.promptMode;if(o.model!==undefined)n.payload.parameters.model=o.model;if(o.size!==undefined)n.payload.parameters.size=o.size;break;
 }
 case 'review.keep':{exact(o,['type','nodeId','reason']);const n=node(o.nodeId);str(o.reason,1000);if(!o.reason.trim())fail('REVIEW_REASON','请填写保留旧输入／结果的理由');g.reviewHistory.push({nodeId:n.id,reasons:structuredClone(g.reviews[n.id]??[]),dependencyIssues:structuredClone(n.dependencyIssues),reason:o.reason,at:new Date().toISOString(),revision:g.revision+1});g.reviews[n.id]=[];n.dependencyIssues=[];break;}
 case 'run.start':{
  exact(o,['type','nodeId','outcome']);const n=node(o.nodeId);if(!n.kind.startsWith('generate.'))fail('NODE_KIND','请选择一个生成框');if(!['success','failed','unknown','slow'].includes(o.outcome))fail('MOCK_OUTCOME','不支持此模拟情景');if((g.reviews[n.id]?.length??0)||n.dependencyIssues.length)fail('DEPENDENCY_REVIEW','请先复核依赖：明确保留旧版，或确认换用新版');
  const effective=effectiveInput(g,n);if(effective.errors.length)fail('RUN_BLOCKED',effective.errors.join('；'));const inputFingerprint=hash(canonical({prompt:effective.prompt,texts:effective.texts,media:effective.media,parameters:n.payload.parameters,capability:'local-sample/1'}));if(Object.values(g.runs).some(r=>r.nodeId===n.id&&r.state==='running'&&r.inputFingerprint===inputFingerprint))fail('RUN_IN_PROGRESS','此节点相同输入的模拟仍在进行，请等待或停止原运行');const runId=uid('run');n.payload.latestRunId=runId;created=[runId];
  const snapshot={node:structuredClone(n),projectId:g.projectId,graphId:g.graphId,startGraphRevision:g.revision,effective,parameters:structuredClone(n.payload.parameters),capability:{id:'local-sample',version:1,mode:'mock',outcome:o.outcome},scope:{nodeIds:[n.id],automaticDownstream:false},command:{commandId:'pending',channel:'gui',actor:'local-session-unverified'}};
  g.runs[runId]={id:runId,projectId:g.projectId,graphId:g.graphId,nodeId:n.id,nodeContentRevision:n.contentRevision,startGraphRevision:g.revision,mode:'mock',snapshot,snapshotHash:hash(canonical(snapshot)),inputFingerprint,state:'running',submissionId:uid('submission'),commandId:'pending',events:[],resultIds:[],createdAt:new Date().toISOString()};break;
 }
 case 'run.cancel':{exact(o,['type','runId']);const r=g.runs[o.runId];if(!r)fail('RUN_MISSING','运行不存在');if(r.state==='running'||r.state==='submissionUnknown'){r.state='cancelled';r.events.push({eventId:uid('event'),state:'cancelled',at:new Date().toISOString(),ignored:false,reason:'停止本地等待；不保證供應商取消或退款'});}break;}
 case 'result.view':case 'result.accept':case 'result.select':{
  exact(o,['type','nodeId','resultId']);const n=node(o.nodeId),r=g.results[o.resultId];if(!r||r.producerNodeId!==n.id)fail('RESULT_OWNER','结果不属于此节点');if(r.mediaStatus!=='ready'||!r.mediaVersionId)fail('RESULT_NOT_READY','媒体尚未就绪或缺失，不能查看／接受');
  if(o.type==='result.view'){r.viewedAt=new Date().toISOString();n.payload.previewResultId=r.id;}
  else {if(o.type==='result.accept'){if(!r.viewedAt)fail('RESULT_NOT_VIEWED','请先查看这个明确版本');r.acceptance??={at:new Date().toISOString(),mediaVersionId:r.mediaVersionId,reviewContext:structuredClone(g.reviews[n.id]??[]),actor:'local-session-unverified'};}if(!r.acceptance)fail('RESULT_NOT_ACCEPTED','请先接受这个版本');n.payload.selectedResultId=r.id;n.payload.previewResultId=r.id;for(const e of g.edges.filter(e=>e.source.nodeId===n.id&&e.resolution==='unresolved'&&e.binding.portType===n.kind.split('.')[1])){e.resolution='resolved';e.binding={mode:'pinned',portType:n.kind.split('.')[1],mediaRef:{kind:'result',resultId:r.id,mediaVersionId:r.mediaVersionId}};const target=g.nodes.find(x=>x.id===e.target.nodeId);if(target)target.contentRevision++;}}
  break;
 }
 case 'undo':{exact(o,['type','targetCommandId']);const record=g.operations[o.targetCommandId];applyUndo(g,record);break;}
 default:fail('OPERATION','C2 不支持此操作');
 }
 g.revision++;return {graph:g,created};
}

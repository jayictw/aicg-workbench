import {DEFAULT_IMAGE_MODEL} from './byteplus-image-models.mjs';
import {exact,fail,canonical,effectiveInput} from './core.mjs';
import {imageRequestPlan} from './image-route.mjs';
import {videoRequestPlan} from './video-route.mjs';
export const IMAGE_MODEL=DEFAULT_IMAGE_MODEL;
export function byteplusPlan(g,n){
 if(!n||!['generate.image','generate.video'].includes(n.kind))fail('GENERATION_TARGET','請選擇圖片或影片任務');
 const effective=effectiveInput(g,n);if(effective.errors.length)fail('GENERATION_INPUT',effective.errors.join('；'));
 const plan=n.kind==='generate.image'?imageRequestPlan(g,n,effective):videoRequestPlan(g,n,effective);
 if(plan.provider!=='byteplus-modelark')fail('BYTEPLUS_MODEL','此正式入口只支援BytePlus模型，舊區域模型不會自動換用');
 return {effective,plan};
}
export function byteplusMutation(input,o,{uid,hash}){
 exact(o,['type','nodeId','operationId','environment',...(o.contractSnapshot?['contractSnapshot']:[])]);if(o.type!=='byteplus.run'||!['provider','engineering-fake'].includes(o.environment))fail('BYTEPLUS_OPERATION','本期任務合同不符');
 const g=structuredClone(input),n=g.nodes.find(n=>n.id===o.nodeId);if(!n)fail('REFERENCE_MISSING','目標不存在');
 if((g.reviews[n.id]?.length??0)||n.dependencyIssues.length)fail('DEPENDENCY_REVIEW','先核對變更來源與固定版本');
 if(Object.values(g.runs).some(r=>r.nodeId===n.id&&['running','submissionUnknown'].includes(r.state)))fail('RUN_IN_PROGRESS','原操作未結，不會重新提交');
 const newer=o.contractSnapshot,formal=[3,4].includes(newer?.version);if(newer&&((formal?(newer.execution!=='byteplus-contract/'+newer.version||newer.environment!==o.environment||!['native-byteplus-https','injected-offline'].includes(newer.transportKind)):o.environment!=='engineering-fake')||newer.owner.nodeId!==n.id||newer.owner.contentRevision!==n.contentRevision||newer.owner.graphRevision!==input.revision))fail('BP_RUN_BINDING','Original B7 confirmation binding invalid');const {effective,plan}=newer?{effective:effectiveInput(g,n),plan:{provider:'byteplus-modelark',region:newer.route.region,model:newer.route.canonicalModelId}}:byteplusPlan(g,n),mode=n.kind==='generate.image'?'byteplus-image':'byteplus-video',runId=newer?'run-b7-'+hash(o.operationId).slice(0,32):uid('run');
 const snapshot={node:structuredClone(n),projectId:g.projectId,graphId:g.graphId,startGraphRevision:g.revision,effective,parameters:structuredClone(newer?n.payload.parameters:n.kind==='generate.video'?plan.parameters:n.payload.parameters),capability:{id:newer?(formal?'byteplus-workbench/generation/'+newer.version:'byteplus-workbench/generation/2'):'byteplus-workbench/generation/1',version:newer?(formal?newer.version:2):1,mode,outcome:'success',plan,operationId:o.operationId,environment:o.environment,...(newer?{contractSnapshot:structuredClone(newer)}:{})},scope:{nodeIds:[n.id],automaticDownstream:false},command:{commandId:'pending',channel:'native-paid-confirmation',actor:'owner-native-click'}};
 g.runs[runId]={id:runId,projectId:g.projectId,graphId:g.graphId,nodeId:n.id,nodeContentRevision:n.contentRevision,startGraphRevision:g.revision,mode,snapshot,snapshotHash:hash(canonical(snapshot)),inputFingerprint:hash(canonical(plan)),state:'running',submissionId:newer?'submission-b7-'+hash(o.operationId).slice(0,32):uid('submission'),commandId:'pending',events:[],resultIds:[],createdAt:new Date().toISOString()};n.payload.latestRunId=runId;g.revision++;return {graph:g,created:[runId]};
}

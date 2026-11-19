import {exact,id,fail} from './core.mjs';
// Selection stores task identity/order only. Result identity is resolved afresh.
export function validateMergeTasks(g,value){
 if(value===undefined)return;
 exact(value,['version','taskNodeIds']);if(value.version!==1||!Array.isArray(value.taskNodeIds)||new Set(value.taskNodeIds).size!==value.taskNodeIds.length)fail('MERGE_TASKS','影片勾選順序格式或版本無效');
 for(const taskId of value.taskNodeIds){id(taskId);const n=g.nodes.find(n=>n.id===taskId);if(n?n.kind!=='generate.video':!g.tombstones.some(t=>t.nodeId===taskId))fail('MERGE_TASKS','順序只接受影片任務；失效項須明確排除');}
}
export function mergeTaskIds(g){return [...(g.sequence.mergeTasks?.taskNodeIds??[])];}
export function currentTaskVideo(g,taskId){
 const n=g.nodes.find(n=>n.id===taskId),base={taskNodeId:taskId,label:n?.label??'已移除的影片任務',humanCode:n?.humanCode??'',status:'no-result',reason:'尚無成功影片；不會代用其他任務或歷史檔案'};
 const issue=(status,reason)=>({...base,status,reason});
 if(!n)return issue('deleted','任務已移除；請明確排除這一項');
 if(n.kind!=='generate.video')return issue('invalid','此身份不是影片任務');
 const run=g.runs[n.payload.latestRunId];
 if(!run)return n.payload.latestRunId?issue('invalid','目前任務的執行記錄缺失'):base;
 if(run.nodeId!==n.id||run.projectId!==g.projectId||run.graphId!==g.graphId)return issue('invalid','目前執行記錄歸屬不符');
 if(run.state==='running')return issue('waiting','正在生成／下載；請等待本次結果，不會默用舊 V1');
 if(run.state==='submissionUnknown')return issue('unknown','本次提交狀態未知；只查原任務，不會默用舊 V1');
 if(['failed','cancelled'].includes(run.state))return issue(run.state,'本次'+(run.state==='failed'?'失敗':'已停止')+'；舊結果保留。可明確排除；使用舊版須另行明確決定');
 if(run.state!=='succeeded')return issue('invalid','目前執行狀態無法確認');
 const results=run.resultIds.map(rid=>g.results[rid]).filter(r=>r&&r.producerNodeId===n.id&&r.runId===run.id);
 if(results.length!==1)return issue('invalid','目前成功執行的影片結果缺失或不唯一');
 const r=results[0],m=g.mediaVersions[r.mediaVersionId];
 if(r.mediaStatus!=='ready')return issue(r.mediaStatus==='corrupt'?'corrupt':'missing','目前結果未完整保存或媒體已失效；請重新驗證或明確排除');
 if(!m||m.resultId!==r.id||m.type!=='video'||!Number.isSafeInteger(m.size)||m.size<=0||!(/^[a-f0-9]{64}$/).test(m.sha256))return issue('invalid','目前結果的媒體身份或完整性資料無效');
 return {...base,status:'ready',reason:'目前成功結果 · 本地原片',resultId:r.id,mediaVersionId:r.mediaVersionId,runId:run.id};
}
export function taskVideoRows(g){const chosen=mergeTaskIds(g),ids=[...chosen,...g.nodes.filter(n=>n.kind==='generate.video'&&!chosen.includes(n.id)).map(n=>n.id)];return ids.map(taskId=>({...currentTaskVideo(g,taskId),checked:chosen.includes(taskId),number:chosen.includes(taskId)?chosen.indexOf(taskId)+1:null}));}

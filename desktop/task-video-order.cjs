 'use strict';
const {error}=require('./media.cjs'),{ResultFiles}=require('./result-files.cjs');
class TaskVideoOrder{
 constructor(getService){this.getService=getService;this.files=new ResultFiles(getService,{showItem:()=>{throw Error('READ_ONLY_ORDER');}});}
 check(req,s){const current=this.getService();if(!s||s!==current||!s.graph)throw error('MERGE_SCOPE','目前工程已變更；請重新讀取');s.core.exact(req,['libraryId','copyId','projectId','graphId','expectedRevision']);const st=s.read();if(st.libraryId!==req.libraryId||st.copyId!==req.copyId||s.graph.projectId!==req.projectId||s.graph.graphId!==req.graphId||s.graph.revision!==req.expectedRevision||s.host.activeProjectId!==req.projectId)throw error('MERGE_SCOPE','工程身份或版本已變更；未採用舊清單');}
 async read(req){const s=this.getService();this.check(req,s);const {taskVideoRows}=await import('../shared/task-video-order.mjs');this.check(req,s);const rows=taskVideoRows(s.graph);
  for(const row of rows){if(row.status!=='ready')continue;try{await this.files.verified({projectId:req.projectId,graphId:req.graphId,expectedRevision:req.expectedRevision,nodeId:row.taskNodeId,resultId:row.resultId,mediaVersionId:row.mediaVersionId,confirmation:'trusted-result-file-click/1'});this.check(req,s);row.url='canvas://media/'+row.mediaVersionId;}catch(e){this.check(req,s);row.status='unavailable';row.reason='本地原片缺失、損毀或來源驗證未通過；恢復原檔後重新驗證，或明確排除';row.diagnosticCode=['MEDIA_MISSING','MEDIA_CORRUPT','RESULT_FILE_INTEGRITY','RESULT_FILE_PATH'].includes(e.code)?e.code:'RESULT_UNAVAILABLE';}}
  for(const row of rows){if(!['failed','cancelled'].includes(row.status))continue;row.historicalResults=Object.values(s.graph.results).filter(r=>r.producerNodeId===row.taskNodeId&&r.mediaStatus==='ready'&&s.graph.runs[r.runId]?.state==='succeeded'&&s.graph.mediaVersions[r.mediaVersionId]?.type==='video').map(r=>({resultId:r.id,mediaVersionId:r.mediaVersionId,createdAt:r.createdAt}));}this.check(req,s);return {scope:{...req},rows,strictMergeAvailable:!!s.host.strictMerge};
 }
}
module.exports={TaskVideoOrder};

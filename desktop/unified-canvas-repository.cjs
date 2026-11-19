const fs=require('node:fs'),fsp=require('node:fs/promises'),path=require('node:path'),{hash,error}=require('./media.cjs'),{content}=require('./unified-repository.cjs');
class CanvasRepository{
 constructor(host,projectId){this.host=host;this.projectId=projectId;this.root=path.join(host.root,'runtime',projectId);this.file=path.join(this.root,'NO-INDEPENDENT-PROJECT-SAVE');this.media=host.repo.media;this.staging=path.join(this.root,'staging');this.ops=path.join(this.root,'save-operations');}
 async init(){for(const p of [this.root,this.staging,this.ops])await fsp.mkdir(p,{recursive:true});}
 contentPath(m){return content(this.host.root,m.sha256);}
 async load(){const graph=this.host.data.business.canvasSection.graphs[this.projectId];if(!graph)return null;return {format:'canvas-c2-envelope-2',graph:structuredClone(graph),commit:this.host.graphCommit(this.projectId)};}
 async verify(g){const issues=[];for(const [id,m]of Object.entries(g.mediaVersions))try{const b=fs.readFileSync(this.contentPath(m));if(b.length!==m.size||hash(b)!==m.sha256)issues.push({mediaVersionId:id,code:'MEDIA_CORRUPT',message:'媒體原字節不符'});}catch{issues.push({mediaVersionId:id,code:'MEDIA_MISSING',message:'媒體缺失，原資料保留'});}return issues;}
 async save(graph,id){this.host.refresh();if(this.host.services.get(this.projectId).graph.revision!==graph.revision)throw error('REVISION_CONFLICT','保存前畫布已變更');return this.host.saveFromCanvas(this.projectId,id);}
 async querySave(id){const r=this.host.repo.receipt(id);if(r.status!=='committed')return r;if(r.scope!==this.projectId)throw error('SAVE_SCOPE','保存ID屬於另一項目發起的整庫操作');this.host.reconcileSavedReceipt(r);const capturedRevision=r.graphRevisions[this.projectId];if(capturedRevision===undefined)throw error('SAVE_SCOPE','保存不屬於此項目');return {...r,capturedRevision,libraryRevision:r.revision};}
}
module.exports={CanvasRepository};

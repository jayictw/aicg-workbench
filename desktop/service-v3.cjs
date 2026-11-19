const {CanvasService:Base,uid}=require('./service-v2.cjs');
const fs=require('node:fs/promises'),{inspect,hash,error}=require('./media.cjs');
class CanvasService extends Base {
 command(e){
  const ops=e?.operation?.type==='transaction.batch'?e.operation.operations:[e?.operation];
  if(ops?.some(o=>['asset.replace','asset.import'].includes(o?.type))&&!this.commandContext)throw error('IMPORT_REQUIRED','媒体换版必须经过受控暂存与原生确认');
  return super.command(e);
 }
 async applyProposal(envelope,stages,context,guard){
  this.requireWritable();if(this.importing)throw error('HOST_BUSY','导入正在进行');
  // Validate the entire graph before copying bytes. No partial business commit.
  guard();if(this.graph.revision!==envelope.expectedRevision)throw error('REVISION_CONFLICT','提案基准已过期，请重新读取并提出');
  this.verifyGraph(this.core.mutate(this.graph,envelope.operation,{uid:context.makeUid(),hash}).graph);
  this.importing=true;const copied=[];let committed=false;
  try{
   for(const s of stages){const meta=await inspect(s.temp);if(meta.sha256!==s.meta.sha256||meta.size!==s.meta.size)throw error('IMPORT_HASH','暂存素材已经变化');if(meta.type!=='text'){const dest=this.repo.contentPath(meta);try{await fs.copyFile(s.temp,dest,require('node:fs').constants.COPYFILE_EXCL);copied.push({dest,sha256:meta.sha256});}catch(e){if(e.code!=='EEXIST')throw e;}this.checkMediaBytes(meta);}}
   guard();if(this.graph.revision!==envelope.expectedRevision)throw error('REVISION_CONFLICT','核验期间图已变化');
   this.importing=false;this.commandContext=context;try{const result=this.command(envelope);committed=true;return result;}finally{this.commandContext=null;}
  }finally{if(!committed)for(const file of copied)if(!Object.values(this.graph.mediaVersions).some(m=>m.sha256===file.sha256))await fs.unlink(file.dest).catch(()=>{});this.importing=false;for(const event of this.pendingEvents.splice(0))this.receive(event);}
 }
}
module.exports={CanvasService,uid};

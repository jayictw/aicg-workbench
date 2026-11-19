'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {hash,error}=require('./media.cjs'),authority=require('./byteplus-result-authority.cjs');
const fail=code=>{throw error(code,'结果未发布；保留原提交及旧成果');};
class BytePlusResultStore{
 constructor(controller,backend){this.c=controller;this.s=controller.s;this.backend=backend;}
 guard(signal){this.s.requireWritable();if(signal?.aborted||this.c.closed)fail('BP_LOCAL_STOPPED');if(this.s.host.activeProjectId!==this.s.graph.projectId)fail('PROJECT_SCOPE');}
 directory(p){fs.mkdirSync(p,{recursive:true});const root=fs.realpathSync(this.s.repo.root),real=fs.realpathSync(p),rel=path.relative(root,real);if(rel.startsWith('..')||path.isAbsolute(rel))fail('BP_RESULT_PATH');for(let at=path.resolve(p);;at=path.dirname(at)){const st=fs.lstatSync(at);if(st.isSymbolicLink())fail('BP_RESULT_PATH');if(at===path.resolve(this.s.repo.root))break;if(path.dirname(at)===at)fail('BP_RESULT_PATH');}}
 point(name){this.backend.fileFault?.(name);}
 async commit(operationId,rows,{signal,operation='single',revalidate=()=>{}}={}){
  this.guard(signal);const a=this.c.journal.query(operationId);if(!a.b7Version||!Array.isArray(rows)||rows.length<(operation==='layer_decomposition'?2:1)||rows.length>(operation==='layer_decomposition'?17:1))fail('BP_RESULT_SET');
  if(operation==='layer_decomposition'&&rows.some((r,i)=>r.z_index!==i))fail('BP_RESULT_ORDER');
  const root=path.join(this.s.repo.root,'byteplus-result-sets');this.directory(root);const tmp=path.join(root,'.staging-'+crypto.randomUUID());fs.mkdirSync(tmp);let published;
  try{
   const members=[];
   for(let i=0;i<rows.length;i++){
    this.guard(signal);revalidate();const row=rows[i],bytes=Buffer.from(row.b64_json,'base64');if(!bytes.length||bytes.toString('base64')!==row.b64_json)fail('BP_RESULT_BYTES');
    const d=await this.backend.decode(bytes,{signal});this.guard(signal);if(d.fullyDecoded!==true||d.contentSha256!==hash(bytes)||d.byteSize!==bytes.length||d.mimeType!==row.mimeType||d.width!==row.width||d.height!==row.height||row.requireAlpha&&d.hasAlpha!==true)fail('BP_RESULT_DECODE');
    const ext={'image/png':'.png','image/jpeg':'.jpg','video/mp4':'.mp4','video/quicktime':'.mov'}[d.mimeType];if(!ext)fail('BP_RESULT_FORMAT');
    const metadata={type:d.mimeType.split('/')[0]==='image'?'image':'video',mime:d.mimeType,ext,size:bytes.length,sha256:d.contentSha256,width:d.width,height:d.height,codec:d.codec};
    if(metadata.type==='video')Object.assign(metadata,{durationMs:d.durationMs,fps:d.fps,pixelFormat:d.pixelFormat,audioCodec:d.audioCodec});
    const file=path.join(tmp,i+ext);this.point('open');const fd=fs.openSync(file,'wx');try{this.point('write');fs.writeFileSync(fd,bytes);this.point('fsync');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}if(hash(fs.readFileSync(file))!==metadata.sha256)fail('BP_RESULT_BYTES');
    members.push({index:i,resultId:'result-b7-'+hash(operationId+'|'+i).slice(0,32),mediaVersionId:'media-b7-'+hash(operationId+'|'+i).slice(0,32),metadata,proof:{fullyDecoded:true,contentSha256:d.contentSha256,byteSize:d.byteSize,mimeType:d.mimeType,hasAlpha:d.hasAlpha,codec:d.codec,...(metadata.type==='video'?{pixelFormat:d.pixelFormat,audioCodec:d.audioCodec}:{})},...(row.z_index===undefined?{}:{z_index:row.z_index}),...(row.bounding_box?{bounding_box:structuredClone(row.bounding_box)}:{}),...(row.sourceId?{sourceId:row.sourceId,sourceVersionId:row.sourceVersionId,sourceExpiresAtMs:row.sourceExpiresAtMs}:{})});
   }
   const set={version:1,operation,bodySha256:a.taskSnapshot.bodySha256,members};set.digest=authority.digestSet(set);this.guard(signal);revalidate();
   const folder=path.join(root,'set-'+set.digest);this.point('rename');if(fs.existsSync(folder)){for(const m of members){const at=path.join(folder,m.index+m.metadata.ext);if(!fs.existsSync(at)||hash(fs.readFileSync(at))!==m.metadata.sha256)fail('BP_RESULT_CONFLICT');}}else fs.renameSync(tmp,folder);published=folder;
   // All originals are validated before entering the immutable content store.
   // Existing content is never overwritten. A failed mirror may leave verified,
   // unreferenced bytes; graph publication is still one all-or-nothing event.
   this.directory(folder);for(const m of members){this.guard(signal);const target=this.s.repo.contentPath(m.metadata),source=path.join(folder,m.index+m.metadata.ext),st=fs.lstatSync(source);if(!st.isFile()||st.isSymbolicLink())fail('BP_RESULT_PATH');this.point('content');try{fs.linkSync(source,target);}catch(e){if(e.code!=='EEXIST')throw e;const existing=fs.lstatSync(target);if(!existing.isFile()||existing.isSymbolicLink())fail('BP_RESULT_PATH');}this.s.checkMediaBytes(m.metadata);}
   this.guard(signal);revalidate();this.point('before-journal');this.c.journal.change(operationId,{state:'succeeded',resultSet:set,localPhase:'content-ready'});this.point('after-journal');
   return await this.publish(operationId,{signal});
  }catch(e){if(e?.code?.startsWith('BP_')||e?.code==='BYTEPLUS_JOURNAL_FAILED')throw e;fail(['ENOSPC','EIO','EACCES'].includes(e?.code)?'BP_RESULT_IO':'BP_RESULT_LOCAL');}
  finally{if(fs.existsSync(tmp)){for(const n of fs.readdirSync(tmp)){const p=path.join(tmp,n);if(fs.lstatSync(p).isFile())fs.unlinkSync(p);}fs.rmdirSync(tmp);}void published;}
 }
 async publish(operationId,{signal}={}){
  this.guard(signal);const a=this.c.journal.query(operationId),set=authority.validSet(a.resultSet);
  for(const m of set.members){this.s.checkMediaBytes(m.metadata);const bytes=fs.readFileSync(this.s.repo.contentPath(m.metadata)),d=await this.backend.decode(bytes,{signal});if(d.contentSha256!==m.metadata.sha256||d.mimeType!==m.metadata.mime||d.fullyDecoded!==true)fail('BP_RESULT_DECODE');}
  this.guard(signal);this.c.b7.check(this.c.journal.query(operationId));const token=authority.markPrepared(this.s,operationId,set),event=authority.eventFor(this.s,operationId,token);this.point('before-receive');const receipt=require('./byteplus-project.cjs').receiveGeneration(this.s,event);this.point('after-receive');this.c.journal.change(operationId,{localPhase:'published',lastLocalStop:false});this.c.notify();return receipt;
 }
}
module.exports={BytePlusResultStore};

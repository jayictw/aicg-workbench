'use strict';
// This module has no write API, Repository, runtime-paths, profile or vault dependency.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {DatabaseSync,constants}=require('node:sqlite');
const {validateIdentity,verifyDatabase}=require('./library-identity.cjs');
const {impact}=require('./diagnostic-impact.cjs');
const {validateTree}=require('./save-validation.cjs');
const LIMITS=Object.freeze({db:512*1024*1024,dbImage:64*1024*1024,object:128*1024*1024,bytes:256*1024*1024,objects:4096,result:4*1024*1024,ms:60000});
const sides=['work.sqlite-wal','work.sqlite-shm','work.sqlite-journal'];
const err=code=>Object.assign(Error(code),{diagnosticCode:code});
function code(e,stage){
 if(e.diagnosticCode)return e.diagnosticCode;
 if(['EACCES','EPERM'].includes(e.code))return 'D_ACCESS_DENIED';
 if(['EBUSY','ETXTBSY'].includes(e.code)||/locked|busy/i.test(e.message))return 'D_BUSY';
 if(e.code==='ENOENT')return stage==='media'?'D_MEDIA_NOT_FOUND':'D_DATABASE_INVALID';
 if(e.code==='ENOTDIR'||e.code==='EISDIR')return 'D_TYPE_INVALID';
 if(/not a database|malformed|corrupt/i.test(e.message))return 'D_DATABASE_CORRUPT';
 return stage==='db'?'D_DATABASE_INVALID':'D_IO_ERROR';
}
function boundary(p){
 const absolute=path.resolve(p);let q=absolute;
 for(;;){try{if(fs.lstatSync(q).isSymbolicLink())throw err('D_PATH_REJECTED')}catch(e){if(e.code!=='ENOENT')throw e}const up=path.dirname(q);if(q===up)break;q=up}
 return absolute;
}
function target(root,dir){
 if(typeof dir!=='string'||dir.length>4096)throw err('D_PATH_REJECTED');
 root=path.resolve(root);dir=path.resolve(dir);const rel=path.relative(root,dir);
 if(!rel||rel==='..'||rel.startsWith('..'+path.sep)||path.isAbsolute(rel)||rel.split(path.sep).some(x=>/^(profiles?|security|\.application)$/i.test(x)))throw err('D_PATH_REJECTED');
 boundary(root);boundary(dir);
 if(!fs.statSync(dir).isDirectory()||fs.realpathSync.native(dir).toLowerCase()!==dir.toLowerCase())throw err('D_PATH_REJECTED');
 return dir;
}
function managed(dir,o){
 if(typeof o.sha!=='string'||!/^[a-f0-9]{64}$/.test(o.sha)||o.id!=='m-'+o.sha||o.rel!=='media/'+o.sha.slice(0,2)+'/'+o.sha+'.bin')throw err('D_REFERENCE_INVALID');
 return boundary(path.join(dir,o.rel));
}
function stat(p){
 boundary(p);
 try{const s=fs.lstatSync(p);if(!s.isFile()||s.nlink!==1)throw err('D_TYPE_INVALID');return {size:s.size,mtime:s.mtimeMs,ctime:s.ctimeMs,dev:s.dev,ino:s.ino}}
 catch(e){if(e.code==='ENOENT')return {missing:true};throw e}
}
function sideState(dir){
 return sides.map(n=>{const p=boundary(path.join(dir,n));try{fs.lstatSync(p);return n}catch(e){if(e.code==='ENOENT')return null;throw e}}).filter(Boolean);
}
const tick=()=>new Promise(r=>setImmediate(r));
async function hashFile(p,max,cancel=()=>{},hook=()=>{}){
 const a=stat(p);if(a.missing)return {missing:true};
 if(a.size>max)throw err('D_RESOURCE_LIMIT');
 const fd=fs.openSync(p,'r'),h=crypto.createHash('sha256'),buffer=Buffer.allocUnsafe(1024*1024);let bytes=0;
 try{
  const opened=fs.fstatSync(fd);
  if(!opened.isFile()||opened.nlink!==1||opened.ino!==a.ino||opened.dev!==a.dev)throw err('D_SNAPSHOT_CHANGED');
  for(;;){cancel();hook(p);const n=fs.readSync(fd,buffer,0,buffer.length,null);if(!n)break;bytes+=n;if(bytes>max)throw err('D_RESOURCE_LIMIT');h.update(buffer.subarray(0,n));await tick()}
 }finally{fs.closeSync(fd)}
 const b=stat(p);if(JSON.stringify(a)!==JSON.stringify(b)||bytes!==a.size)throw err('D_SNAPSHOT_CHANGED');
 return {...a,sha256:h.digest('hex')};
}
async function image(p,before,stop){
 const data=Buffer.allocUnsafe(before.size),fd=fs.openSync(p,'r');let offset=0;
 try{const st=fs.fstatSync(fd);if(st.size!==before.size||st.ino!==before.ino||st.dev!==before.dev)throw err('D_SNAPSHOT_CHANGED');
  while(offset<data.length){stop();const n=fs.readSync(fd,data,offset,Math.min(1048576,data.length-offset),null);if(!n)throw err('D_SNAPSHOT_CHANGED');offset+=n;await tick()}
  const extra=Buffer.alloc(1);if(fs.readSync(fd,extra,0,1,null)!==0)throw err('D_SNAPSHOT_CHANGED');
 }finally{fs.closeSync(fd)}
 if(crypto.createHash('sha256').update(data).digest('hex')!==before.sha256)throw err('D_SNAPSHOT_CHANGED');
 return data;
}
function memoryReader(bytes){
 if(bytes.length<100||!bytes.subarray(0,16).equals(Buffer.from('SQLite format 3\0')))throw err('D_DATABASE_CORRUPT');
 // Never normalize a WAL image or ignore its sidecars. No disk SQLite VFS is opened.
 if(bytes[18]===2||bytes[19]===2)throw err('D_BUSY');
 if(bytes[18]!==1||bytes[19]!==1)throw err('D_DATABASE_INVALID');
 const db=new DatabaseSync(':memory:',{readOnly:true,allowExtension:false});
 try{
  if(typeof db.deserialize!=='function'||typeof db.setAuthorizer!=='function')throw err('D_VERSION_UNSUPPORTED');
  db.deserialize(bytes); // Node documents this image as writable; enforce the restrictions below.
  db.exec('PRAGMA temp_store=MEMORY;PRAGMA query_only=ON');
  if(db.location('main')!==null||db.prepare('PRAGMA query_only').get().query_only!==1||db.prepare('PRAGMA temp_store').get().temp_store!==2)throw err('D_DATABASE_INVALID');
  db.setAuthorizer((action,a,b)=>{
   if(action===constants.SQLITE_SELECT||action===constants.SQLITE_READ)return constants.SQLITE_OK;
   if(action===constants.SQLITE_FUNCTION&&String(b||a).toLowerCase()==='count')return constants.SQLITE_OK;
   if(action===constants.SQLITE_PRAGMA&&a==='quick_check'&&(b===null||b===undefined))return constants.SQLITE_OK;
   if(action===constants.SQLITE_TRANSACTION&&a==='BEGIN')return constants.SQLITE_OK;
   return constants.SQLITE_DENY;
  });return db;
 }catch(e){db.close();throw e}
}
function smallJSON(p,max){const s=stat(p);if(s.missing)throw err('D_DATABASE_INVALID');if(s.size>max)throw err('D_RESOURCE_LIMIT');return require('./d1-json.cjs').parse(fs.readFileSync(p,'utf8'))}
async function scan(input,hooks={}){
 const started=Date.now(),cancelFlag=input.cancelBuffer?new Int32Array(input.cancelBuffer):null;
 const report={state:'running',overall:'unconfirmed',consistency:'unavailable',scope:'仅固定文件与已登记对象；非全目录审计；未检查媒体解码或来源防伪',identityVerified:false,checked:0,total:null,unchecked:null,issues:[],items:[],unknown:['历史引用未穷尽；没有当前引用不等于可删除','未证明检查期间没有外部writer；库整体状态未确认'],versions:{},observedFiles:0};
 const observations=new Map();let db,dir,stage='path',frozenObjects=[],proofId=null;
 function stop(){if(cancelFlag&&Atomics.load(cancelFlag,0))throw err('D_CANCELLED');if(Date.now()-started>LIMITS.ms)throw err('D_RESOURCE_LIMIT')}
 const issue=(c,more={})=>{if(report.issues.length<4096)report.issues.push({code:c,stage,...more})};
 async function observe(p,max,check=stop){const v=await hashFile(p,max,check,hooks.read||(()=>{}));observations.set(p,{value:v,max});return v}
 try{
  stop();dir=target(input.librariesRoot,input.dir);report.location=dir;
  if(sideState(dir).length)throw err('D_BUSY');
  stage='identity';
  const identityPath=path.join(dir,'library.json'),dbPath=path.join(dir,'work.sqlite');
  const identityHash=await observe(identityPath,4096);if(identityHash.missing)throw err('D_DATABASE_INVALID');
  let identity;
  try{identity=smallJSON(identityPath,4096);validateIdentity(identity,input.identityKind)}
  catch(e){if(/UNKNOWN_LIBRARY_SCHEMA/.test(e.message)||identity?.identityVersion!==undefined&&identity.identityVersion!==1)throw err('D_VERSION_UNSUPPORTED');throw e.diagnosticCode?e:err('D_IDENTITY_MISMATCH')}
  report.versions.container=identity.schemaVersion;report.versions.identity=identity.identityVersion??null;
  stage='db';const dbHash=await observe(dbPath,Math.min(LIMITS.db,LIMITS.dbImage));if(dbHash.missing)throw err('D_DATABASE_INVALID');
  if(sideState(dir).length)throw err('D_BUSY');
  const dbImage=await image(dbPath,dbHash,stop);if(sideState(dir).length)throw err('D_BUSY');db=memoryReader(dbImage);hooks.memoryReady?.(db);
  db.exec('BEGIN'); // read transaction; no writer lease or write PRAGMA
  if(db.prepare('PRAGMA quick_check').get().quick_check!=='ok')throw err('D_DATABASE_CORRUPT');
  for(const n of ['meta','revisions','objects','pose_meta','pose_records']){
   const t=db.prepare('SELECT type,sql FROM sqlite_schema WHERE name=?').get(n);
   if(!t||t.type!=='table'||/^CREATE VIRTUAL/i.test(t.sql||''))throw err('D_DATABASE_INVALID');
  }
  try{verifyDatabase(db,identity,input.identityKind)}catch{throw err('D_IDENTITY_MISMATCH')}
  const metas=db.prepare('SELECT id,schema,revision FROM meta LIMIT 2').all();
  if(metas.length!==1||metas[0].id!==identity.libraryId)throw err('D_IDENTITY_MISMATCH');
  const meta=metas[0];report.versions.meta=meta.schema;
  if(meta.schema!==1)throw err('D_VERSION_UNSUPPORTED');
  if(!Number.isSafeInteger(meta.revision)||meta.revision<1)throw err('D_DATABASE_INVALID');
  const ps=db.prepare('SELECT schema,revision FROM pose_meta LIMIT 2').all();
  if(ps.length!==1)throw err('D_DATABASE_INVALID');
  report.versions.pose=ps[0].schema;
  if(ps[0].schema!==1)throw err('D_VERSION_UNSUPPORTED');
  if(!Number.isSafeInteger(ps[0].revision)||ps[0].revision<0)throw err('D_DATABASE_INVALID');
  report.identityVerified=true;report.libraryId=identity.libraryId;report.revision=meta.revision;report.poseRevision=ps[0].revision;
  const n=db.prepare('SELECT count(*) AS n FROM objects').get().n;report.total=n;
  if(!Number.isSafeInteger(n)||n<0||n>LIMITS.objects)throw err('D_RESOURCE_LIMIT');
  const objects=db.prepare('SELECT id,sha,rel,mime,bytes FROM objects ORDER BY id LIMIT 4097').all();frozenObjects=objects;
  const row=db.prepare('SELECT CAST(payload AS BLOB) AS payload FROM revisions WHERE revision=?').get(meta.revision);
  if(!row||typeof row.payload!=='string')throw err('D_DATABASE_INVALID');
  if(Buffer.byteLength(row.payload)>LIMITS.db)throw err('D_RESOURCE_LIMIT');
  let dto;try{dto=require('./d1-json.cjs').parse(row.payload);validateTree(dto)}catch(e){throw err(/TREE_|REQUEST_SIZE/.test(e.message)?'D_RESOURCE_LIMIT':'D_DATABASE_INVALID')}
  report.versions.dto=dto.schemaVersion;
  if(![1,2,3,4,5].includes(dto.schemaVersion))throw err('D_VERSION_UNSUPPORTED');
  const poses=db.prepare('SELECT id,CAST(payload AS BLOB) AS payload FROM pose_records LIMIT 202').all();
  db.close();db=null;
  stop();
  const ix=impact(dto,poses,objects,identity.libraryId);
  report.unknown.push(...ix.unknown);report.omittedReferences=ix.omitted;proofId=dto.sourceEvidence;
  for(const i of ix.issues)issue(i.code,{mediaId:i.mediaId,where:i.where});
  if(proofId!=='m-'+input.proofSha||!objects.some(o=>o.id===proofId)){issue('D_REFERENCE_INVALID',{where:'应用来源证据'});report.unknown.push('应用来源证据缺失／不匹配，来源关系未验证')}
  let bytes=0;
  for(const o of objects){
   stop();stage='media';
   if(sideState(dir).length)throw err('D_BUSY');
   const refs=ix.refs.get(o.id)||[];
   const item={mediaId:/^m-[a-f0-9]{64}$/.test(o.id)?o.id:undefined,relative:undefined,expectedSize:Number.isSafeInteger(o.bytes)?o.bytes:null,expectedHash:typeof o.sha==='string'&&/^[a-f0-9]{64}$/.test(o.sha)?o.sha:undefined,mime:typeof o.mime==='string'?o.mime.slice(0,80):undefined,filename:ix.descriptors.get(o.id),references:refs,attribution:refs.length?'current':'unknown-history',operations:['严格开库及完整备份会校验此登记对象',...(refs.some(r=>r.poseId)?['姿势缩图载入']:[]),...(refs.some(r=>r.outputId)?['PNG下载／套回依赖此输出']:[])],isEvidence:o.id===proofId||refs.some(r=>/证据/.test(r.role||'')),code:'D_BYTES_MATCH'};
   try{
    if(!Number.isSafeInteger(o.bytes)||o.bytes<0||o.bytes>LIMITS.object||typeof o.mime!=='string')throw err('D_REFERENCE_INVALID');
    const p=managed(dir,o);item.relative=o.rel;
    if(bytes+o.bytes>LIMITS.bytes)throw err('D_RESOURCE_LIMIT');
    const got=await observe(p,LIMITS.object);bytes+=got.size||0;
    if(got.missing)item.code='D_MEDIA_NOT_FOUND';
    else{item.actualSize=got.size;item.actualHash=got.sha256;if(got.size!==o.bytes){item.code='D_MEDIA_SIZE_MISMATCH';item.hashMismatch=got.sha256!==o.sha}else if(got.sha256!==o.sha)item.code='D_MEDIA_HASH_MISMATCH'}
   }catch(e){const c=code(e,'media');if(['D_CANCELLED','D_RESOURCE_LIMIT','D_SNAPSHOT_CHANGED','D_BUSY'].includes(c))throw e;item.code=c}
   report.items.push(item);report.checked++;
   if(item.code!=='D_BYTES_MATCH'){issue(item.code,{mediaId:item.mediaId});if(item.isEvidence)report.unknown.push('证据对象不可用：来源内容及其关系无法验证')}
   if(Buffer.byteLength(JSON.stringify(report))>LIMITS.result)throw err('D_RESOURCE_LIMIT');
   hooks.progress?.({checked:report.checked,total:report.total});await tick();
  }
  report.state='finished';
 }catch(e){const c=code(e,stage);issue(c,{where:stage==='identity'?'library.json':stage==='db'?'work.sqlite':stage==='path'?'所选库路径／固定sidecar':'登记媒体检查'});report.state=c==='D_CANCELLED'?'cancelled':'stopped';report.unknown.push('未完成：'+c)}
 finally{
  try{db?.close()}catch{}
  if(dir){
   try{
    if(sideState(dir).length)throw err('D_BUSY');
    for(const [p,before]of observations){
     if(Date.now()-started>LIMITS.ms*2)throw err('D_RESOURCE_LIMIT');
     const after=await hashFile(p,before.max,()=>{},hooks.finalRead||(()=>{}));
     if(JSON.stringify(after)!==JSON.stringify(before.value))throw err('D_SNAPSHOT_CHANGED');
    }
    report.consistency=observations.size?'observed-unchanged':'unavailable';
   }catch(e){const c=code(e,'verify');issue(c);report.consistency=c==='D_SNAPSHOT_CHANGED'?'changed':'unavailable';report.state=report.state==='cancelled'?'cancelled':'stopped'}
  }
 }
 report.unchecked=report.total===null?null:Math.max(0,report.total-report.checked);
 report.observedFiles=observations.size;report.unknown=[...new Set(report.unknown)].slice(0,48);
 report.unknownReferenceCount=report.unknown.length?null:0;report.finishedAt=new Date().toISOString();
 // Even finished+unchanged is a bounded observation, never an exclusive snapshot or repair verdict.
 report.overall='unconfirmed';
 report.items.sort((a,b)=>Number(a.code==='D_BYTES_MATCH')-Number(b.code==='D_BYTES_MATCH')||String(a.mediaId||'').localeCompare(String(b.mediaId||'')));
 if(Buffer.byteLength(JSON.stringify(report))>LIMITS.result){
  if(report.state!=='cancelled')report.state='stopped';
  report.issues=[{code:'D_RESOURCE_LIMIT',stage:'report',where:'完整报告字节预算'},...report.issues.filter(i=>i.code!=='D_RESOURCE_LIMIT')];
  while(Buffer.byteLength(JSON.stringify(report))>LIMITS.result-1024){
   if(report.items.length){const keep=Math.floor(report.items.length/2);report.omittedResultObjects=(report.omittedResultObjects||0)+report.items.length-keep;report.items=report.items.slice(0,keep)}
   else if(report.issues.length>1){const keep=Math.max(1,Math.floor(report.issues.length/2));report.omittedIssueRecords=(report.omittedIssueRecords||0)+report.issues.length-keep;report.issues=report.issues.slice(0,keep)}
   else break;
  }
  report.unknown=[...report.unknown.slice(0,47),'报告预算不足：省略'+(report.omittedResultObjects||0)+'个对象、'+(report.omittedIssueRecords||0)+'条结构记录及部分原因；关联未穷尽。'];
 }
 const watched=[...observations].map(([file,x])=>({file,max:x.max,value:x.value}));
 return {report,watched,dir};
}
async function recheck(watched,dir){
 try{if(sideState(dir).length)return 'unavailable';for(const x of watched){const a=await hashFile(x.file,x.max);if(JSON.stringify(a)!==JSON.stringify(x.value))return 'changed'}return watched.length?'observed-unchanged':'unavailable'}catch{return 'unavailable'}
}
module.exports={scan,recheck,target,LIMITS,code,memoryReader};

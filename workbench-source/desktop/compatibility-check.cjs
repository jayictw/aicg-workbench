'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {DatabaseSync,constants}=require('node:sqlite');
const shape=require('./compatibility-shape.cjs'),{validateDto}=require('./diagnostic-schema.cjs');
const identityRules=require('./library-identity.cjs'),{boundary}=require('./runtime-paths.cjs');
const H=b=>crypto.createHash('sha256').update(b).digest('hex'),fail=c=>{throw Error(c)};
const tables={
 meta:'id TEXT PRIMARY KEY,schema INTEGER,revision INTEGER',
 revisions:'revision INTEGER PRIMARY KEY,payload TEXT NOT NULL,at INTEGER',
 objects:'id TEXT PRIMARY KEY,sha TEXT,rel TEXT,mime TEXT,bytes INTEGER',
 bindings:'id TEXT PRIMARY KEY,digest TEXT',
 operations:'id TEXT PRIMARY KEY,digest TEXT,revision INTEGER,at INTEGER',
 pose_meta:'schema INTEGER,revision INTEGER',
 pose_records:'id TEXT PRIMARY KEY,payload TEXT NOT NULL',
 pose_bindings:'id TEXT PRIMARY KEY,digest TEXT NOT NULL',
 pose_operations:'id TEXT PRIMARY KEY,digest TEXT NOT NULL,revision INTEGER NOT NULL,at INTEGER NOT NULL',
 library_identity:'payload TEXT NOT NULL'
};
const norm=s=>s.replace(/\s+/g,'').replace(/;$/,'').toLowerCase();
function structure(db,kind){
 const names=Object.keys(tables).filter(n=>kind===identityRules.FORMAL||n!=='library_identity');
 const expected=new Map(names.map(n=>[n,{type:'table',tbl_name:n,sql:'CREATE TABLE '+n+'('+tables[n]+')'}]));
 for(const n of ['meta','objects','bindings','operations','pose_records','pose_bindings','pose_operations'])expected.set('sqlite_autoindex_'+n+'_1',{type:'index',tbl_name:n,sql:null});
 const rows=db.prepare('SELECT type,name,tbl_name,sql FROM sqlite_schema').all();
 if(rows.length!==expected.size)fail('C_SQL_STRUCTURE_UNREVIEWED');
 for(const r of rows){const e=expected.get(r.name);if(!e||r.type!==e.type||r.tbl_name!==e.tbl_name||(e.sql===null?r.sql!==null:typeof r.sql!=='string'||norm(r.sql)!==norm(e.sql)))fail('C_SQL_STRUCTURE_UNREVIEWED')}
 for(const n of names){const cols=db.prepare('PRAGMA table_info('+n+')').all(),want=tables[n].split(',').map((def,cid)=>({cid,name:def.split(' ')[0],type:def.split(' ')[1],notnull:def.includes('NOT NULL')?1:0,dflt_value:null,pk:def.includes('PRIMARY KEY')?1:0}));if(cols.length!==want.length||cols.some((x,i)=>Object.entries(want[i]).some(([k,v])=>x[k]!==v)))fail('C_SQL_STRUCTURE_UNREVIEWED')}
 // Exact origin and columns; no sqlite_* prefix permission.
 for(const n of ['meta','objects','bindings','operations','pose_records','pose_bindings','pose_operations']){
  const ix=db.prepare('PRAGMA index_list('+n+')').all();if(ix.length!==1||ix[0].name!=='sqlite_autoindex_'+n+'_1'||ix[0].origin!=='pk'||ix[0].unique!==1||ix[0].partial!==0)fail('C_SQL_STRUCTURE_UNREVIEWED');
  const cols=db.prepare('PRAGMA index_info(sqlite_autoindex_'+n+'_1)').all();if(cols.length!==1||cols[0].name!=='id')fail('C_SQL_STRUCTURE_UNREVIEWED');
 }
}
function json(s){try{return require('./d1-json.cjs').parse(Buffer.from(s))}catch{fail('C_CONTENT_CORRUPT')}}
function identity(dir,kind){boundary(dir);const f=path.join(dir,'library.json');boundary(f);if(fs.statSync(f).size>4096)fail('C_STRUCTURE_INVALID');const b=fs.readFileSync(f),v=json(b);shape.ver(v?.schemaVersion,[1],'IDENTITY');if(kind===identityRules.FORMAL)shape.ver(v.identityVersion,[1],'IDENTITY_FORMAT');shape.keys(v,kind===identityRules.FORMAL?['libraryId','schemaVersion','kind','identityVersion','appId','name','createdAt','createdWith','storageContract']:['libraryId','schemaVersion','kind']);identityRules.validateIdentity(v,kind);const st=fs.statSync(f);return {value:v,hash:H(b),stat:{dev:st.dev,ino:st.ino,size:st.size,mtime:st.mtimeMs,ctime:st.ctimeMs}}}
function validateDb(db,id,{allowEmpty=false}={}){
 structure(db,id.kind);const metas=db.prepare('SELECT * FROM meta LIMIT 2').all();if(metas.length!==1)fail('C_STRUCTURE_INVALID');const m=metas[0];shape.ver(m.schema,[1],'DATABASE');
 if(m.id!==id.libraryId||!Number.isSafeInteger(m.revision)||m.revision<0)fail('C_IDENTITY_MISMATCH');
 identityRules.verifyDatabase(db,id,id.kind);
 const poses=db.prepare('SELECT * FROM pose_meta LIMIT 2').all();if(poses.length!==1)fail('C_STRUCTURE_INVALID');shape.ver(poses[0].schema,[1],'POSE');if(!Number.isSafeInteger(poses[0].revision)||poses[0].revision<0)fail('C_STRUCTURE_INVALID');
 if(db.prepare('PRAGMA quick_check').get().quick_check!=='ok')fail('C_DATABASE_CORRUPT');
 const objects=db.prepare('SELECT * FROM objects ORDER BY id').all(),byId=new Map();
 for(const o of objects){if(typeof o.sha!=='string'||!/^[a-f0-9]{64}$/.test(o.sha)||o.id!=='m-'+o.sha||o.rel!=='media/'+o.sha.slice(0,2)+'/'+o.sha+'.bin'||!Number.isSafeInteger(o.bytes)||o.bytes<0||o.bytes>128*1024*1024)fail('C_REFERENCE_INVALID');byId.set(o.id,o)}
 const pngChecks=[],d1Checks=[],poseRecords=[];let current=null,last=0,lastDto=0;const historyHash=crypto.createHash('sha256'),poseHash=crypto.createHash('sha256');
 for(const r of db.prepare('SELECT revision,CAST(payload AS BLOB) AS payload,at FROM revisions ORDER BY revision').iterate()){
  if(!Number.isSafeInteger(r.revision)||r.revision!==last+1||!Number.isSafeInteger(r.at))fail('C_STRUCTURE_INVALID');last=r.revision;
  historyHash.update(JSON.stringify(r));const dto=json(r.payload);shape.validateDTO(dto);if(dto.schemaVersion<lastDto||[4,5].includes(dto.schemaVersion)&&lastDto!==0&&lastDto!==dto.schemaVersion)fail('C_MIXED_DTO');lastDto=dto.schemaVersion;validateDto(dto);if(dto.schemaVersion===5)d1Checks.push({generated:dto.business.generated,tasks:dto.business.workspace.tasks,media:dto.media});
  for(const x of [...dto.business.stageDrafts||[],...dto.business.stageWork||[]])if(x.libraryId!==id.libraryId)fail('C_IDENTITY_MISMATCH');
  for(const work of dto.business.stageWork||[])if(work.result)pngChecks.push({id:work.result.blob.$png,width:work.result.width,height:work.result.height});for(const x of dto.media){const o=byId.get(x.id);if(!o||o.sha!==x.sha256||o.bytes!==x.size||o.mime!==x.mime)fail('C_REFERENCE_INVALID')}
  if(typeof dto.sourceEvidence!=='string'||!byId.has(dto.sourceEvidence))fail('C_SOURCE_EVIDENCE_INVALID');
  if(r.revision===m.revision)current=dto;
 }
 if(last!==m.revision||!current&&!(allowEmpty&&m.revision===0))fail('C_STRUCTURE_INVALID');
 for(const r of db.prepare('SELECT id,CAST(payload AS BLOB) AS payload FROM pose_records').iterate()){
  poseHash.update(JSON.stringify(r));const v=json(r.payload);if(v.id!==r.id)fail('C_REFERENCE_INVALID');shape.poseRecord(v);
  const {verifiedRecord}=require('./pose-schema.cjs');poseRecords.push(verifiedRecord({...v,thumbnail:{status:'pending'}}));
  if(v.thumbnail.status==='ready'){const p=v.thumbnail.media,o=byId.get(p.id);if(p.mime!=='image/png'||p.size<24||p.size>96*1024)fail('C_REFERENCE_INVALID');pngChecks.push({id:p.id,width:256,height:192});if(!o||o.sha!==p.sha256||o.bytes!==p.size||o.mime!==p.mime)fail('C_REFERENCE_INVALID')}
 }
 require('./pose-schema.cjs').validateAdditions([],poseRecords);
 for(const [table,version]of [['operations',m.revision],['pose_operations',poses[0].revision]])for(const r of db.prepare('SELECT * FROM '+table).iterate())if(!Number.isSafeInteger(r.revision)||r.revision<1||r.revision>version||!Number.isSafeInteger(r.at)||typeof r.digest!=='string'||!/^[a-f0-9]{64}$/.test(r.digest))fail('C_STRUCTURE_INVALID');
 const proof=require('../integration-build.json').sourceEvidence.sha256;
 if(current&&current.sourceEvidence!=='m-'+proof||poses[0].revision>0&&!byId.has('m-'+proof))fail('C_SOURCE_EVIDENCE_INVALID');
 return {pngChecks,d1Checks,stateStamp:H(Buffer.from(JSON.stringify([m,poses[0],historyHash.digest('hex'),poseHash.digest('hex'),objects]))),meta:m,poseRevision:poses[0].revision,objects,dto:current,versions:{identity:id.identityVersion??null,container:id.schemaVersion,database:m.schema,dto:current?.schemaVersion??null,pose:poses[0].schema,complete:null,source:current?'verified':'not-checked',embedded:current?'verified':'not-checked'},eligible:current?.schemaVersion===5};
}
function verifyD1(dir,checks){const cache=new Map();for(const check of checks||[])require('./d1-schema.cjs').generated(check.generated,{tasks:check.tasks,media:check.media,product:true,readBytes:id=>{if(!cache.has(id)){const h=id.slice(2),file=path.join(dir,'media',h.slice(0,2),h+'.bin');boundary(file);cache.set(id,fs.readFileSync(file))}return cache.get(id)}})}
function manifest(v,r){shape.ver(v?.schemaVersion,[1],'COMPLETE');shape.keys(v,['schemaVersion','libraryId','revision','poseRevision','dbHash','objects']);if(!Array.isArray(v.objects)||v.libraryId!==r.meta.id||v.revision!==r.meta.revision||v.poseRevision!==r.poseRevision||typeof v.dbHash!=='string'||JSON.stringify([...v.objects].sort((a,b)=>a.id.localeCompare(b.id)))!==JSON.stringify(r.objects))fail('C_BACKUP_MANIFEST_MISMATCH');r.versions.complete=1}
function sidecars(dir){for(const n of ['work.sqlite-wal','work.sqlite-shm','work.sqlite-journal'])if(fs.existsSync(path.join(dir,n)))fail('C_CHECK_INCOMPLETE_SIDECAR')}
function verifyObjects(dir,objects,pngChecks=[]){const stamp=[];const chunk=Buffer.allocUnsafe(1024*1024);for(const o of objects){const p=path.join(dir,o.rel);boundary(p);const fd=fs.openSync(p,'r');try{const before=fs.fstatSync(fd);if(!before.isFile()||before.size!==o.bytes)fail('C_MEDIA_SIZE_MISMATCH');const h=crypto.createHash('sha256'),text=o.mime==='text/plain; charset=utf-8'?new TextDecoder('utf-8',{fatal:true}):null;let n,total=0,header=null;while((n=fs.readSync(fd,chunk,0,chunk.length,null))>0){if(total===0)header=Buffer.from(chunk.subarray(0,Math.min(n,24)));total+=n;if(total>o.bytes)fail('C_CHECK_INCOMPLETE_CHANGED');h.update(chunk.subarray(0,n));if(text)try{text.decode(chunk.subarray(0,n),{stream:true})}catch{fail('C_CONTENT_CORRUPT')}}if(text)try{text.decode()}catch{fail('C_CONTENT_CORRUPT')}if(total!==o.bytes||h.digest('hex')!==o.sha)fail('C_MEDIA_HASH_MISMATCH');for(const wanted of pngChecks)if(wanted.id===o.id&&(!header||header.length<24||!header.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||header.readUInt32BE(16)!==wanted.width||header.readUInt32BE(20)!==wanted.height))fail('C_MEDIA_HEADER_MISMATCH');const after=fs.fstatSync(fd),now=fs.statSync(p);stamp.push([o.id,before.dev,before.ino,before.size,before.mtimeMs,before.ctimeMs]);if(after.ino!==before.ino||after.size!==before.size||after.mtimeMs!==before.mtimeMs||now.ino!==before.ino||now.ctimeMs!==before.ctimeMs)fail('C_CHECK_INCOMPLETE_CHANGED')}finally{fs.closeSync(fd)}}return H(Buffer.from(JSON.stringify(stamp)))}
function preflight(dir,kind,{allowEmpty=false}={}){
 sidecars(dir);const id=identity(dir,kind),f=path.join(dir,'work.sqlite');boundary(f);const st=fs.statSync(f);
 if(!st.isFile()||st.size>512*1024*1024)fail('C_RESOURCE_LIMIT');const fd=fs.openSync(f,'r'),header=Buffer.alloc(100);try{if(fs.readSync(fd,header,0,100,0)!==100||header.subarray(0,16).toString()!=='SQLite format 3\0')fail('C_DATABASE_CORRUPT')}finally{fs.closeSync(fd)}
 if(header[18]!==1||header[19]!==1)fail('C_CHECK_INCOMPLETE_SIDECAR');
 const bytes=fs.readFileSync(f);if(bytes.length!==st.size||bytes.length>512*1024*1024)fail('C_CHECK_INCOMPLETE_CHANGED');if(bytes[18]!==1||bytes[19]!==1)fail('C_CHECK_INCOMPLETE_SIDECAR');
 const before=H(bytes),db=new DatabaseSync(':memory:',{readOnly:true,allowExtension:false});
 try{db.deserialize(bytes);db.exec('PRAGMA query_only=ON;PRAGMA temp_store=MEMORY');if(db.location('main')!==null||db.prepare('PRAGMA query_only').get().query_only!==1||db.prepare('PRAGMA temp_store').get().temp_store!==2)fail('C_CHECK_INCOMPLETE');
 db.setAuthorizer((action,a,b)=>{if(action===constants.SQLITE_SELECT||action===constants.SQLITE_READ)return constants.SQLITE_OK;if(action===constants.SQLITE_PRAGMA&&['quick_check','index_list','index_info','table_info'].includes(a))return constants.SQLITE_OK;if(action===constants.SQLITE_TRANSACTION&&a==='BEGIN')return constants.SQLITE_OK;return constants.SQLITE_DENY})}catch(e){db.close();throw e}
 let r;
 try{db.exec('BEGIN');r=validateDb(db,id.value,{allowEmpty})}catch(e){if(/^C_/.test(e.message))throw e;if(/locked|busy/i.test(e.message))fail('C_CHECK_INCOMPLETE_BUSY');if(/no such table|no such column/i.test(e.message))fail('C_SQL_STRUCTURE_UNREVIEWED');if(/malformed|not a database|corrupt/i.test(e.message))fail('C_DATABASE_CORRUPT');throw e}finally{db.close()}
 const mediaStamp=verifyObjects(dir,r.objects,r.pngChecks);verifyD1(dir,r.d1Checks);sidecars(dir);if(H(fs.readFileSync(f))!==before||identity(dir,kind).hash!==id.hash)fail('C_CHECK_INCOMPLETE_CHANGED');
 const now=fs.statSync(f);if(st.ino!==now.ino||st.ctimeMs!==now.ctimeMs||JSON.stringify(identity(dir,kind).stat)!==JSON.stringify(id.stat))fail('C_CHECK_INCOMPLETE_CHANGED');return {...r,identityHash:id.hash,identityStat:id.stat,dbStat:{dev:st.dev,ino:st.ino,mtime:st.mtimeMs,ctime:st.ctimeMs,size:st.size},mediaStamp,dbHash:before};
}
function assertWritable(repo,{allowEmpty=false}={}){
 const id=identity(repo.dir,repo.identityKind);if(id.value.libraryId!==repo.identity.libraryId||repo.compatIdentityHash&&id.hash!==repo.compatIdentityHash)fail('C_IDENTITY_MISMATCH');
 const r=validateDb(repo.db,id.value,{allowEmpty});if(!r.eligible&&!(allowEmpty&&r.meta.revision===0))fail('C_LEGACY_REVIEW_REQUIRED');verifyObjects(repo.dir,r.objects,r.pngChecks);verifyD1(repo.dir,r.d1Checks);repo.compatibilityVersions=r.versions;return r;
}
module.exports={preflight,validateDb,assertWritable,manifest,structure};








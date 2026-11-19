'use strict';
// QA execution state only. Never a business DTO, credential store or retry engine.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {DatabaseSync}=require('node:sqlite');
const {boundary,inside}=require('./runtime-paths.cjs');
const {verifyPNG,MAX,MODEL}=require('./flash-png.cjs');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const fail=()=>{throw Error('FLASH_JOURNAL_UNAVAILABLE')};
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const exact=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const uuid=x=>typeof x==='string'&&/^[a-f0-9-]{36}$/.test(x);
const phases=['prepared','sending','received','verifying','verified','joined','submission-unknown'];
const uncertain=['sending','received','verifying','submission-unknown'];
const APP=0x464c5332;
class FlashJournal {
 constructor(profileRoot){this.profile=boundary(path.resolve(profileRoot));const runtime=require('./runtime-paths.cjs');const permitted=['automation','flash-qa'].some(mode=>inside(path.join(runtime.descriptor(mode).runtimeRoot,'profiles'),this.profile));if(!permitted)throw Error('FLASH_QA_PROFILE_REQUIRED');this.dir=path.join(this.profile,'flash-attempts.v1');this.file=path.join(this.dir,'attempts.sqlite');this.ownerFile=path.join(this.dir,'owner.json');this.candidates=path.join(this.dir,'candidates');this.error=null;
  try{this.open()}catch{this.error='FLASH_JOURNAL_UNAVAILABLE';try{this.db?.close()}catch{}this.db=null}
 }
 guard(){for(const f of [this.profile,this.dir,this.file,this.ownerFile,this.candidates])boundary(f);if(!inside(this.profile,this.file))fail();for(const f of [this.file,this.ownerFile])if(fs.existsSync(f)&&(!fs.statSync(f).isFile()||fs.statSync(f).nlink!==1))fail()}
 open(){this.guard();const owner={format:1,kind:'FLASH-QA-ATTEMPTS',profile:this.profile.toLowerCase()};
  if(!fs.existsSync(this.dir)){
   if(fs.existsSync(path.join(this.profile,'security','credentials.v1.bin')))fail();
   fs.mkdirSync(this.dir);fs.mkdirSync(this.candidates);this.write(this.ownerFile,Buffer.from(JSON.stringify(owner)));
   this.db=new DatabaseSync(this.file);this.db.exec(`PRAGMA application_id=${APP};PRAGMA user_version=1;PRAGMA synchronous=FULL;BEGIN IMMEDIATE;CREATE TABLE meta(owner TEXT NOT NULL,count INTEGER NOT NULL,digest TEXT NOT NULL);CREATE TABLE attempts(id TEXT PRIMARY KEY,confirmation TEXT UNIQUE NOT NULL,payload TEXT NOT NULL);`);
   this.db.prepare('INSERT INTO meta VALUES(?,?,?)').run(JSON.stringify(owner),0,hash('[]'));this.db.exec('COMMIT');
  }else{if(!fs.existsSync(this.file)||!fs.existsSync(this.ownerFile)||!fs.existsSync(this.candidates))fail();this.db=new DatabaseSync(this.file)}
  this.db.exec('PRAGMA synchronous=FULL;PRAGMA busy_timeout=0');this.check();
 }
 write(file,bytes){boundary(file);const fd=fs.openSync(file,'wx',0o600);try{fs.writeFileSync(fd,bytes);fs.fsyncSync(fd)}finally{fs.closeSync(fd)}}
 check(){if(this.error||!this.db)fail();this.guard();if(fs.statSync(this.file).size>2*1024*1024||fs.statSync(this.ownerFile).size>4096)fail();const owner={format:1,kind:'FLASH-QA-ATTEMPTS',profile:this.profile.toLowerCase()};if(!eq(JSON.parse(fs.readFileSync(this.ownerFile)),owner))fail();
  if(this.db.prepare('PRAGMA application_id').get().application_id!==APP||this.db.prepare('PRAGMA user_version').get().user_version!==1||this.db.prepare('PRAGMA quick_check').get().quick_check!=='ok')fail();
  if(!eq(this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map(x=>x.name),['attempts','meta']))fail();
  const ddl=this.db.prepare("SELECT name,sql FROM sqlite_master WHERE type='table' ORDER BY name").all();if(!eq(ddl.map(x=>x.sql),['CREATE TABLE attempts(id TEXT PRIMARY KEY,confirmation TEXT UNIQUE NOT NULL,payload TEXT NOT NULL)','CREATE TABLE meta(owner TEXT NOT NULL,count INTEGER NOT NULL,digest TEXT NOT NULL)']))fail();
  if(!eq(this.db.prepare('PRAGMA table_info(attempts)').all().map(x=>x.name),['id','confirmation','payload'])||!eq(this.db.prepare('PRAGMA table_info(meta)').all().map(x=>x.name),['owner','count','digest']))fail();
  const meta=this.db.prepare('SELECT * FROM meta').all(),raw=this.db.prepare('SELECT * FROM attempts ORDER BY id').all();
  if(meta.length!==1||meta[0].owner!==JSON.stringify(owner)||meta[0].count!==raw.length||raw.length>16||Buffer.byteLength(JSON.stringify(raw))>1048576||meta[0].digest!==hash(JSON.stringify(raw)))fail();
  if(new Set(raw.map(x=>x.id)).size!==raw.length||new Set(raw.map(x=>x.confirmation)).size!==raw.length)fail();
  const rows=raw.map(x=>{const a=JSON.parse(x.payload);this.validate(a);if(x.id!==a.id||x.confirmation!==a.confirmationId)fail();return a});
  let total=0;const entries=fs.readdirSync(this.candidates);if(entries.length>32)fail();for(const name of entries){if(!/^flash-offline-[a-f0-9-]{36}\.(png|pending)$/.test(name))fail();const f=path.join(this.candidates,name);boundary(f);const st=fs.statSync(f);if(!st.isFile()||st.nlink!==1||st.size>MAX)fail();total+=st.size}if(total>128*1024*1024)fail();
  for(const a of rows)if(a.candidate)this.readCandidate(a);return rows;
 }
 validate(a){if(!exact(a,['format','id','confirmationId','owner','session','epoch','viewId','snapshot','requestDigest','account','phase','code','cancelled','handed','candidate','save','createdAt','expiresAt','events'])||a.format!==1||!/^flash-offline-[a-f0-9-]{36}$/.test(a.id)||!uuid(a.confirmationId)||!uuid(a.session)||!Number.isSafeInteger(a.epoch)||a.epoch<1||typeof a.viewId!=='string'||a.viewId.length>128||!exact(a.owner,['libraryId','location'])||!uuid(a.owner.libraryId)||typeof a.owner.location!=='string'||a.owner.location.length>4096||!path.isAbsolute(a.owner.location)||!phases.includes(a.phase)||typeof a.cancelled!=='boolean'||typeof a.handed!=='boolean'||!Number.isSafeInteger(a.createdAt)||a.expiresAt!==a.createdAt+300000||typeof a.code!=='string'||!/^FLASH_[A-Z_]+$/.test(a.code)||!Array.isArray(a.events)||!a.events.length||a.events[0]!=='prepared'||a.events.at(-1)!==a.phase||a.events.length>12||a.events.some(p=>!phases.includes(p)))fail();
  const s=a.snapshot;if(!exact(s,['prompt','taskId','viewId','parameters','provider','region','endpoint','images','listEstimateCNY','actualCost','offline','accountState'])||typeof s.prompt!=='string'||!s.prompt.trim()||Buffer.byteLength(s.prompt)>4096||typeof s.taskId!=='string'||!s.taskId||s.taskId.length>128||s.viewId!==a.viewId||s.provider!=='火山方舟中国'||s.region!=='cn-beijing'||s.endpoint!=='https://ark.cn-beijing.volces.com/api/v3/images/generations'||s.images!==1||s.listEstimateCNY!=='0.12'||s.actualCost!=='unknown'||s.offline!==true||!eq(s.parameters,{model:MODEL,size:'1024x1024',response_format:'b64_json',output_format:'png',watermark:true})||s.accountState!==a.account.vaultRevision||a.requestDigest!==hash(JSON.stringify(s)))fail();
  const c=a.account;if(!exact(c,['provider','region','model','purpose','slotId','slotRevision','vaultRevision','bindingVersion'])||c.provider!=='fake-provider'||c.region!=='cn-beijing'||c.model!==MODEL||c.purpose!=='generate-single-image'||!uuid(c.slotId)||![c.slotRevision,c.vaultRevision,c.bindingVersion].every(x=>Number.isSafeInteger(x)&&x>0)||c.bindingVersion!==c.vaultRevision)fail();
  if(a.candidate!==null&&(!exact(a.candidate,['id','metadata'])||a.candidate.id!==a.id||!exact(a.candidate.metadata,['width','height','channels','mime','size','sha256','pixelsSha256'])||!/^[a-f0-9]{64}$/.test(a.candidate.metadata.sha256)||a.candidate.metadata.size>MAX))fail();
  if(['verified','joined'].includes(a.phase)&&!a.candidate||a.phase==='joined'&&!a.handed||!['verified','joined'].includes(a.phase)&&a.candidate)fail();
  if(a.save!==null&&(!exact(a.save,['operationId','expectedRevision','state','receipt'])||!/^save-[a-f0-9-]{36}$/.test(a.save.operationId)||!Number.isSafeInteger(a.save.expectedRevision)||a.save.expectedRevision<0||!['pending','committed'].includes(a.save.state)||a.save.state==='committed'&&(!exact(a.save.receipt,['id','digest','revision','at'])||a.save.receipt.id!==a.save.operationId||a.save.receipt.revision!==a.save.expectedRevision+1||!/^[a-f0-9]{64}$/.test(a.save.receipt.digest)||!Number.isSafeInteger(a.save.receipt.at))||a.save.state==='pending'&&a.save.receipt!==null))fail();
 }
 transaction(fn){if(this.error)fail();try{this.db.exec('BEGIN IMMEDIATE');const rows=this.check(),result=fn(rows);for(const a of rows)this.validate(a);this.db.exec('DELETE FROM attempts');for(const a of rows)this.db.prepare('INSERT INTO attempts VALUES(?,?,?)').run(a.id,a.confirmationId,JSON.stringify(a));const raw=this.db.prepare('SELECT * FROM attempts ORDER BY id').all();if(raw.length>16||Buffer.byteLength(JSON.stringify(raw))>1048576)fail();this.db.prepare('UPDATE meta SET count=?,digest=?').run(raw.length,hash(JSON.stringify(raw)));this.db.exec('COMMIT');return result}catch{try{this.db.exec('ROLLBACK')}catch{}throw Error('FLASH_JOURNAL_UNAVAILABLE')}}
 all(){try{return this.check()}catch{this.error='FLASH_JOURNAL_UNAVAILABLE';fail()}}
 add(a){return this.transaction(rows=>{if(rows.length>=16||rows.some(x=>x.id===a.id||x.confirmationId===a.confirmationId))fail();if(rows.some(x=>eq(x.owner,a.owner)&&x.snapshot.taskId===a.snapshot.taskId&&uncertain.includes(x.phase)))throw Error('FLASH_UNKNOWN_ATTEMPT_NO_RETRY');rows.push(a);return a})}
 patch(id,fn){return this.transaction(rows=>{const a=rows.find(x=>x.id===id);if(!a)fail();return fn(a)})}
 start(id){return this.transaction(rows=>{const a=rows.find(x=>x.id===id);if(!a)fail();if(a.phase!=='prepared'||a.cancelled)return false;if(rows.some(x=>x.id!==id&&eq(x.owner,a.owner)&&x.snapshot.taskId===a.snapshot.taskId&&uncertain.includes(x.phase)))fail();this.phase(a,'sending','FLASH_OFFLINE_SENDING');return true})}
 phase(a,phase,code){a.phase=phase;a.code=code;if(a.events.at(-1)!==phase)a.events.push(phase)}
 readCandidate(a){const file=path.join(this.candidates,a.id+'.png');boundary(file);const st=fs.statSync(file);if(!st.isFile()||st.nlink!==1||st.size>MAX||st.size!==a.candidate.metadata.size)fail();const b=fs.readFileSync(file),m=verifyPNG(b);if(!eq(m,a.candidate.metadata))fail();return b}
 stage(id,bytes){const metadata=verifyPNG(bytes);this.all();const tmp=path.join(this.candidates,id+'.pending'),file=path.join(this.candidates,id+'.png');if(fs.existsSync(file)||fs.existsSync(tmp))fail();this.write(tmp,bytes);if(!fs.readFileSync(tmp).equals(bytes)||!eq(verifyPNG(fs.readFileSync(tmp)),metadata))fail();fs.renameSync(tmp,file);return {id,metadata}}
 close(){this.db?.close();this.db=null}
}
module.exports={FlashJournal,hash,uncertain};

'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const {VideoLock,processPowerShell}=require('./video-lock.cjs'),{hash,error}=require('./media.cjs');
const stamp=s=>typeof s==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{7}Z$/.test(s)&&Number.isFinite(Date.parse(s));
const fields=v=>Object.keys(v).sort().join(',');
class C5SessionLock extends VideoLock{
 constructor(root,options={}){super(root,options);this.file=path.join(this.root,'c5-session.lock');}
 read(){
  const st=fs.lstatSync(this.file);if(!st.isFile()||st.isSymbolicLink()||st.nlink!==1||st.size<1||st.size>8192)throw error('C5_SESSION_LOCK_INVALID','C5 工作階段鎖格式或路徑無法核對');
  let v,bytes=fs.readFileSync(this.file);try{v=JSON.parse(bytes);}catch{throw error('C5_SESSION_LOCK_INVALID','C5 工作階段鎖不是完整記錄');}
  if(!v||typeof v!=='object'||Array.isArray(v)||!Number.isSafeInteger(v.pid)||v.pid<1)throw error('C5_SESSION_LOCK_INVALID','C5 工作階段鎖身分無效');
  const legacy=fields(v)==='pid';
  if(!legacy&&(fields(v)!=='exe,instance,pid,root,startedAt,version'||v.version!==2||v.root!==this.root||!stamp(v.startedAt)||typeof v.exe!=='string'||!v.exe||v.exe.length>4096||!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(v.instance)))throw error('C5_SESSION_LOCK_INVALID','C5 工作階段鎖不是受支援的完整身分記錄');
  return {value:v,digest:hash(bytes),bytes,legacy};
 }
 owner(){const p=this.probe(process.pid);if(p.state!=='alive'||p.pid!==process.pid||!stamp(p.startedAt))throw error('C5_SESSION_PROCESS_IDENTITY','無法核對目前 C5 程序身分，未接管工作階段');return {version:2,root:this.root,pid:process.pid,startedAt:p.startedAt,exe:process.execPath,instance:crypto.randomUUID()};}
 assess(r){const p=this.probe(r.value.pid);if(p.state==='dead')return {ownerState:'dead-original-instance',recoverable:true};if(p.state!=='alive'||p.pid!==r.value.pid||!stamp(p.startedAt))return {ownerState:'unknown',recoverable:false};if(r.legacy)return {ownerState:'alive-legacy-pid',recoverable:false};return p.startedAt===r.value.startedAt?{ownerState:'alive',recoverable:false}:{ownerState:'dead-original-instance',recoverable:true};}
 status(){if(this.held)return {locked:true,digest:this.digest,ownerState:'owned-by-current-process',recoverable:false};if(!fs.existsSync(this.file))return {locked:false,recoverable:false};const r=this.read();return {locked:true,digest:r.digest,legacy:r.legacy,...this.assess(r)};}
 acquire(){
  if(this.held)throw error('PROJECT_BUSY','此 C5 工作階段已由目前程序持有');
  const owner=this.owner();try{const fd=fs.openSync(this.file,'wx');try{fs.writeFileSync(fd,JSON.stringify(owner));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}catch(e){
   if(e.code!=='EEXIST')throw e;let r;try{r=this.read();const s=this.assess(r);if(!s.recoverable)throw error('C5_SESSION_OWNER_ACTIVE_OR_UNKNOWN','另一 C5 工作階段仍存活或身分不明');return this.recover(r.digest);}catch(cause){const e=error('PROJECT_BUSY','此工程的 C5 工作階段尚無法安全接管；原鎖和資料保留');e.lockReason=cause.code??'C5_SESSION_LOCK_UNKNOWN';throw e;}
  }
  this.digest=this.read().digest;this.held=true;return {acquired:true,recovered:false};
 }
 recover(expectedDigest){
  if(this.held)throw error('C5_SESSION_LOCK_HELD','目前程序已持有 C5 工作階段鎖');
  if(!/^[a-f0-9]{64}$/.test(expectedDigest))throw error('C5_SESSION_LOCK_CHANGED','C5 工作階段鎖摘要不符');const r=this.read();if(r.digest!==expectedDigest)throw error('C5_SESSION_LOCK_CHANGED','C5 工作階段鎖已變更');if(!this.assess(r).recoverable)throw error('C5_SESSION_OWNER_ACTIVE_OR_UNKNOWN','另一 C5 工作階段仍存活或身分不明');
  const owner=this.owner(),ps=processPowerShell(),result=spawnSync(ps,['-NoLogo','-NoProfile','-NonInteractive','-File',path.join(__dirname,'c5-session-recover.ps1'),'-Root',this.root,'-ExpectedDigest',expectedDigest,'-OwnerBase64',Buffer.from(JSON.stringify(owner)).toString('base64')],{windowsHide:true,encoding:'utf8',timeout:25000});let value;try{value=JSON.parse(result.stdout.trim());}catch{throw error('C5_SESSION_RECOVERY_FAILED','C5 工作階段恢復結果未知；沒有刪除其他鎖');}
  if(result.status!==0||!value.ok)throw error(/^C5_SESSION_[A-Z_]+$/.test(value.code??'')?value.code:'C5_SESSION_RECOVERY_FAILED','C5 原程序仍在、鎖已變更或身分不明，未接管');
  const now=this.read();if(now.digest!==value.digest||now.value.instance!==owner.instance||now.value.pid!==process.pid||now.value.startedAt!==owner.startedAt)throw error('C5_SESSION_LOCK_CHANGED','C5 工作階段恢復後身分已變更');this.digest=now.digest;this.held=true;return {acquired:true,recovered:true,legacy:r.legacy,originalLockSHA256:expectedDigest};
 }
 release(){if(!this.held)return;if(this.read().digest!==this.digest)throw error('C5_SESSION_LOCK_CHANGED','C5 工作階段鎖已被替換，未刪除');fs.unlinkSync(this.file);this.held=false;}
}
module.exports={C5SessionLock};

'use strict';const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),error=(code,message)=>Object.assign(new Error(message),{code});
class ShortcutPreferences{
 constructor(root,{platform=process.platform,beforeCommit=null}={}){this.root=path.resolve(root);this.platform=platform;this.beforeCommit=beforeCommit;this.file=path.join(this.root,'shortcuts.json');this.stamp=null;}
 async init(){this.policy=await import('../shared/shortcuts.mjs');this.refresh();return this;}
 checkPath(){let p=this.root;const paths=[];for(;;){paths.push(p);const next=path.dirname(p);if(next===p)break;p=next;}for(const dir of paths){let st;try{st=fs.lstatSync(dir);}catch(e){if(e.code!=='ENOENT')throw e;}if(st?.isSymbolicLink())throw error('SHORTCUT_PATH','個人設定路徑不可為連結');}let fileStat;try{fileStat=fs.lstatSync(this.file);}catch(e){if(e.code!=='ENOENT')throw e;}if(fileStat){const st=fileStat;if(!st.isFile()||st.isSymbolicLink()||st.nlink!==1)throw error('SHORTCUT_PATH','個人設定檔不是獨立普通檔案');}}
 raw(){this.checkPath();if(!fs.existsSync(this.file))return {bytes:null,stamp:'absent'};const st=fs.statSync(this.file);if(st.size>16384)throw error('SHORTCUT_SIZE','個人快捷鍵檔案超過16KiB，已停用且未覆蓋原檔');const bytes=fs.readFileSync(this.file);return {bytes,stamp:hash(bytes)};}
 refresh(){let raw;try{raw=this.raw();}catch(e){this.stamp=null;this.state={version:1,revision:0,platform:this.platform,status:'unavailable',warning:e.code+' · '+e.message,bindings:this.policy.disabled()};this.readError=e;return;}this.readError=null;if(raw.stamp===this.stamp&&this.state)return;this.stamp=raw.stamp;this.invalidBytes=null;
  if(!raw.bytes){this.state={version:1,revision:0,platform:this.platform,status:this.platform==='win32'?'ready':'unavailable',warning:this.platform==='win32'?null:'此候選只支援Windows，快捷鍵未啟用',bindings:this.platform==='win32'?this.policy.defaults():this.policy.disabled()};return;}
  try{const d=JSON.parse(raw.bytes.toString('utf8'));if(Object.keys(d).sort().join(',')!=='bindings,platform,revision,version'||d.version!==1||d.platform!==this.platform||!Number.isSafeInteger(d.revision)||d.revision<0)throw error('SHORTCUT_SCHEMA','設定版本不相容');this.state={...d,status:'ready',warning:null,bindings:this.policy.validateBindings(d.bindings,this.platform)};}
  catch(e){this.invalidBytes=raw.bytes;this.state={version:1,revision:0,platform:this.platform,status:'invalid',warning:'原快捷鍵設定無法使用，已停用所有畫布快捷鍵；可明確恢復全部預設，原檔會保留',bindings:this.policy.disabled()};}
 }
 read(){this.refresh();return structuredClone({...this.state,token:this.stamp});}
 change(request){
  this.refresh();if(this.platform!=='win32')throw error('SHORTCUT_PLATFORM','此候選未支援Mac／Cmd設定');if(this.readError)throw this.readError;
  if(!request||Object.keys(request).sort().join(',')!=='expectedRevision,expectedToken,operation'||!Number.isSafeInteger(request.expectedRevision)||request.expectedRevision!==this.state.revision||request.expectedToken!==this.stamp)throw error('SHORTCUT_REVISION','設定已改變，請重新讀取後再修改');
  const o=request.operation;if(!o||typeof o!=='object'||Array.isArray(o))throw error('SHORTCUT_SCHEMA','設定操作不合法');let bindings;
  if(o.type==='resetAll'&&Object.keys(o).length===1)bindings=this.policy.defaults();
  else{if(this.state.status!=='ready')throw error('SHORTCUT_RECOVERY','先恢復全部預設；不採用損壞設定');if(o.type==='set'&&Object.keys(o).sort().join(',')==='actionId,binding,type')bindings=this.policy.changeBinding(this.state.bindings,o.actionId,o.binding);else if(o.type==='reset'&&Object.keys(o).sort().join(',')==='actionId,type'){const d=this.policy.defaults();if(!Object.hasOwn(d,o.actionId))throw error('SHORTCUT_ACTION','未知快捷操作');bindings=this.policy.changeBinding(this.state.bindings,o.actionId,d[o.actionId]);}else throw error('SHORTCUT_SCHEMA','設定操作含未知欄位');}
  bindings=this.policy.validateBindings(bindings,this.platform);if(this.state.status==='ready'&&JSON.stringify(bindings)===JSON.stringify(this.state.bindings))return this.read();
  const doc={version:1,revision:this.state.revision+1,platform:this.platform,bindings},expectedStamp=this.stamp;this.checkPath();fs.mkdirSync(this.root,{recursive:true});this.checkPath();
  const tmp=path.join(this.root,'shortcuts-'+crypto.randomUUID()+'.tmp');let committed=false;
  try{const fd=fs.openSync(tmp,'wx',0o600);try{fs.writeFileSync(fd,JSON.stringify(doc,null,2));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}this.beforeCommit?.();if(this.raw().stamp!==expectedStamp)throw error('SHORTCUT_REVISION','另一個動作修改了設定，未覆蓋；請重讀');if(this.invalidBytes)fs.writeFileSync(path.join(this.root,'shortcuts-invalid-'+crypto.randomUUID()+'.json'),this.invalidBytes,{flag:'wx',mode:0o600});fs.renameSync(tmp,this.file);committed=true;this.stamp=null;this.refresh();return this.read();}finally{if(!committed&&fs.existsSync(tmp))fs.unlinkSync(tmp);}
 }
}
module.exports={ShortcutPreferences};

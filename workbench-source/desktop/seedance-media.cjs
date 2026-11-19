'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const {boundary,inside}=require('./runtime-paths.cjs');
const runtimeConfig=require('../integration-build.json'),ROOT=path.join(runtimeConfig.runtimeRoot,'media-validation');
let PYTHON=runtimeConfig.mediaValidationRuntime?.python;const TOOL_ROOT=path.resolve(__dirname,'../../tools/ffmpeg');
const HELPER=path.join(__dirname,'seedance-media-helper.py'),MAX_BYTES=32*1024*1024,cache=new Map();
const TOOL_CONTRACT=Object.freeze([
 {link:path.join(TOOL_ROOT,'ffmpeg.exe'),path:path.join(TOOL_ROOT,'ffmpeg.exe'),sha256:'57c56e369d5b4873b4d93fc1a1d833cb7cd8bc9325c14b05c34ce60b22842d8a'},
 {link:path.join(TOOL_ROOT,'ffprobe.exe'),path:path.join(TOOL_ROOT,'ffprobe.exe'),sha256:'afe05347caaabe479b3c4eae71992b6ec1e11c57266a1d665deb0f9fe9847208'},
 {link:PYTHON,path:PYTHON,sha256:'3c48fbdcc2ed5c55290e39bef50bd6b1da76f43f3069a4a2624d0b8876a605f5'}]);
let toolsChecked=false;
const fail=code=>{throw Error(code)},hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function tools(){if(toolsChecked&&runtimeConfig.mediaValidationRuntime?.external!==true)return;let contracts=TOOL_CONTRACT;if(runtimeConfig.mediaValidationRuntime?.external===true){const resolve=require('../../desktop/external-tools.cjs').resolveTool;contracts=['ffmpeg','ffprobe','python'].map(n=>{const t=resolve(n);if(n==='python')PYTHON=t.path;return {link:t.path,path:t.path,sha256:t.sha256};});}if(typeof PYTHON!=='string'||!path.isAbsolute(PYTHON))fail('C_VIDEO_TOOL_CHANGED');for(const tool of contracts){if(fs.realpathSync.native(tool.link).toLowerCase()!==path.resolve(tool.path).toLowerCase())fail('C_VIDEO_TOOL_CHANGED');const fd=fs.openSync(tool.path,'r'),h=crypto.createHash('sha256'),chunk=Buffer.alloc(1024*1024);try{const before=fs.fstatSync(fd);if(!before.isFile()||before.size>512*1024*1024)fail('C_VIDEO_TOOL_CHANGED');let n;while((n=fs.readSync(fd,chunk,0,chunk.length,null))>0)h.update(chunk.subarray(0,n));const after=fs.fstatSync(fd);if(before.size!==after.size||before.mtimeMs!==after.mtimeMs||h.digest('hex')!==tool.sha256)fail('C_VIDEO_TOOL_CHANGED')}finally{fs.closeSync(fd)}}toolsChecked=true}
function cleanup(dir){
 if(!path.isAbsolute(dir)||!inside(ROOT,dir)||path.dirname(dir)!==ROOT||!path.basename(dir).startsWith('verify-'))fail('C_VIDEO_SCRATCH_PATH');
 boundary(dir);for(const name of fs.readdirSync(dir)){const file=path.join(dir,name),st=fs.lstatSync(file);if(!st.isFile()||st.isSymbolicLink()||st.nlink!==1)fail('C_VIDEO_SCRATCH_PATH');fs.unlinkSync(file)}fs.rmdirSync(dir);
}
function verifyMP4(bytes,model=require('./seedance-policy.cjs').entry.exactModelId){
 const spec=require('./seedance-policy.cjs').media(model);
 if(!Buffer.isBuffer(bytes)||!bytes.length||bytes.length>MAX_BYTES)fail('C_VIDEO_MEDIA_SIZE');
 tools();
 const sha256=hash(bytes),cacheKey=model+":"+sha256;if(cache.has(cacheKey))return structuredClone(cache.get(cacheKey));
 boundary(ROOT);fs.mkdirSync(ROOT,{recursive:true});boundary(ROOT);const dir=fs.mkdtempSync(path.join(ROOT,'verify-'));
 try{
  boundary(dir);const file=path.join(dir,'original.mp4'),fd=fs.openSync(file,'wx',0o600);try{fs.writeFileSync(fd,bytes);fs.fsyncSync(fd)}finally{fs.closeSync(fd)}
  const result=spawnSync(PYTHON,['-I','-B','-X','utf8',HELPER,dir,model,...(runtimeConfig.mediaValidationRuntime?.external===true?[require('../../desktop/external-tools.cjs').resolveTool('ffmpeg').path,require('../../desktop/external-tools.cjs').resolveTool('ffprobe').path]:[])],{encoding:'utf8',windowsHide:true,timeout:25000,maxBuffer:1024*1024,env:{SystemRoot:'C:\\Windows',TEMP:dir,TMP:dir},cwd:__dirname});
  if(result.error||result.signal||result.status!==0)fail('C_VIDEO_MEDIA_INVALID');
  let value;try{value=JSON.parse(result.stdout)}catch{fail('C_VIDEO_MEDIA_INVALID')}
  const d=value.detail;
  if(value.sha256!==sha256||value.size!==bytes.length||value.width!==spec.width||value.height!==spec.height||d?.kind!=='video'||d.container!=='mp4'||d.width!==spec.width||d.height!==spec.height||!Number.isSafeInteger(d.durationMs)||d.durationMs<3900||d.durationMs>4100||d.codec!=='h264'||d.frameRate?.numerator!==24||d.frameRate.denominator!==1||d.audio!=='absent')fail('C_VIDEO_MEDIA_INVALID');
  if(cache.size>=64)cache.delete(cache.keys().next().value);cache.set(cacheKey,structuredClone(value));return value;
 }finally{cleanup(dir)}
}
module.exports={verifyMP4,MAX_BYTES,TOOL_CONTRACT};

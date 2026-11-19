// User-selected external tools. No PATH search, downloads, shell strings, or implicit trust.
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const BASE=path.resolve(__dirname,'..'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const names=new Set(['node','powershell','ffmpeg','ffprobe','python','codex']);
function fail(code){throw Object.assign(Error(code+'：外部依赖未配置、不兼容或已变更；请正常关闭工作台，运行 CHECK-DEPENDENCIES.ps1 查看及重新配置。原工程保留。'),{code});}
function regular(file){if(typeof file!=='string'||!path.isAbsolute(file)||file.startsWith('\\\\'))fail('DEPENDENCY_PATH');for(let p=file;;p=path.dirname(p)){const st=fs.lstatSync(p);if(st.isSymbolicLink()||p===file&&(!st.isFile()||st.nlink!==1||st.size>512*1024*1024))fail('DEPENDENCY_PATH');if(path.dirname(p)===p)break;}if(fs.realpathSync.native(file).toLowerCase()!==path.resolve(file).toLowerCase())fail('DEPENDENCY_PATH');}
function resolveTool(name,{base=BASE}={}){
 if(!names.has(name))fail('DEPENDENCY_NAME');
 let build,raw;try{raw=fs.readFileSync(path.join(base,'integration-build.json'));build=JSON.parse(raw);}catch{fail('DEPENDENCY_CONFIG_INTEGRITY');}
 let spec;
 if(build.externalDependencies){
  try{const record=JSON.parse(fs.readFileSync(path.join(base,'.aicg-install.json')));if(record.version!==1||record.product!=='AICG-P4-TEST'||path.resolve(record.programRoot).toLowerCase()!==path.resolve(base).toLowerCase()||record.files?.['integration-build.json']!==sha(raw)||build.externalDependencies.version!==1)fail('DEPENDENCY_CONFIG_INTEGRITY');}catch{fail('DEPENDENCY_CONFIG_INTEGRITY');}
  spec=build.externalDependencies.tools?.[name];if(!spec)fail('DEPENDENCY_MISSING');
 }else if(['ffmpeg','ffprobe'].includes(name))spec={path:path.join(base,'tools/ffmpeg',name+'.exe'),sha256:name==='ffmpeg'?'57c56e369d5b4873b4d93fc1a1d833cb7cd8bc9325c14b05c34ce60b22842d8a':'afe05347caaabe479b3c4eae71992b6ec1e11c57266a1d665deb0f9fe9847208'};
 else if(name==='python'){const old=JSON.parse(fs.readFileSync(path.join(base,'workbench-source/integration-build.json')));spec={path:old.mediaValidationRuntime?.python,sha256:'3c48fbdcc2ed5c55290e39bef50bd6b1da76f43f3069a4a2624d0b8876a605f5'};}
 else{const rt=JSON.parse(fs.readFileSync(path.join(base,'desktop/mcp/external-runtime.json'))),pins=JSON.parse(fs.readFileSync(path.join(base,'desktop/mcp/terminal-pins.json')));spec={path:rt[name==='codex'?'codexCli':name],sha256:name==='codex'?rt.codexSha256:pins[name+'Sha256']};}
 if(typeof spec?.path!=='string'||!/^[a-f0-9]{64}$/.test(spec?.sha256??''))fail('DEPENDENCY_CONFIG_INTEGRITY');
 try{regular(spec.path);if(sha(fs.readFileSync(spec.path))!==spec.sha256)fail('DEPENDENCY_CHANGED');}catch(e){if(e.code?.startsWith('DEPENDENCY_'))throw e;fail(e.code==='ENOENT'?'DEPENDENCY_MISSING':'DEPENDENCY_CHANGED');}
 return {path:spec.path,sha256:spec.sha256,version:spec.version??null};
}
module.exports={resolveTool};

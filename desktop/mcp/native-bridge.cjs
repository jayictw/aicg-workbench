'use strict';
// Application-owned bridge and embedded Node; no third-party Agent executable is trusted here.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const base=path.resolve(__dirname,'../..');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function enabled(){return require('./external-runtime.json').nativeBridgeVersion===1;}
function file(rel){const pins=JSON.parse(fs.readFileSync(path.join(base,'desktop/mcp/native-bridge-pins.json'),'utf8')),expected=pins.files?.[rel],f=path.join(base,rel);if(!/^[a-f0-9]{64}$/.test(expected??'')||sha(require('./client-policy.cjs').regular(f))!==expected)throw Error('MCP_BRIDGE_CHANGED');return f;}
function executable(){return file('tools/AICG-MCP.exe');}
function node(){return file('tools/electron/electron.exe');}
function env(extra={}){const e={};for(const k of ['SystemRoot','WINDIR','TEMP','TMP','USERPROFILE','LOCALAPPDATA','APPDATA','PATH'])if(process.env[k])e[k]=process.env[k];return {...e,...extra};}
function nodeEnv(){const e=env({ELECTRON_RUN_AS_NODE:'1'});if(process.env.AICG_MCP_CONNECTION_ID)e.AICG_MCP_CONNECTION_ID=process.env.AICG_MCP_CONNECTION_ID;return e;}
function invoke(args,options={}){const r=cp.spawnSync(executable(),args,{env:env(),windowsHide:true,encoding:'utf8',timeout:10000,...options});let v;try{v=JSON.parse(r.stdout.trim());}catch{throw Error('MCP_BRIDGE_UNAVAILABLE');}if(r.status!==0||v.type==='rejected')throw Error(/^MCP_[A-Z_]+$/.test(v.code??'')?v.code:'MCP_BRIDGE_FAILED');return v;}
function probe(pid){if(!Number.isSafeInteger(pid)||pid<1)return {state:'unknown'};try{return invoke(['--probe',String(pid)]);}catch{return {state:'unknown'};}}
module.exports={enabled,file,executable,node,env,nodeEnv,invoke,probe};

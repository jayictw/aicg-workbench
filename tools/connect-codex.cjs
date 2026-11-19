'use strict';
// Current real Codex terminal only; no new model, login or global MCP configuration.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawn}=require('node:child_process'),{performance}=require('node:perf_hooks'),{StringDecoder}=require('node:string_decoder');
const base=path.resolve(__dirname,'..'),runtime=require('../desktop/mcp/external-runtime.json'),started=performance.now();
const newOpenIntent=process.argv.length===3&&process.argv[2]==='--open-intent';
if(process.argv.length!==2&&!newOpenIntent||!process.env.CODEX_THREAD_ID||!process.env.CODEX_SESSION_ID)throw Error('MCP_CODEX_TERMINAL_REQUIRED');
const helper=path.join(base,'desktop/mcp/bridge-output.cjs'),helperSha='72ac644d6bd958f2f96e891351ca38618b447edeffc45b8cb6867095ad86e2c9';
if(crypto.createHash('sha256').update(fs.readFileSync(helper)).digest('hex')!==helperSha)throw Error('MCP_BRIDGE_HELPER_INTEGRITY');
const {formatReady,callWithReadBack,validateReadBack}=require(helper);
const active=JSON.parse(fs.readFileSync(path.join(base,'runtime/snapshot-active.json'),'utf8'));
if(!/^[a-f0-9-]{36}$/.test(active.invitationId)||require('../desktop/mcp/authority-policy.cjs').expired(require('../desktop/mcp/authority-policy.cjs').validateMarker(active)))throw Error('MCP_INVITATION_EXPIRED');
const traceFile=active.engineeringEvidence?path.join(base,'runtime/codex-client',active.invitationId+'.jsonl'):null;
const metricsFile=active.engineeringEvidence?path.join(base,'runtime/bridge-metrics','metrics-'+crypto.randomUUID()+'.jsonl'):null;
function redact(v){if(typeof v==='string'&&v.trim().startsWith('{')){try{return JSON.stringify(redact(JSON.parse(v)));}catch{return v;}}if(Array.isArray(v))return v.map(redact);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,k==='handle'||k==='scope'&&typeof x==='string'?'[session-bound-scope]':redact(x)]));return v;}
function trace(direction,value){if(!traceFile)return;fs.mkdirSync(path.dirname(traceFile),{recursive:true});fs.appendFileSync(traceFile,JSON.stringify({at:new Date().toISOString(),direction,frame:redact(value),actualTransport:'verified-current-real-Codex-terminal/MCP'})+'\n');}
function metric(value){if(!metricsFile)return;fs.mkdirSync(path.dirname(metricsFile),{recursive:true});fs.appendFileSync(metricsFile,JSON.stringify({at:new Date().toISOString(),...value})+'\n');}
const child=spawn(runtime.node,[path.join(base,'desktop/mcp/external-adapter.cjs'),active.invitationId],{cwd:base,windowsHide:true,stdio:['pipe','pipe','pipe']}),pending=new Map(),decoder=new StringDecoder('utf8'),stdinDecoder=new StringDecoder('utf8');
let seq=0,buffer='',input='',scope=null,ready=false,queue=Promise.resolve(),catalogue=[],currentRequest=null;
function out(value){const t=performance.now(),bytes=JSON.stringify(value)+'\n';process.stdout.write(bytes);metric({kind:'terminal-output',controllerRequestId:value.id??null,bytes:Buffer.byteLength(bytes),serializeAndWriteMs:performance.now()-t});}
function rpc(method,params){return new Promise((resolve,reject)=>{const id=++seq,t=performance.now(),at=new Date().toISOString(),timer=setTimeout(()=>{pending.delete(id);reject(Error('MCP_BRIDGE_TIMEOUT'));},45000),frame={jsonrpc:'2.0',id,method,params},wire=JSON.stringify(frame)+'\n';pending.set(id,{resolve,reject,timer,t,at,controllerRequestId:currentRequest?.id??null,tool:params.name??method,requestBytes:Buffer.byteLength(wire),bucket:currentRequest?.rpcs});trace('codex-request',frame);child.stdin.write(wire);});}
child.stdout.on('data',b=>{buffer+=decoder.write(b);if(buffer.length>130000)throw Error('MCP_FRAME_LIMIT');for(;;){const end=buffer.indexOf('\n');if(end<0)break;const line=buffer.slice(0,end);buffer=buffer.slice(end+1);let m;try{m=JSON.parse(line);}catch{continue;}trace('mcp-response',m);const p=pending.get(m.id);if(!p)continue;pending.delete(m.id);clearTimeout(p.timer);const row={kind:'rpc',controllerRequestId:p.controllerRequestId,rpcId:m.id,tool:p.tool,sentAt:p.at,rpcMs:performance.now()-p.t,requestBytes:p.requestBytes,responseBytes:Buffer.byteLength(line),rpcError:!!m.error,resultError:!!m.result?.isError};p.bucket?.push(row);metric(row);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}});
child.stderr.on('data',()=>{});
child.on('exit',code=>{for(const p of pending.values()){clearTimeout(p.timer);p.reject(Error('MCP_DISCONNECTED'));}pending.clear();out({disconnected:true,code});process.exitCode=code??0;process.stdin.destroy();});
(async()=>{await rpc('initialize',{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'real-codex-current-terminal',version:'1.1.0'}});child.stdin.write(JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized'})+'\n');const listed=await rpc('tools/list',{}),s=await rpc('tools/call',{name:'session_info',arguments:{}});if(s.isError||!s.structuredContent?.authorized)throw Error('MCP_AUTHORIZATION_REQUIRED');scope=s.structuredContent.scope;catalogue=listed.tools;ready=true;out(formatReady({ready:true,interface:'Canvas Context Snapshot',tools:catalogue,projectId:scope.projectId,graphId:scope.graphId,expiresAt:s.structuredContent.expiresAt,session:'current-real-Codex; OS-verified by host; not LocalAgent',timing:{bridgeStartupMs:performance.now()-started},metricsFile:metricsFile?path.relative(base,metricsFile).replaceAll('\\','/'):null}));})().catch(e=>{out({error:e.message});child.stdin.end();});
async function dispatch(m){
 if(!m||!Number.isInteger(m.id)||Object.keys(m).some(k=>!['id','op','name','arguments','readBack'].includes(k)))throw Error('MCP_BRIDGE_SCHEMA');
 if(m.op==='close'){if(m.readBack!==undefined)throw Error('MCP_BRIDGE_SCHEMA');child.stdin.end();return {value:{closed:true}};}
 if(!ready)throw Error('MCP_NOT_READY');
 if(m.op==='catalogue'){if(m.readBack!==undefined||m.arguments!==undefined||typeof m.name!=='string')throw Error('MCP_BRIDGE_SCHEMA');const tool=catalogue.find(t=>t.name===m.name);if(!tool)throw Error('MCP_TOOL_UNKNOWN');return {value:{tool}};}
 if(m.op!=='call'||typeof m.name!=='string')throw Error('MCP_BRIDGE_SCHEMA');
 validateReadBack(m);
 const call=(name,args)=>{const a=name==='session_info'?{}:name==='scope_select'?{projectId:scope.projectId,graphId:scope.graphId}:{...args,scope:scope.handle,projectId:scope.projectId,graphId:scope.graphId};return rpc('tools/call',{name,arguments:a});};
 return callWithReadBack(m,call);
}
process.stdin.on('data',b=>{input+=stdinDecoder.write(b);if(input.length>20000)throw Error('MCP_REQUEST_LIMIT');for(;;){const i=input.indexOf('\n');if(i<0)break;const line=input.slice(0,i);input=input.slice(i+1);queue=queue.then(async()=>{let m;const t=performance.now();try{m=JSON.parse(line);currentRequest={id:m.id,rpcs:[]};const result=await dispatch(m),rpcs=currentRequest.rpcs;out({id:m.id,...result,timing:{bridgeMs:performance.now()-t,rpcMs:rpcs.reduce((s,r)=>s+r.rpcMs,0),rpcCalls:rpcs.length}});}catch(e){out({id:m?.id??null,error:e.message});}finally{currentRequest=null;}});}});
process.stdin.on('end',()=>queue.finally(()=>child.stdin.end()));


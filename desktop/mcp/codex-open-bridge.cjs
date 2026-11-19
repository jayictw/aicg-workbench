'use strict';
const {MAX_FRAME}=require('./contracts.cjs');
// A persistent MCP client owned by the initiating Codex terminal tool session.
// No Codex process is launched. No configuration or login data is read/written.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawn}=require('node:child_process');
const {projects,select}=require('./codex-open-policy.cjs'),rt=require('./external-runtime.json');
const BASE=path.resolve(__dirname,'../..'),pins=require('./codex-open-pins.json');
const {StringDecoder}=require('node:string_decoder'),inputDecoder=new StringDecoder('utf8'),rpcDecoder=new StringDecoder('utf8');
let backlog=0;
const out=x=>process.stdout.write(JSON.stringify(x)+'\n');
let openingReject=null,cancelled=false;
let app=null,adapter=null,opened=false,scope=null,buffer='',rpcBuffer='',seq=0,queue=Promise.resolve(),pending=new Map();
function cleanError(e){return /^MCP_[A-Z_]+$/.test(e.message)?e.message:'MCP_BRIDGE_FAILED';}
function rpc(method,params){return new Promise((resolve,reject)=>{const id=++seq,timer=setTimeout(()=>{pending.delete(id);reject(Error('MCP_BRIDGE_TIMEOUT'));},20000);pending.set(id,{resolve,reject,timer});adapter.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n');});}
async function open(projectName){
 if(cancelled)throw Error('MCP_LAUNCH_CANCELLED');if(opened)throw Error('MCP_ALREADY_OPEN');const p=select(projectName);
 if(!process.env.CODEX_THREAD_ID||!process.env.CODEX_SESSION_ID)throw Error('MCP_LAUNCH_SESSION_UNAVAILABLE');
 // These identifiers add session binding; authority also requires independently verified OS ancestry and private pipes.
 const sessionDigest=crypto.createHash('sha256').update(process.env.CODEX_THREAD_ID+'\0'+process.env.CODEX_SESSION_ID).digest('hex');
 const request={launchId:crypto.randomUUID(),createdAt:Date.now(),projectName:p.name,sessionDigest,ticket:crypto.randomBytes(32).toString('hex')};
 opened=true;
 const ready=new Promise((resolve,reject)=>{
  openingReject=reject;
  app=spawn(pins.electron,[pins.main,'--codex-launch='+request.launchId],{cwd:BASE,windowsHide:true,detached:true,stdio:['ignore','pipe','pipe','ipc']});
  const timer=setTimeout(()=>reject(Error('MCP_LAUNCH_TIMEOUT')),20000);
  app.stdout.on('data',()=>{});
  app.on('message',v=>{if(v.launchId!==request.launchId){clearTimeout(timer);reject(Error('MCP_LAUNCH_FRAME'));return;}clearTimeout(timer);v.error?reject(Error(v.error)):resolve(v);});
  app.stderr.on('data',chunk=>{if(process.env.C4_DIALOGUE_ENGINEERING_CDP!=='1')return;const found=/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//.exec(String(chunk));if(found){const dir=path.join(BASE,'runtime');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'engineering-cdp.json'),JSON.stringify({launchId:request.launchId,appPid:app.pid,port:Number(found[1]),scope:'owned-synthetic-app-only'}));}});app.on('error',()=>{clearTimeout(timer);reject(Error('MCP_LAUNCH_FAILED'));});app.on('exit',()=>{clearTimeout(timer);reject(Error('MCP_LAUNCH_CLOSED'));if(adapter)adapter.stdin.end();});
  app.send(request);
 });
 const receipt=await ready;openingReject=null;delete request.ticket;
 adapter=spawn(rt.node,[path.join(__dirname,'external-adapter.cjs'),receipt.invitationId],{cwd:BASE,windowsHide:true,stdio:['pipe','pipe','pipe']});
 adapter.stderr.on('data',()=>{});adapter.stdin.on('error',()=>{});
 adapter.stdout.on('data',b=>{rpcBuffer+=rpcDecoder.write(b);if(rpcBuffer.length>MAX_FRAME)return stop();for(;;){const i=rpcBuffer.indexOf('\n');if(i<0)break;const line=rpcBuffer.slice(0,i);rpcBuffer=rpcBuffer.slice(i+1);let v;try{v=JSON.parse(line);}catch{return stop();}const task=pending.get(v.id);if(task){pending.delete(v.id);clearTimeout(task.timer);v.error?task.reject(Error(v.error.message)):task.resolve(v.result);}}});
 adapter.on('exit',()=>{for(const p of pending.values()){clearTimeout(p.timer);p.reject(Error('MCP_BRIDGE_DISCONNECTED'));}pending.clear();scope=null;});
 const init=await rpc('initialize',{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'codex-current-session-command-bridge',version:'1.0.0'}});
 adapter.stdin.write(JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized'})+'\n');
 const catalogue=await rpc('tools/list',{}),session=await rpc('tools/call',{name:'session_info',arguments:{}});
 if(session.isError||!session.structuredContent?.authorized||!session.structuredContent.proposalPermission)throw Error('MCP_AUTODELEGATION_FAILED');
 scope=session.structuredContent.scope;
 return {projectName:p.name,protocolVersion:init.protocolVersion,toolNames:catalogue.tools.map(t=>t.name),session:session.structuredContent,transport:'same-initiating-terminal-session-command-bridge'};
}
function stop(){cancelled=true;if(openingReject){openingReject(Error('MCP_LAUNCH_CANCELLED'));openingReject=null;}if(adapter){adapter.stdin.end();adapter=null;}if(app){if(app.connected)app.disconnect();app=null;}scope=null;}
async function dispatch(m){if(!m||!Number.isSafeInteger(m.id)||m.id<1)throw Error('MCP_BRIDGE_FRAME');
 if(m.op==='projects'&&Object.keys(m).length===2)return {projects:projects.map(p=>p.name)};
 if(m.op==='open'&&Object.keys(m).length===3)return open(m.projectName);
 if(m.op==='call'&&Object.keys(m).every(k=>['id','op','name','arguments'].includes(k))){if(!adapter||!scope)throw Error('MCP_BRIDGE_NOT_CONNECTED');let args=m.arguments??{};if(!args||typeof args!=='object'||Array.isArray(args))throw Error('MCP_SCHEMA');if(!['session_info','attachment_read'].includes(m.name))args={...(m.name==='scope_select'?{}:{scope:scope.handle}),projectId:scope.projectId,graphId:scope.graphId,...args};return rpc('tools/call',{name:m.name,arguments:args});}
 if(m.op==='close'&&Object.keys(m).length===2){stop();return {stopped:true};}
 throw Error('MCP_BRIDGE_COMMAND_UNAVAILABLE');
}
process.stdin.on('data',b=>{buffer+=inputDecoder.write(b);if(Buffer.byteLength(buffer)>MAX_FRAME){out({error:'MCP_BRIDGE_FRAME'});return stop();}for(;;){const i=buffer.indexOf('\n');if(i<0)break;const line=buffer.slice(0,i);buffer=buffer.slice(i+1);let urgent;try{urgent=JSON.parse(line);}catch{}if(urgent?.op==='close'&&Number.isSafeInteger(urgent.id)&&Object.keys(urgent).length===2){stop();out({id:urgent.id,value:{stopped:true}});continue;}if(++backlog>16){out({error:'MCP_BRIDGE_BUSY'});stop();process.exitCode=2;process.stdin.destroy();return;}queue=queue.then(async()=>{let m;try{m=JSON.parse(line);const value=await dispatch(m);out({id:m.id,value});}catch(e){out({id:m?.id??null,error:cleanError(e)});if(m?.op==='open'&&!scope)stop();}finally{backlog--;}});}});
process.stdin.on('end',()=>{stop();queue.finally(()=>{stop();process.exit(0);});});process.on('SIGTERM',()=>{stop();process.exit(0);});
out({ready:true,interface:'C3 controlled command bridge; actual MCP underneath; no new Codex session'});

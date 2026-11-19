'use strict';
const {fork}=require('node:child_process'),path=require('node:path'),crypto=require('node:crypto');
const {PROTOCOL,MAX_RESPONSE}=require('./contracts.cjs');
// Local reference client: owns stdio; parent-only IPC is the separate trusted broker.
class LocalClient{
 constructor(broker){this.broker=broker;this.session=crypto.randomUUID();this.next=0;this.pending=new Map();this.transcript=[];this.closed=false;
  const env={ELECTRON_RUN_AS_NODE:'1'};for(const k of ['SystemRoot','SYSTEMROOT','WINDIR','TEMP','TMP'])if(process.env[k])env[k]=process.env[k];
  this.child=fork(path.join(__dirname,'stdio.cjs'),[],{execPath:process.execPath,execArgv:['--require',path.join(__dirname,'../uk-network.cjs')],env,stdio:['pipe','pipe','pipe','ipc'],windowsHide:true});
  let buffer='';this.child.stdout.on('data',b=>{buffer+=b.toString('utf8');if(Buffer.byteLength(buffer)>MAX_RESPONSE*2){this.close();return}for(;;){const i=buffer.indexOf('\n');if(i<0)break;const line=buffer.slice(0,i);buffer=buffer.slice(i+1);let m;try{m=JSON.parse(line)}catch{this.close();return}const p=this.pending.get(m.id);if(p){this.pending.delete(m.id);clearTimeout(p.timer);this.transcript.push({direction:'server',message:m});p.resolve(m)}}});
  this.child.stderr.on('data',()=>{}); // Never forward raw runtime diagnostics to models/logs.
  this.child.on('message',async m=>{if(this.closed||m?.type!=='query'||!Number.isSafeInteger(m.seq))return;try{const data=await broker.query(this.session,m.name,m.args);if(!this.closed&&this.child.connected)this.child.send({type:'reply',seq:m.seq,data})}catch(e){if(!this.closed&&this.child.connected)this.child.send({type:'reply',seq:m.seq,error:/^MCP_[A-Z_]+$/.test(e.message)?e.message:'MCP_READ_FAILED'})}});
  this.expiry=setTimeout(()=>this.close(),600000);this.expiry.unref();this.child.on('exit',()=>this.finish());this.child.on('error',()=>this.finish());
 }
 finish(){clearTimeout(this.expiry);this.closed=true;for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(Error('MCP_DISCONNECTED'))}this.pending.clear();if(this.broker.scope?.session===this.session)this.broker.invalidate()}
 request(method,params){if(this.closed||this.pending.size>=8)return Promise.reject(Error('MCP_DISCONNECTED'));return new Promise((resolve,reject)=>{const id=++this.next,m={jsonrpc:'2.0',id,method,...(params===undefined?{}:{params})},timer=setTimeout(()=>{this.pending.delete(id);reject(Error('MCP_CLIENT_TIMEOUT'))},7000);this.pending.set(id,{resolve,reject,timer});this.transcript.push({direction:'client',message:m});this.child.stdin.write(JSON.stringify(m)+'\n')})}
 notify(method){this.child.stdin.write(JSON.stringify({jsonrpc:'2.0',method})+'\n')}
 async initialize(){const r=await this.request('initialize',{protocolVersion:PROTOCOL,capabilities:{},clientInfo:{name:'acs-local-r1-test-client',version:'1.0.0'}});if(r.result?.protocolVersion!==PROTOCOL)throw Error('MCP_PROTOCOL');this.notify('notifications/initialized');return r}
 async call(name,args={}){return this.request('tools/call',{name,arguments:args})}
 close(){if(this.closed)return;this.finish();this.child.stdin.end();if(this.child.connected)this.child.disconnect();const child=this.child;setTimeout(()=>{if(child.exitCode===null)child.kill()},500).unref()}
}
module.exports={LocalClient};

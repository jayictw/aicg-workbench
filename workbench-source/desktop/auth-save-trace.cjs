'use strict';
// Diagnostic side channel only: never a DTO, permission or save authority.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{threadId}=require('node:worker_threads');
const cfg=require('../integration-build.json'),cache=new WeakMap();
const entries=new Set(['confirm-save','save-before-switch','flash-confirm','library-initialization','external-read-grant','external-proposal-grant','internal-read-grant','engineering-call','ipc-work-save','unidentified']);
const origins=new Set(['ui','background','engineering-test','initialization','unknown']);
const ids=new Set(['traceId','parentTraceId','operationId','libraryId','sessionId','invitationId']);
const nums=new Set(['expectedRevision','resultRevision','workerMessageId','peerPid','expiresAt','revision','inputCount']);
const bools=new Set(['scopeNotExpired','proposalGrantPresent','reportedTrustedEvent','replayed','authorized','proposalPermission','connected','prepared','dirty','saving','focused','confirm','scopePresent']);
function source(value){return {provenance:'caller-reported',entry:entries.has(value?.entry)&&value.entry!=='library-initialization'?value.entry:'unidentified',origin:origins.has(value?.origin)&&value.origin!=='initialization'?value.origin:'unknown',...(typeof value?.trustedEvent==='boolean'?{reportedTrustedEvent:value.trustedEvent}:{})}}
function fields(value={}){const out={};for(const [k,v]of Object.entries(value&&typeof value==='object'?value:{})){
 if(ids.has(k)&&typeof v==='string'&&/^(?:save-)?[a-f0-9-]{36}$/.test(v))out[k]=v;
 else if(nums.has(k)&&Number.isSafeInteger(v)&&v>=0)out[k]=v;
 else if(bools.has(k)&&typeof v==='boolean')out[k]=v;
 else if(k==='entry'&&entries.has(v)||k==='origin'&&origins.has(v))out[k]=v;
 else if(['stage','outcome','reason','method','inputType','targetEntry','provenance'].includes(k)&&typeof v==='string'&&/^[a-zA-Z0-9_-]{1,60}$/.test(v))out[k]=v;
 else if(k==='errorCode')out[k]=typeof v==='string'&&/^[A-Z][A-Z0-9_]{1,60}$/.test(v)?v:'DIAGNOSTIC_ERROR';
 }return out}
class DiagnosticTrace{
 constructor(paths,{bootId=crypto.randomUUID(),io=fs,role=threadId?'worker':'main'}={}){this.paths=paths;this.io=io;this.bootId=/^[a-f0-9-]{36}$/.test(bootId)?bootId:crypto.randomUUID();this.role=role;this.seq=0;this.failures=0;this.writes=0;this.enabled=['mcp-qa','mcp-automation'].includes(paths.mode);this.root=path.join(cfg.runtimeRoot,'auth-save-diagnostics',paths.mode||'disabled',this.bootId);this.file=path.join(this.root,role+'-'+threadId+'.jsonl');if(this.enabled)this.record('trace-start',{stage:'startup'})}
 record(event,data={}){if(!this.enabled)return;try{
  const row={version:1,bootId:this.bootId,role:this.role,pid:process.pid,threadId,mode:this.paths.mode,profile:path.relative(cfg.runtimeRoot,this.paths.profileRoot).replaceAll('\\','/'),testHooks:!!this.paths.testHooks,runClass:this.paths.testHooks?'engineering-test-profile':'ordinary-qa-profile',actorIdentity:'UNVERIFIED',seq:++this.seq,at:Date.now(),monotonicNs:process.hrtime.bigint().toString(),writeFailures:this.failures,event:/^[a-z0-9._-]{1,80}$/.test(event)?event:'diagnostic-invalid-event',...fields(data)};
  this.io.mkdirSync(this.root,{recursive:true});const fd=this.io.openSync(this.file,'a');try{this.io.writeFileSync(fd,JSON.stringify(row)+'\n');this.io.fsyncSync(fd)}finally{this.io.closeSync(fd)}this.writes++;
 }catch{this.failures++}}
 begin(kind,data={}){const traceId=fields(data).traceId||crypto.randomUUID(),base={...fields(data),traceId};this.record(kind+'.begin',base);return {traceId,base,mark:(stage,extra={})=>this.record(kind+'.stage',{...base,stage,...fields(extra)}),success:(extra={})=>this.record(kind+'.result',{...base,...fields(extra),outcome:'success-ack'}),failure:(error,extra={})=>this.record(kind+'.result',{...base,...fields(extra),errorCode:error?.message,outcome:'error-no-success-ack'})}}
 health(){return {bootId:this.bootId,writes:this.writes,failures:this.failures,seq:this.seq,healthy:this.failures===0}}
}
function getTrace(paths,options){if(!cache.has(paths))cache.set(paths,new DiagnosticTrace(paths,options));return cache.get(paths)}
module.exports={DiagnosticTrace,getTrace,source,fields};

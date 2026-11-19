'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawn}=require('node:child_process');
const runtime=require('./external-runtime.json');
const phases=new Set(['console-ready','cli-starting','cli-exited','failed']);
function alive(pid){if(!Number.isSafeInteger(pid)||pid<1)return false;try{process.kill(pid,0);return true}catch(e){return e.code==='ESRCH'?false:null}}
class CliLaunch{
 constructor({host,paths,spawnProcess=spawn,clock=Date.now,probe=alive}){this.host=host;this.paths=paths;this.spawn=spawnProcess;this.clock=clock;this.probe=probe;this.attempt=null;this.timer=null}
 emit(type,extra={}){this.host.record(type,extra)}
 start({handoff=null}={}){const h=this.host,v=h.invitation;
  if(!v||v.expiresAt<=this.clock()||h.testPolicy||!h.child||h.state!=='waiting-client')throw Error('MCP_INVITATION_EXPIRED');
  if(this.attempt?.invitationId===v.invitationId)return this.status();
  if(this.attempt){this.refresh();const a=this.attempt;if(a.consolePid&&this.probe(a.consolePid)!==false||a.uncertain||a.phase==='starting')throw Error('MCP_CLI_PREVIOUS_LAUNCH_UNCONFIRMED')}
  const attemptId=crypto.randomUUID(),report=path.join(require('../../integration-build.json').runtimeRoot,'external-launches',v.invitationId+'-'+attemptId+'.json');
  if(handoff)require('./attachment-handoff.cjs').launchPlan(handoff,v,attemptId,require('../../integration-build.json').runtimeRoot);
  const a=this.attempt={invitationId:v.invitationId,attemptId,report,phase:'starting',startedAt:this.clock(),supervisorPid:null,consolePid:null,exitCode:null,code:null,uncertain:true};
  this.emit('codex-launch-requested',{phase:a.phase,attachment:handoff?{name:handoff.name,type:handoff.type,size:handoff.size,sha256:handoff.sha256}:null});
  try{const child=this.spawn(runtime.powershell,['-NoLogo','-NoProfile','-NonInteractive','-File',path.join(__dirname,'launch-codex.ps1'),'-InvitationId',v.invitationId,'-LaunchAttemptId',attemptId],{cwd:this.paths.codeRoot,windowsHide:true,stdio:['ignore','pipe','pipe']});
   a.supervisorPid=child.pid||null;let output='';child.stdout.on('data',b=>{output+=String(b);if(output.length>4096){output='';return}const lines=output.split('\n');output=lines.pop();for(const line of lines){try{const r=JSON.parse(line);if(r.stage==='console-process-created'&&Number.isSafeInteger(r.pid)&&r.pid>0){a.consolePid=r.pid;this.emit('codex-console-process-created',{pid:r.pid})}}catch{}}});child.stderr.on('data',()=>{a.stderrObserved=true});
   child.on('error',e=>{if(this.attempt!==a)return;a.phase='failed';a.code=['ENOENT','EACCES','EPERM'].includes(e.code)?'MCP_CLI_'+e.code:'MCP_CLI_START_FAILED';a.uncertain=false;this.emit('codex-launch-failed',{phase:a.phase,code:a.code})});
   child.on('exit',code=>{if(this.attempt!==a)return;a.exitCode=Number.isInteger(code)?code:null;a.supervisorExited=true;this.emit('codex-launcher-exited',{exitCode:a.exitCode});this.refresh();if(a.phase==='starting'&&code!==0){a.phase='failed';a.code='MCP_CLI_START_FAILED';a.uncertain=false}});
   child.unref?.();
  }catch(e){a.phase='failed';a.code=['ENOENT','EACCES','EPERM'].includes(e.code)?'MCP_CLI_'+e.code:'MCP_CLI_START_FAILED';a.uncertain=false;this.emit('codex-launch-failed',{code:a.code})}
  clearInterval(this.timer);this.timer=setInterval(()=>this.status(),400);this.timer.unref?.();return this.status()
 }
 refresh(){const a=this.attempt;if(!a)return;let row=null;
  try{const s=fs.statSync(a.report);if(s.size>4096)throw Error();row=JSON.parse(fs.readFileSync(a.report,'utf8'));if(row.attemptId!==a.attemptId||row.invitationId!==a.invitationId||!phases.has(row.phase)||!Number.isSafeInteger(row.pid)||row.pid<1)throw Error();
   a.attachmentVerified=row.attachmentVerified===true;a.attachmentSha256=row.attachmentSha256??null;a.attachmentSize=row.attachmentSize??null;a.attachmentType=row.attachmentType??null;a.consolePid=row.pid;a.interactiveConsole=row.interactive===true;a.visibleConsole=row.visible===true;
   if(row.phase==='failed'){a.phase='failed';a.code=/^MCP_[A-Z_]+$/.test(row.code)?row.code:'MCP_CLI_START_FAILED';a.uncertain=false}
   else if(row.phase==='cli-exited'){a.phase='connection-unconfirmed';a.code='MCP_CLI_EXITED';a.cliExitCode=Number.isInteger(row.exitCode)?row.exitCode:null;a.uncertain=false}
   else if(a.interactiveConsole&&a.visibleConsole){a.phase='waiting-connection';a.uncertain=false}
   else {a.phase='connection-unconfirmed';a.code='MCP_CLI_CONSOLE_UNCONFIRMED'}
  }catch(e){if(e.code!=='ENOENT'){a.phase='connection-unconfirmed';a.code='MCP_CLI_STATUS_UNAVAILABLE';a.uncertain=true}}
  if(!row&&a.consolePid&&this.probe(a.consolePid)===false){a.phase='failed';a.code='MCP_CLI_CONSOLE_EXITED_BEFORE_READY';a.uncertain=false}
  const h=this.host;
  if(h.invitation?.invitationId!==a.invitationId){if(a.phase!=='failed'){a.phase='connection-unconfirmed';a.code='MCP_INVITATION_EXPIRED'}return}
  // The identity-verified pipe peer alone does not prove initialize/tools discovery.
  if(h.peer&&row&&a.interactiveConsole&&a.visibleConsole&&['console-ready','cli-starting'].includes(row.phase)){try{const file=path.join(require('../../integration-build.json').runtimeRoot,'external-protocol',a.invitationId+'.jsonl');if(fs.statSync(file).size>131072)throw Error();const rows=fs.readFileSync(file,'utf8').trim().split('\n').map(s=>JSON.parse(s));if(rows.some(r=>r.direction==='server'&&r.protocolVersion)&&rows.some(r=>r.direction==='server'&&r.toolCount===13)){a.phase='connected';a.code=null;a.uncertain=false;return}}catch{}}
  if(this.clock()-a.startedAt>45000&&!['failed','connected'].includes(a.phase)){a.phase='connection-unconfirmed';a.code=a.code||'MCP_CLI_CONNECTION_UNCONFIRMED'}
 }
 status(){this.refresh();const a=this.attempt;if(a&&this.notified!==a.phase){this.notified=a.phase;this.emit('codex-launch-state',{phase:a.phase,code:a.code})}const blocked=!!a&&(this.host.invitation?.invitationId===a.invitationId||a.uncertain||a.phase==='starting'||!!a.consolePid&&this.probe(a.consolePid)!==false);return a?{phase:a.phase,attemptId:a.attemptId,attachmentVerified:!!a.attachmentVerified,attachmentSha256:a.attachmentSha256??null,attachmentSize:a.attachmentSize??null,attachmentType:a.attachmentType??null,supervisorPid:a.supervisorPid,consolePid:a.consolePid,interactiveConsole:!!a.interactiveConsole,visibleConsole:!!a.visibleConsole,exitCode:a.exitCode,cliExitCode:a.cliExitCode??null,code:a.code,launchBlocked:blocked}: {phase:'idle',launchBlocked:false}}
 dispose(){clearInterval(this.timer);this.timer=null}
}
module.exports={CliLaunch};

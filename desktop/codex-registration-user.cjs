'use strict';
const path=require('node:path');
const {serverFor,stable,hash,planRegistration}=require('./codex-registration.cjs');
const {ConfigRpc}=require('./codex-registration-rpc.cjs');
const fail=(code,message)=>Object.assign(Error(message),{code});
const SCHEMA='aicg-user-registration-plan/v1';
const canonical=p=>path.win32.normalize(p).toLowerCase();
function projectUser(response){
 const layers=response?.layers;
 if(!Array.isArray(layers))throw fail('REGISTRATION_USER_METADATA','Official config/read must include layers');
 const users=layers.filter(l=>l?.name?.type==='user'&&!l.name.profile);
 if(users.length!==1)throw fail('REGISTRATION_USER_METADATA','Exactly one official base user layer required');
 const user=users[0],file=user.name.file;
 if(user.disabledReason||typeof file!=='string'||!path.win32.isAbsolute(file)||path.win32.basename(file).toLowerCase()!=='config.toml'||typeof user.version!=='string'||!user.version||!user.config||typeof user.config!=='object'||Array.isArray(user.config))throw fail('REGISTRATION_USER_METADATA','User layer path/version/config is unavailable or disabled');
 const source=user.config,servers=source.mcp_servers;
 if(servers!==undefined&&(!servers||typeof servers!=='object'||Array.isArray(servers)))throw fail('REGISTRATION_USER_METADATA','User MCP table has unsupported shape');
 const entry=servers?.aicg;
 const rest={...source};if(servers){rest.mcp_servers={...servers};delete rest.mcp_servers.aicg;if(Object.keys(rest.mcp_servers).length===0)delete rest.mcp_servers;}
 // Only the required entry and opaque digests leave this projection. Never log raw layers.
 return {filePath:file,version:user.version,entry,entryDigest:hash(entry),otherSettingsDigest:hash(rest),effectiveMatches:desired=>{
  try{return planRegistration({desired,currentAicg:response.config?.mcp_servers?.aicg,currentVersion:'projection',expectedVersion:'projection'}).status==='unchanged';}catch{return false;}
 }};
}
const digestPlan=plan=>{const copy={...plan};delete copy.digest;return hash(copy);};
async function readUser(rpc,cwd){return projectUser(await rpc.call('config/read',{cwd,includeLayers:true}));}
async function makeUserPlan({rpc,cwd,root}){
 const user=await readUser(rpc,cwd),entry=serverFor(root);
 const change=planRegistration({desired:entry,currentAicg:user.entry,currentVersion:user.version,expectedVersion:user.version});
 const plan={schema:SCHEMA,targetPath:user.filePath,keyPath:'mcp_servers.aicg',entry,expectedVersion:user.version,currentEntryDigest:user.entryDigest,otherSettingsDigest:user.otherSettingsDigest,action:change.status==='unchanged'?'noop':'add',effectiveMatchesDesired:user.effectiveMatches(entry),scope:'user-config-only',reloadUserConfig:false};
 return {...plan,digest:digestPlan(plan)};
}
function validatePlan(plan,root){
 if(!plan||plan.schema!==SCHEMA||plan.keyPath!=='mcp_servers.aicg'||plan.scope!=='user-config-only'||plan.reloadUserConfig!==false||!['add','noop'].includes(plan.action)||typeof plan.expectedVersion!=='string'||!plan.expectedVersion||plan.digest!==digestPlan(plan)||stable(plan.entry)!==stable(serverFor(root)))throw fail('REGISTRATION_PLAN_INVALID','Plan changed or targets a different reviewed connector; create a new plan');
}
function stateCheck(user,plan){
 let entryMatches=false;try{entryMatches=planRegistration({desired:plan.entry,currentAicg:user.entry,currentVersion:user.version,expectedVersion:user.version}).status==='unchanged';}catch{}
 return {sameOfficialUserPath:canonical(user.filePath)===canonical(plan.targetPath),entryMatches,otherSettingsUnchanged:user.otherSettingsDigest===plan.otherSettingsDigest,effectiveMatchesDesired:user.effectiveMatches(plan.entry),version:user.version};
}
async function applyUserPlan({rpc,cwd,root,plan,confirmed=false}){
 validatePlan(plan,root);
 if(confirmed!==true)throw fail('REGISTRATION_CONFIRM_REQUIRED','Review the plan and pass --confirm once before apply-user');
 const user=await readUser(rpc,cwd);
 if(canonical(user.filePath)!==canonical(plan.targetPath)||user.version!==plan.expectedVersion||user.entryDigest!==plan.currentEntryDigest||user.otherSettingsDigest!==plan.otherSettingsDigest)throw fail('REGISTRATION_CONFLICT','Official user configuration differs from the reviewed plan; no write attempted');
 const change=planRegistration({desired:plan.entry,currentAicg:user.entry,currentVersion:user.version,expectedVersion:plan.expectedVersion});
 if(change.status==='unchanged')return {state:'unchanged',writeAttempts:0,userLayerVerified:true,effectiveMatchesDesired:user.effectiveMatches(plan.entry),planDigest:plan.digest};
 let reply;
 try{
  reply=await rpc.call('config/batchWrite',{filePath:user.filePath,expectedVersion:plan.expectedVersion,reloadUserConfig:false,edits:change.edits});
 }catch(e){
  // Never replay a possibly committed write. One read can establish current state, not authorship.
  let observed;try{observed=stateCheck(await readUser(rpc,cwd),plan);}catch{observed={readUnavailable:true};}
  return {state:'write-error-or-unknown',writeAttempts:1,retryAllowed:false,planDigest:plan.digest,error:{code:e.code??'REGISTRATION_WRITE_UNKNOWN',configWriteErrorCode:typeof e.rpcData?.config_write_error_code==='string'?e.rpcData.config_write_error_code:null},observed,ownWriteAttribution:'unknown'};
 }
 let observed;try{observed=stateCheck(await readUser(rpc,cwd),plan);}catch{return {state:'postwrite-read-unknown',writeAttempts:1,retryAllowed:false,planDigest:plan.digest};}
 const acknowledgementValid=reply&&['ok','okOverridden'].includes(reply.status)&&typeof reply.filePath==='string'&&canonical(reply.filePath)===canonical(user.filePath)&&typeof reply.version==='string'&&reply.version===observed.version;
 if(!acknowledgementValid||!observed.sameOfficialUserPath||!observed.entryMatches||!observed.otherSettingsUnchanged)return {state:'postwrite-verification-failed',writeAttempts:1,retryAllowed:false,planDigest:plan.digest,acknowledgementValid:!!acknowledgementValid,observed};
 return {state:observed.effectiveMatchesDesired&&reply.status==='ok'?'registered':'registered-but-overridden',writeAttempts:1,userLayerVerified:true,otherSettingsUnchanged:true,effectiveMatchesDesired:observed.effectiveMatchesDesired,version:observed.version,planDigest:plan.digest,reloadOtherSessions:false};
}
async function checkUserPlan({rpc,cwd,root,plan}){validatePlan(plan,root);return {state:'read-only-reconciliation',...stateCheck(await readUser(rpc,cwd),plan),writeAttempts:0,ownWriteAttribution:'not-established'};}
async function withUserRpc({cwd,run,rpcFactory=o=>new ConfigRpc(o)}){const rpc=rpcFactory({cwd});let result,closed;try{await rpc.initialize();result=await run(rpc);}finally{closed=await rpc.close();}return {...result,configServerClose:closed};}
module.exports={makeUserPlan,applyUserPlan,checkUserPlan,withUserRpc,projectUser,digestPlan};

'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),c=require('./d1-json.cjs'),price=require('./price-contract.cjs'),am=require('./live-authority.cjs'),network=require('./uk-network.cjs'),{writeJSON,observeTransport}=require('./studio-six-runner.cjs');
const fail=code=>{throw Object.assign(Error(code),{code})};
function requireExisting(paths){
 for(const name of ['credential-domain.v1.json','unified-actions.v2.sqlite','unified-actions.v2.owner.json','source-admissions.v1.sqlite','source-admissions.owner.json','security/credentials.v2.bin','security/credentials.v2.owner.json']){const file=path.join(paths.profileRoot,name);require('./runtime-paths.cjs').boundary(file);if(!fs.existsSync(file)||!fs.statSync(file).isFile()||fs.statSync(file).nlink!==1)fail('MANUAL_ORIGINAL_FILES_REQUIRED')}
}
async function openExisting({service,policy,paths,root,libraryDir,controlledBoundary,testTimeoutMs}){
 let repo,source,pipeline;
 try{
  policy.attach(service.ledger);const state=policy.check(),old=state.attempts[0],dir=libraryDir||path.join(paths.librariesRoot,'studio-six-byteplus-b6d2');
  if(!fs.existsSync(dir)||fs.realpathSync.native(dir).toLowerCase()!==old.owner.canonicalPath)fail('MANUAL_ORIGINAL_LIBRARY_REQUIRED');
  repo=new(require('./repository.cjs').Repository)(dir,async()=>{},{runtimeMode:paths.mode,sourceEvidence:paths.sourceEvidence,identityKind:paths.identityKind,buildId:paths.buildId});repo.open();
  if(repo.identity.libraryId!==old.owner.libraryId||old.owner.taskId!==policy.plan.cases[0].taskId)fail('MANUAL_ORIGINAL_LIBRARY_REQUIRED');
  const now={cap:repo.cap,libraryId:repo.identity.libraryId,location:dir,blocked:false,switching:false};source=new(require('./d1-controller.cjs').SourceController)({profileRoot:service.vault.profileRoot,current:()=>now,readCore:async(method,args)=>repo[method](...(method==='receipt'?[args.id]:[]))});
  source.checkReservation(old);
  const scope={cap:now.cap,taskId:old.owner.taskId,viewId:crypto.randomUUID()};await source.bind(scope);
  const quote={version:2,revision:1,estimateState:'reference',currency:'CNY',expectedMinor:36,budgetMinor:policy.approval.budgetMinor,priceSource:price.PRICE,priceCheckedDate:'2026-10-27'},authority=new(policy.test?am.ControlledConfirmationAuthority:am.LiveAuthority)({inputPolicy:service.inputPolicy,quote:price.base(quote)});
  const transport=observeTransport(new(require('./restricted-https.cjs').RestrictedHttpsTransport)({studioBoundary:controlledBoundary||network.studioBoundary(policy),...(policy.test&&testTimeoutMs?{totalMs:testTimeoutMs,connectMs:Math.min(3000,testTimeoutMs)}:{})}),root);
  pipeline=new(require('./image-pipeline.cjs').ImagePipeline)({service,source,transport,authority,reviewPolicy:()=>quote,studioRunPolicy:policy});const configs=await pipeline.configs(scope);if(configs.length!==1||configs[0].configId!==old.configId)fail('MANUAL_ORIGINAL_CONFIGURATION_REQUIRED');
  const context={service,policy,paths,root,repo,source,pipeline,scope,quote,configId:old.configId,close(){policy.stop();pipeline.close();source.close();repo.close()}};
  if(!state.attempts.slice(1).some(a=>a.execution.phase!=='completed'))await preflight(context);return context;
 }catch(e){pipeline?.close();source?.close();repo?.close();throw e}
}
async function preflight(ctx){const {service,source,policy,scope,quote,root}=ctx;let read;try{
 const before=service.ledger.read(),sourceBefore=source.read(),remaining=policy.approval.lifetimeMaxPosts-before.attempts.length;
 if(remaining<0||sourceBefore.rows.length+remaining>16)fail('MANUAL_SOURCE_CAPACITY');
 read=await service.vault.read();const config=read.data.configs.find(x=>x.configId===ctx.configId),credential=read.data.credentials.find(x=>x.credentialId===config?.credentialId),old=before.attempts[0];if(!config||!credential||!c.same(old.execution.config,config)||!c.same(old.ref,Object.fromEntries(require('./uk-vault.cjs').REF.map(k=>[k,credential[k]]))))fail('MANUAL_CREDENTIAL_CHANGED');
 const shadow=Object.create(Object.getPrototypeOf(service.ledger));shadow.session=service.ledger.session;let state=structuredClone(before);shadow.tx=fn=>{const out=fn(state);state.revision++;return out};const sizes=[];
 for(const cell of policy.plan.cases.slice(before.attempts.length-1,policy.approval.maxNewPosts)){const effective=structuredClone(cell.effective);if(policy.test)effective.target.adapterId='ark-images-offline-v1';shadow.prepareWorkspace({config,credential,owner:source.view(scope.cap,scope.taskId,scope.viewId),viewId:scope.viewId,bindingGeneration:source.bindingGeneration,cap:scope.cap,effective,kind:policy.test?'ark-image-qa-confirmed':'ark-image-provider',quote,credentialDisplay:{credentialName:credential.displayName,accountAlias:credential.accountAlias},studioReferenceBase64:cell.packet.referenceBase64??null});sizes.push(Buffer.byteLength(c.jcs(state)))}
 // Reserve 8 KiB per pending output for authorization, TLS provenance and final outcome.
 if(Buffer.byteLength(c.jcs(state))+remaining*8192>3*1024*1024||!c.same(before,service.ledger.read())||!c.same(sourceBefore,source.read()))fail('MANUAL_CAPACITY');
 const evidence={state:'PASS',historicalAttempts:1,preservedAttempts:before.attempts.length,pendingNew:remaining,predictedLedgerBytesByStep:sizes,reservedCompletionBytes:remaining*8192,conservativeTotalBytes:Buffer.byteLength(c.jcs(state))+remaining*8192,limitBytes:3*1024*1024,sourceRowsAfter:sourceBefore.rows.length+remaining,sourceLimit:16,attemptLimit:16,sqliteLimitBytes:8*1024*1024,outputLimitEachBytes:8*1024*1024,originalLedgerUnchanged:true,originalSourceUnchanged:true};writeJSON(path.join(root,'capacity-preflight.json'),evidence);return evidence;
 }finally{for(const item of read?.data?.credentials||[])item.secret=undefined;read=undefined}}
module.exports={requireExisting,openExisting,preflight};

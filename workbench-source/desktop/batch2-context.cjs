'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),pm=require('./batch2-policy.cjs'),{Repository}=require('./repository.cjs'),{SourceController}=require('./d1-controller.cjs'),{ImagePipeline}=require('./image-pipeline.cjs'),{RestrictedHttpsTransport}=require('./restricted-https.cjs'),network=require('./uk-network.cjs'),am=require('./live-authority.cjs'),price=require('./price-contract.cjs');
async function createContext({service,policy,paths,root}){
 if(!pm.branded(policy)||policy.test)throw Error('B2_NATIVE_POLICY');policy.attach(service.ledger);const before=policy.check();if(before.attempts.length!==38||fs.existsSync(path.join(root,'execution-record.json')))throw Error('B2_ALREADY_STARTED');
 const resources={runtimeMode:paths.mode,sourceEvidence:paths.sourceEvidence,identityKind:paths.identityKind,buildId:paths.buildId},dir=pm.RETAINED_LIBRARY,repo=new Repository(dir,async()=>{},resources);repo.open();let source,pipeline;
 try{
  const owner=before.attempts[13].owner,taskId=policy.plan.cases[0].taskId;
  if(repo.identity.libraryId!==owner.libraryId||owner.canonicalPath!==fs.realpathSync.native(dir).toLowerCase()||owner.taskId!==taskId)throw Error('B2_ORIGINAL_OWNER');
  const now={cap:repo.cap,libraryId:repo.identity.libraryId,location:dir,blocked:false,switching:false};source=new SourceController({profileRoot:service.vault.profileRoot,current:()=>now,readCore:async(method,args)=>{if(!['load','receipt'].includes(method))throw Error('B2_REPOSITORY_READ_ONLY');return repo[method](...(method==='receipt'?[args.id]:[]))}});
  const scope={cap:now.cap,taskId,viewId:crypto.randomUUID()};await source.bind(scope);
  const quote={version:2,revision:1,estimateState:'reference',currency:'CNY',expectedMinor:12,budgetMinor:policy.approval.batchBudgetMinor,priceSource:price.PRICE,priceCheckedDate:'2026-10-26'},authority=new am.LiveAuthority({inputPolicy:service.inputPolicy,quote:price.base(quote)}),transport=require('./batch2-runner.cjs').observeTransport(new RestrictedHttpsTransport({studioBoundary:network.studioBoundary(policy)}),root);
  pipeline=new ImagePipeline({service,source,transport,authority,reviewPolicy:()=>quote,studioRunPolicy:policy});const configs=await pipeline.configs(scope);if(configs.length!==1||configs[0].configId!==before.attempts[0].configId)throw Error('B2_CONFIGURATION_AMBIGUOUS');
  require('./batch2-runner.cjs').writeJSON(path.join(root,'HISTORICAL-BASELINE-CHECK.json'),{status:'PASS',batch:2,retainedAttempts:38,retainedSubmits:38,oldRowHashes:policy.historyHashes,ownerUnchanged:true,unknownCase:'S2-D-2',unknownAttemptId:before.attempts[37].id,unknownRequestId:before.attempts[37].execution.request.requestId,officialRequests:0,credentialSecretRecorded:false});
  return {service,policy,paths,root,repo,source,scope,quote,pipeline,configId:configs[0].configId,close(){pipeline.close();source.close();repo.close()}};
 }catch(e){pipeline?.close();source?.close();repo.close();throw e}
}
module.exports={createContext};

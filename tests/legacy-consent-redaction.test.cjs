'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..');
const consent=require('../workbench-source/desktop/manual-consent.cjs');
test('legacy consent preserves exports but cannot mint approval',()=>{
  assert.deepEqual(Object.keys(consent).sort(),['TEXT','approval']);
  assert.equal(typeof consent.TEXT,'string');
  for(const data of [undefined,{}, {seal:{runId:'synthetic',sha256:'synthetic'},m:{route:{}}}]){
    assert.throws(()=>consent.approval(data),{code:'LEGACY_MANUAL_APPROVAL_UNAVAILABLE'});
  }
  const source=fs.readFileSync(path.join(base,'workbench-source/desktop/manual-consent.cjs'),'utf8');
  assert.doesNotMatch(source,/ep-\d{14}-|budgetMinor|uploadConsent|credentialUseConsent/);
});
test('legacy caller stops before writing approval or opening sender',async()=>{
  let writes=0,opened=0,validated=0;
  const task={manualTaskId:'synthetic-task',previewDigest:'synthetic-digest',effective:{target:'image',studio:{originalText:'synthetic',automaticText:'',manualText:''}},wireBody:{prompt:'synthetic'},group:'A',historical:{}};
  const data={seal:{runId:'synthetic',sha256:'synthetic',root:'synthetic'},tasks:[task],m:{route:{logicalModel:'synthetic'}}};
  const fakeFs={existsSync:()=>false,openSync:()=>{writes++;throw Error('unexpected write');}};
  const policy={approvalFile:()=> 'synthetic-approval.json',validateApproval:()=>{validated++;throw Error('unexpected approval');}};
  const mod={exports:{}};
  vm.runInNewContext(fs.readFileSync(path.join(base,'workbench-source/desktop/endpoint-ui-controller.cjs'),'utf8'),{module:mod,exports:mod.exports,Buffer,require:n=>{
    if(n==='node:fs')return fakeFs;
    if(n==='./endpoint-plan.cjs')return {load:()=>data};
    if(n==='./endpoint-policy.cjs')return policy;
    if(n==='./manual-consent.cjs')return consent;
    if(n==='node:path'||n==='node:crypto')return require(n);
    throw Error('unexpected require: '+n);
  }});
  const controller=mod.exports.create({openEngine:async()=>{opened++;throw Error('unexpected sender');}});
  const preview=controller.preview(task.manualTaskId);
  await assert.rejects(controller.send(task.manualTaskId,preview.previewDigest,true),{code:'LEGACY_MANUAL_APPROVAL_UNAVAILABLE'});
  assert.equal(writes,0);assert.equal(opened,0);assert.equal(validated,0);assert.equal(controller.state().stopped,true);
});

'use strict';
const fs=require('node:fs'),path=require('node:path'),c=require('./d1-json.cjs'),seal=require('./manual-task-seal.cjs');
const fail=code=>{throw Object.assign(Error(code),{code})};
function load(){
 const raw=fs.readFileSync(path.join(seal.root,'manual-task-manifest.json'));if(c.hash(raw)!==seal.sha256)fail('MANUAL_PLAN_CHANGED');const m=JSON.parse(raw),planBytes=fs.readFileSync(path.join(seal.root,'frozen-source-plan.json')),summaryBytes=fs.readFileSync(path.join(seal.root,'historical-execution-summary.json'));
 if(c.hash(planBytes)!==m.sourcePlanSha256||c.hash(summaryBytes)!==m.sourceExecutionSummarySha256)fail('MANUAL_HISTORY_CHANGED');const original=JSON.parse(planBytes),history=JSON.parse(summaryBytes);
 if(history.actualRequestCount!==1||history.sha256!==m.sourceRecordSha256||c.hash(fs.readFileSync(history.sourceFile))!==history.sha256||m.tasks.length!==6)fail('MANUAL_HISTORY_CHANGED');
 const tasks=m.tasks.map(entry=>{if(!/^manual-(level|high)-[ABC]\.json$/.test(entry.file))fail('MANUAL_PATH');const b=fs.readFileSync(path.join(seal.root,'tasks',entry.file));if(c.hash(b)!==entry.sha256)fail('MANUAL_TASK_CHANGED');const t=JSON.parse(b),o=original.cases.find(x=>x.caseId===t.caseId),expected=structuredClone(o?.effective);if(!o)fail('MANUAL_CASE');expected.target.requestedModel=m.route.model;expected.target.adapterVersion=2;
  if(t.manualTaskId!==entry.id||!c.same(t.effective,expected)||!c.same(t.wireBody,{...o.wireBody,model:m.route.model})||t.originalWireBodySha256!==o.wireBodySha256||t.wireBodySha256!==c.hash(Buffer.from(JSON.stringify(t.wireBody)))||t.referenceSha256!==o.referenceSha256||t.sceneTaskId!==o.taskId||!c.same(t.historical,history.records.find(x=>x.caseId===t.caseId)))fail('MANUAL_BINDING');
  for(const name of [t.camera+'.reference.png',t.camera+'.source.json'])if(c.hash(fs.readFileSync(path.join(seal.root,'inputs',name)))!==original.inputHashes[name])fail('MANUAL_INPUT_CHANGED');return {...t,packet:o.packet,taskId:o.taskId};
 });
 return {m,original,history,tasks,seal};
}
module.exports={load};

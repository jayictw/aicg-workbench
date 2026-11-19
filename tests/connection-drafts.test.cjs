'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {ApiUiService}=require('../desktop/api-ui-service.cjs');
const root=path.resolve(__dirname,'../../runtime/tests/connection-drafts');fs.mkdirSync(root,{recursive:true});
function setup(){const file=path.join(fs.mkdtempSync(path.join(root,'fixture-')),'settings.json');return {file,s:new ApiUiService(file)};}
const draft={id:'draft-synthetic',kind:'CUSTOM',name:'Synthetic gateway',baseUrl:'https://gateway.example.invalid/v1',protocolId:'UNKNOWN',protocolVersion:'UNKNOWN',modelName:'Synthetic image',wireId:'Org/Test:model.v2',region:'UNKNOWN',mediaKind:'IMAGE',selectorKind:'MODEL_ID',authType:'BEARER',operationPath:'/images/generate'};
const context={owner:{libraryId:'l',copyId:'c',projectId:'p',graphId:'g',nodeId:'n'},mediaKind:'IMAGE',assets:[]};
test('custom and local drafts are user-editable, round trip exactly and never become executable routes',()=>{
 const {s,file}=setup(),created=s.saveFromUi({expectedRevision:0,connectionDraft:draft});
 assert.deepEqual(created.localDrafts,[{...draft,transport:'NOT_IMPLEMENTED'}]);assert.deepEqual(created.config.routings,[]);
 const reopened=new ApiUiService(file),local={...draft,id:'draft-local',kind:'LOCAL',baseUrl:'http://127.0.0.1:8188',authType:'NONE'};
 reopened.saveFromUi({expectedRevision:1,connectionDraft:local});
 const saved=reopened.saveFromUi({expectedRevision:2,connectionDraft:{...draft,modelName:'Renamed synthetic model'}});
 assert.equal(saved.localDrafts.length,2);assert.equal(saved.localDrafts[0].modelName,'Renamed synthetic model');assert.equal(saved.localDrafts[1].baseUrl,local.baseUrl);
 assert.deepEqual(saved.routeCapabilities,{});assert.deepEqual(saved.tasks,[]);assert.deepEqual(saved.bindings,{});
 assert.equal(reopened.preview({routingId:'local:'+local.id,configRevision:3,mode:'TEXT_TO_IMAGE',prompt:'synthetic',overrides:{},selectedImages:[]},context).code,'LOCAL_TRANSPORT_NOT_IMPLEMENTED');
 assert.throws(()=>reopened.bind({routingId:'local:'+local.id,expectedRevision:3,mode:'TEXT_TO_IMAGE'},context),{code:'LOCAL_TRANSPORT_NOT_IMPLEMENTED'});
});
test('historical drafts remain locked and survive the new draft save',()=>{
 const {s,file}=setup(),old={id:'historical',name:'retained',baseUrl:'http://localhost:8188',protocolId:'UNKNOWN',modelName:'retained',wireId:'historical/ID',region:'UNKNOWN'};
 s.save({expectedRevision:0,localDrafts:[old]});
 assert.throws(()=>s.saveFromUi({expectedRevision:1,connectionDraft:{...draft,id:old.id}}),{code:'HISTORICAL_CONFIG_READ_ONLY'});
 assert.throws(()=>s.saveFromUi({expectedRevision:1,localDrafts:[]}),{code:'HISTORICAL_CONFIG_READ_ONLY'});
 s.saveFromUi({expectedRevision:1,connectionDraft:draft});assert.deepEqual(new ApiUiService(file).read().localDrafts[0],{...old,transport:'NOT_IMPLEMENTED'});
});
test('unsafe address, caller-supplied transport, unexpected secret field and stale saves do not mutate settings',()=>{
 const {s}=setup();
 const negatives=[
  [{...draft,baseUrl:'http://gateway.example.invalid/v1'},'CONFIG_URL_UNSAFE'],
  [{...draft,baseUrl:'http://127.0.0.1:8188'},'CONFIG_URL_UNSAFE'],
  [{...draft,baseUrl:'https://user:pass@gateway.example.invalid'},'CONFIG_URL_UNSAFE'],
  [{...draft,baseUrl:'https://gateway.example.invalid?credential=x'},'CONFIG_URL_UNSAFE'],
  [{...draft,kind:'LOCAL',baseUrl:'http://169.254.169.254'},'LOCAL_TRUST_NOT_IMPLEMENTED'],
  [{...draft,operationPath:'//outside.invalid/path'},'CONFIG_PATH_UNSAFE'],
  [{...draft,transport:'SUPPORTED'},'UI_FIELD_UNSUPPORTED'],
  [{...draft,apiKey:'synthetic credential'},'UI_FIELD_UNSUPPORTED'],
 ];
 for(const [connectionDraft,code] of negatives)assert.throws(()=>s.saveFromUi({expectedRevision:0,connectionDraft}),{code});
 assert.equal(s.read().revision,0);assert.deepEqual(s.read().localDrafts,[]);
 s.saveFromUi({expectedRevision:0,connectionDraft:draft});
 assert.throws(()=>s.saveFromUi({expectedRevision:0,connectionDraft:draft}),{code:'CONFIG_REVISION_CONFLICT'});
 assert.throws(()=>s.saveFromUi({expectedRevision:1,connectionDraft:draft,defaults:{}}),{code:'UI_FIELD_UNSUPPORTED'});
 assert.equal(s.read().revision,1);
});

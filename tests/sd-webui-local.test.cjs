'use strict';
const assert=require('node:assert/strict'),{test}=require('node:test');
const {localSdOrigin}=require('../desktop/api-config.cjs');
const {prepare,reference}=require('../desktop/sd-webui-provider.cjs');
const provider={providerId:'p',kind:'CUSTOM',displayName:'Stable Diffusion'};
const connection={providerId:'p',connectionId:'c',protocolId:'sd-webui-v1',protocolVersion:'1',baseUrl:'http://127.0.0.1:7860',authType:'NONE',credentialRequired:false,region:'LOCAL',revision:1,displayName:'SD'};
const model={modelId:'m',catalogProviderId:'p',mediaKind:'IMAGE',displayName:'Named model'};
const routing={routingId:'r',modelId:'m',connectionId:'c',regionBinding:'LOCAL',selector:{kind:'MODEL_ID',wireModelId:'fixture.safetensors [1234567890]'},operations:{submit:{method:'POST',path:'/sdapi/v1/txt2img'}},adapterBinding:{adapterId:'UNSUPPORTED',adapterVersion:'1'},revision:1};
const config={providers:[provider],connections:[connection],models:[model],routings:[routing],revision:1},ctx={owner:{},mediaKind:'IMAGE',assets:[]},req={routingId:'r',mode:'TEXT_TO_IMAGE',prompt:'Synthetic yellow square',selectedImages:[],overrides:{}};
test('only literal loopback ports can be configured',()=>{
 assert.equal(localSdOrigin('http://127.0.0.1:8081/'),'http://127.0.0.1:8081');
 for(const v of ['https://127.0.0.1:7860','http://localhost:7860','http://127.1:7860','http://127.0.0.1:0','http://127.0.0.1:7860/path','http://127.0.0.1:7860#x','http://127.0.0.1@outside.invalid','http://192.168.1.1:7860'])assert.throws(()=>localSdOrigin(v),{code:'CONFIG_URL_UNSAFE'});
});
test('text-only SD request is exact, one output and no global settings override',async()=>{
 const x=await prepare(config,req,ctx);assert.equal(x.ok,true,x.code);assert.equal(x.summary.protocol,'SD_WEBUI_LOCAL');assert.equal(x.plan.url,connection.baseUrl+'/sdapi/v1/txt2img');
 const p=JSON.parse(x.requestJson);assert.equal(p.prompt,req.prompt);assert.equal(p.batch_size,1);assert.equal(p.n_iter,1);assert.equal(p.save_images,false);assert.equal(p.override_settings_restore_afterwards,true);assert.deepEqual(p.override_settings,{sd_model_checkpoint:routing.selector.wireModelId});
 assert.deepEqual(reference().modes,['TEXT_TO_IMAGE']);
});
test('unsupported mode, reference, unsafe option or endpoint never produces a dispatch preview',async()=>{
 for(const [over,expected]of [[{mode:'IMAGE_REFERENCE'},'MODE_UNSUPPORTED'],[{selectedImages:[{assetId:'x'}]},'MODE_UNSUPPORTED'],[{overrides:{alwayson_scripts:'anything'}},'PARAMETER_UNSUPPORTED'],[{overrides:{width:513}},'PARAMETER_RANGE']])assert.equal((await prepare(config,{...req,...over},ctx)).code,expected);
 const other={...config,connections:[{...connection,baseUrl:'http://outside.invalid'}]};assert.equal((await prepare(other,req,ctx)).ok,false);
});
module.exports={config,req,ctx};

const fs=require('node:fs'),fsp=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),http=require('node:http'),crypto=require('node:crypto');
const {ApiUiService}=require('../desktop/api-ui-service.cjs'),{OpenAiAttempt}=require('../desktop/openai-attempt.cjs'),{SdWebUiProvider,publishSavedImage}=require('../desktop/sd-webui-provider.cjs');
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const fixturePng=Buffer.from('89504e470d0a1a0a0000000d494844520000020000000200','hex');
const inspectFixture=async file=>{const bytes=await fsp.readFile(file);return {type:'image',mime:'image/png',sha256:digest(bytes),size:bytes.length,width:512,height:512};};
const actual={owner:{libraryId:'library',projectId:'project',graphId:'graph',nodeId:'task',graphRevision:1},mediaKind:'IMAGE',assets:[],prompt:req.prompt};
function change(baseUrl){
 return {
 providers:[{...provider,identitySource:'USER',identityVerification:'USER_DECLARED'}],
 connections:[{...connection,baseUrl,adaptationStatus:'UNSUPPORTED'}],
 models:[{...model,canonicalModel:'UNKNOWN',canonicalKnowledge:'UNKNOWN',originProviderId:'UNKNOWN',modelVersion:'UNKNOWN',lifecycle:'UNKNOWN',templateRef:{templateId:'UNKNOWN',templateRevision:'1',sourceRef:'USER'}}],
 routings:[{...routing,accountScope:'UNKNOWN',routeVersion:'1',verification:{implementation:'UNSUPPORTED',accountEntitlement:'UNKNOWN',realGeneration:'NOT_RUN'}}]
 };
}
function directory(t){
 const root=fs.mkdtempSync(path.join(process.env.SD_TEST_ROOT??os.tmpdir(),'sd-ui-'));
 return root;
}
test('new settings import read-only and preserve the legacy file for rollback',t=>{
 const root=directory(t),legacy=path.join(root,'settings.json'),modern=path.join(root,'settings-v2.json');
 const before=new ApiUiService(legacy);
 const old={id:'old',name:'Original draft',baseUrl:'http://localhost:8188',protocolId:'UNKNOWN',modelName:'Original',wireId:'legacy/model',region:'UNKNOWN'};
 before.save({expectedRevision:0,localDrafts:[old]});
 const bytes=fs.readFileSync(legacy),after=new ApiUiService(modern,{legacyFile:legacy});
 assert.deepEqual(after.state,before.state);assert.equal(fs.existsSync(modern),false);
 const draft={id:'synthetic-custom',kind:'CUSTOM',name:'Custom draft',baseUrl:'https://api.example.invalid/v1',protocolId:'UNKNOWN',protocolVersion:'UNKNOWN',modelName:'Unmapped model',wireId:'new/model',region:'UNKNOWN',mediaKind:'IMAGE',selectorKind:'MODEL_ID',authType:'BEARER',operationPath:'/images'};
 after.saveFromUi({expectedRevision:1,connectionDraft:draft});
 assert.deepEqual(fs.readFileSync(legacy),bytes);assert.deepEqual(new ApiUiService(legacy).state,before.state);
 const loaded=new ApiUiService(modern,{legacyFile:legacy});
 assert.equal(loaded.read().localDrafts.length,2);
 assert.deepEqual(loaded.read().routeCapabilities,{});
 assert.equal(loaded.preview({...req,routingId:'local:'+draft.id,configRevision:2},actual).code,'LOCAL_TRANSPORT_NOT_IMPLEMENTED');
});
async function harness(t,{png=fixturePng,inspect=inspectFixture,beforeDispatch,afterGet,beforePost}={}){
 const root=directory(t),calls=[];
 let behavior='ok',confirmed=false;
 const server=http.createServer(async(request,response)=>{
  const chunks=[];for await(const c of request)chunks.push(c);
  calls.push({method:request.method,url:request.url,body:Buffer.concat(chunks).toString(),auth:request.headers.authorization});
  if(request.method==='POST')await beforePost?.();
  if(request.method==='GET'){
   await afterGet?.();
   response.end(JSON.stringify(behavior==='missing'?[]:[{title:routing.selector.wireModelId}]));
  }else if(behavior==='lost'){response.destroy();}
  else if(behavior==='redirect'){response.writeHead(307,{Location:'/must-not-follow'});response.end();}
  else response.end(JSON.stringify({images:[png.toString('base64')]}));
 });
 t.after(()=>new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve())));
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const baseUrl='http://127.0.0.1:'+server.address().port,file=path.join(root,'ui.json');
 const boot=()=>{
  const ui=new ApiUiService(file);
  ui.openaiFactory=({key,onUpdate})=>new OpenAiAttempt({root:path.join(root,key),identity:{libraryId:'library',projectId:'project'},prepareRequest:prepare,providerKind:'CUSTOM',provider:new SdWebUiProvider({origin:baseUrl,inspect}),beforeDispatch,onUpdate,authorize:async()=>confirmed});
  return ui;
 };
 const ui=boot();
 ui.saveFromUi({expectedRevision:0,change:change(baseUrl)});
 assert.deepEqual(Object.keys(ui.read().routeCapabilities.r),['TEXT_TO_IMAGE']);
 const preview=()=>ui.preview({...req,configRevision:ui.state.revision},actual),submit=p=>ui.submit({previewId:p.previewId},actual);
 return {ui,boot,calls,preview,submit,allow:()=>{confirmed=true;},set:v=>{behavior=v;},root};
}
test('settings → preview → authorization → one loopback POST → verified result and original history',async t=>{
 const h=await harness(t),p=await h.preview();assert.equal(p.ok,true,p.code);assert.equal(h.calls.length,0);
 await assert.rejects(h.submit(p),{code:'OPENAI_CONFIRMATION_CANCELLED'});assert.equal(h.calls.length,0);
 h.allow();const approved=await h.preview(),done=await h.submit(approved);
 assert.equal(done.status,'COMPLETED');assert.equal(done.result.verified,true);assert.equal(done.result.sha256,digest(fixturePng));assert.equal(done.snapshot.protocol,'SD_WEBUI_LOCAL');
 assert.deepEqual(h.calls.map(c=>[c.method,c.url]),[['GET','/sdapi/v1/sd-models'],['POST','/sdapi/v1/txt2img']]);
 assert.ok(h.calls.every(c=>c.auth===undefined));assert.equal(JSON.parse(h.calls[1].body).prompt,req.prompt);
 await assert.rejects(async()=>h.submit(approved),{code:'PREVIEW_STALE'});
 const reopened=h.boot(),history=reopened.openaiHistory(actual);assert.equal(history.length,1);
 const original=await reopened.recover({operationId:done.operationId},actual);assert.equal(original.result.sha256,done.result.sha256);assert.equal(h.calls.length,2);
 const stageCalls=[],service={graph:{revision:1,nodes:[{id:'task',kind:'generate.image',position:{x:90,y:70}}]},
  async prepare(file){assert.deepEqual(await fsp.readFile(file),fixturePng);stageCalls.push('prepare');return {token:'token',metadata:{sha256:digest(fixturePng),size:fixturePng.length}};},
  async confirm(x,options){assert.deepEqual(x,{token:'token',expectedRevision:1,position:{x:490,y:70}});assert.equal(options.independent,true);stageCalls.push('confirm');},
  async cancel(){stageCalls.push('cleanUp');}};
 const args={service,task:done,root:reopened.openaiFor(actual,'c').root,target:{nodeId:'task',expectedRevision:1},onPublished:()=>stageCalls.push('published')};
 assert.equal(await publishSavedImage({...args,guard(){}}),true);assert.deepEqual(stageCalls,['prepare','confirm','cleanUp','published']);
 let guards=0;
 assert.equal(await publishSavedImage({...args,guard(){if(++guards===2)throw Error('STALE');}}),false);
 assert.deepEqual(stageCalls.slice(4),['prepare','cleanUp']);
});
test('checkpoint absence never posts and a lost receipt is not retried after reopening',async t=>{
 const h=await harness(t);h.allow();h.set('missing');
 await assert.rejects(h.submit(await h.preview()),{code:'SD_CHECKPOINT_MISSING'});
 assert.deepEqual(h.calls.map(c=>c.method),['GET']);
 h.set('lost');const unknown=await h.submit(await h.preview());assert.equal(unknown.status,'SUBMISSION_UNKNOWN');
 const reopened=h.boot();assert.equal((await reopened.recover({operationId:unknown.operationId},actual)).status,'SUBMISSION_UNKNOWN');
 await assert.rejects(async()=>reopened.submit({previewId:(await reopened.preview({...req,configRevision:reopened.state.revision},actual)).previewId},actual),{code:'RUN_UNKNOWN_PENDING'});
 assert.deepEqual(h.calls.map(c=>c.method),['GET','GET','POST']);
});
test('a redirect is never followed, even to a route on the same loopback service',async t=>{
 const h=await harness(t);h.set('redirect');h.allow();const result=await h.submit(await h.preview());
 assert.equal(result.status,'SUBMISSION_UNKNOWN');assert.equal(result.httpStatus,307);
 assert.deepEqual(h.calls.map(c=>c.url),['/sdapi/v1/sd-models','/sdapi/v1/txt2img']);
});

test('actual local decode → committed canvas material → save and reopen', {skip:process.env.SD_DECODE_REAL!=='1'},async t=>{
 const media=require('../desktop/media.cjs'),{UnifiedService}=require('../desktop/unified-service.cjs');
 const dir=directory(t),file=path.join(dir,'512.png');
 await media.run('ffmpeg',['-hide_banner','-v','error','-f','lavfi','-i','color=c=gold:s=512x512:d=1','-frames:v','1','-threads','1',file]);
 const png=fs.readFileSync(file),h=await harness(t,{png,inspect:media.inspect});h.allow();
 const task=await h.submit(await h.preview());assert.equal(task.status,'COMPLETED');assert.equal(task.result.sha256,digest(png));
 const uid=()=>crypto.randomUUID();
 const host=new UnifiedService(path.join(dir,'project'));await host.init();t.after(()=>host.close());
 const project=uid();
 await host.workspaceCommand({commandId:uid(),expectedRevision:host.data.editRevision,operation:{type:'project-create',id:project,name:'Synthetic SD material test',description:'Isolated test'}});
 await host.selectProject(project);
 const service=host.active();
 await service.command({commandVersion:1,commandId:uid(),projectId:project,graphId:service.graph.graphId,expectedRevision:service.graph.revision,operation:{type:'node.create',kind:'generate.image',label:'Synthetic SD task',position:{x:40,y:50}}});
 const target={nodeId:service.graph.nodes[0].id,expectedRevision:service.graph.revision};
 assert.equal(await publishSavedImage({service,task,target,root:h.ui.openaiFor(actual,'c').root,guard:()=>assert.equal(service.graph.revision,target.expectedRevision),onPublished:()=>{}}),true);
 const imported=service.graph.nodes.find(n=>n.kind==='asset.image');
 assert.equal(service.graph.mediaVersions[imported.payload.mediaVersionId].sha256,digest(png));
 await host.saveFromCanvas(project,uid());await host.close();
 const reopened=new UnifiedService(path.join(dir,'project'));await reopened.init();t.after(()=>reopened.close());await reopened.selectProject(project);
 const saved=reopened.active();assert.equal(saved.graph.nodes.find(n=>n.kind==='asset.image').id,imported.id);
 await saved.checkMediaBytes(saved.graph.mediaVersions[imported.payload.mediaVersionId]);
});

test('revoking the initiating grant during checkpoint lookup prevents reservation and POST',async t=>{
 let seen,release,allowed=true;
 const lookup=new Promise(resolve=>{seen=resolve;}),hold=new Promise(resolve=>{release=resolve;});
 const h=await harness(t,{afterGet:async()=>{seen();await hold;},beforeDispatch:()=>{if(!allowed)throw Object.assign(Error('AGENT_REVOKED'),{code:'AGENT_REVOKED'});}});
 h.allow();const p=await h.preview(),pending=h.submit(p);
 await lookup;allowed=false;release();
 await assert.rejects(pending,{code:'AGENT_REVOKED'});
 assert.deepEqual(h.calls.map(x=>x.method),['GET']);
 assert.deepEqual(h.ui.openaiHistory(actual),[]);
});

test('an SD connection cannot silently change protocol under the same identity',async t=>{
 const h=await harness(t),old=h.ui.state.config.connections[0],revision=h.ui.state.revision;
 assert.throws(()=>h.ui.saveFromUi({expectedRevision:revision,change:{connections:[{...old,protocolId:'p1-01-O.I'}]}}),{code:'SD_CONNECTION_PROTOCOL_FIXED'});
 assert.equal(h.ui.state.revision,revision);
 assert.equal(h.ui.state.config.connections[0].protocolId,'sd-webui-v1');
});
test('a shared connection persists the real node on the initial dispatch projection',async t=>{
 let before,release;
 const entered=new Promise(resolve=>{before=resolve;}),hold=new Promise(resolve=>{release=resolve;});
 const h=await harness(t,{beforePost:async()=>{before();await hold;}});
 // Fill the shared runner cache with the first node, then start the second.
 assert.equal((await h.preview()).ok,true);h.allow();
 const other={...actual,owner:{...actual.owner,nodeId:'other-task'}};
 const p=await h.ui.preview({...req,configRevision:h.ui.state.revision},other),pending=h.ui.submit({previewId:p.previewId},other);
 await entered;
 try{assert.equal(h.boot().state.tasks[0].owner.nodeId,other.owner.nodeId);}
 finally{release();await pending;}
});

test('manual discovery reads only the chosen local model list and hides its paths and ambiguous titles',async t=>{
 const calls=[];
 const server=http.createServer((rq,rs)=>{
  calls.push([rq.method,rq.url,rq.headers.authorization]);
  rs.end(JSON.stringify([
   {title:'Installed checkpoint [0123456789]',filename:'D:\\local\\private.safetensors',config:'sensitive-field'},
   {title:'Duplicated title'},{title:'Duplicated title'},
   {title:'/absolute/hidden.safetensors'},
   {title:'C:\\unusable.safetensors'},
   {title:'\u001bcontrol'},
   {model_name:'missing-title'}
  ]));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>server.close(resolve)));
 const provider=new SdWebUiProvider({origin:'http://127.0.0.1:'+server.address().port});
 assert.deepEqual(await provider.listCheckpoints(),['Installed checkpoint [0123456789]']);
 assert.deepEqual(calls,[['GET','/sdapi/v1/sd-models',undefined]]);
 const remote=new SdWebUiProvider({origin:'https://outside.invalid',request:()=>assert.fail('Unsafe origin must not reach the wire')});
 await assert.rejects(remote.listCheckpoints(),{code:'CONFIG_URL_UNSAFE'});
});

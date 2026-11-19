'use strict';
// Runway's documented native-model subset. Configuration/UI, credentials,
// confirmations and the durable journal remain in their existing boundaries.
const fs=require('node:fs'),fsp=require('node:fs/promises'),path=require('node:path'),https=require('node:https'),crypto=require('node:crypto');
const {prepareGuardedRequest}=require('./api-request-guard.cjs');
const {freeze,canonical}=require('./live-policy.cjs'),secrets=require('./secret-policy.cjs');
const {lookup}=require('./official-media-policy.cjs'),{timedNext}=require('./stream-download.cjs');
const ORIGIN='https://api.dev.runwayml.com',VERSION='2024-11-06',ADAPTER='runway-native',ADAPTER_VERSION='1';
const SOURCE='https://docs.dev.runwayml.com/openapi.json',URI_MAX=5242880;
const imageRatios=['1024:1024','1080:1080','1168:880','1360:768','1440:1080','1080:1440','1808:768','1920:1080','1080:1920','2112:912','1280:720','720:1280','720:720','960:720','720:960','1680:720'];
const videoRatios=['1280:720','720:1280','1104:832','960:960','832:1104','1584:672'];
const models=Object.freeze({gen4_image:{mediaKind:'IMAGE',modes:['TEXT_TO_IMAGE','IMAGE_REFERENCE']},gen4_image_turbo:{mediaKind:'IMAGE',modes:['IMAGE_REFERENCE']},'gen4.5':{mediaKind:'VIDEO',modes:['TEXT_TO_VIDEO','FIRST_FRAME']},gen4_turbo:{mediaKind:'VIDEO',modes:['FIRST_FRAME']}});
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
const fail=(code,extra={})=>{throw Object.assign(Error(code),{code,...extra});};
function taskId(id){if(typeof id!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id))fail('RUNWAY_TASK_ID');return id;}
function outputURL(value){
 let u;try{u=new URL(value);}catch{fail('RUNWAY_OUTPUT_URL');}
 // Only an authenticated successful task may supply this transient download URL.
 if(typeof value!=='string'||value.length>16384||u.protocol!=='https:'||u.port||u.username||u.password||u.hash||!/^[-a-z0-9]+\.cloudfront\.net$/.test(u.hostname)||/[\\\x00-\x20]/.test(value))fail('RUNWAY_OUTPUT_URL');
 return u.href;
}
function resolve(config,routingId,mode){
 const r=config.routings.find(x=>x.routingId===routingId),c=config.connections.find(x=>x.connectionId===r?.connectionId),m=config.models.find(x=>x.modelId===r?.modelId),p=config.providers.find(x=>x.providerId===c?.providerId);
 if(!r||!c||!m||!p||[r,c,m,p].some(x=>x.archivedAt))fail('CONFIG_REFERENCE_MISSING');
 if(p.kind!=='ORIGINAL'||c.baseUrl!==ORIGIN||c.protocolId!=='p1-01-R'||c.protocolVersion!==VERSION||c.authType!=='BEARER'||c.credentialRequired!==true||!['UNSUPPORTED','ADAPTED','PARTIAL'].includes(c.adaptationStatus)||c.providerId!==m.catalogProviderId||r.regionBinding!==c.region||r.selector.kind!=='MODEL_ID')fail('RUNWAY_ROUTE_SCOPE');
 const wire=r.selector.wireModelId,model=Object.hasOwn(models,wire)?models[wire]:null;
 if(!model)fail('CAPABILITY_UNKNOWN');
 if(model.mediaKind!==m.mediaKind||!model.modes.includes(mode))fail('MODE_UNSUPPORTED');
 const defaultPath=model.mediaKind==='IMAGE'?'/v1/text_to_image':'/v1/text_to_video';
 if(canonical(r.operations)!==canonical({submit:{method:'POST',path:defaultPath}})||!['UNSUPPORTED',ADAPTER].includes(r.adapterBinding.adapterId)||r.adapterBinding.adapterVersion!=='1')fail('RUNWAY_ROUTE_SCOPE');
 if(m.canonicalModel!==null&&m.canonicalModel!==wire)fail('CONFIG_CANONICAL_CONFLICT');
 const submitPath=mode==='FIRST_FRAME'?'/v1/image_to_video':defaultPath;
 return freeze({ok:true,operation:'submit',method:'POST',url:ORIGIN+submitPath,wireValue:wire,placement:'body.model',providerId:p.providerId,connectionId:c.connectionId,modelId:m.modelId,routingId:r.routingId,canonicalModel:m.canonicalModel,region:c.region,authType:c.authType,credentialRequired:true,configRevision:config.revision,connectionRevision:c.revision,routingRevision:r.revision,adapterId:ADAPTER,adapterVersion:ADAPTER_VERSION,mediaKind:model.mediaKind,protocolVersion:VERSION,evidenceLevel:'IMPLEMENTED_REAL_API_NOT_RUN',realGeneration:'NOT_RUN'});
}
function reference(wire,mode){
 const model=Object.hasOwn(models,wire)?models[wire]:null;if(!model)return null;
 const image=model.mediaKind==='IMAGE',ratios=image?imageRatios:mode==='TEXT_TO_VIDEO'?videoRatios.slice(0,2):videoRatios;
 return {id:'RUNWAY_'+wire,revision:'1',knowledge:'SUPPORTED',label:'Runway '+wire+' · 官方文档能力',sources:[SOURCE],sourceRefs:[SOURCE],checkedAt:'2026-11-10',documentUpdatedAt:null,modes:[...model.modes],inputCount:{minImages:1,maxImages:3},parameters:{ratio:{type:'string',enum:[...ratios],required:true},...(!image?{duration:{type:'number',min:2,max:10,step:1,required:true}}:{}),seed:{type:'number',min:0,max:4294967295,step:1}},defaults:{ratio:image?'1024:1024':'1280:720',...(!image?{duration:5}:{})},realAPI:'NOT_RUN',accountEntitlement:'UNKNOWN'};
}
async function inspectImageBytes(source,{directory,inspect=require('./media.cjs').inspect}){
 if(!Buffer.isBuffer(source?.bytes)||!['image/png','image/jpeg'].includes(source.mime)||!path.isAbsolute(directory))fail('RUNWAY_INPUT_DECODE');
 for(let p=path.resolve(directory);;p=path.dirname(p)){if(fs.existsSync(p)&&fs.lstatSync(p).isSymbolicLink())fail('RUNWAY_INPUT_DECODE');if(path.dirname(p)===p)break;}
 await fsp.mkdir(directory,{recursive:true});const file=path.join(directory,crypto.randomUUID()+(source.mime==='image/png'?'.png':'.jpg'));let created=false;
 try{const handle=await fsp.open(file,'wx',0o600);created=true;try{await handle.writeFile(source.bytes);}finally{await handle.close();}return await inspect(file);}finally{if(created)await fsp.unlink(file);}
}
async function prepare(config,req,context,savedDefaults={},ports={}){
 let plan;try{secrets.assertSafe({req,context,savedDefaults});plan=resolve(config,req.routingId,req.mode);}catch(e){return {ok:false,code:e.code??'RUNWAY_CONFIGURATION'};}
 const cap=reference(plan.wireValue,req.mode);
 if(context?.mediaKind!==plan.mediaKind||!context.owner)return {ok:false,code:'MODEL_MEDIA_MISMATCH',capability:cap};
 if(typeof req.prompt!=='string'||req.prompt.length>1000||!req.prompt.trim()||/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(req.prompt))return {ok:false,code:'RUNWAY_PROMPT',capability:cap};
 const defaults={...cap.defaults,...savedDefaults},parameters={...defaults,...req.overrides};
 const scoped={...cap,scope:{routingId:plan.routingId,adapterId:ADAPTER,adapterVersion:ADAPTER_VERSION,operation:'submit',mode:req.mode},combinations:[],input:{mimes:['image/png','image/jpeg'],maxBytes:3932142,totalBytes:3*3932142,width:{min:1,max:8192},height:{min:1,max:8192},maxPixels:24000000,ratio:req.mode==='FIRST_FRAME'?{min:0.5,max:plan.wireValue==='gen4.5'?2:2.358}:{min:1/8192,max:8192}},request:{encoding:'BASE64_DATA_URL',maxBytes:3*URI_MAX+32768}};
 const prepared=await prepareGuardedRequest({plan,input:{mode:req.mode,prompt:req.prompt,localAssets:context.assets,selectedImages:req.selectedImages},capability:scoped,savedDefaults:defaults,overridesJson:JSON.stringify(req.overrides??{})},{...ports,serialize:(_plan,selected,params,uris)=>{
  if(uris.some(x=>x.length>URI_MAX))fail('RUNWAY_DATA_URI_LIMIT');
  return {model:plan.wireValue,promptText:req.prompt,...params,...(req.mode==='FIRST_FRAME'?{promptImage:[{uri:uris[0],position:'first'}]}:req.mode==='IMAGE_REFERENCE'?{referenceImages:uris.map(uri=>({uri}))}:{})};
 }});
 if(!prepared.ok)return {...prepared,capability:cap};
 const sources=Object.fromEntries(Object.keys(parameters).map(k=>[k,Object.hasOwn(req.overrides??{},k)?'REQUEST_OVERRIDE':Object.hasOwn(savedDefaults,k)?'USER_DEFAULT':'REFERENCE_TEMPLATE']));
 const summary={provider:'Runway',providerKind:'ORIGINAL',configRevision:plan.configRevision,connectionRevision:plan.connectionRevision,routingRevision:plan.routingRevision,authType:plan.authType,connection:config.connections.find(c=>c.connectionId===plan.connectionId).displayName,connectionId:plan.connectionId,routingId:plan.routingId,region:plan.region,modelName:plan.wireValue,canonicalModel:plan.canonicalModel,wireSelector:{kind:'MODEL_ID',wireModelId:plan.wireValue},mode:req.mode,prompt:req.prompt,images:prepared.images.map(({assetId,role,sha256,sequenceIndex})=>({assetId,role,sha256,sequenceIndex})),parameters:prepared.parameters,parameterSources:sources,outputCount:1,reference:{id:cap.id,revision:cap.revision,knowledge:cap.knowledge,sources:cap.sources},protocol:'RUNWAY_OFFICIAL',protocolVersion:VERSION,adapterId:ADAPTER,adapterVersion:ADAPTER_VERSION,operationPath:new URL(plan.url).pathname,requestSHA256:hash(prepared.requestJson),cost:'UNKNOWN',accountEntitlement:'UNKNOWN',realAPI:'NOT_RUN'};
 return freeze({...prepared,plan,summary});
}
function nativeEnabled(){const b=require('../integration-build.json');return b.offlineOnly!==true&&b.supplierAPIEnabled===true;}
function nativeRequest({url,method,headers,body,phase,signal,timeoutMs,maxBytes}){
 if(!nativeEnabled())fail('RUNWAY_NETWORK_DISABLED');
 if(phase==='download')outputURL(url);else if(![ORIGIN+'/v1/text_to_image',ORIGIN+'/v1/text_to_video',ORIGIN+'/v1/image_to_video'].includes(url)&&!(method==='GET'&&new RegExp('^'+ORIGIN+'/v1/tasks/[a-fA-F0-9-]{36}$').test(url)))fail('RUNWAY_ROUTE_SCOPE');
 return new Promise((resolve,reject)=>{
  let settled=false,response;const finish=(err,value)=>{if(settled)return;settled=true;clearTimeout(timer);err?reject(err):resolve(value);};
  const req=https.request(url,{method,headers,agent:false,rejectUnauthorized:true,minVersion:'TLSv1.2',maxHeaderSize:16384,lookup,signal},res=>{
   response=res;const chunks=[];let size=0;
   res.on('data',b=>{size+=b.length;if(size>maxBytes){res.destroy();finish(Object.assign(Error('RUNWAY_RESPONSE_LIMIT'),{code:'RUNWAY_RESPONSE_LIMIT'}));}else chunks.push(b);});
   res.on('end',()=>finish(null,{status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks)}));res.on('error',()=>finish(Error('RUNWAY_NETWORK_UNKNOWN')));res.on('aborted',()=>finish(Error('RUNWAY_NETWORK_UNKNOWN')));
  });
  const timer=setTimeout(()=>{req.destroy();response?.destroy();finish(Error('RUNWAY_TIMEOUT'));},timeoutMs);
  req.on('error',()=>finish(Error('RUNWAY_NETWORK_UNKNOWN')));req.end(body??undefined);
 });
}
function safeToken(value){return typeof value==='string'&&/^[A-Za-z0-9_.:-]{1,120}$/.test(value)&&!secrets.contains(value)?value:null;}
function diagnostic(r,body){const headers=r?.headers??{},key=Object.keys(headers).find(k=>k.toLowerCase()==='x-request-id');return {httpStatus:Number.isInteger(r?.status)?r.status:null,providerCode:safeToken(body?.reason??body?.failureCode),requestId:safeToken(headers[key])};}
class RunwayProvider{
 #outputs=new Map();
 constructor({credential,request,inspect=require('./media.cjs').inspect,apiTimeoutMs=180000}={}){if(typeof credential!=='function'||request!==undefined&&typeof request!=='function'||!Number.isSafeInteger(apiTimeoutMs)||apiTimeoutMs<1||apiTimeoutMs>180000)fail('RUNWAY_CREDENTIAL_PORT');this.credential=credential;this.request=request??nativeRequest;this.inspect=inspect;this.injected=!!request;this.apiTimeoutMs=apiTimeoutMs;}
 async binding(){return this.credential('query',secret=>{if(typeof secret!=='string'||!secret.length)fail('CREDENTIAL_REQUIRED');return hash(secret);});}
 assertDispatchEnabled(){if(!this.injected&&!nativeEnabled())fail('RUNWAY_NETWORK_DISABLED');}
 async api(method,url,body,consume){
  if(!this.injected&&!nativeEnabled())fail('RUNWAY_NETWORK_DISABLED');
  const outcome=await this.credential(method==='POST'?'submit':'query',async secret=>{
   if(typeof secret!=='string'||secret.length<16||secret.length>4096||/[^\x21-\x7e]/.test(secret))fail('CREDENTIAL_REQUIRED');
   try{
    const controller=new AbortController(),timeoutMs=Math.min(this.apiTimeoutMs,method==='POST'?180000:15000);let r;
    try{const work=()=>this.request({url,method,headers:{Authorization:'Bearer '+secret,'X-Runway-Version':VERSION,'Content-Type':'application/json'},body,phase:method==='POST'?'submit':'query',timeoutMs,maxBytes:65536,automaticPostRetries:0,signal:controller.signal});r=(await timedNext({next:async()=>({done:false,value:await work()})},{ms:timeoutMs})).value;}finally{controller.abort();}
    if(!Buffer.isBuffer(r?.body)||r.body.length>65536)fail('RUNWAY_RESPONSE_INVALID');
    let parsed;try{parsed=JSON.parse(r.body.toString('utf8'));}catch{fail('RUNWAY_RESPONSE_INVALID');}
    if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))fail('RUNWAY_RESPONSE_INVALID');
    const d=diagnostic(r,parsed);if(r.status!==200)fail('RUNWAY_HTTP',d);
    if(secrets.contains(parsed))fail('RUNWAY_SENSITIVE_RESPONSE');
    const result=consume(parsed);return secrets.assertSafe({ok:true,value:{...result,...d,providerCode:d.providerCode??result.providerCode??null}});
   }catch(e){
    // Vault intentionally masks thrown callback errors. Cross that unchanged
    // boundary with safe data, then restore the typed Runway error outside it.
    return secrets.assertSafe({ok:false,error:{code:/^RUNWAY_[A-Z_]+$/.test(e.code??'')?e.code:'RUNWAY_NETWORK_UNKNOWN',httpStatus:Number.isInteger(e.httpStatus)?e.httpStatus:null,providerCode:safeToken(e.providerCode),requestId:safeToken(e.requestId)}});
   }
  });
  if(outcome?.ok!==true)fail(outcome?.error?.code??'RUNWAY_NETWORK_UNKNOWN',{httpStatus:outcome?.error?.httpStatus??null,providerCode:outcome?.error?.providerCode??null,requestId:outcome?.error?.requestId??null});
  return outcome.value;
 }
 async submit(prepared){
  const {plan,requestJson}=prepared;if(!prepared.ok||!plan?.ok||plan.url!==ORIGIN+prepared.summary.operationPath||hash(requestJson)!==prepared.summary.requestSHA256)fail('RUNWAY_REQUEST_INVALID');
  return this.api('POST',plan.url,requestJson,body=>({taskId:taskId(body.id)}));
 }
 async query(id){taskId(id);this.#outputs.delete(id);return this.api('GET',ORIGIN+'/v1/tasks/'+id,undefined,body=>{
  if(body.id!==id)fail('RUNWAY_TASK_ID');
  if(!['PENDING','THROTTLED','RUNNING','SUCCEEDED','FAILED','CANCELLED'].includes(body.status))fail('RUNWAY_STATUS_UNKNOWN');
  if(body.status==='SUCCEEDED'){
   if(!Array.isArray(body.output)||body.output.length!==1)fail('RUNWAY_OUTPUT_COUNT');this.#outputs.set(id,outputURL(body.output[0]));
  }
  return {taskId:id,remoteStatus:body.status,providerCode:safeToken(body.failureCode),hasOutput:body.status==='SUCCEEDED'};
 });}
 async download(id,root,mediaKind,expected={}){
  taskId(id);const url=this.#outputs.get(id);if(!url)fail('RUNWAY_OUTPUT_UNAVAILABLE');outputURL(url);
  if(!['IMAGE','VIDEO'].includes(mediaKind)||!path.isAbsolute(root))fail('RUNWAY_RESULT_SCOPE');
  for(let p=path.resolve(root);;p=path.dirname(p)){if(fs.existsSync(p)&&fs.lstatSync(p).isSymbolicLink())fail('RUNWAY_RESULT_SCOPE');if(path.dirname(p)===p)break;}
  await fsp.mkdir(root,{recursive:true});let temp;
  try{
   const maxBytes=(mediaKind==='IMAGE'?32:128)*1024*1024;
   const r=await this.request({url,method:'GET',headers:{},phase:'download',timeoutMs:600000,maxBytes,automaticPostRetries:0});
   if(r?.status!==200)fail('RUNWAY_DOWNLOAD_HTTP',{httpStatus:r?.status??null});
   const headers=Object.fromEntries(Object.entries(r.headers??{}).map(([k,v])=>[k.toLowerCase(),v]));
   if(headers['content-encoding']&&!/^identity$/i.test(headers['content-encoding']))fail('RUNWAY_DOWNLOAD_FORMAT');
   const mime=String(headers['content-type']??'').split(';')[0].toLowerCase(),ext={'image/png':'.png','image/jpeg':'.jpg','image/webp':'.webp','video/mp4':'.mp4'}[mime];
   if(!ext||(mediaKind==='IMAGE')!==mime.startsWith('image/'))fail('RUNWAY_DOWNLOAD_FORMAT');
   const {readBytes}=require('./api-mock-response.cjs');
   const bytes=await readBytes(r,{maxBytes,waitMs:600000});if(!bytes.length)fail('RUNWAY_DOWNLOAD_EMPTY');
   temp=path.join(root,id+'.'+crypto.randomUUID()+'.partial'+ext);const handle=await fsp.open(temp,'wx',0o600);try{await handle.writeFile(bytes);await handle.sync();}finally{await handle.close();}
   const info=await this.inspect(temp);if(info.sha256!==hash(bytes)||info.size!==bytes.length||info.mime!==mime||info.type!==(mediaKind==='IMAGE'?'image':'video'))fail('RUNWAY_DOWNLOAD_DECODE');
   if(expected.ratio){const [width,height]=expected.ratio.split(':').map(Number);if(info.width!==width||info.height!==height)fail('RUNWAY_OUTPUT_GEOMETRY');}
   if(mediaKind==='VIDEO'&&expected.duration!==undefined&&(!Number.isFinite(info.durationMs)||Math.abs(info.durationMs-expected.duration*1000)>250))fail('RUNWAY_OUTPUT_DURATION');
   const filename=id+'.'+info.sha256+ext,final=path.join(root,filename);
   try{await fsp.link(temp,final);}catch(e){if(e.code!=='EEXIST')fail('RUNWAY_RESULT_CONFLICT');const old=await fsp.lstat(final);if(!old.isFile()||old.isSymbolicLink()||old.nlink!==1||hash(await fsp.readFile(final))!==info.sha256)fail('RUNWAY_RESULT_CONFLICT');}
   this.#outputs.delete(id);return {filename,sha256:info.sha256,size:info.size,mime,width:info.width,height:info.height,...(mediaKind==='VIDEO'?{durationMs:info.durationMs}:{}),verified:true};
  }catch(e){if(/^RUNWAY_[A-Z_]+$/.test(e.code??''))fail(e.code,{httpStatus:e.httpStatus??null});fail('RUNWAY_DOWNLOAD_FAILED');}
  finally{if(temp)await fsp.unlink(temp).catch(()=>{});}
 }
}
module.exports={RunwayProvider,prepare,resolve,reference,models,outputURL,taskId,inspectImageBytes,ORIGIN,VERSION};

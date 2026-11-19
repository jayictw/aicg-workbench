'use strict';
// B02: exact Gemini API Interactions routes. Vertex and legacy schemas are not used.
const fs=require('node:fs'),fsp=require('node:fs/promises'),path=require('node:path'),https=require('node:https'),crypto=require('node:crypto');
const {prepareGuardedRequest}=require('./api-request-guard.cjs'),{freeze,canonical}=require('./live-policy.cjs'),secrets=require('./secret-policy.cjs');
const {lookup}=require('./official-media-policy.cjs'),{timedNext}=require('./stream-download.cjs');
const ORIGIN='https://generativelanguage.googleapis.com/v1beta',VERSION='v1beta',ADAPTER='gemini-interactions',SOURCE='https://aistudio.google.com/api-reference/interactions-api/create-interaction.md';
const models=Object.freeze({'gemini-3.1-flash-image':{mediaKind:'IMAGE',protocolId:'p1-01-G.I',modes:['TEXT_TO_IMAGE','IMAGE_REFERENCE']},'gemini-omni-1.1-flash':{mediaKind:'VIDEO',protocolId:'p1-01-G.O',modes:['TEXT_TO_VIDEO','FIRST_FRAME','FIRST_LAST_FRAME']}});
const hash=v=>crypto.createHash('sha256').update(v).digest('hex'),fail=(code,extra={})=>{throw Object.assign(Error(code),{code,...extra});};
function taskId(v){if(typeof v!=='string'||!/^v1_[A-Za-z0-9_-]{1,500}$/.test(v)||secrets.contains(v))fail('GEMINI_TASK_ID');return v;}
function resolve(config,routingId,mode){
 const r=config.routings.find(x=>x.routingId===routingId),c=config.connections.find(x=>x.connectionId===r?.connectionId),m=config.models.find(x=>x.modelId===r?.modelId),p=config.providers.find(x=>x.providerId===c?.providerId);
 if(!r||!c||!m||!p||[r,c,m,p].some(x=>x.archivedAt))fail('CONFIG_REFERENCE_MISSING');
 const wire=r.selector?.wireModelId,model=Object.hasOwn(models,wire??'')?models[wire]:null;if(!model)fail('CAPABILITY_UNKNOWN');
 if(p.kind!=='ORIGINAL'||c.baseUrl!==ORIGIN||c.protocolId!==model.protocolId||c.protocolVersion!==VERSION||c.authType!=='HEADER_KEY'||c.credentialRequired!==true||!['UNSUPPORTED','ADAPTED','PARTIAL'].includes(c.adaptationStatus)||c.providerId!==m.catalogProviderId||r.regionBinding!==c.region||r.selector.kind!=='MODEL_ID'||m.mediaKind!==model.mediaKind)fail('GEMINI_ROUTE_SCOPE');
 if(!model.modes.includes(mode))fail('MODE_UNSUPPORTED');
 if(canonical(r.operations)!==canonical({submit:{method:'POST',path:'/interactions'}})||!['UNSUPPORTED',ADAPTER].includes(r.adapterBinding.adapterId)||r.adapterBinding.adapterVersion!=='1')fail('GEMINI_ROUTE_SCOPE');
 if(m.canonicalModel!==null&&m.canonicalModel!==wire)fail('CONFIG_CANONICAL_CONFLICT');
 return freeze({ok:true,operation:'submit',method:'POST',url:ORIGIN+'/interactions',wireValue:wire,placement:'body.model',providerId:p.providerId,connectionId:c.connectionId,modelId:m.modelId,routingId:r.routingId,canonicalModel:m.canonicalModel,region:c.region,authType:c.authType,credentialRequired:true,configRevision:config.revision,connectionRevision:c.revision,routingRevision:r.revision,adapterId:ADAPTER,adapterVersion:'1',mediaKind:model.mediaKind,protocolVersion:VERSION,evidenceLevel:'IMPLEMENTED_REAL_API_NOT_RUN',realGeneration:'NOT_RUN'});
}
function reference(wire){
 const m=Object.hasOwn(models,wire)?models[wire]:null;if(!m)return null;const image=m.mediaKind==='IMAGE';
 return {id:'GEMINI_'+wire,revision:'B02-1',knowledge:'SUPPORTED',label:'Google Gemini API · 官方文档限定能力',sources:[SOURCE,'https://aistudio.google.com/docs/models/'+wire.replace('gemini-omni-1.1-flash','gemini-omni-flash')],sourceRefs:[SOURCE],checkedAt:'2026-11-10',modes:[...m.modes],inputCount:{minImages:1,maxImages:image?14:2},parameters:image?{aspect_ratio:{type:'string',enum:['1:1','2:3','3:2','3:4','4:3','4:5','5:4','9:16','16:9','21:9','1:8','8:1','1:4','4:1']},image_size:{type:'string',enum:['512','1K','2K','4K']},mime_type:{type:'string',enum:['image/png','image/jpeg']}}:{aspect_ratio:{type:'string',enum:['16:9','9:16']},duration:{type:'number',min:3,max:10,step:1},resolution:{type:'string',enum:['360p','720p','1080p','4k']}},defaults:image?{aspect_ratio:'1:1',image_size:'1K',mime_type:'image/png'}:{aspect_ratio:'16:9',duration:5,resolution:'720p'},realAPI:'NOT_RUN',accountEntitlement:'UNKNOWN',background:'NOT_ENABLED_MODEL_SPECIFIC_ELIGIBILITY_UNVERIFIED',delivery:'INLINE_ONLY',inputSubset:'PNG/JPEG; 20MB full encoded request; local geometry safety caps',...(image?{}:{modelAliasNotice:'Official model page: 1.1 routes to 1.2 on 2026-12-03; B02 retains 1.1 ID and 3-10s limits.'})};
}
async function inspectImageBytes(source,{directory,inspect=require('./media.cjs').inspect}){
 if(!Buffer.isBuffer(source?.bytes)||!['image/png','image/jpeg'].includes(source.mime)||!path.isAbsolute(directory))fail('GEMINI_INPUT_DECODE');
 for(let p=path.resolve(directory);;p=path.dirname(p)){if(fs.existsSync(p)&&fs.lstatSync(p).isSymbolicLink())fail('GEMINI_INPUT_DECODE');if(path.dirname(p)===p)break;}
 await fsp.mkdir(directory,{recursive:true});const file=path.join(directory,crypto.randomUUID()+(source.mime==='image/png'?'.png':'.jpg'));let created=false;
 try{const h=await fsp.open(file,'wx',0o600);created=true;try{await h.writeFile(source.bytes);}finally{await h.close();}return await inspect(file);}finally{if(created)await fsp.unlink(file);}
}
async function prepare(config,req,context,savedDefaults={},ports={}){
 let plan;try{secrets.assertSafe({req,context,savedDefaults});plan=resolve(config,req.routingId,req.mode);}catch(e){return {ok:false,code:e.code??'GEMINI_CONFIGURATION'};}
 const cap=reference(plan.wireValue),blocked=code=>({ok:false,code,capability:cap});
 if(context?.mediaKind!==plan.mediaKind||!context.owner)return blocked('MODEL_MEDIA_MISMATCH');
 if(typeof req.prompt!=='string'||!req.prompt.trim()||req.prompt.length>32000||/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(req.prompt))return blocked('GEMINI_PROMPT');
 const defaults={...cap.defaults,...savedDefaults},scoped={...cap,scope:{routingId:plan.routingId,adapterId:ADAPTER,adapterVersion:'1',operation:'submit',mode:req.mode},combinations:[],input:{mimes:['image/png','image/jpeg'],maxBytes:14*1024*1024,totalBytes:14*1024*1024,width:{min:1,max:16384},height:{min:1,max:16384},maxPixels:64000000,ratio:{min:1/16384,max:16384}},request:{encoding:'BASE64_DATA_URL',maxBytes:20*1024*1024}};
 const prepared=await prepareGuardedRequest({plan,input:{mode:req.mode,prompt:req.prompt,localAssets:context.assets,selectedImages:req.selectedImages},capability:scoped,savedDefaults:defaults,overridesJson:JSON.stringify(req.overrides??{})},{...ports,serialize:(_p,_selected,params,uris)=>{
  const input=uris.map(uri=>{const match=/^data:(image\/(?:png|jpeg));base64,(.+)$/.exec(uri);if(!match)fail('GEMINI_INPUT_MIME');return {type:'image',mime_type:match[1],data:match[2]};});input.push({type:'text',text:req.prompt});
  const image=plan.mediaKind==='IMAGE';return {model:plan.wireValue,input,background:false,store:true,response_format:{type:image?'image':'video',delivery:'inline',...params,...(!image?{duration:params.duration+'s'}:{})},...(!image?{generation_config:{video_config:{task:req.mode==='TEXT_TO_VIDEO'?'text_to_video':'image_to_video'}}}:{})};
 }});if(!prepared.ok)return {...prepared,capability:cap};
 const summary={provider:'Google Gemini API',providerKind:'ORIGINAL',configRevision:plan.configRevision,connectionRevision:plan.connectionRevision,routingRevision:plan.routingRevision,authType:plan.authType,connection:config.connections.find(c=>c.connectionId===plan.connectionId).displayName,connectionId:plan.connectionId,routingId:plan.routingId,region:plan.region,modelName:plan.wireValue,canonicalModel:plan.canonicalModel,wireSelector:{kind:'MODEL_ID',wireModelId:plan.wireValue},mode:req.mode,prompt:req.prompt,images:prepared.images.map(({assetId,role,sha256,sequenceIndex})=>({assetId,role,sha256,sequenceIndex})),parameters:prepared.parameters,parameterSources:Object.fromEntries(Object.keys(prepared.parameters).map(k=>[k,Object.hasOwn(req.overrides??{},k)?'REQUEST_OVERRIDE':Object.hasOwn(savedDefaults,k)?'USER_DEFAULT':'REFERENCE_TEMPLATE'])),outputCount:1,reference:{id:cap.id,revision:cap.revision,knowledge:cap.knowledge,sources:cap.sources},protocol:'GEMINI_OFFICIAL',protocolVersion:VERSION,adapterId:ADAPTER,adapterVersion:'1',operationPath:'/interactions',requestSHA256:hash(prepared.requestJson),cost:'UNKNOWN',accountEntitlement:'UNKNOWN',realAPI:'NOT_RUN',execution:'SYNCHRONOUS_INLINE_STORED_INTERACTION',background:false};
 return freeze({...prepared,plan,summary});
}
function nativeEnabled(){const b=require('../integration-build.json');return b.offlineOnly!==true&&b.supplierAPIEnabled===true;}
function nativeRequest({url,method,headers,body,signal,timeoutMs,maxBytes}){
 if(!nativeEnabled())fail('GEMINI_NETWORK_DISABLED');
 if(!(method==='POST'&&url===ORIGIN+'/interactions')&&!(method==='GET'&&url.startsWith(ORIGIN+'/interactions/')&&taskId(url.slice((ORIGIN+'/interactions/').length))))fail('GEMINI_ROUTE_SCOPE');
 return new Promise((resolve,reject)=>{let settled=false,response,timer;const finish=(err,value)=>{if(settled)return;settled=true;clearTimeout(timer);err?reject(err):resolve(value);};
  const req=https.request(url,{method,headers,agent:false,rejectUnauthorized:true,minVersion:'TLSv1.2',maxHeaderSize:16384,lookup,signal},res=>{response=res;const chunks=[];let size=0;res.on('data',b=>{size+=b.length;if(size>maxBytes){res.destroy();finish(Object.assign(Error('GEMINI_RESPONSE_LIMIT'),{code:'GEMINI_RESPONSE_LIMIT'}));}else chunks.push(b);});res.on('end',()=>finish(null,{status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks)}));res.on('error',()=>finish(Error('GEMINI_NETWORK_UNKNOWN')));res.on('aborted',()=>finish(Error('GEMINI_NETWORK_UNKNOWN')));});
  timer=setTimeout(()=>{req.destroy();response?.destroy();finish(Error('GEMINI_TIMEOUT'));},timeoutMs);req.on('error',()=>finish(Error('GEMINI_NETWORK_UNKNOWN')));req.end(body??undefined);
 });
}
const safeToken=v=>typeof v==='string'&&/^[A-Za-z0-9_.:-]{1,120}$/.test(v)&&!secrets.contains(v)?v:null;
function diagnostic(r,b){const h=Object.fromEntries(Object.entries(r?.headers??{}).map(([k,v])=>[k.toLowerCase(),v]));return {httpStatus:Number.isInteger(r?.status)?r.status:null,providerCode:safeToken(b?.error?.status??b?.error?.code),requestId:safeToken(h['x-request-id']??h['x-goog-request-id'])};}
class GeminiProvider{
 #outputs=new Map();
 constructor({credential,request,inspect=require('./media.cjs').inspect,apiTimeoutMs=600000}={}){if(typeof credential!=='function'||request!==undefined&&typeof request!=='function'||!Number.isSafeInteger(apiTimeoutMs)||apiTimeoutMs<1||apiTimeoutMs>600000)fail('GEMINI_CREDENTIAL_PORT');this.credential=credential;this.request=request??nativeRequest;this.inspect=inspect;this.injected=!!request;this.apiTimeoutMs=apiTimeoutMs;}
 async binding(){return this.credential('query',s=>{if(typeof s!=='string'||!s.length)fail('CREDENTIAL_REQUIRED');return hash(s);});}
 assertDispatchEnabled(){if(!this.injected&&!nativeEnabled())fail('GEMINI_NETWORK_DISABLED');}
 async api(method,url,body,consume,expectedCredential,beforeSend){
  this.assertDispatchEnabled();const outcome=await this.credential(method==='POST'?'submit':'query',async secret=>{
   if(typeof secret!=='string'||secret.length<16||secret.length>4096||/[^\x21-\x7e]/.test(secret))fail('CREDENTIAL_REQUIRED');
   try{if(expectedCredential&&hash(secret)!==expectedCredential)fail('GEMINI_CREDENTIAL_CHANGED');beforeSend?.();this.assertDispatchEnabled();const controller=new AbortController();let r;try{r=(await timedNext({next:async()=>({done:false,value:await this.request({url,method,headers:{'x-goog-api-key':secret,'Content-Type':'application/json'},body,phase:method==='POST'?'submit':'query',timeoutMs:this.apiTimeoutMs,maxBytes:192*1024*1024,automaticPostRetries:0,signal:controller.signal})})},{ms:this.apiTimeoutMs})).value;}finally{controller.abort();}
    if(!Number.isInteger(r?.status))fail('GEMINI_RESPONSE_INVALID');let parsed;try{parsed=Buffer.isBuffer(r.body)&&r.body.length<=192*1024*1024?JSON.parse(r.body.toString('utf8')):null;}catch{}const d=diagnostic(r,parsed);
    if(r.status!==200)fail('GEMINI_HTTP',d);if(!parsed||Array.isArray(parsed)||typeof parsed!=='object')fail('GEMINI_RESPONSE_INVALID',d);
    return secrets.assertSafe({ok:true,value:{...consume(parsed),...d}});
   }catch(e){return secrets.assertSafe({ok:false,error:{code:/^GEMINI_[A-Z_]+$/.test(e.code??'')?e.code:'GEMINI_NETWORK_UNKNOWN',httpStatus:Number.isInteger(e.httpStatus)?e.httpStatus:null,providerCode:safeToken(e.providerCode),requestId:safeToken(e.requestId)}});}
  });if(outcome?.ok!==true)fail(outcome?.error?.code??'GEMINI_NETWORK_UNKNOWN',{httpStatus:outcome?.error?.httpStatus??null,providerCode:outcome?.error?.providerCode??null,requestId:outcome?.error?.requestId??null});return outcome.value;
 }
 consume(body,expectedId,wire){
  const id=taskId(body.id);if(expectedId&&id!==expectedId)fail('GEMINI_TASK_ID');if(body.model!==wire)fail('GEMINI_MODEL_MISMATCH');
  if(!['in_progress','completed','failed','cancelled','incomplete','requires_action','requires_continuation'].includes(body.status))fail('GEMINI_STATUS_UNKNOWN');
  if(body.status==='completed')this.#outputs.set(id,body.steps);else this.#outputs.delete(id);
  return {taskId:id,remoteStatus:body.status,hasOutput:body.status==='completed'};
 }
 async submit(p,expectedCredential,beforeSend){if(!p.ok||p.plan?.url!==ORIGIN+'/interactions'||hash(p.requestJson)!==p.summary?.requestSHA256)fail('GEMINI_REQUEST_INVALID');return this.api('POST',p.plan.url,p.requestJson,b=>this.consume(b,null,p.plan.wireValue),expectedCredential,beforeSend);}
 async query(id,wire){taskId(id);this.#outputs.delete(id);return this.api('GET',ORIGIN+'/interactions/'+id,undefined,b=>this.consume(b,id,wire));}
 async download(id,root,mediaKind,expected={}){
  taskId(id);const steps=this.#outputs.get(id);this.#outputs.delete(id);if(!path.isAbsolute(root)||!Array.isArray(steps))fail('GEMINI_OUTPUT_SCHEMA');
  const content=steps.filter(s=>s.type==='model_output').flatMap(s=>Array.isArray(s.content)?s.content:[]).filter(c=>['image','video','audio'].includes(c?.type));
  if(content.length!==1)fail('GEMINI_OUTPUT_COUNT');const c=content[0],mime=c.mime_type,ext={'image/png':'.png','image/jpeg':'.jpg','image/webp':'.webp','video/mp4':'.mp4'}[mime];
  if(!ext||c.type!==(mediaKind==='IMAGE'?'image':'video')||(mediaKind==='IMAGE')!==mime.startsWith('image/')||expected.mime_type&&mime!==expected.mime_type)fail('GEMINI_OUTPUT_FORMAT');
  if(c.uri!==undefined||typeof c.data!=='string'||!c.data.length||c.data.length>180*1024*1024||c.data.length%4!==0||!/^[A-Za-z0-9+/]*={0,2}$/.test(c.data))fail('GEMINI_OUTPUT_DELIVERY');
  const bytes=Buffer.from(c.data,'base64');if(bytes.toString('base64')!==c.data||!bytes.length||bytes.length>(mediaKind==='IMAGE'?32:128)*1024*1024||secrets.contains(bytes))fail('GEMINI_OUTPUT_BYTES');
  for(let p=path.resolve(root);;p=path.dirname(p)){if(fs.existsSync(p)&&fs.lstatSync(p).isSymbolicLink())fail('GEMINI_RESULT_SCOPE');if(path.dirname(p)===p)break;}
  await fsp.mkdir(root,{recursive:true});const temp=path.join(root,crypto.randomUUID()+'.partial'+ext);let created=false;
  try{const h=await fsp.open(temp,'wx',0o600);created=true;try{await h.writeFile(bytes);await h.sync();}finally{await h.close();}const info=await this.inspect(temp);
   if(info.sha256!==hash(bytes)||info.size!==bytes.length||info.mime!==mime||info.type!==(mediaKind==='IMAGE'?'image':'video')||!Number.isSafeInteger(info.width)||info.width<1||!Number.isSafeInteger(info.height)||info.height<1)fail('GEMINI_OUTPUT_DECODE');
   if(expected.aspect_ratio){const [w,h]=expected.aspect_ratio.split(':').map(Number);if(Math.abs((info.width/info.height)/(w/h)-1)>.02)fail('GEMINI_OUTPUT_GEOMETRY');}
   if(mediaKind==='VIDEO'&&expected.duration!==undefined&&(!Number.isFinite(info.durationMs)||Math.abs(info.durationMs-expected.duration*1000)>250))fail('GEMINI_OUTPUT_DURATION');
   const filename=hash(id)+'.'+info.sha256+ext,final=path.join(root,filename);try{await fsp.link(temp,final);}catch(e){if(e.code!=='EEXIST')fail('GEMINI_RESULT_CONFLICT');const old=await fsp.lstat(final);if(!old.isFile()||old.isSymbolicLink()||old.nlink!==1||hash(await fsp.readFile(final))!==info.sha256)fail('GEMINI_RESULT_CONFLICT');}
   return {filename,sha256:info.sha256,size:info.size,mime,width:info.width,height:info.height,...(mediaKind==='VIDEO'?{durationMs:info.durationMs}:{}),verified:true};
  }finally{if(created)await fsp.unlink(temp).catch(()=>{});}
 }
}
module.exports={GeminiProvider,prepare,resolve,reference,models,taskId,inspectImageBytes,ORIGIN,VERSION};

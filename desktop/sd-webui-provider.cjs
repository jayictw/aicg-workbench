'use strict';
const path=require('node:path'),crypto=require('node:crypto'),http=require('node:http');
const {localSdOrigin}=require('./api-config.cjs'),{canonical,freeze}=require('./live-policy.cjs'),secrets=require('./secret-policy.cjs');
const PROTOCOL='sd-webui-v1',LABEL='SD_WEBUI_LOCAL',POST_PATH='/sdapi/v1/txt2img',MODELS_PATH='/sdapi/v1/sd-models';
const sources=['https://github.com/AUTOMATIC1111/stable-diffusion-webui/blob/v1.10.1/modules/api/api.py','https://github.com/AUTOMATIC1111/stable-diffusion-webui/wiki/API'];
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const fail=(code,extra={})=>{throw Object.assign(Error(code),{code,...extra});};
const validCheckpointTitle=value=>typeof value==='string'&&!!value.trim()&&value.length<=240&&!/[\x00-\x1f\x7f\\]/.test(value);
function reference(){
 const side={type:'number',enum:[512,640,768,896,1024]};
 return {id:LABEL,revision:'1.10.1-txt2img-1',knowledge:'SUPPORTED',label:'Stable Diffusion WebUI · 本地文生图',sources,sourceRefs:sources,modes:['TEXT_TO_IMAGE'],inputCount:{minImages:0,maxImages:0},parameters:{width:side,height:side,steps:{type:'number',min:1,max:50,step:1},cfg_scale:{type:'number',min:1,max:20},seed:{type:'number',min:-1,max:4294967295,step:1}},defaults:{width:512,height:512,steps:20,cfg_scale:7,seed:-1},realAPI:'NOT_RUN',accountEntitlement:'LOCAL_NO_AUTH'};
}
function resolve(config,routingId,mode){
 const r=config.routings.find(x=>x.routingId===routingId),c=config.connections.find(x=>x.connectionId===r?.connectionId),m=config.models.find(x=>x.modelId===r?.modelId),p=config.providers.find(x=>x.providerId===c?.providerId);
 if(!r||!c||!m||!p||[r,c,m,p].some(x=>x.archivedAt))fail('CONFIG_REFERENCE_MISSING');
 if(mode!=='TEXT_TO_IMAGE')fail('MODE_UNSUPPORTED');
 if(c.protocolId!==PROTOCOL||c.protocolVersion!=='1'||p.kind!=='CUSTOM'||c.authType!=='NONE'||c.credentialRequired||m.mediaKind!=='IMAGE'||m.catalogProviderId!==p.providerId||c.region!=='LOCAL'||r.regionBinding!=='LOCAL'||r.selector?.kind!=='MODEL_ID'||canonical(r.operations)!==canonical({submit:{method:'POST',path:POST_PATH}})||r.adapterBinding?.adapterId!=='UNSUPPORTED'||r.adapterBinding?.adapterVersion!=='1')fail('SD_ROUTE_SCOPE');
 const wire=r.selector.wireModelId;
 if(!validCheckpointTitle(wire))fail('SD_CHECKPOINT_INVALID');
 const origin=localSdOrigin(c.baseUrl);
 return {origin,url:origin+POST_PATH,operationPath:POST_PATH,method:'POST',wireValue:wire,connectionId:c.connectionId,routingId:r.routingId,modelId:m.modelId,configRevision:config.revision,connectionRevision:c.revision,routingRevision:r.revision,mediaKind:'IMAGE',displayName:m.displayName??wire,connectionName:c.displayName,providerName:p.displayName};
}
async function prepare(config,req,context,defaults={}){
 const cap=reference(),blocked=code=>({ok:false,code,capability:cap});
 let plan;
 try{plan=resolve(config,req.routingId,req.mode);}catch(e){return blocked(e.code??'SD_ROUTE_SCOPE');}
 if(!context?.owner||context.mediaKind!=='IMAGE')return blocked('MODEL_MEDIA_MISMATCH');
 if(!Array.isArray(req.selectedImages)||req.selectedImages.length)return blocked('MODE_UNSUPPORTED');
 if(typeof req.prompt!=='string'||!req.prompt.trim()||req.prompt.length>32000||/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(req.prompt))return blocked('UI_PROMPT_INVALID');
 const parameters={...cap.defaults,...defaults,...req.overrides},parameterSources={};
 for(const [key,value] of Object.entries(parameters)){
  const rule=Object.hasOwn(cap.parameters,key)?cap.parameters[key]:null;
  if(!rule)return blocked('PARAMETER_UNSUPPORTED');
  if(typeof value!=='number'||!Number.isFinite(value))return blocked('PARAMETER_TYPE');
  if(rule.enum&&!rule.enum.includes(value)||value<rule.min||value>rule.max||rule.step===1&&!Number.isSafeInteger(value))return blocked('PARAMETER_RANGE');
  parameterSources[key]=Object.hasOwn(req.overrides??{},key)?'REQUEST_OVERRIDE':Object.hasOwn(defaults,key)?'USER_DEFAULT':'REFERENCE_TEMPLATE';
 }
 const payload={prompt:req.prompt,...parameters,batch_size:1,n_iter:1,send_images:true,save_images:false,override_settings:{sd_model_checkpoint:plan.wireValue},override_settings_restore_afterwards:true};
 const requestJson=JSON.stringify(payload),summary={protocol:LABEL,provider:plan.providerName,providerKind:'CUSTOM',connection:plan.connectionName,connectionId:plan.connectionId,routingId:plan.routingId,recipient:plan.origin,region:'LOCAL',modelName:plan.displayName,wireSelector:{kind:'MODEL_ID',wireModelId:plan.wireValue},mode:req.mode,images:[],prompt:req.prompt,parameters,parameterSources,outputCount:1,requestSHA256:hash(requestJson),reference:{id:cap.id,revision:cap.revision,knowledge:cap.knowledge,sources},cost:'LOCAL_SERVICE',realAPI:'NOT_RUN'};
 secrets.assertSafe(summary);
 return freeze({ok:true,plan,images:[],parameters,requestJson,summary});
}
function localRequest(url,{method,body,limit,ms}){
 return new Promise((resolve,reject)=>{
  const abort=AbortSignal.timeout(ms);
  const rejectWith=code=>reject(Object.assign(Error(code),{code}));
  const request=http.request(url,{method,agent:false,signal:abort,headers:body?{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}:undefined},response=>{
   const status=response.statusCode;
   if(status!==200){resolve({status});response.destroy();return;}
   const chunks=[];let length=0;
   response.on('error',()=>rejectWith('SD_NETWORK_UNKNOWN'));
   response.on('data',chunk=>{
    length+=chunk.length;
    if(length>limit){rejectWith('SD_RESPONSE_LIMIT');response.destroy();return;}
    chunks.push(chunk);
   });
   response.on('end',()=>{
    try{resolve({status,payload:JSON.parse(Buffer.concat(chunks,length).toString('utf8'))});}
    catch{rejectWith('SD_RESPONSE_INVALID');}
   });
  });
  request.on('error',()=>rejectWith('SD_NETWORK_UNKNOWN'));
  request.end(body);
 });
}
class SdWebUiProvider{
 #outputs=new Map();
 constructor({origin,request=localRequest,inspect=require('./media.cjs').inspect}){
  this.getOrigin=typeof origin==='function'?origin:()=>origin;this.request=request;this.inspect=inspect;this.injected=request!==localRequest;
 }
 get origin(){return localSdOrigin(this.getOrigin());}
 binding(){return this.origin+'|'+PROTOCOL;}
 assertDispatchEnabled(){localSdOrigin(this.origin);}
 async #checkpointTitles(){
  const out=await this.request(this.origin+MODELS_PATH,{method:'GET',limit:4*1024*1024,ms:10000});
  if(out.status!==200)fail(out.status===401?'SD_LOCAL_AUTH_UNSUPPORTED':'SD_LOCAL_SERVICE_UNAVAILABLE');
  if(!Array.isArray(out.payload))fail('SD_RESPONSE_INVALID');
  const titles=new Map();
  for(const item of out.payload)if(validCheckpointTitle(item?.title))titles.set(item.title,(titles.get(item.title)??0)+1);
  return [...titles].filter(([,count])=>count===1).map(([title])=>title);
 }
 async listCheckpoints(){
  return (await this.#checkpointTitles()).filter(title=>!/^(?:\/|[a-z]:)/i.test(title));
 }
 async preflight(p){
  if(p.plan.origin!==this.origin)fail('SD_ROUTE_SCOPE');
  if(!(await this.#checkpointTitles()).includes(p.plan.wireValue))fail('SD_CHECKPOINT_MISSING');
 }
 async submit(p,binding,beforeSend){
  if(!p.ok||p.summary.protocol!==LABEL||p.plan.url!==this.origin+POST_PATH||this.binding()!==binding||hash(p.requestJson)!==p.summary.requestSHA256)fail('SD_ROUTE_SCOPE');
  beforeSend?.();
  const r=await this.request(this.origin+POST_PATH,{method:'POST',body:p.requestJson,limit:46*1024*1024,ms:180000});
  if(r.status!==200)fail('SD_HTTP',{httpStatus:r.status});
  if(!Array.isArray(r.payload?.images)||r.payload.images.length!==1||typeof r.payload.images[0]!=='string')fail('SD_OUTPUT_SCHEMA');
  const id='sd-local-'+crypto.randomUUID();this.#outputs.set(id,{data:r.payload.images[0],mime:'image/png'});
  return {taskId:id,taskIdKind:'LOCAL_RESULT_REFERENCE',remoteStatus:'completed',hasOutput:true,httpStatus:200};
 }
 async download(id,root,mediaKind,expected){
  const content=this.#outputs.get(id);this.#outputs.delete(id);
  return require('./openai-provider.cjs').writeSyncImageOutput(content,id,path.resolve(root),mediaKind,{size:expected.width+'x'+expected.height},this.inspect);
 }
}
// Publication is independent of submission. The verified result and its audit
// already exist if the original canvas changed while the local service ran.
async function publishSavedImage({service,task,root,target,measurements,guard,onPublished}){
 const r=task.result;
 let stage;
 try{
  guard();
  const source=service.graph.nodes.find(n=>n.id===target.nodeId);
  const {findFreePosition}=await import('../shared/free-position.mjs');
  const position=source&&findFreePosition({x:Math.min(source.position.x+400,100000),y:source.position.y},service.graph.nodes,measurements,'asset.image');
  if(!position||!r?.verified||r.filename!==hash(task.taskId)+'.'+r.sha256+'.png')return false;
  stage=await service.prepare(path.join(root,'results',r.filename));
  guard();
  if(stage.metadata.sha256!==r.sha256||stage.metadata.size!==r.size)return false;
  await service.confirm({token:stage.token,expectedRevision:target.expectedRevision,position},{independent:true});
 }catch{return false;}
 finally{if(stage)await service.cancel(stage.token);}
 onPublished();
 return true;
}
module.exports={PROTOCOL,LABEL,POST_PATH,reference,resolve,prepare,SdWebUiProvider,publishSavedImage};

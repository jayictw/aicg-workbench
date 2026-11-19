'use strict';
// Wan 3.0 only. The renderer never supplies credentials, transport or media URLs.
const fs=require('node:fs'),fsp=require('node:fs/promises'),path=require('node:path'),https=require('node:https'),crypto=require('node:crypto'),net=require('node:net');
const {prepareGuardedRequest}=require('./api-request-guard.cjs'),{canonical,freeze}=require('./live-policy.cjs'),secrets=require('./secret-policy.cjs');
const {lookup}=require('./official-media-policy.cjs'),{timedNext}=require('./stream-download.cjs');
const SOURCE='https://help.aliyun.com/zh/model-studio/wan3-video-generation-api-reference',SUBMIT='/services/aigc/video-generation/video-synthesis',ADAPTER='wan3-native';
const regions=['cn-beijing','ap-southeast-1','ap-northeast-1','eu-central-1','us-east-1','cn-hongkong'];
const uiModes=['TEXT_TO_VIDEO','FIRST_FRAME','FIRST_LAST_FRAME','MULTI_REFERENCE'];
const models=Object.freeze(Object.fromEntries(['wan3.0-video','wan3.0-video-prime'].map(m=>[m,{mediaKind:'VIDEO',modes:[...uiModes]}])));
const hash=x=>crypto.createHash('sha256').update(x).digest('hex'),fail=(code,extra={})=>{throw Object.assign(Error(code),{code,...extra});};
function origin(base){
 if(typeof base!=='string')fail('WAN_ROUTE_SCOPE');
 const m=/^https:\/\/([A-Za-z0-9][A-Za-z0-9_-]{0,199})\.([a-z0-9-]+)\.maas\.aliyuncs\.com\/api\/v1$/.exec(base);
 if(!m||!regions.includes(m[2]))fail('WAN_ROUTE_SCOPE');return {baseUrl:base,workspace:m[1],region:m[2]};
}
function taskId(id){if(typeof id!=='string'||! /^[A-Za-z0-9][A-Za-z0-9_-]{0,255}$/.test(id)||secrets.contains(id))fail('WAN_TASK_ID');return id;}
function resolve(config,routingId,mode,protocolOnly=false){
 const r=config.routings.find(x=>x.routingId===routingId),c=config.connections.find(x=>x.connectionId===r?.connectionId),m=config.models.find(x=>x.modelId===r?.modelId),p=config.providers.find(x=>x.providerId===c?.providerId);
 if(!r||!c||!m||!p||[r,c,m,p].some(x=>x.archivedAt))fail('CONFIG_REFERENCE_MISSING');
 const o=origin(c.baseUrl),wire=r.selector.wireModelId;
 if(p.kind!=='ORIGINAL'||c.protocolId!=='p1-01-A.V'||c.protocolVersion!=='v1'||c.authType!=='BEARER'||c.credentialRequired!==true||!['UNSUPPORTED','PARTIAL','ADAPTED'].includes(c.adaptationStatus)||c.providerId!==m.catalogProviderId||r.regionBinding!==c.region||o.region!==c.region||r.selector.kind!=='MODEL_ID'||canonical(r.operations)!==canonical({submit:{method:'POST',path:SUBMIT}})||!['UNSUPPORTED',ADAPTER].includes(r.adapterBinding.adapterId)||r.adapterBinding.adapterVersion!=='1')fail('WAN_ROUTE_SCOPE');
 if(!Object.hasOwn(models,wire))fail('CAPABILITY_UNKNOWN');if(m.mediaKind!=='VIDEO'||!uiModes.includes(mode)&&!(protocolOnly&&mode==='REFERENCE_VIDEO'))fail('MODE_UNSUPPORTED');
 if(m.canonicalModel!==null&&m.canonicalModel!==wire)fail('CONFIG_CANONICAL_CONFLICT');
 return freeze({ok:true,operation:'submit',method:'POST',url:c.baseUrl+SUBMIT,baseUrl:c.baseUrl,workspace:o.workspace,region:o.region,wireValue:wire,providerId:p.providerId,connectionId:c.connectionId,modelId:m.modelId,routingId:r.routingId,canonicalModel:m.canonicalModel,authType:'BEARER',credentialRequired:true,configRevision:config.revision,connectionRevision:c.revision,routingRevision:r.revision,adapterId:ADAPTER,adapterVersion:'1',protocolVersion:'v1',mediaKind:'VIDEO',evidenceLevel:'IMPLEMENTED_REAL_API_NOT_RUN',realGeneration:'NOT_RUN'});
}
function reference(wire){if(!Object.hasOwn(models,wire))return null;return {id:'WAN3_'+wire,revision:'20261111-1',knowledge:'SUPPORTED',label:'Wan 3.0 · 官方协议（真实API未验证）',sources:[SOURCE],sourceRefs:[SOURCE],checkedAt:'2026-11-11',documentUpdatedAt:null,modes:[...uiModes],inputCount:{minImages:1,maxImages:10},parameters:{resolution:{type:'string',enum:['480P','720P','1080P']},ratio:{type:'string',enum:['adaptive','21:9','16:9','4:3','1:1','3:4','9:16']},duration:{type:'number',min:-1,max:30,step:1},audio:{type:'boolean',enum:[true]},seed:{type:'number',min:-1,max:2147483647,step:1},prompt_extend:{type:'boolean'},watermark:{type:'boolean'}},defaults:{resolution:'1080P',ratio:'adaptive',duration:5,audio:true,prompt_extend:true,watermark:false},accountEntitlement:'UNKNOWN',realAPI:'NOT_RUN',implementationLimits:{imageFormats:['image/png','image/jpeg'],maxImageBytes:20000000,maxImageTotalBytes:48000000,maxRequestBytes:64*1024*1024,maxImagePixels:24000000,fifthModeUI:'DEFERRED_TO_P2-01'}};}
function validate(req,defaults){
 if(!req||Object.keys(req).some(k=>!['routingId','configRevision','mode','prompt','selectedImages','overrides'].includes(k)))fail('UI_FIELD_UNSUPPORTED');
 if(typeof req.prompt!=='string'||req.prompt.length>20000||/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(req.prompt)||req.mode==='TEXT_TO_VIDEO'&&!req.prompt.trim())fail('WAN_PROMPT');
 const p={...defaults,...req.overrides};if(p.duration!==undefined&&p.duration!==-1&&(!Number.isInteger(p.duration)||p.duration<2||p.duration>30))fail('PARAMETER_RANGE');
}
function opaquePNG(bytes){
 if(!bytes.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')))return;
 let at=8,ihdr=false,end=false;
 while(at+12<=bytes.length){const n=bytes.readUInt32BE(at),t=bytes.toString('ascii',at+4,at+8);if(n>bytes.length-at-12)fail('WAN_INPUT_FORMAT');if(t==='IHDR'){if(ihdr||n!==13||![0,2,3].includes(bytes[at+17]))fail('WAN_INPUT_ALPHA');ihdr=true;}if(t==='tRNS')fail('WAN_INPUT_ALPHA');at+=n+12;if(t==='IEND'){end=true;break;}}
 if(!ihdr||!end||at!==bytes.length)fail('WAN_INPUT_FORMAT');
}
function summary(plan,req,prepared,config,cap,media=[]){return {provider:'Alibaba Cloud Wan',providerKind:'ORIGINAL',configRevision:plan.configRevision,connectionRevision:plan.connectionRevision,routingRevision:plan.routingRevision,authType:'BEARER',connection:config.connections.find(c=>c.connectionId===plan.connectionId).displayName,connectionId:plan.connectionId,routingId:plan.routingId,region:plan.region,workspace:plan.workspace,modelName:plan.wireValue,canonicalModel:plan.canonicalModel,wireSelector:{kind:'MODEL_ID',wireModelId:plan.wireValue},mode:req.mode,prompt:req.prompt,images:prepared.images.map(({assetId,role,sha256,sequenceIndex})=>{const a=prepared.assetIdentity?.[assetId];return {assetId,role,sha256,sequenceIndex,...a};}),media,parameters:prepared.parameters,parameterSources:Object.fromEntries(Object.keys(prepared.parameters).map(k=>[k,Object.hasOwn(req.overrides??{},k)?'REQUEST_OVERRIDE':Object.hasOwn(prepared.savedDefaults??{},k)?'USER_DEFAULT':'REFERENCE_TEMPLATE'])),outputCount:1,reference:{id:cap.id,revision:cap.revision,knowledge:'SUPPORTED',sources:[SOURCE]},protocol:'WAN_OFFICIAL',protocolVersion:'v1',adapterId:ADAPTER,adapterVersion:'1',operationPath:SUBMIT,requestSHA256:hash(prepared.requestJson),cost:'UNKNOWN',accountEntitlement:'UNKNOWN',realAPI:'NOT_RUN'};}
async function prepare(config,req,context,savedDefaults={},ports={}){
 let plan,cap;try{secrets.assertSafe({req,context,savedDefaults});plan=resolve(config,req.routingId,req.mode);cap=reference(plan.wireValue);validate(req,{...cap.defaults,...savedDefaults});}catch(e){return {ok:false,code:e.code??'WAN_CONFIGURATION'};}
 if(context?.mediaKind!=='VIDEO'||!context.owner||!Array.isArray(context.assets))return {ok:false,code:'MODEL_MEDIA_MISMATCH'};
 const scoped={...cap,scope:{routingId:plan.routingId,adapterId:ADAPTER,adapterVersion:'1',operation:'submit',mode:req.mode},combinations:[],input:{mimes:['image/png','image/jpeg'],maxBytes:20000000,totalBytes:48000000,width:{min:240,max:8000},height:{min:240,max:8000},maxPixels:24000000,ratio:{min:1/8,max:8}},request:{encoding:'BASE64_DATA_URL',maxBytes:64*1024*1024}};
 const identities={};
 const p=await prepareGuardedRequest({plan,input:{mode:req.mode,prompt:req.prompt,localAssets:context.assets,selectedImages:req.selectedImages},capability:scoped,savedDefaults:{...cap.defaults,...savedDefaults},overridesJson:JSON.stringify(req.overrides??{})},{...ports,readAsset:async asset=>{
  const a=context.assets.find(a=>a.assetId===asset.assetId&&a.url===asset.url);if(!a||typeof a.version!=='string'||!a.version||!/^[a-f0-9]{64}$/.test(a.sha256))fail('INPUT_REFERENCE_MISSING');
  const source=await ports.readAsset({...asset,version:a.version,sha256:a.sha256},context);if(!Buffer.isBuffer(source?.bytes)||hash(source.bytes)!==a.sha256)fail('INPUT_REFERENCE_MISSING');opaquePNG(source.bytes);identities[a.assetId]={assetNodeId:a.assetNodeId??null,contentVersion:a.version};return source;
 },serialize:(_p,selected,parameters,uris)=>({model:plan.wireValue,input:{...(req.prompt?{prompt:req.prompt}:{}),...(uris.length?{media:uris.map((url,i)=>({type:req.mode==='FIRST_LAST_FRAME'?(i?'last_frame':'first_frame'):req.mode==='FIRST_FRAME'?'first_frame':'reference_image',url}))}:{})},parameters})});
 if(!p.ok)return {...p,capability:cap};const result={...p,assetIdentity:identities,savedDefaults};return freeze({...result,plan,summary:summary(plan,req,result,config,cap)});
}
function mediaURL(value){let u;try{u=new URL(value);}catch{fail('WAN_MEDIA_URL');}if(typeof value!=='string'||value.length>16384||u.protocol!=='https:'||u.username||u.password||u.port||u.hash||net.isIP(u.hostname)||u.hostname.startsWith('[')||u.hostname==='localhost'||u.hostname.endsWith('.local')||/[\\\x00-\x20]/.test(value))fail('WAN_MEDIA_URL');return u.href;}
// Trusted main-process test port only. Not registered with renderer/UI or MCP.
async function prepareReferenceVideoMock(config,req,context,savedDefaults={},ports={}){
 try{
  secrets.assertSafe({req,context,savedDefaults});if(req.mode!=='REFERENCE_VIDEO'||typeof ports.resolveTrustedVideos!=='function'||req.selectedImages!==undefined)fail('WAN_TRUSTED_MEDIA_REQUIRED');
  const plan=resolve(config,req.routingId,req.mode,true),cap=reference(plan.wireValue);validate(req,{...cap.defaults,...savedDefaults});
  const rows=await ports.resolveTrustedVideos(context);if(!Array.isArray(rows)||rows.length<1||rows.length>5)fail('WAN_VIDEO_COUNT');
  const ids=new Set();let duration=0;
  const media=rows.map((a,i)=>{if(!a||!a.assetId||!a.assetNodeId||!a.version||!/^[a-f0-9]{64}$/.test(a.sha256)||ids.has(a.assetId)||canonical(a.owner)!==canonical(context.owner)||a.role!=='REFERENCE_VIDEO'||!Number.isSafeInteger(a.size)||a.size<1||a.size>100000000||!Number.isFinite(a.durationMs)||a.durationMs<1000||a.durationMs>15000||!Number.isFinite(a.fps)||a.fps<16||a.fps>60||!Number.isInteger(a.width)||!Number.isInteger(a.height)||a.width<240||a.width>3840||a.height<240||a.height>2160||Math.max(a.width/a.height,a.height/a.width)>8||a.mime!=='video/mp4'||a.codec!=='h264'||a.audioCodec!==null&&a.audioCodec!=='aac')fail('WAN_VIDEO_INPUT');ids.add(a.assetId);duration+=a.durationMs;return {assetId:a.assetId,assetNodeId:a.assetNodeId,contentVersion:a.version,sha256:a.sha256,role:a.role,sequenceIndex:i,size:a.size,durationMs:a.durationMs,width:a.width,height:a.height,fps:a.fps};});
  if(duration>15000)fail('WAN_VIDEO_DURATION');
  // Reuse the existing parameter/override guard without misclassifying videos as images.
  const plain=await prepare(config,{...req,mode:'TEXT_TO_VIDEO',prompt:req.prompt||'Wan media-only parameter validation',selectedImages:[]},context,savedDefaults,{});if(!plain.ok)return plain;
  const params=plain.parameters;if(params.duration!==-1&&duration+params.duration*1000>30000)fail('WAN_VIDEO_DURATION');
  const body={model:plan.wireValue,input:{...(req.prompt?{prompt:req.prompt}:{}),media:rows.map(a=>({type:'reference_video',url:mediaURL(a.url)}))},parameters:params},requestJson=JSON.stringify(body),p={ok:true,body,requestJson,requestBytes:Buffer.byteLength(requestJson),images:[],parameters:params,savedDefaults};
  return freeze({...p,plan,mockOnly:true,summary:summary(plan,req,p,config,cap,media)});
 }catch(e){return {ok:false,code:e.code??'WAN_VIDEO_INPUT'};}
}
function outputURL(value,region){const u=new URL(mediaURL(value));if(region!=='cn-beijing'||u.hostname!=='dashscope-result-bj.oss-cn-beijing.aliyuncs.com')fail('WAN_OUTPUT_SOURCE_UNKNOWN');return u.href;}
function resultFile(root,result){
 if(!path.isAbsolute(root)||result?.verified!==true||result.mime!=='video/mp4'||! /^[a-f0-9]{64}\.[a-f0-9]{64}\.mp4$/.test(result.filename)||! /^[a-f0-9]{64}$/.test(result.sha256))fail('WAN_RESULT_SCOPE');
 for(let p=path.resolve(root);;p=path.dirname(p)){if(fs.existsSync(p)&&fs.lstatSync(p).isSymbolicLink())fail('WAN_RESULT_SCOPE');if(path.dirname(p)===p)break;}
 const file=path.join(root,result.filename),stat=fs.lstatSync(file);if(!stat.isFile()||stat.isSymbolicLink()||stat.nlink!==1||stat.size!==result.size||stat.size>128*1024*1024||hash(fs.readFileSync(file))!==result.sha256)fail('WAN_RESULT_SCOPE');return file;
}
const token=v=>typeof v==='string'&&/^[A-Za-z0-9_.:-]{1,120}$/.test(v)&&!secrets.contains(v)?v:null;
function diagnostic(r,b){const h=Object.fromEntries(Object.entries(r?.headers??{}).map(([k,v])=>[k.toLowerCase(),v]));return {httpStatus:Number.isInteger(r?.status)?r.status:null,providerCode:token(b?.output?.code??b?.code),requestId:token(b?.request_id??h['x-request-id'])};}
function enabled(){const b=require('../integration-build.json');return b.offlineOnly!==true&&b.supplierAPIEnabled===true;}
function nativeRequest({url,method,headers,body,phase,region,signal,timeoutMs,maxBytes}){
 if(!enabled())fail('WAN_NETWORK_DISABLED');if(phase==='download')outputURL(url,region);else {const u=new URL(url),base=u.origin+'/api/v1';origin(base);const tail=url.slice(base.length);if(!(method==='POST'&&tail===SUBMIT)&&!(method==='GET'&&tail.startsWith('/tasks/')&&taskId(tail.slice(7))))fail('WAN_ROUTE_SCOPE');}
 return new Promise((resolve,reject)=>{let settled=false,response,timer;const finish=(e,v)=>{if(settled)return;settled=true;clearTimeout(timer);e?reject(e):resolve(v);};
  const req=https.request(url,{method,headers,agent:false,rejectUnauthorized:true,minVersion:'TLSv1.2',maxHeaderSize:16384,lookup,signal},res=>{response=res;const chunks=[];let size=0;res.on('data',b=>{size+=b.length;if(size>maxBytes){res.destroy();finish(Object.assign(Error('WAN_RESPONSE_LIMIT'),{code:'WAN_RESPONSE_LIMIT'}));}else chunks.push(b);});res.on('end',()=>finish(null,{status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks)}));res.on('error',()=>finish(Error('WAN_NETWORK_UNKNOWN')));res.on('aborted',()=>finish(Error('WAN_NETWORK_UNKNOWN')));});
  timer=setTimeout(()=>{req.destroy();response?.destroy();finish(Error('WAN_TIMEOUT'));},timeoutMs);req.on('error',()=>finish(Error('WAN_NETWORK_UNKNOWN')));req.end(body??undefined);
 });
}
class WanProvider{
 #outputs=new Map();#queries=new Map();#lastPost=-Infinity;#live=new Set();
 constructor({baseUrl,credential,request,inspect=require('./media.cjs').inspect,apiTimeoutMs=15000,pollIntervalMs=15000,clock=Date.now}={}){this.scope=origin(baseUrl);if(typeof credential!=='function'||request!==undefined&&typeof request!=='function'||!Number.isSafeInteger(apiTimeoutMs)||apiTimeoutMs<1||apiTimeoutMs>180000||!Number.isSafeInteger(pollIntervalMs)||pollIntervalMs<0||!request&&pollIntervalMs<15000)fail('WAN_CREDENTIAL_PORT');this.credential=credential;this.request=request??nativeRequest;this.injected=!!request;this.inspect=inspect;this.apiTimeoutMs=apiTimeoutMs;this.pollIntervalMs=pollIntervalMs;this.clock=clock;}
 assertDispatchEnabled(){if(!this.injected&&!enabled())fail('WAN_NETWORK_DISABLED');}
 async binding(){return this.credential('query',s=>{if(typeof s!=='string'||!s.length)fail('CREDENTIAL_REQUIRED');return hash(s);});}
 async api(method,url,body,consume,expectedCredential,beforeSend){
  this.assertDispatchEnabled();const outcome=await this.credential(method==='POST'?'submit':'query',async secret=>{
   try{if(typeof secret!=='string'||secret.length<16||secret.length>4096||/[^\x21-\x7e]/.test(secret))fail('CREDENTIAL_REQUIRED');if(expectedCredential&&hash(secret)!==expectedCredential)fail('WAN_CREDENTIAL_CHANGED');beforeSend?.();this.assertDispatchEnabled();
    const controller=new AbortController();let r;try{r=(await timedNext({next:async()=>({done:false,value:await this.request({url,method,headers:{Authorization:'Bearer '+secret,'Content-Type':'application/json',...(method==='POST'?{'X-DashScope-Async':'enable'}:{})},body,phase:method==='POST'?'submit':'query',region:this.scope.region,signal:controller.signal,timeoutMs:this.apiTimeoutMs,maxBytes:65536,automaticPostRetries:0})})},{ms:this.apiTimeoutMs})).value;}finally{controller.abort();}
    let b;try{if(Buffer.isBuffer(r?.body)&&r.body.length<=65536)b=JSON.parse(r.body.toString('utf8'));}catch{}const d=diagnostic(r,b);if(!Number.isInteger(r?.status))fail('WAN_RESPONSE_INVALID',d);if(r.status!==200)fail('WAN_HTTP',d);if(!b||typeof b!=='object'||Array.isArray(b))fail('WAN_RESPONSE_INVALID',d);
    try{return secrets.assertSafe({ok:true,value:{...consume(b),...d}});}catch(e){throw Object.assign(e,d);}
   }catch(e){return secrets.assertSafe({ok:false,error:{code:/^WAN_[A-Z_]+$/.test(e.code??'')?e.code:'WAN_NETWORK_UNKNOWN',httpStatus:Number.isInteger(e.httpStatus)?e.httpStatus:null,providerCode:token(e.providerCode),requestId:token(e.requestId)}});}
  });if(outcome?.ok!==true)fail(outcome?.error?.code??'WAN_NETWORK_UNKNOWN',outcome?.error??{});return outcome.value;
 }
 consume(b,expectedId){const o=b.output,id=taskId(o?.task_id);if(expectedId&&id!==expectedId)fail('WAN_TASK_ID');if(!['PENDING','RUNNING','SUCCEEDED','FAILED','CANCELED','UNKNOWN'].includes(o.task_status))fail('WAN_STATUS_UNKNOWN');
  this.#outputs.delete(id);if(o.task_status==='SUCCEEDED'){if(b.usage?.video_count!==undefined&&b.usage.video_count!==1)fail('WAN_OUTPUT_COUNT');this.#outputs.set(id,{url:outputURL(o.video_url,this.scope.region),expiresAt:this.clock()+86400000});}
  const usage={};for(const k of ['video_count','duration','input_video_duration','output_video_duration','fps','SR'])if(b.usage?.[k]!==undefined){const v=b.usage[k];if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>100000)fail('WAN_USAGE');usage[k]=v;}
  if(['SUCCEEDED','FAILED','CANCELED'].includes(o.task_status))this.#live.delete(id);
  if(usage.input_video_duration!==undefined&&usage.output_video_duration!==undefined&&usage.input_video_duration+usage.output_video_duration>30.25)fail('WAN_USAGE');
  return {taskId:id,remoteStatus:o.task_status,hasOutput:o.task_status==='SUCCEEDED',usage};
 }
 async submit(p,expectedCredential,beforeSend){
  if(!p?.ok||p.plan?.baseUrl!==this.scope.baseUrl||p.plan.url!==this.scope.baseUrl+SUBMIT||hash(p.requestJson)!==p.summary?.requestSHA256||p.mockOnly&&!this.injected)fail('WAN_REQUEST_INVALID');
  if(this.#live.size>=5)fail('WAN_CONCURRENCY_LIMIT');
  // The remote account/Workspace quota remains authoritative. Native dispatches
  // on this connection are additionally bounded to five per second.
  const now=this.clock();if(!this.injected&&now-this.#lastPost<200)fail('WAN_RATE_LIMIT_LOCAL');
  this.#lastPost=now;const result=await this.api('POST',p.plan.url,p.requestJson,b=>this.consume(b),expectedCredential,beforeSend);
  if(['PENDING','RUNNING'].includes(result.remoteStatus))this.#live.add(result.taskId);return result;
 }
 async query(id){taskId(id);const now=this.clock();if(this.#queries.has(id)&&now-this.#queries.get(id)<this.pollIntervalMs)fail('WAN_POLL_TOO_SOON');this.#queries.set(id,now);return this.api('GET',this.scope.baseUrl+'/tasks/'+id,undefined,b=>this.consume(b,id));}
 async download(id,root,mediaKind,expected={}){
  taskId(id);const entry=this.#outputs.get(id);if(!entry||this.clock()>=entry.expiresAt)fail('WAN_OUTPUT_EXPIRED');const url=outputURL(entry.url,this.scope.region);if(mediaKind!=='VIDEO'||!path.isAbsolute(root))fail('WAN_RESULT_SCOPE');
  for(let p=path.resolve(root);;p=path.dirname(p)){if(fs.existsSync(p)&&fs.lstatSync(p).isSymbolicLink())fail('WAN_RESULT_SCOPE');if(path.dirname(p)===p)break;}await fsp.mkdir(root,{recursive:true});let temp;
  try{const r=await this.request({url,method:'GET',headers:{},phase:'download',region:this.scope.region,timeoutMs:600000,maxBytes:128*1024*1024,automaticPostRetries:0});if(r?.status!==200)fail('WAN_DOWNLOAD_HTTP',{httpStatus:Number.isInteger(r?.status)?r.status:null});
   const headers=Object.fromEntries(Object.entries(r.headers??{}).map(([k,v])=>[k.toLowerCase(),v]));if(headers['content-encoding']&&!/^identity$/i.test(headers['content-encoding'])||String(headers['content-type']??'').split(';')[0].toLowerCase()!=='video/mp4')fail('WAN_DOWNLOAD_FORMAT');
   const {readBytes}=require('./api-mock-response.cjs'),bytes=await readBytes(r,{maxBytes:128*1024*1024,waitMs:600000});if(!bytes.length||secrets.contains(bytes))fail('WAN_DOWNLOAD_BYTES');temp=path.join(root,crypto.randomUUID()+'.partial.mp4');const h=await fsp.open(temp,'wx',0o600);try{await h.writeFile(bytes);await h.sync();}finally{await h.close();}
   const info=await this.inspect(temp);if(info.type!=='video'||info.mime!=='video/mp4'||info.codec!=='h264'||info.audioCodec!==null&&info.audioCodec!=='aac'||info.sha256!==hash(bytes)||info.size!==bytes.length||!Number.isInteger(info.width)||!Number.isInteger(info.height)||info.width<1||info.width>3840||info.height<1||info.height>2160||!Number.isFinite(info.fps)||Math.abs(info.fps-30)>.1||!Number.isFinite(info.durationMs)||info.durationMs<2000||info.durationMs>30000)fail('WAN_DOWNLOAD_DECODE');
   if(expected.duration!==undefined&&expected.duration!==-1&&Math.abs(info.durationMs-expected.duration*1000)>250)fail('WAN_OUTPUT_DURATION');if(expected.audio===false&&info.audioCodec!==null)fail('WAN_OUTPUT_AUDIO');
   if(expected.ratio&&expected.ratio!=='adaptive'){const [w,h]=expected.ratio.split(':').map(Number);if(Math.abs((info.width/info.height)/(w/h)-1)>.02)fail('WAN_OUTPUT_GEOMETRY');}
   const filename=hash(id)+'.'+info.sha256+'.mp4',final=path.join(root,filename);try{await fsp.link(temp,final);}catch(e){if(e.code!=='EEXIST')fail('WAN_RESULT_CONFLICT');const old=await fsp.lstat(final);if(!old.isFile()||old.isSymbolicLink()||old.nlink!==1||hash(await fsp.readFile(final))!==info.sha256)fail('WAN_RESULT_CONFLICT');}
   this.#outputs.delete(id);return {filename,sha256:info.sha256,size:info.size,mime:info.mime,width:info.width,height:info.height,durationMs:info.durationMs,verified:true};
  }catch(e){if(/^WAN_[A-Z_]+$/.test(e.code??''))throw e;fail('WAN_DOWNLOAD_FAILED');}finally{if(temp)await fsp.unlink(temp).catch(()=>{});}
 }
}
module.exports={WanProvider,prepare,prepareReferenceVideoMock,resolve,reference,models,regions,origin,taskId,outputURL,resultFile,inspectImageBytes:require('./runway-provider.cjs').inspectImageBytes};

'use strict';
// Request preflight only; no transport, credentials, persistence or production
// entry point. Capabilities and local byte/decoder/serializer ports are supplied
// by the exact adapter caller. No Provider limits are embedded in this module.
const {prepareInputSelection}=require('./api-inputs.cjs');
const {freeze}=require('./live-policy.cjs');
const {createHash}=require('node:crypto'),path=require('node:path');
const own=(o,k)=>Object.hasOwn(o,k);
const record=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const positive=x=>Number.isSafeInteger(x)&&x>0;
const hash=b=>createHash('sha256').update(b).digest('hex');
function diagnostic(cap,code,fieldPath,extra={}){
 return freeze({ok:false,code,fieldPath,knowledge:code==='CAPABILITY_UNKNOWN'?'UNKNOWN':cap?.knowledge??'UNKNOWN',severity:'ERROR',sourceRefs:cap?.sourceRefs??[],effectiveScope:cap?.scope??null,userAction:'Review the indicated input and exact capability evidence; no automatic parameter correction.',...extra});
}
function signature(bytes){
 if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'image/png';
 if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';
 return null;
}
async function prepareRequest({plan,input,capability:cap,savedDefaults={},overrides={}},{readAsset,inspectAsset,serialize}={}){
 const fail=(code,field,extra)=>diagnostic(cap,code,field,extra);
 const scope={routingId:plan?.routingId,adapterId:plan?.adapterId,adapterVersion:plan?.adapterVersion,operation:plan?.operation,mode:input?.mode};
 if(!plan?.ok||cap?.knowledge!=='SUPPORTED'||!Array.isArray(cap.sourceRefs)||!cap.sourceRefs.length||!record(cap.scope)||Object.entries(scope).some(([k,v])=>v===undefined||cap.scope[k]!==v))return fail('CAPABILITY_UNKNOWN','capability.scope');
 // Known reference count errors precede legacy ROLE_CARDINALITY. Other roles,
 // modes, ordering and ambiguous selections remain the inherited core's job.
 if(['IMAGE_REFERENCE','MULTI_REFERENCE'].includes(input?.mode)){
  const c=cap.inputCount;
  if(!positive(c?.minImages)||!positive(c?.maxImages)||c.maxImages<c.minImages)return fail('CAPABILITY_UNKNOWN','selectedImages');
  if(Array.isArray(input.selectedImages)&&(input.selectedImages.length<c.minImages||input.selectedImages.length>c.maxImages))return fail('INPUT_COUNT','selectedImages',{actualCount:input.selectedImages.length,minImages:c.minImages,maxImages:c.maxImages});
 }
 const selected=prepareInputSelection(input,cap.inputCount);
 if(!selected.ok)return fail(selected.code,'selectedImages');
 if(!record(savedDefaults)||!record(overrides)||!record(cap.parameters))return fail('CAPABILITY_UNKNOWN','parameters');
 const params={};
 for(const field of new Set([...Object.keys(savedDefaults),...Object.keys(overrides)]))if(!own(cap.parameters,field))return fail('PARAMETER_UNSUPPORTED','parameters.'+field);
 for(const [field,rule]of Object.entries(cap.parameters)){
  const value=own(overrides,field)?overrides[field]:savedDefaults[field];
  if(value===undefined){if(rule.required)return fail('REQUIRED_FIELD','parameters.'+field);continue;}
  if(typeof value!==rule.type||(rule.type==='number'&&!Number.isFinite(value)))return fail('PARAMETER_TYPE','parameters.'+field);
  if(rule.enum&&!rule.enum.includes(value))return fail('PARAMETER_ENUM','parameters.'+field);
  if((rule.min!==undefined&&value<rule.min)||(rule.max!==undefined&&value>rule.max))return fail('PARAMETER_RANGE','parameters.'+field);
  if(rule.step!==undefined&&(!positive(rule.step)||!Number.isSafeInteger(value)||value%rule.step!==0))return fail('SIZE_STEP','parameters.'+field);
  params[field]=value; // false is an explicit value, never treated as absent.
 }
 if(params.generate_audio===false&&cap.audioOff!=='SUPPORTED')return fail(cap.audioOff==='UNSUPPORTED'?'AUDIO_OFF_UNSUPPORTED':'CAPABILITY_UNKNOWN','parameters.generate_audio');
 if(!Array.isArray(cap.combinations))return fail('CAPABILITY_UNKNOWN','parameters.combinations');
 for(const rule of cap.combinations){
  if(Object.entries(rule.when).every(([k,v])=>params[k]===v)&&Object.entries(rule.allow).some(([k,values])=>!values.includes(params[k])))return fail('COMBINATION_RULE','parameters',{combination:rule});
 }
 const media=cap.input;
 if(selected.images.length&&(!record(media)||!Array.isArray(media.mimes)||!positive(media.maxBytes)||!positive(media.totalBytes)||!positive(media.width?.min)||!positive(media.width?.max)||!positive(media.height?.min)||!positive(media.height?.max)||!positive(media.maxPixels)||!Number.isFinite(media.ratio?.min)||!Number.isFinite(media.ratio?.max)||media.ratio.min<=0||media.ratio.max<media.ratio.min||typeof readAsset!=='function'||typeof inspectAsset!=='function'))return fail('CAPABILITY_UNKNOWN','input');
 const images=[],urls=[];let totalBytes=0;
 for(const [index,asset]of selected.images.entries()){
  const field='selectedImages.'+index;
  let source;try{source=await readAsset(asset);}catch{return fail('INPUT_DECODE',field);}
  if(!Buffer.isBuffer(source?.bytes)||!source.bytes.length)return fail('INPUT_DECODE',field);
  // Snapshot bytes once; decoder must attest to this exact snapshot via SHA/size.
  const bytes=Buffer.from(source.bytes),mime=signature(bytes),ext=typeof source.filename==='string'?path.extname(source.filename).toLowerCase():'';
  const extensionMime={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg'}[ext];
  if(!mime||extensionMime!==mime||source.mime!==mime||!media.mimes.includes(mime))return fail('INPUT_MIME',field);
  totalBytes+=bytes.length;
  if(bytes.length>media.maxBytes||totalBytes>media.totalBytes)return fail('INPUT_BYTES',field);
  let decoded;try{decoded=await inspectAsset(asset,{...source,bytes:Buffer.from(bytes)});}catch{return fail('INPUT_DECODE',field);}
  if(decoded?.mime!==mime)return fail('INPUT_MIME',field);
  if(decoded.sha256!==hash(bytes)||decoded.size!==bytes.length||!positive(decoded.width)||!positive(decoded.height))return fail('INPUT_DECODE',field);
  const {width,height}=decoded,ratio=width/height;
  if(width<media.width.min||width>media.width.max||height<media.height.min||height>media.height.max||width*height>media.maxPixels||ratio<media.ratio.min||ratio>media.ratio.max)return fail('INPUT_GEOMETRY',field,{width,height,pixels:width*height,ratio});
  images.push({...asset,mime,size:bytes.length,sha256:hash(bytes),width,height});
  urls.push(cap.request?.encoding==='BASE64_DATA_URL'?'data:'+mime+';base64,'+bytes.toString('base64'):asset.url);
 }
 if(!['URL','BASE64_DATA_URL'].includes(cap.request?.encoding)||!positive(cap.request.maxBytes)||typeof serialize!=='function')return fail('CAPABILITY_UNKNOWN','request');
 let body,requestJson;
 try{body=serialize(plan,selected,freeze({...params}),Object.freeze(urls));requestJson=JSON.stringify(body);if(typeof requestJson!=='string')throw Error();}catch{return fail('REQUEST_SERIALIZE','request');}
 // Exact UTF8 bytes of the complete serialized JSON body, including Base64,
 // data URL prefixes, prompt and every parameter. Dispatch must use this string.
 const requestBytes=Buffer.byteLength(requestJson,'utf8');
 if(requestBytes>cap.request.maxBytes)return fail('REQUEST_BYTES','request',{actualBytes:requestBytes,limitBytes:cap.request.maxBytes,rawImageBytes:totalBytes});
 return freeze({ok:true,body:JSON.parse(requestJson),requestJson,requestBytes,images,parameters:params,effectiveScope:{...cap.scope},sourceRefs:[...cap.sourceRefs]});
}
module.exports={prepareRequest};

'use strict';
const c=require('./d1-json.cjs'),p=require('./seedance-policy.cjs');
const PATH='/api/v3/contents/generations/tasks',HOST='ark-content-generation-cn-beijing.tos-cn-beijing.volces.com';
const fail=code=>{throw Object.assign(Error(code),{code})};
function body(e,referenceBase64){p.validate(e);return Buffer.from(c.jcs({model:e.target.requestedModel,content:e.version===4?require('./video-reference.cjs').wireContent(e,referenceBase64):[{type:'text',text:e.prompt}],...Object.fromEntries(e.parameters.map(x=>[x.key,x.value]))}))}
function jobId(x){if(typeof x!=='string'||!/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(x))fail('C_VIDEO_JOB_ID');return x}
const diag=require('./video-query-diagnostic.cjs'),us=require('./video-url-source.cjs');
function sourceError(error,field,value){const e=diag.error('source-validation','SOURCE_ERROR',field,value);e.queryDiagnostic=diag.make({...e.queryDiagnostic,urlSource:error.urlSource,providerStatus:'succeeded'});throw e}
function json(response){if(!response||response.status!==200)throw diag.error('http','HTTP_ERROR');if(!Buffer.isBuffer(response.body)||response.body.length>1048576)throw diag.error('json','JSON_ERROR','body',response.body);if(!/^application\/json(?:;|$)/i.test(response.contentType))throw diag.error('http','MIME_ERROR','content-type',response.contentType);try{return c.parse(response.body,{max:1048576})}catch{throw diag.error('json','JSON_ERROR','body',response.body)}}
function submitted(response){const v=json(response);c.keys(v,['id']);return jobId(v.id)}
function queried(response,id,model=p.entry.exactModelId){const v=json(response);
 if(!v||typeof v!=='object'||Array.isArray(v))throw diag.error('response-fields','FIELD_ERROR','body',v);
 if(v.id!==jobId(id))throw diag.error('source-validation','SOURCE_ERROR','id',v.id);
 if(!p.byModel(model)||v.model!==model)throw diag.error('source-validation','SOURCE_ERROR','model',v.model);
 if(!['queued','running','succeeded','failed','expired','cancelled'].includes(v.status))throw diag.error('response-fields','FIELD_ERROR','status',v.status);
 const usage=require('./video-usage.cjs').parse(v.usage,Object.hasOwn(v,'usage'));
 try{if(v.status==='succeeded'){
  if(model===require('./seedance25-contract.cjs').model){for(const [field,expected]of Object.entries({resolution:'480p',ratio:'16:9',duration:4,framespersecond:24,generate_audio:false})){if(Object.hasOwn(v,field)&&v[field]!==expected)throw diag.error('response-fields','FIELD_ERROR',field,v[field])}}
  if(!v.content||typeof v.content!=='object'||Array.isArray(v.content))throw diag.error('response-fields','FIELD_ERROR','content',v.content);
  if(typeof v.content.video_url!=='string')throw diag.error('response-fields','FIELD_ERROR','content.video_url',v.content.video_url);
  try{mediaURL(v.content.video_url,model)}catch(error){sourceError(error,'content.video_url',v.content.video_url)}
  try{signedExpiry(v.content.video_url,model)}catch(error){sourceError(error,'signature-expiry',v.content.video_url)}
 }
 }catch(error){error.videoUsage=usage;throw error}
 return {usage,status:v.status,url:v.status==='succeeded'?v.content.video_url:null,responseDeclaredModel:v.model,knownURLExpiresAt:v.status==='succeeded'?signedExpiry(v.content.video_url,model):null}}
function mediaURL(value,model=p.entry.exactModelId){if(typeof value!=='string')us.reject('type',undefined);if(value.length>4096)us.reject('length',undefined);let u;try{u=new URL(value)}catch{us.reject('parse',undefined)}if(u.protocol!=='https:')us.reject('protocol',value);if(!p.hosts(model).includes(u.hostname))us.reject('hostname',value);if(u.port)us.reject('port',value);if(u.username||u.password)us.reject('userinfo',value);if(u.hash)us.reject('fragment',value);return u}
function signedExpiry(value,model=p.entry.exactModelId){const url=mediaURL(value,model),q=new Map([...url.searchParams].map(([k,v])=>[k.toLowerCase(),v]));let result=null;const unix=q.get('x-expires');if(unix!==undefined){if(!/^[0-9]{1,13}$/.test(unix)||!Number.isSafeInteger(Number(unix)*1000))us.reject('unix-expiry',value);result=Number(unix)*1000}if(q.has('x-tos-date')||q.has('x-tos-expires')){const date=q.get('x-tos-date'),seconds=q.get('x-tos-expires');if(!/^\d{8}T\d{6}Z$/.test(date||''))us.reject('tos-date',value);if(!/^\d{1,7}$/.test(seconds||''))us.reject('tos-seconds',value);const iso=date.slice(0,4)+'-'+date.slice(4,6)+'-'+date.slice(6,8)+'T'+date.slice(9,11)+':'+date.slice(11,13)+':'+date.slice(13,15)+'Z',at=Date.parse(iso);if(!Number.isFinite(at)||new Date(at).toISOString().replace(/[-:]|\.000/g,'')!==date)us.reject('tos-date-value',value);const end=at+Number(seconds)*1000;if(!Number.isSafeInteger(end))us.reject('tos-overflow',value);result=result===null?end:Math.min(result,end)}return result}
module.exports=Object.freeze({PATH,HOST,body,jobId,json,submitted,queried,mediaURL,signedExpiry,validate:p.validate});

'use strict';
// The only new B6 POST implementation. Literal loopback, fixed test path,
// bounded JSON, no redirects, Authorization, Key, TLS, or provider endpoint.
const http=require('node:http'),recovery=new WeakMap();
function createBytePlusMockPost(config={}){
 const {port}=config;
 if(!Number.isInteger(port)||port<1024||port>65535)throw Object.assign(Error('B6 local mock port required'),{code:'BP_OFFLINE_ONLY'});
 const post=(body,{signal}={})=>new Promise((resolve,reject)=>{
  const bytes=Buffer.from(JSON.stringify(body));if(bytes.length>64000000){reject(Object.assign(Error('B6 mock body limit'),{code:'BP_BODY_LIMIT'}));return;}
  const req=http.request({host:'127.0.0.1',port,path:'/bp-02-b6',method:'POST',agent:false,signal,headers:{'Content-Type':'application/json','Content-Length':String(bytes.length),'X-AICG-Offline-Mock':'BP-02-B6'}},res=>{
   let size=0;const chunks=[];res.on('data',b=>{size+=b.length;if(size>(config.b7?.enabled===true?180000000:1048576))res.destroy(Error('limit'));else chunks.push(b);});res.on('error',reject);
   res.on('end',()=>{try{if(res.statusCode!==200||res.headers['x-aicg-offline-mock']!=='BP-02-B6')throw Error('local mock contract');resolve(JSON.parse(Buffer.concat(chunks)));}catch{reject(Object.assign(Error('Mock outcome unknown'),{code:'BP_MOCK_UNKNOWN'}));}});
  });req.setTimeout(10000,()=>req.destroy(Error('timeout')));req.on('error',()=>reject(Object.assign(Error('Mock outcome unknown'),{code:'BP_MOCK_UNKNOWN'})));req.end(bytes);
 });
 if(config.b7?.enabled===true)recovery.set(post,createRecovery(config));
 return post;
}
function createRecovery({port,decoder,b7}){
 if(!Array.isArray(b7.sources)||b7.sources.length>64)throw Object.assign(Error('B7 fixed local sources required'),{code:'BP_OFFLINE_ONLY'});
 const sources=structuredClone(b7.sources),hosts=[...new Set(sources.map(s=>new URL(s.uri).hostname))];let decoding;
 const decode=async(bytes,options)=>{decoding??=import('./byteplus-media-decoder.mjs').then(m=>m.createBytePlusMediaDecoder(decoder));return (await decoding)(bytes,options);};
 const json=(method,suffix,signal)=>new Promise((resolve,reject)=>{const req=http.request({host:'127.0.0.1',port,path:'/bp-02-b7/tasks'+suffix,method,agent:false,signal,headers:{'X-AICG-Offline-Mock':'BP-02-B7'}},res=>{let size=0;const chunks=[];res.on('data',b=>{size+=b.length;if(size>1048576)res.destroy();else chunks.push(b);});res.on('error',()=>reject(Object.assign(Error('Local task response unavailable'),{code:'BP_TASK_IO'})));res.on('end',()=>{try{if(res.headers['x-aicg-offline-mock']!=='BP-02-B7')throw Error();resolve({status:res.statusCode,headers:{'x-request-id':res.headers['x-request-id']},body:JSON.parse(Buffer.concat(chunks))});}catch{reject(Object.assign(Error('Local task response invalid'),{code:'BP_TASK_QUERY_UNKNOWN'}));}});});req.setTimeout(10000,()=>req.destroy());req.on('error',()=>reject(Object.assign(Error('Local task IO failed'),{code:'BP_TASK_IO'})));req.end();});
 const identity=id=>{if(typeof id!=='string'||!/^[-A-Za-z0-9_.]{1,128}$/.test(id))throw Object.assign(Error('Original task ID required'),{code:'BP_TASK_UNKNOWN'});return '/'+encodeURIComponent(id);};
 const member=s=>Object.fromEntries(Object.entries(s).filter(([k])=>['assetNodeId','mediaVersionId','sourceId','sourceVersionId','contentSha256','byteSize','mimeType','metadata','requireAlpha','z_index'].includes(k)));
 return {mode:'offline-mock',decode,poll:b7.poll,queryTask:(id,{signal}={})=>json('GET',identity(id),signal),listTasks:async()=>{const r=await json('GET','');if(r.status!==200)throw Object.assign(Error('List failed'),{code:'BP_TASK_QUERY_UNKNOWN'});return r.body;},deleteTask:async(id)=>{const r=await json('DELETE',identity(id));if(r.status!==200||JSON.stringify(r.body)!=='{}')throw Object.assign(Error('Delete outcome unknown'),{code:'BP_CLOUD_OUTCOME_UNKNOWN'});},
  locateVideo:async(parsed,a)=>{const s=sources.find(s=>s.uri===parsed.content.video_url);if(!s)throw Object.assign(Error('No trusted result source'),{code:'BP_RECOVERY_SOURCE'});return {contractKind:'byteplus.media-set',contractVersion:1,provider:'byteplus-modelark',region:'ap-southeast-1',canonicalModelId:a.plan.model,profile:'seedance-output',operation:'single',members:[{...member(s),expectedUri:s.uri}]};},
  locateOutput:async result=>{const s=sources.find(s=>s.uri===result.url);if(!s)throw Object.assign(Error('No fixed image source'),{code:'BP_RECOVERY_SOURCE'});return member(s);},
  media:{mode:'offline-mock',clock:Date.now,timeoutMs:10000,maxAttempts:1,approvedHosts:hosts.length?hosts:['media.fixture.invalid'],decode,lookup:async()=>[{address:'8.8.8.8',family:4}],resolveSource:async id=>structuredClone(sources.find(s=>s.sourceId===id.sourceId&&s.sourceVersionId===id.sourceVersionId)),
   // Explicit offline peer/DNS adapter. This makes no production TLS claim.
   open:async r=>new Promise((resolve,reject)=>{const s=sources.find(s=>s.uri===r.url);if(!s||!/^[-A-Za-z0-9_.]{1,128}$/.test(s.sourceId))return reject(Object.assign(Error('Source unavailable'),{code:'BP_MEDIA_SOURCE'}));const req=http.request({host:'127.0.0.1',port,path:'/bp-02-b7/media/'+s.sourceId,method:'GET',agent:false,signal:r.signal,headers:r.headers},res=>resolve({status:res.statusCode,headers:res.headers,peerAddress:r.address,body:res,close:()=>res.destroy()}));req.on('error',reject);req.setTimeout(10000,()=>req.destroy());req.end();})}}
}
module.exports={createBytePlusMockPost,recoveryFor:post=>recovery.get(post)};

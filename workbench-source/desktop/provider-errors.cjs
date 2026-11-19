'use strict';
const crypto=require('node:crypto');
const MAX=65536,MAP=Object.freeze({AccessDenied:'接口拒绝访问；需核对资源/项目权限。',AccountOverdueError:'账户或计费状态不允许调用。','OperationDenied.ServiceNotOpen':'服务尚未开通或当前不可用。','OperationDenied.PermissionDenied':'当前身份没有该配置的访问权限。','OperationDenied.ServiceOverdue':'服务因账务状态被暂停。',ModelNotOpen:'该账户未开通指定模型。',AuthenticationError:'接口未接受当前认证凭证。',InvalidParameter:'接口拒绝了请求参数。','InvalidEndpointOrModel.NotFound':'指定模型/端点不可用或无访问权限。'});
const UNKNOWN='未能安全解析官方错误原因；需凭HTTP状态及请求标识查询。',STATES=['PARSED','UNRECOGNIZED','INVALID_JSON','BODY_LIMIT','UNSUPPORTED_ENCODING','INCOMPLETE'];
function id(value,secret){return typeof value==='string'&&/^\d{14,20}[A-Za-z0-9_-]{0,96}$/.test(value)&&(!secret||!value.includes(secret)&&!secret.includes(value))?value:null}
function capture(bytes,{status,headers={},secret='',state}={}){
 let body=null;try{if(!state)body=require('./d1-json.cjs').parse(bytes,{max:MAX})}catch{state='INVALID_JSON'}
 const rawCode=body?.error?.code,code=typeof rawCode==='string'&&Object.hasOwn(MAP,rawCode)&&(!secret||!rawCode.includes(secret))?rawCode:null;
 const message=body?.error?.message,embedded=typeof message==='string'?/Request\s+[Ii][Dd]:?\s*(\d{14,20}[A-Za-z0-9_-]{0,96})/.exec(message)?.[1]:null;
 const requestId=[headers['x-request-id'],headers['x-tt-logid'],body?.request_id,body?.error?.request_id,embedded].map(x=>id(x,secret)).find(Boolean)||null;
 const complete=!state||['PARSED','UNRECOGNIZED','INVALID_JSON'].includes(state);
 return {httpStatus:status,code,message:code?MAP[code]:UNKNOWN,requestId,captureState:state||(code?'PARSED':'UNRECOGNIZED'),bodyBytesRead:bytes.length,bodyComplete:complete,bodySha256:complete?crypto.createHash('sha256').update(bytes).digest('hex'):null};
}
function valid(d){if(!d||Object.keys(d).sort().join(',')!=='bodyBytesRead,bodyComplete,bodySha256,captureState,code,httpStatus,message,requestId')return false;return Number.isSafeInteger(d.httpStatus)&&d.httpStatus>=100&&d.httpStatus<=599&&(d.code===null||Object.hasOwn(MAP,d.code))&&d.message===(d.code?MAP[d.code]:UNKNOWN)&&(d.requestId===null||id(d.requestId,''))&&STATES.includes(d.captureState)&&Number.isSafeInteger(d.bodyBytesRead)&&d.bodyBytesRead>=0&&d.bodyBytesRead<=MAX&&typeof d.bodyComplete==='boolean'&&(d.bodySha256===null||/^[a-f0-9]{64}$/.test(d.bodySha256))}
function collect(res,secret){return new Promise(resolve=>{let done=false,size=0;const chunks=[],finish=state=>{if(done)return;done=true;const d=capture(Buffer.concat(chunks),{status:res.statusCode,headers:res.headers,secret,state});resolve(d)};
 if(res.headers['content-encoding']&&res.headers['content-encoding']!=='identity'){finish('UNSUPPORTED_ENCODING');res.destroy();return}
 res.on('data',chunk=>{size+=chunk.length;if(size>MAX){finish('BODY_LIMIT');res.destroy()}else chunks.push(Buffer.from(chunk))});res.once('end',()=>finish());res.once('aborted',()=>finish('INCOMPLETE'));res.once('error',()=>finish('INCOMPLETE'));
 })}
module.exports=Object.freeze({MAX,capture,collect,valid});

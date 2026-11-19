'use strict';
// Only these public error codes and exact public message phrases may leave HTTP memory.
// Unmatched message text, extra JSON fields, URLs and headers are never persisted.
const CODES=Object.freeze({
 AccessDenied:'此請求沒有目標資源的存取權限',
 'OperationDenied.PermissionDenied':'供應商拒絕存取模型配置',
 'OperationDenied.ServiceNotOpen':'供應商表示模型服務未開通或不可用',
 'OperationDenied.ServiceOverdue':'供應商表示帳戶帳款逾期',
 AccountOverdueError:'供應商表示帳戶有逾期餘額',
 AuthenticationError:'供應商無法驗證本次認證',
 'InvalidEndpointOrModel.ModelIDAccessDisabled':'供應商表示此帳戶不能以模型 ID 呼叫',
 'InvalidEndpointOrModel.NotFound':'供應商找不到模型或接入點，或無權存取',
 ModelNotOpen:'供應商表示模型尚未開通',
 'RateLimitExceeded.EndpointRPMExceeded':'供應商表示接入點每分鐘請求量已達限制',
 'RateLimitExceeded.EndpointTPMExceeded':'供應商表示接入點每分鐘 Token 量已達限制',
 InvalidParameter:'供應商拒絕本次參數',MissingParameter:'供應商表示缺少必要參數',
 InternalServiceError:'供應商回報服務異常'
});
const MESSAGES=Object.freeze({
 AccessDenied:'The request failed because you do not have access to the requested resource.',
 'OperationDenied.PermissionDenied':'Operation is denied because you are not permitted to access the specified configuration of the FoundationModel.',
 AccountOverdueError:'The request failed because your account has an overdue balance.',
 AuthenticationError:'The API key or AK/SK in the request is missing or invalid.',
 'InvalidEndpointOrModel.ModelIDAccessDisabled':'Accessing the model via Model ID is not allowed for your account. Please use a custom endpoint ID instead.'
});
const PHASES=new Set(['prepare','submit','query','download','media-validation']);
function requestId(value){return typeof value==='string'&&/^[-A-Za-z0-9_.:]{1,200}$/.test(value)?value:null;}
function fields(value={}){const code=typeof value.supplierCode==='string'&&Object.hasOwn(CODES,value.supplierCode)?value.supplierCode:null;let message=null;if(code&&typeof value.supplierMessage==='string'&&value.supplierMessage.length<=1024&&!/[\x00-\x1f\x7f]/.test(value.supplierMessage)){const text=value.supplierMessage.replace(/\s*Request [iI][dD]:\s*[-A-Za-z0-9_.:]{1,200}\.?\s*$/,'').trim();if(text===MESSAGES[code])message=text;}return {supplierCode:code,supplierMessage:message};}
function capture(body){if(!Buffer.isBuffer(body)||body.length>65536)return fields();try{const data=JSON.parse(body.toString('utf8'));if(!data||typeof data!=='object'||Array.isArray(data)||!data.error||typeof data.error!=='object'||Array.isArray(data.error))return fields();return fields({supplierCode:data.error.code,supplierMessage:data.error.message});}catch{return fields();}}
function format(value){const d=fields(value),phase=PHASES.has(value.phase)?value.phase:'unknown',status=Number.isInteger(value.httpStatus)&&value.httpStatus>=100&&value.httpStatus<=599?value.httpStatus:null,id=requestId(value.requestId);return [`階段 ${phase}`,status?'HTTP '+status:null,d.supplierCode?'供應商 '+d.supplierCode+'：'+CODES[d.supplierCode]:'供應商詳細原因未取得或未通過安全白名單',d.supplierMessage,id?'requestID '+id:null].filter(Boolean).join(' · ');}
module.exports={capture,fields,format,requestId,PHASES};

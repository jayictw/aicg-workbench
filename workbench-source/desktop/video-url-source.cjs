'use strict';
// Diagnostic labels are independent of the admission allowlist. A documented host is not an admission grant.
const CONTRACT='ark-content-generation-cn-beijing.tos-cn-beijing.volces.com';
const DOCUMENTED='ark-acg-cn-beijing.tos-cn-beijing.volces.com';
const RULES=['accepted','type','length','parse','protocol','hostname','port','userinfo','fragment','unix-expiry','tos-date','tos-seconds','tos-date-value','tos-overflow'];
const SIG=['x-expires','x-tos-date','x-tos-expires'];
function shape(rule,value){let u;try{u=new URL(value)}catch{}return clean({version:1,rule,hostname:u?.hostname,protocol:u?.protocol,pathPresent:!!u?.pathname,queryPresent:!!u?.search,fragmentPresent:!!u?.hash,signatureParameters:u?[...u.searchParams.keys()].map(k=>k.toLowerCase()).filter(k=>SIG.includes(k)):[]})}
function clean(v){return {version:1,rule:RULES.includes(v?.rule)?v.rule:'parse',hostname:[CONTRACT,DOCUMENTED].includes(v?.hostname)?v.hostname:null,hostnameState:v?.hostname===CONTRACT?'contract':v?.hostname===DOCUMENTED?'documented-alternative':v?.hostname||v?.hostnameState==='redacted-other'?'redacted-other':'unavailable',protocol:['https:','http:'].includes(v?.protocol)?v.protocol:v?.protocol?'other':null,pathPresent:v?.pathPresent===true,queryPresent:v?.queryPresent===true,fragmentPresent:v?.fragmentPresent===true,signatureParameters:SIG.filter(k=>Array.isArray(v?.signatureParameters)&&v.signatureParameters.includes(k))}}
function valid(v){return require('./d1-json.cjs').same(v,clean(v))}
function reject(rule,value){const e=Object.assign(Error('C_VIDEO_DOWNLOAD_URL'),{code:'C_VIDEO_DOWNLOAD_URL'});e.urlSource=shape(rule,value);throw e}
module.exports={CONTRACT,DOCUMENTED,shape,clean,valid,reject};

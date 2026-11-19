'use strict';
// Isolated fixture boundary only: injected DNS/transport, no native network/key store.
const net=require('node:net');
const {publicAddress}=require('./official-media-policy.cjs');
const {ConfigRepository}=require('./api-config.cjs');
const fail=code=>Object.assign(new Error(code),{code});
const record=v=>!!v&&typeof v==='object'&&!Array.isArray(v)&&[Object.prototype,null].includes(Object.getPrototypeOf(v));
function fixtureURL(value,hosts,{signed=false}={}){
 if(typeof value!=='string'||value.length>8192||/[\x00-\x20\x7f\\]/.test(value))throw fail('MOCK_URL_UNSAFE');
 // Inspect the raw path before URL normalization. Signed query tokens remain
 // opaque in memory; their encoded slashes are not path traversal.
 let decoded=value.split(/[?#]/,1)[0];for(let n=0;n<3;n++){if(/\/(?:\.|\.\.)(?:\/|$)/.test(decoded)||/%(?:2e|2f|5c|25)/i.test(decoded))throw fail('MOCK_URL_UNSAFE');try{decoded=decodeURIComponent(decoded);}catch{throw fail('MOCK_URL_UNSAFE');}}
 let u;try{u=new URL(value);}catch{throw fail('MOCK_URL_UNSAFE');}
 if(u.protocol!=='https:'||u.username||u.password||u.hash||u.port||!signed&&u.search||net.isIP(u.hostname.replace(/^\[|\]$/g,''))||!u.hostname.endsWith('.example.invalid')||!hosts.includes(u.hostname))throw fail('MOCK_URL_UNSAFE');return u;
}
class MockReadGuard{
 constructor({resolve,request,policy,containsKnownSecret=()=>false}){
  if(policy?.fixtureId!=='MOCK-06-URL-1'||!Array.isArray(policy.allowedHosts)||!policy.allowedHosts.length||policy.allowedHosts.some(x=>typeof x!=='string'||!/^[-a-z0-9.]+\.example\.invalid$/.test(x))||!Number.isSafeInteger(policy.maxRedirects)||policy.maxRedirects<0||policy.maxRedirects>8||typeof resolve!=='function'||typeof request!=='function')throw fail('MOCK_URL_CONTRACT');
  this.policy=structuredClone(policy);this.resolve=resolve;this.request=request;this.containsKnownSecret=containsKnownSecret;
 }
 async read(value,{operation='download',operationName=null}={}){
  if(!['query','download'].includes(operation))throw fail('MOCK_READ_OPERATION');
  for(let hops=0;;hops++){
   const u=fixtureURL(value,this.policy.allowedHosts,{signed:true});let addresses;
   try{addresses=await this.resolve(u.hostname);}catch{throw fail('MOCK_DNS_UNSAFE');}
   if(!Array.isArray(addresses)||!addresses.length||addresses.some(x=>!publicAddress(x?.address)||net.isIP(x.address)!==x.family))throw fail('MOCK_DNS_UNSAFE');
   const pin={...addresses[0]};let response;
   // A compliant injected client connects ONLY to this pin, with original TLS
   // name, manual redirects, no ambient proxy/auth and no fresh DNS lookup.
   const lookup=(_host,_opts,cb)=>{if(typeof _opts==='function')cb=_opts;if(_host!==u.hostname)return cb(fail('MOCK_DNS_UNSAFE'));if(_opts?.all)return cb(null,[{...pin}]);cb(null,pin.address,pin.family);};
   try{response=await this.request({operationKind:operation,operationName,method:'GET',url:u.href,headers:{},body:null,redirect:'manual',followRedirects:false,connectAddress:pin.address,pinnedAddress:pin,servername:u.hostname,lookup,agent:false,proxy:false,rejectUnauthorized:true,options:{retry:{limit:0},maxRetries:0}});}catch{throw fail('MOCK_READ_FAILED');}
   if(response?.connectedAddress&&response.connectedAddress!==pin.address)throw fail('MOCK_CONNECTION_UNSAFE');
   if(response?.status===302){if(hops>=this.policy.maxRedirects)throw fail('MOCK_REDIRECT_LIMIT');const location=Object.entries(response.headers??{}).find(([k])=>k.toLowerCase()==='location')?.[1];if(typeof location!=='string')throw fail('MOCK_URL_UNSAFE');try{value=new URL(location,u).href;}catch{throw fail('MOCK_URL_UNSAFE');}fixtureURL(value,this.policy.allowedHosts,{signed:true});continue;}
   return response;
  }
 }
}
class MockConfigRepository{
 constructor({allowedHosts,containsKnownSecret=()=>false}={}){if(!Array.isArray(allowedHosts)||!allowedHosts.length)throw fail('MOCK_CONFIG_CONTRACT');this.allowedHosts=[...allowedHosts];this.containsKnownSecret=value=>{
  // Inspect string leaves before JSON escaping can hide an already encoded
  // known credential. The caller still owns the finite in-memory secret set.
  const seen=new WeakSet();let nodes=0;const walk=v=>{if(++nodes>20000)return true;if(typeof v==='string')return containsKnownSecret(v);if(!v||typeof v!=='object')return false;if(seen.has(v))return true;seen.add(v);return Object.values(v).some(walk);};return containsKnownSecret(value)||walk(value);
 };this.repo=new ConfigRepository();}
 check(change){for(const c of change.connections??[])try{fixtureURL(c.baseUrl,this.allowedHosts);}catch{throw fail('MOCK_CONFIG_URL_UNSAFE');}}
 update(change){this.check(change);return this.repo.update(change,{containsKnownSecret:this.containsKnownSecret});}
 read(){return this.repo.read();}
 serialize(){return this.repo.serialize({containsKnownSecret:this.containsKnownSecret});}
 projectProjection(id){return this.repo.projectProjection(id,{containsKnownSecret:this.containsKnownSecret});}
 static restore(bytes,options){const r=new MockConfigRepository(options);r.repo=ConfigRepository.restore(bytes,{containsKnownSecret:r.containsKnownSecret});r.check(r.read());return r;}
}
function validateInputHandle(handle,scope){
 const blocked=code=>({ok:false,code,requiresUploadAuthorization:true,canSubmit:false,userAction:'Provide a fresh upload authorized for the original Connection/account; no automatic account change.'});
 if(!record(handle)||!record(scope)||!Number.isSafeInteger(scope.now))return blocked('INPUT_HANDLE_UNKNOWN');
 for(const k of ['connectionId','accountScope','routingId','sha256'])if(typeof scope[k]!=='string'||!scope[k]||scope[k]==='UNKNOWN'||handle[k]!==scope[k])return blocked('INPUT_HANDLE_SCOPE');
 if(!Number.isSafeInteger(handle.expiresAt))return blocked('INPUT_HANDLE_EXPIRY_UNKNOWN');if(scope.now>=handle.expiresAt)return blocked('INPUT_HANDLE_EXPIRED');
 if(handle.kind!=='FILE_ID'||typeof handle.value!=='string'||!/^[-a-zA-Z0-9_]{1,128}$/.test(handle.value)||typeof handle.uploadOperationId!=='string')return blocked('INPUT_HANDLE_UNKNOWN');
 return {ok:true,canSubmit:true,requiresUploadAuthorization:false};
}
function nonsecretProjection(value,{containsKnownSecret=()=>false}={}){
 if(!record(value))return {schemaVersion:1};
 const safe=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(v)&&!containsKnownSecret(v),out={schemaVersion:1};
 for(const key of ['state','remoteTaskId','currentResultVersion','code'])if(safe(value[key]))out[key]=value[key];
 if(record(value.resultVersions)){
  out.resultVersions={};for(const key of ['V1','V2']){const v=value.resultVersions[key];if(!record(v))continue;const row={};for(const field of ['id','assetId','mediaVersionId','status'])if(safe(v[field]))row[field]=v[field];if(/^[a-f0-9]{64}$/.test(v.sha256??'')&&!containsKnownSecret(v.sha256))row.sha256=v.sha256;if(Number.isSafeInteger(v.size)&&v.size>=0)row.size=v.size;out.resultVersions[key]=row;}
 }
 return out;
}
module.exports={MockReadGuard,MockConfigRepository,fixtureURL,validateInputHandle,nonsecretProjection};

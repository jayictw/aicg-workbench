'use strict';
// Nonsecret, in-memory configuration contract. No file IO, credentials or network.
const {canonical,freeze}=require('./live-policy.cjs');
const clone=structuredClone;
const fail=(code,extra={})=>{throw Object.assign(new Error(code),{code,...extra});};
const meta=['schemaVersion','revision','createdAt','updatedAt','archivedAt'];
const specs={
 providers:{id:'providerId',fields:['providerId','displayName','kind','identitySource','identityVerification','legalName','website','docsUrl']},
 connections:{id:'connectionId',fields:['connectionId','providerId','displayName','baseUrl','region','protocolId','protocolVersion','authType','credentialRequired','adaptationStatus','validationState']},
 models:{id:'modelId',fields:['modelId','catalogProviderId','displayName','mediaKind','originProviderId','canonicalModel','canonicalKnowledge','modelVersion','lifecycle','templateRef']},
 routings:{id:'routingId',fields:['routingId','connectionId','modelId','selector','operations','adapterBinding','regionBinding','accountScope','routeVersion','verification']}
};
function object(v){if(!v||typeof v!=='object'||Array.isArray(v)||![Object.prototype,null].includes(Object.getPrototypeOf(v)))fail('CONFIG_INVALID');return v;}
function fields(v,allowed){object(v);for(const k of Object.keys(v)){if(/^(?:api.?key|secret.*|token|authorization|headers|authBinding|credential(?:Value|Ref|Handle|Epoch)|password)$/i.test(k))fail('CONFIG_SECRET_FIELD');if(!allowed.includes(k))fail('CONFIG_FIELD_UNSUPPORTED');}}
function str(v){if(typeof v!=='string'||!v.trim()||v.length>2048||/[\x00-\x1f\x7f]/.test(v))fail('CONFIG_INVALID');return v;}
function id(v){str(v);if(!/^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/.test(v)||['constructor','prototype','__proto__'].includes(v))fail('CONFIG_ID_INVALID');return v;}
function one(v,options){if(!options.includes(v))fail('CONFIG_INVALID');return v;}
function localSdOrigin(v){
 if(typeof v!=='string'||!/^http:\/\/127\.0\.0\.1(?::[0-9]{1,5})?\/?$/.test(v))fail('CONFIG_URL_UNSAFE');
 let u;try{u=new URL(v);}catch{fail('CONFIG_URL_UNSAFE');}
 if(u.port==='0')fail('CONFIG_URL_UNSAFE');return u.origin;
}
function safeBase(v){
 str(v);let u;try{u=new URL(v);}catch{fail('CONFIG_URL_UNSAFE');}
 if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash||/%(?:2e|2f|5c)/i.test(v)||v.includes('\\')||/\/(?:\.|\.\.)(?:\/|$)/.test(v))fail('CONFIG_URL_UNSAFE');
 // This layer validates spelling only. DNS/IP and redirect enforcement belongs to
 // a future approved transport. This module has no dispatch capability.
 return u.href.replace(/\/$/,'');
}
function safePath(v){str(v);if(!v.startsWith('/')||v.startsWith('//')||/[?#\\%]/.test(v)||/\/(?:\.|\.\.)(?:\/|$)/.test(v)||!/^\/[A-Za-z0-9_./{}-]*$/.test(v))fail('CONFIG_PATH_UNSAFE');return v;}
function simpleMap(v,keys){fields(v,keys);for(const value of Object.values(v))if(value!==null&&typeof value!=='boolean'&&typeof value!=='number')str(value);return clone(v);}
function selector(v){
 object(v);const options={MODEL_ID:['wireModelId'],ENDPOINT_ID:['endpointId','declaredCanonicalModel','bindingVerification'],PATH:['routePath','routeSchemaVersion'],OPERATION:['operationId','operationSchemaVersion'],VERSION:['versionId','deploymentOrModelPath']};
 const required=options[v.kind];if(!required)fail('CONFIG_SELECTOR_INVALID');fields(v,['kind',...required]);
 for(const k of required){if(k==='declaredCanonicalModel'&&(v[k]===null||v[k]==='UNKNOWN'))continue;str(v[k]);}
 if(v.kind==='ENDPOINT_ID'){
  one(v.bindingVerification,['UNKNOWN','USER_DECLARED','DOCUMENTED','VERIFIED']);
  // K04 A: an unknown declaration cannot carry evidence of a known binding.
  if(v.declaredCanonicalModel===null||v.declaredCanonicalModel==='UNKNOWN')return {...clone(v),declaredCanonicalModel:null,bindingVerification:'UNKNOWN'};
 }
 if(v.kind==='PATH')safePath(v.routePath);
 return clone(v);
}
function operations(v){
 fields(v,['upload','submit','query','result','cancel']);
 for(const op of Object.values(v)){fields(op,['method','path','requestSchemaRef','responseSchemaRef','authScope']);one(op.method,['GET','POST','PUT','DELETE','PATCH']);safePath(op.path);for(const k of ['requestSchemaRef','responseSchemaRef','authScope'])if(op[k]!==undefined)str(op[k]);}
 return clone(v);
}
function normalize(kind,input,old,now){
 const spec=specs[kind];fields(input,[...spec.fields,...meta]);
 const v={};for(const k of spec.fields)if(Object.hasOwn(input,k))v[k]=clone(input[k]);
 id(v[spec.id]);
 if(old&&input.revision!==undefined&&input.revision!==old.revision)fail('CONFIG_ENTITY_REVISION_CONFLICT');
 if(kind==='providers'){
  str(v.displayName);one(v.kind,['ORIGINAL','THIRD_PARTY','CUSTOM']);str(v.identitySource);one(v.identityVerification,['DOCUMENTED','VERIFIED','USER_DECLARED','UNKNOWN']);
  for(const k of ['legalName'])if(v[k]!==undefined)str(v[k]);for(const k of ['website','docsUrl'])if(v[k]!==undefined)v[k]=safeBase(v[k]);
 }else if(kind==='connections'){
  id(v.providerId);str(v.displayName);v.baseUrl=v.protocolId==='sd-webui-v1'?localSdOrigin(v.baseUrl):safeBase(v.baseUrl);str(v.region);str(v.protocolId);str(v.protocolVersion);one(v.authType,['BEARER','HEADER_KEY','NONE','OAUTH','AK_SK','UNKNOWN']);
  if(typeof v.credentialRequired!=='boolean')fail('CONFIG_INVALID');one(v.adaptationStatus,['DESIGN_ONLY','PARTIAL','ADAPTED','UNSUPPORTED','UNKNOWN']);
  if(v.validationState!==undefined){fields(v.validationState,['localConfig','protocolCoverage','safeProbe','credentialStatus','accountEntitlement','endpointBinding','realGeneration']);for(const s of Object.values(v.validationState)){fields(s,['status','checkedAt','scopeRevision','evidenceRef']);str(s.status);if(s.scopeRevision!==undefined&&!Number.isSafeInteger(s.scopeRevision))fail('CONFIG_INVALID');for(const k of ['checkedAt','evidenceRef'])if(s[k]!=null)str(s[k]);}}
 }else if(kind==='models'){
  id(v.catalogProviderId);str(v.displayName);one(v.mediaKind,['IMAGE','VIDEO']);if(v.originProviderId!=='UNKNOWN')id(v.originProviderId);one(v.canonicalKnowledge,['DOCUMENTED','USER_DECLARED','UNKNOWN']);
  // Normalize legacy unknown assertions at the config boundary, never in attempts.
  if(v.canonicalModel===null||v.canonicalModel==='UNKNOWN'){
   v.canonicalModel=null;v.canonicalKnowledge='UNKNOWN';
  }else{
   if(v.canonicalKnowledge==='UNKNOWN')fail('CONFIG_CANONICAL_CONFLICT');str(v.canonicalModel);
  }
  str(v.modelVersion);str(v.lifecycle);if(v.templateRef!==undefined)simpleMap(v.templateRef,['templateId','templateRevision','sourceRef']);
 }else{
  id(v.connectionId);id(v.modelId);v.selector=selector(v.selector);v.operations=operations(v.operations);
  fields(v.adapterBinding,['adapterId','adapterVersion']);str(v.adapterBinding.adapterId);str(v.adapterBinding.adapterVersion);str(v.regionBinding);str(v.accountScope);str(v.routeVersion);
  simpleMap(v.verification,['implementation','accountEntitlement','realGeneration','compatibilityClaim']);
 }
 const archived=input.archivedAt??old?.archivedAt??null;if(archived!==null)str(archived);
 return {...v,schemaVersion:1,revision:old?old.revision+1:1,createdAt:old?.createdAt??now,updatedAt:now,archivedAt:archived};
}
function relations(state){
 const p=new Map(state.providers.map(x=>[x.providerId,x])),c=new Map(state.connections.map(x=>[x.connectionId,x])),m=new Map(state.models.map(x=>[x.modelId,x]));
 for(const x of c.values())if(!p.has(x.providerId))fail('CONFIG_REFERENCE_MISSING');
 for(const x of m.values())if(!p.has(x.catalogProviderId)||x.originProviderId!=='UNKNOWN'&&!p.has(x.originProviderId))fail('CONFIG_REFERENCE_MISSING');
 for(const r of state.routings){const con=c.get(r.connectionId),model=m.get(r.modelId);if(!con||!model)fail('CONFIG_REFERENCE_MISSING');if(con.providerId!==model.catalogProviderId)fail('CONFIG_PROVIDER_MISMATCH');if(con.region!==r.regionBinding)fail('CONFIG_REGION_MISMATCH');
  if(r.selector.kind==='ENDPOINT_ID'&&r.selector.declaredCanonicalModel!==null&&model.canonicalModel!==null&&r.selector.declaredCanonicalModel!==model.canonicalModel)fail('CONFIG_CANONICAL_CONFLICT');}
}
function guarded(v,{containsKnownSecret=()=>false}={}){if(containsKnownSecret(v)===true)fail('CONFIG_SECRET_VALUE');return v;}
class ConfigRepository{
 #state=freeze({schemaVersion:1,revision:0,providers:[],connections:[],models:[],routings:[]});
 #history=[];
 read(){return clone(this.#state);}
 update(change,options={}){
  object(change);const expected=change.expectedRevision;
  if(!Number.isSafeInteger(expected)||expected!==this.#state.revision)fail('CONFIG_REVISION_CONFLICT',{currentRevision:this.#state.revision,changedPaths:[...new Set(this.#history.filter(x=>x.revision>expected||!Number.isSafeInteger(expected)).flatMap(x=>x.paths))]});
  fields(change,['expectedRevision',...Object.keys(specs)]);
  const state=this.read(),paths=[],now=new Date().toISOString();
  for(const [kind,spec]of Object.entries(specs)){
   const rows=change[kind]??[];if(!Array.isArray(rows))fail('CONFIG_INVALID');const ids=new Set();
   for(const row of rows){object(row);const key=id(row[spec.id]);if(ids.has(key))fail('CONFIG_DUPLICATE_ID');ids.add(key);const at=state[kind].findIndex(x=>x[spec.id]===key),old=at<0?null:state[kind][at];const value=normalize(kind,row,old,now);if(at<0)state[kind].push(value);else state[kind][at]=value;paths.push(kind+'.'+key);}
  }
  relations(state);guarded(state,options);state.revision++;
  this.#state=freeze(state);this.#history.push({revision:state.revision,paths});return this.read();
 }
 serialize(options={}){return JSON.stringify(guarded(this.read(),options));}
 projectProjection(routingId,options={}){
  const state=this.#state,r=state.routings.find(x=>x.routingId===routingId);if(!r)fail('CONFIG_REFERENCE_MISSING');const c=state.connections.find(x=>x.connectionId===r.connectionId),m=state.models.find(x=>x.modelId===r.modelId),p=state.providers.find(x=>x.providerId===c.providerId);
  // Detached immutable local snapshot; no key hashes, handles or auth values.
  return freeze(guarded(clone({schemaVersion:1,configRevision:state.revision,provider:p,connection:c,model:m,routing:r}),options));
 }
 static restore(serialized,options={}){
  let raw;try{raw=JSON.parse(serialized);}catch{fail('CONFIG_INVALID');}
  fields(raw,['schemaVersion','revision',...Object.keys(specs)]);if(raw.schemaVersion!==1||!Number.isSafeInteger(raw.revision)||raw.revision<0)fail('CONFIG_INVALID');
  const repo=new ConfigRepository(),state={schemaVersion:1,revision:raw.revision};
  for(const [kind,spec]of Object.entries(specs)){
   if(!Array.isArray(raw[kind]))fail('CONFIG_INVALID');const ids=new Set();state[kind]=raw[kind].map(row=>{
    if(!Number.isSafeInteger(row.revision)||row.revision<1||row.schemaVersion!==1||typeof row.createdAt!=='string'||typeof row.updatedAt!=='string')fail('CONFIG_INVALID');
    const value=normalize(kind,row,null,row.createdAt);if(ids.has(value[spec.id]))fail('CONFIG_DUPLICATE_ID');ids.add(value[spec.id]);return {...value,revision:row.revision,createdAt:row.createdAt,updatedAt:row.updatedAt};
   });
  }
  relations(state);guarded(state,options);repo.#state=freeze(state);return repo;
 }
}
function previewTemplateUpdate(saved,proposed,options={}){
 // Comparison only. Applying templates/overrides belongs to subsequent tasks.
 fields(saved,['size','wireModelId']);fields(proposed,['size','wireModelId']);
 for(const v of [...Object.values(saved),...Object.values(proposed)])str(v);
 guarded(saved,options);guarded(proposed,options);
 return {applied:false,changes:[...new Set([...Object.keys(saved),...Object.keys(proposed)])].sort().filter(k=>canonical(saved[k])!==canonical(proposed[k])).map(field=>({field,saved:clone(saved[field]??null),proposed:clone(proposed[field]??null)}))};
}
module.exports={ConfigRepository,previewTemplateUpdate,safeBase,safePath,localSdOrigin};

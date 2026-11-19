'use strict';
// Pure routing resolution. No provider adapter, secret broker or dispatch entry.
const {safeBase,safePath}=require('./api-config.cjs');
const {freeze,canonical}=require('./live-policy.cjs');
const blocked=(code,details={})=>({ok:false,code,...details});
function routeState(repo,routingId){
 const state=repo.read(),r=state.routings.find(x=>x.routingId===routingId),c=state.connections.find(x=>x.connectionId===r?.connectionId),m=state.models.find(x=>x.modelId===r?.modelId),p=state.providers.find(x=>x.providerId===c?.providerId);return {state,r,c,m,p};
}
function resolveRoute(repo,routingId,{operation,mode,registry={}}={}){
 const {state,r,c,m,p}=routeState(repo,routingId);
 if(!r||!c||!m||!p)return blocked('CONFIG_REFERENCE_MISSING');
 if([r,c,m,p].some(x=>x.archivedAt!==null))return blocked('ARCHIVED');
 const adapter=Object.hasOwn(registry,c.protocolId)?registry[c.protocolId]:null;
 if(!adapter||!['ADAPTED','PARTIAL'].includes(c.adaptationStatus))return blocked('UNSUPPORTED',{protocolId:c.protocolId});
 if(adapter.protocolVersion!==c.protocolVersion||adapter.adapterId!==r.adapterBinding.adapterId||adapter.adapterVersion!==r.adapterBinding.adapterVersion||adapter.authType!==c.authType)return blocked('ADAPTER_BINDING_MISMATCH');
 const op=adapter.operations?.[operation],configured=r.operations[operation];
 if(!op||!configured||!op.modes.includes(mode))return blocked('PARTIAL',{unsupportedOperation:operation,unsupportedMode:mode});
 if(op.method!==configured.method||op.path!==configured.path||adapter.selectorKind!==r.selector.kind||adapter.placement!=='body.model')return blocked('ROUTE_CONTRACT_MISMATCH');
 if(c.providerId!==m.catalogProviderId||r.regionBinding!==c.region)return blocked('ROUTE_SCOPE_MISMATCH');
 const wireValue=r.selector.kind==='ENDPOINT_ID'?r.selector.endpointId:r.selector.kind==='MODEL_ID'?r.selector.wireModelId:null;
 if(!wireValue)return blocked('UNSUPPORTED_SELECTOR');
 return freeze({ok:true,operation,method:op.method,url:safeBase(c.baseUrl)+safePath(op.path),wireValue,placement:adapter.placement,providerId:p.providerId,connectionId:c.connectionId,modelId:m.modelId,routingId:r.routingId,canonicalModel:m.canonicalModel,region:c.region,authType:c.authType,credentialRequired:c.credentialRequired,configRevision:state.revision,connectionRevision:c.revision,routingRevision:r.revision,adapterId:adapter.adapterId,adapterVersion:adapter.adapterVersion,evidenceLevel:'LOCAL_RESOLUTION_ONLY',realGeneration:'NOT_RUN'});
}
function selectionBinding(repo,routingId,credentialEpoch){
 const {state,r,c}=routeState(repo,routingId);if(!r||!c)throw Object.assign(new Error('CONFIG_REFERENCE_MISSING'),{code:'CONFIG_REFERENCE_MISSING'});
 // Opaque in-memory identity only; never part of persistent configuration.
 return Object.freeze({routingId,connectionId:c.connectionId,configRevision:state.revision,routingRevision:r.revision,connectionRevision:c.revision,credentialEpoch});
}
function sameSelection(a,b){return !!a&&!!b&&['routingId','connectionId','configRevision','routingRevision','connectionRevision','credentialEpoch'].every(k=>a[k]===b[k]);}
function planSafeProbe(repo,connectionId,{registry={},descriptor}={}){
 const state=repo.read(),c=state.connections.find(x=>x.connectionId===connectionId);
 if(!c||c.archivedAt!==null)return blocked('CONFIG_REFERENCE_MISSING');
 const adapter=Object.hasOwn(registry,c.protocolId)?registry[c.protocolId]:null;
 // Probe descriptors are trusted adapter evidence, never inferred from Base URL.
 if(!adapter||!descriptor)return blocked('NO_SAFE_PROBE',{localConfig:'PASS',safeProbe:'NOT_RUN'});
 const d=descriptor;
 if(!Array.isArray(adapter.safeProbes)||!adapter.safeProbes.some(x=>canonical(x)===canonical(d)))return blocked('NO_SAFE_PROBE',{safeProbe:'NOT_RUN'});
 if(d.connectionId!==c.connectionId||d.connectionRevision!==c.revision||d.protocolId!==c.protocolId||d.protocolVersion!==c.protocolVersion||adapter.protocolVersion!==c.protocolVersion||d.method!=='GET'||d.nonCharging!==true||typeof d.evidenceRef!=='string'||!d.evidenceRef||d.authType!=='NONE')return blocked('NO_SAFE_PROBE',{safeProbe:'NOT_RUN'});
 let url;try{url=safeBase(c.baseUrl)+safePath(d.path);}catch{return blocked('NO_SAFE_PROBE',{safeProbe:'NOT_RUN'});}
 return freeze({ok:true,connectionId,connectionRevision:c.revision,method:'GET',url,operation:'metadata',authType:'NONE',evidenceRef:d.evidenceRef,scope:'PROBE_ONLY',safeProbe:'NOT_RUN',realGeneration:'NOT_RUN',accountEntitlement:'UNKNOWN'});
}
module.exports={resolveRoute,selectionBinding,sameSelection,planSafeProbe};

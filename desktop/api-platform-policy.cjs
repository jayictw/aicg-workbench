'use strict';
// Product admission policy only; no model-ID whitelist, transport or credentials.
const catalog=require('./api-platform-templates.json'),{ConfigRepository}=require('./api-config.cjs'),{canonical}=require('./live-policy.cjs');
const ids=['BP.V','BP.I','O.I','X.I','X.V','A.V','A.I','M.V1','M.V2','M.I','M.V1.CN','M.V2.CN','M.I.CN','M.I.H3','M.I.H3.CN','L'];
const reviewedIds=['G.I','G.O','G.C','R','S','B','P','K','F','Q'];
const localSd={id:'SD_LOCAL',label:'Stable Diffusion WebUI（本地）',providerName:'Stable Diffusion WebUI',
 kind:'CUSTOM',baseUrl:'http://127.0.0.1:7860',protocolId:'sd-webui-v1',protocolVersion:'1',region:'LOCAL',authType:'NONE',
 path:'/sdapi/v1/txt2img',mediaKinds:['IMAGE'],required:[],regionOptions:[],modelReferences:[],sources:[],evidence:'DOCUMENTED_LOCAL_PROTOCOL'};
const bflIds=catalog.filter(t=>t.id.startsWith('B.')).map(t=>t.id);
const platforms=[localSd,...catalog.filter(t=>[...ids,...bflIds].includes(t.id)),...catalog.filter(t=>reviewedIds.includes(t.id)&&t.admission?.status==='TEMPLATE_READY')];
const unavailablePlatforms=catalog.filter(t=>!platforms.includes(t)).map(t=>({id:t.id,label:t.label,reason:['CUSTOM','LOCAL'].includes(t.id)?'后续版本支持；当前不开放自定义或本地接入。':t.id==='MOCK'?'仅历史合成测试配置，不是可新建的 API 平台。':t.admission?.reason||'当前模板的认证或请求映射尚未完整核实／接入，不开放新建。',admission:t.admission??null}));
const fail=code=>{throw Object.assign(Error(code),{code});};
const same=(a,b)=>canonical(a)===canonical(b);
const body=x=>Object.fromEntries(Object.entries(x).filter(([k,v])=>!['schemaVersion','revision','createdAt','updatedAt'].includes(k)&&!(k==='archivedAt'&&v===null)));
function connectionTemplate(c){
 const t=platforms.find(x=>x.protocolId===c?.protocolId);if(!t||c.protocolVersion!==t.protocolVersion||c.authType!==t.authType||c.credentialRequired!==(t.authType!=='NONE')||c.adaptationStatus!=='UNSUPPORTED')return null;
 if(t.required.includes('workspace')){const suffix='.'+c.region+'.maas.aliyuncs.com/api/v1',u=c.baseUrl;if(!t.regionOptions.includes(c.region)||!u.startsWith('https://')||!u.endsWith(suffix)||!/^[A-Za-z0-9][A-Za-z0-9_-]{0,199}$/.test(u.slice(8,-suffix.length)))return null;}
 else if(t===localSd?c.region!==t.region:c.baseUrl!==t.baseUrl||c.region!==t.region)return null;
 return t;
}
function routeSupported(r,cfg){
 const c=cfg.connections.find(x=>x.connectionId===r.connectionId),t=connectionTemplate(c),p=cfg.providers.find(x=>x.providerId===c?.providerId),m=cfg.models.find(x=>x.modelId===r.modelId);
 return !!t&&p?.kind===t.kind&&m?.catalogProviderId===c.providerId&&t.mediaKinds.includes(m.mediaKind)&&(t===localSd?r.selector.kind==='MODEL_ID':['MODEL_ID','ENDPOINT_ID'].includes(r.selector.kind))&&same(r.operations,{submit:{method:'POST',path:t.pathsByMediaKind?.[m.mediaKind]??t.path}})&&same(r.adapterBinding,{adapterId:'UNSUPPORTED',adapterVersion:'1'})&&r.regionBinding===c.region&&same(r.verification,{implementation:'UNSUPPORTED',accountEntitlement:'UNKNOWN',realGeneration:'NOT_RUN'});
}
function uiChange(state,req){
 if(req.localDrafts!==undefined&&!same(req.localDrafts,state.localDrafts))fail('HISTORICAL_CONFIG_READ_ONLY');
 const change=req.change??{};
 // A live local connection and its task history retain their protocol identity.
 for(const row of change.connections??[]){
  const old=state.config.connections.find(x=>x.connectionId===row.connectionId);
  if(old&&old.protocolId!==row.protocolId&&[old.protocolId,row.protocolId].includes(localSd.protocolId))fail('SD_CONNECTION_PROTOCOL_FIXED');
 }
 // Old unsupported connections are never silently converted under the same ID.
 for(const row of change.connections??[]){const old=state.config.connections.find(x=>x.connectionId===row.connectionId);if(old&&!connectionTemplate(old)&&!same(body(old),body(row)))fail('HISTORICAL_CONFIG_READ_ONLY');}
 const cfg=ConfigRepository.restore(JSON.stringify(state.config)).update({expectedRevision:state.config.revision,...structuredClone(change)}),out={};
 const idKeys={providers:'providerId',connections:'connectionId',models:'modelId',routings:'routingId'};
 for(const [kind,key]of Object.entries(idKeys)){
  out[kind]=[];
  for(const row of change[kind]??[]){const now=cfg[kind].find(x=>x[key]===row[key]),old=state.config[kind].find(x=>x[key]===row[key]);if(old&&same(body(old),body(now)))continue;
   const routes=kind==='routings'?[now]:cfg.routings.filter(r=>kind==='connections'?r.connectionId===now.connectionId:kind==='models'?r.modelId===now.modelId:cfg.connections.some(c=>c.providerId===now.providerId&&r.connectionId===c.connectionId));
   if(!routes.length||!routes.every(r=>routeSupported(r,cfg)))fail('PLATFORM_CONFIGURATION_UNSUPPORTED');
   if(old){const beforeRoutes=state.config.routings.filter(r=>kind==='routings'?r.routingId===old.routingId:kind==='connections'?r.connectionId===old.connectionId:kind==='models'?r.modelId===old.modelId:state.config.connections.some(c=>c.providerId===old.providerId&&r.connectionId===c.connectionId));if(beforeRoutes.some(r=>!routeSupported(r,state.config)))fail('HISTORICAL_CONFIG_READ_ONLY');}
   out[kind].push(row);
  }
 }
 return {...req,change:out,localDrafts:undefined};
}
module.exports={platforms,unavailablePlatforms,connectionTemplate,routeSupported,uiChange};

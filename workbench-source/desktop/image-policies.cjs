'use strict';
// Static exact routing. Logical identity remains in Vault; v1 history is never reinterpreted.
const legacy=Object.freeze({id:'bp-pro',revision:1,exactModelId:'dola-seedream-5-0-pro-260628',serviceId:'byteplus-sg',serviceRevision:1,region:'ap-southeast-1',origin:'https://ark.ap-southeast.bytepluses.com',protocolId:'ark-images-json-v1',adapterId:'ark-images-offline-v1',adapterVersion:1,promptBytes:4096});
const current=Object.freeze({...legacy,adapterVersion:2,requestModelId:require('../../shared/byteplus-image-models.json').models.find(m=>m.id===legacy.exactModelId)?.endpointRoute?.id??null});
const historicalEndpointHash='aa0f3a9916d791df72c3cbef48702cfdf4d407a16a7023f998caf12f829764b3';
function requestMatches(p,value){if(p.exactModelId===legacy.exactModelId&&p.adapterVersion===2)return typeof value==='string'&&((typeof p.requestModelId==='string'&&value===p.requestModelId)||require('node:crypto').createHash('sha256').update(value).digest('hex')===historicalEndpointHash);return (p.requestModelId||p.exactModelId)===value;}

function createRegistry(values){
 const entries=Object.freeze(values.map(p=>Object.freeze({...p})));
 if(entries.length<1||new Set(entries.map(p=>p.id+':'+p.revision)).size!==entries.length)throw Error('C_IMAGE_POLICY');
 const config=c=>entries.find(p=>p.id===c?.modelPresetId&&p.revision===c.modelPresetRevision&&p.exactModelId===c.exactModelId)||null;
 const match=(p,t)=>p.id===t?.modelPresetId&&p.revision===t.modelPresetRevision&&requestMatches(p,t.requestedModel)&&p.serviceId===t.serviceId&&p.serviceRevision===t.serviceRevision&&p.origin===t.apiOrigin&&p.region===t.region&&p.adapterId===t.adapterId&&p.adapterVersion===t.adapterVersion&&t.modelVersion===null&&t.platformId==='bytedance'&&t.serviceTrust==='official-preset';
 const chinaOld={...legacy,id:'ark-flash',exactModelId:'doubao-seedream-5-0-flash-260915',serviceId:'ark-cn',region:'cn-beijing',origin:'https://ark.cn-beijing.volces.com'};const policies=[...entries,...entries.map(p=>({...p,adapterId:'ark-images-https-v1'})),{...chinaOld,adapterId:'ark-images-https-v1'},{...legacy,id:'ark-flash',exactModelId:'doubao-seedream-5-0-flash-260915',serviceId:'ark-cn',region:'cn-beijing',origin:'https://ark.cn-beijing.volces.com'},...[legacy,current].flatMap(p=>[p,{...p,adapterId:'ark-images-https-v1'}])];
 return Object.freeze({entries,config,target:t=>policies.find(p=>match(p,t))||null,providerConfig:c=>config(c)?{...config(c),adapterId:'ark-images-https-v1'}:null,historyConfig:c=>[legacy,current].find(p=>p.id===c?.modelPresetId&&p.revision===c.modelPresetRevision&&p.exactModelId===c.exactModelId)||null,createRegistry});
}
const china={...legacy,id:'ark-flash',exactModelId:'doubao-seedream-5-0-flash-260915',serviceId:'ark-cn',region:'cn-beijing',origin:'https://ark.cn-beijing.volces.com',adapterVersion:3};
module.exports=createRegistry([china]);

'use strict';
const c=require('./d1-json.cjs');
const entry=Object.freeze({id:'ark-seedance-mini',revision:1,exactModelId:'doubao-seedance-2-0-mini-260615',serviceId:'ark-cn',serviceRevision:1,region:'cn-beijing',origin:'https://ark.cn-beijing.volces.com',adapterId:'ark-seedance-offline-v1',adapterVersion:1,promptBytes:4096});
const v25=require('./seedance25-contract.cjs'),entry25=Object.freeze({...entry,id:v25.presetId,revision:v25.version,exactModelId:v25.model});
const entries=Object.freeze([entry,entry25]);
const DEFAULTS=Object.freeze([{key:'duration',value:4},{key:'generate_audio',value:false},{key:'ratio',value:'16:9'},{key:'resolution',value:'480p'},{key:'watermark',value:true}].map(Object.freeze));
const isVideoAdapter=id=>['ark-seedance-offline-v1','ark-seedance-https-v1'].includes(id);
function byModel(model){return entries.find(e=>e.exactModelId===model)||null}
function config(v){return entries.find(e=>v?.modelPresetId===e.id&&v.modelPresetRevision===e.revision&&v.exactModelId===e.exactModelId)||null}
function media(model){if(!byModel(model))c.fail('VIDEO_POLICY');return model===v25.model?v25.media:{width:864,height:496,durationMinMs:3900,durationMaxMs:4100,codec:'h264',pixelFormat:'yuv420p',fps:24,audio:'absent',maxBytes:33554432}}
function hosts(model=entry.exactModelId){if(!byModel(model))c.fail('VIDEO_POLICY');return model===v25.model?v25.hosts:[require('./video-url-source.cjs').CONTRACT]}
function makeTarget(provider=false,model=entry.exactModelId){const e=byModel(model);if(!e)c.fail('VIDEO_POLICY');return {platformId:'bytedance',serviceId:entry.serviceId,serviceRevision:1,region:entry.region,apiOrigin:entry.origin,serviceTrust:'official-preset',requestedModel:e.exactModelId,modelVersion:null,modelPresetId:e.id,modelPresetRevision:e.revision,adapterId:provider?'ark-seedance-https-v1':entry.adapterId,adapterVersion:1}}
function target(t){const e=byModel(t?.requestedModel);return e&&isVideoAdapter(t.adapterId)&&c.same(t,makeTarget(t.adapterId==='ark-seedance-https-v1',e.exactModelId))?e:null}
function effective(prompt,provider=false,model=entry.exactModelId){const e={version:1,target:makeTarget(provider,model),operation:'text-to-video',prompt,inputs:[],parameters:structuredClone(model===v25.model?v25.parameters:DEFAULTS),outputCount:1};validate(e);return e}
function validate(e){if(e?.version===4)return require('./video-reference.cjs').validate(e);c.keys(e,['version','target','operation','prompt','inputs','parameters','outputCount']);if(e.version!==1||!target(e.target)||e.operation!=='text-to-video'||!c.text(e.prompt,4096,{prompt:true})||!c.same(e.inputs,[])||!c.same(e.parameters,e.target.requestedModel===v25.model?v25.parameters:DEFAULTS)||e.outputCount!==1)c.fail('VIDEO_POLICY');return e}
module.exports=Object.freeze({entry,entry25,entries,byModel,media,hosts,DEFAULTS,config,providerConfig:config,target,makeTarget,effective,validate,isVideoAdapter});

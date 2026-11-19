'use strict';
const catalog=require('../shared/byteplus-image-models.json');
function imageConfirmation(plan){
 if(plan.frames)return require('./video-route.cjs').videoConfirmation(plan);
 const model=catalog.models.find(m=>m.id===plan.model);if(!model)throw Object.assign(Error('Unsupported image model'),{code:'BP_IMAGE_PLAN'});
 const size=model.sizes.find(s=>s.size===plan.parameters.size);if(!size)throw Object.assign(Error('Unsupported image size'),{code:'BP_IMAGE_PARAMETERS'});
 const requestRouting={modelId:plan.model,requestModel:plan.requestModel??plan.model,kind:plan.routing?.kind??'model-id',endpointId:plan.routing?.endpointId??null,apiDomain:plan.routing?.apiDomain??new URL(catalog.endpoint).hostname,region:catalog.region,declaredProject:plan.routing?.declaredProject??null,projectIdentityVerified:false,endpointModelVerified:false};
 return {requestRouting,imageSize:{...size},imageModel:{id:model.id,label:model.label,region:catalog.region,routing:plan.routing?.kind==='endpoint'?'owner-specified endpoint; account/Project not verified':'official-model-id; no account-specific endpoint ID configured',validation:model.validation,realPaidVerified:model.realPaidVerified}};
}
module.exports={imageConfirmation};

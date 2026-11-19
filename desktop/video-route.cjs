'use strict';
const {isDeepStrictEqual}=require('node:util'),route=require('../shared/byteplus-video-route.json');
function validateVideoRoute(plan){
 if(!Object.hasOwn(plan,'requestModel')){
  if(plan.routing!==undefined)throw Object.assign(Error('Invalid legacy video route'),{code:'BP_VIDEO_ROUTE'});
  return plan.model;
 }
 if(route.endpointId===null||route.endpointId==='')throw Object.assign(Error('BytePlus endpoint is not configured for this installation'),{code:'BP_ENDPOINT_UNCONFIGURED'});
 const expected={...route,kind:'endpoint'};
 if(plan.requestModel!==route.endpointId||plan.model!==route.canonicalModel||plan.region!==route.region||plan.apiOrigin!=='https://'+route.apiDomain||!isDeepStrictEqual(plan.routing,expected))throw Object.assign(Error('Pinned video route does not match confirmation'),{code:'BP_VIDEO_ROUTE'});
 return route.endpointId;
}
function videoConfirmation(plan){
 validateVideoRoute(plan);
 return {requestRouting:{modelId:plan.model,requestModel:plan.requestModel??plan.model,kind:plan.routing?.kind??'model-id',endpointId:plan.routing?.endpointId??null,region:plan.region,apiDomain:new URL(plan.apiOrigin).hostname,projectIdentityVerified:false,endpointModelVerified:false},videoModel:{id:plan.model,label:'Seedance 2.5',historicalEndpointSucceeded:true,currentAccountRouteVerified:false}};
}
module.exports={route,validateVideoRoute,videoConfirmation};

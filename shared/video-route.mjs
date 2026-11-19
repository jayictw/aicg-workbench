import route from './byteplus-video-route.json' with {type:'json'};
import {videoPlan} from './video-plan.mjs';
// Only newly prepared native requests use this route. Historical base plans keep their exact shape.
export const VIDEO_ENDPOINT_ROUTE=Object.freeze({...route});
export function videoRequestPlan(g,n,effective,options){
 if(route.endpointId===null||route.endpointId==='')throw Object.assign(Error('BytePlus endpoint is not configured for this installation'),{code:'BP_ENDPOINT_UNCONFIGURED'});
 const plan=videoPlan(g,n,effective,options);
 return {...plan,requestModel:route.endpointId,routing:{...route,kind:'endpoint'}};
}

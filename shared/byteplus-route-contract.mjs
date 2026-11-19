import source from './byteplus-route-contract.json' with {type:'json'};

// BytePlus only. This catalog is descriptive evidence, never account authorization.
function freeze(value){
 if(value && typeof value==='object'){
  for(const item of Object.values(value))freeze(item);
  Object.freeze(value);
 }
 return value;
}
const catalog=freeze(structuredClone(source));
const fields=['provider','region','canonicalModelId','selectorKind','selectorValue','contractVersion','operation'];
function reject(code){throw Object.assign(Error('BytePlus route is unavailable; no credential read or submission is authorized'),{code});}
export function byteplusCapabilities(){return structuredClone(catalog);}

// Exact new-version record only; no defaults, coercion, fallback or legacy migration.
export function validateBytePlusRoute(input){
 if(!input || Object.getPrototypeOf(input)!==Object.prototype)reject('BP_ROUTE_SCHEMA');
 const keys=Reflect.ownKeys(input);
 if(keys.length!==fields.length || keys.some(key=>!fields.includes(key)) ||
    fields.some(key=>!Object.hasOwn(input,key) || !Object.hasOwn(Object.getOwnPropertyDescriptor(input,key),'value') ||
     !Object.getOwnPropertyDescriptor(input,key).enumerable))reject('BP_ROUTE_SCHEMA');
 if(input.contractVersion!==catalog.contractVersion)reject('BP_ROUTE_VERSION');
 if(input.provider!==catalog.provider || input.region!==catalog.region)reject('BP_ROUTE_PLATFORM_REGION');
 const model=catalog.models.find(model=>model.canonicalModelId===input.canonicalModelId);
 if(!model)reject('BP_ROUTE_MODEL');
 if(model.selectorValue===null||model.selectorValue==='')reject('BP_ENDPOINT_UNCONFIGURED');
 if(input.selectorKind!==model.selectorKind || input.selectorValue!==model.selectorValue)reject('BP_ROUTE_SELECTOR');
 const operation=model.operations.find(operation=>operation.operation===input.operation);
 if(!operation || operation.officialSupport!=='SUPPORTED')reject('BP_ROUTE_OPERATION');
 if(!operation.workbenchImplemented)reject('BP_ROUTE_NOT_IMPLEMENTED');
 return freeze({route:{...input},apiURL:catalog.apiOrigin+model.apiPath,
  officialSupport:operation.officialSupport,workbenchImplemented:true,implementedSubset:operation.subset,
  accountEntitlement:catalog.accountEntitlement,endpointBinding:catalog.endpointBinding,submissionAuthorization:'BLOCK'});
}

// A valid tuple is distinct from permission to spend. B1 deliberately supplies no
// way to promote UNKNOWN from a caller-provided flag or a remembered endpoint.
export function assertBytePlusSubmission(input,{phase,url,body}={}){
 const checked=validateBytePlusRoute(input),operation=checked.route.operation;
 if(url!==checked.apiURL || phase!==(operation.startsWith('image.')?'image':'submit') ||
    body?.model!==checked.route.selectorValue)reject('BP_ROUTE_WIRE');
 let actual;
 if(phase==='image'){
  if(body.image!==undefined && (!Array.isArray(body.image) || !body.image.length))reject('BP_ROUTE_WIRE');
  const count=body.image?.length??0;
  actual=count===0?'image.text_to_image':count===1?'image.single_reference':'image.multi_reference';
 }else{
  const roles=body.content?.slice(1).map(item=>item.role);
  if(body.omni_reference_task_type==='reference' && roles?.length && roles.every(role=>role==='reference_image'))actual='video.reference_images';
  else if(body.omni_reference_task_type===undefined && roles?.join(',')==='first_frame')actual='video.first_frame';
  else if(body.omni_reference_task_type===undefined && roles?.join(',')==='first_frame,last_frame')actual='video.first_last_frame';
 }
 if(actual!==operation)reject('BP_ROUTE_WIRE_OPERATION');
 // No current account/endpoint binding evidence exists; preserve this hard gate.
 reject('BP_ROUTE_ACCOUNT_UNKNOWN');
}

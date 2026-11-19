// BP-02-B4: opt-in offline Seedream Pro contracts. No HTTP, credential, IPC,
// graph, Journal, downloader or publication imports. Artifacts grant no spend.
import {createHash} from 'node:crypto';
import {byteplusCapabilities} from '../shared/byteplus-route-contract.mjs';

const MODEL='dola-seedream-5-0-pro-260628',BODY_MAX=64000000,IMAGE_MAX=32*1024*1024;
const requests=new WeakSet(),parsedSets=new WeakSet();
const hash=b=>createHash('sha256').update(b).digest('hex');
const int=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const id=v=>typeof v==='string'&&/^[-a-zA-Z0-9_.]{1,128}$/.test(v);
function reject(code){throw Object.assign(Error('BytePlus image contract rejected; no submission or publication is authorized.'),{code});}
function freeze(v){if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;}
function data(v,seen=new Set(),depth=0){
 if(v===null||['string','boolean'].includes(typeof v)||typeof v==='number'&&Number.isFinite(v))return v;
 if(!v||typeof v!=='object'||seen.has(v)||depth>16)reject('BP_IMAGE_SCHEMA');
 const array=Array.isArray(v),keys=Reflect.ownKeys(v);
 if(!array&&Object.getPrototypeOf(v)!==Object.prototype||array&&(v.length>1000||keys.length!==v.length+1))reject('BP_IMAGE_SCHEMA');
 const out=array?[]:{};seen.add(v);
 for(const k of keys){if(array&&k==='length')continue;const d=Object.getOwnPropertyDescriptor(v,k);if(typeof k!=='string'||k==='__proto__'||!d.enumerable||!Object.hasOwn(d,'value')||array&&!/^(0|[1-9][0-9]*)$/.test(k))reject('BP_IMAGE_SCHEMA');out[k]=data(d.value,seen,depth+1);}
 seen.delete(v);return out;
}
function exact(v,required,optional=[]){if(!v||Object.getPrototypeOf(v)!==Object.prototype||required.some(k=>!Object.hasOwn(v,k))||Object.keys(v).some(k=>!required.includes(k)&&!optional.includes(k)))reject('BP_IMAGE_SCHEMA');}
function route(r,endpointSelector){
 const c=byteplusCapabilities(),m=c.models.find(m=>m.canonicalModelId===MODEL);
 const selector=endpointSelector===undefined?m?.selectorValue:endpointSelector;
 if(selector===null||selector==='')reject('BP_ENDPOINT_UNCONFIGURED');
 if(r.provider!==c.provider||r.region!==c.region||r.canonicalModelId!==MODEL||r.contractVersion!==1||c.contractVersion!==3||m?.selectorKind!=='endpoint_id'||typeof selector!=='string'||!/^ep-[A-Za-z0-9][A-Za-z0-9-]{0,124}$/.test(selector))reject('BP_IMAGE_ROUTE');
 return {provider:c.provider,region:c.region,canonicalModelId:MODEL,selectorKind:'endpoint_id',selectorValue:selector,contractVersion:3};
}
export function validateSeedreamSize(value,operation){
 const v=data(value);if(!['generate','interactive_edit','layer_decomposition'].includes(operation))reject('BP_IMAGE_MODE');
 if(v?.kind==='tier'){
  exact(v,['kind','value']);if(!['1K','1.5K','2K',...(operation==='layer_decomposition'?['auto']:[])].includes(v.value))reject('BP_IMAGE_SIZE');return v.value;
 }
 exact(v,['kind','width','height'],['ratio']);
 const {width:w,height:h}=v;
 if(v.kind!=='dimensions'||operation==='layer_decomposition'||!int(w,15,100000)||!int(h,15,100000)||w*h<921600||w*h>4624220||w/h<1/16||w/h>16)reject('BP_IMAGE_SIZE');
 if(Object.hasOwn(v,'ratio')){
  const m=typeof v.ratio==='string'&&/^([1-9][0-9]{0,3}):([1-9][0-9]{0,3})$/.exec(v.ratio);
  if(!m||w*Number(m[2])!==h*Number(m[1]))reject('BP_IMAGE_SIZE');
 }
 return w+'x'+h;
}
function reference(r,i,layer){
 exact(r,['assetNodeId','mediaVersionId','contentSha256','mimeType','byteSize','width','height','hasAlpha','sequenceIndex']);
 if(!id(r.assetNodeId)||!id(r.mediaVersionId)||!/^[a-f0-9]{64}$/.test(r.contentSha256)||r.sequenceIndex!==i||!['image/png','image/jpeg',...(!layer?['image/webp']:[])].includes(r.mimeType)||!int(r.byteSize,1,30000000)||!int(r.width,15,100000)||!int(r.height,15,100000)||r.width*r.height<(layer?262144:196)||r.width*r.height>36000000||r.width/r.height<1/16||r.width/r.height>16||typeof r.hasAlpha!=='boolean'||r.mimeType==='image/jpeg'&&r.hasAlpha)reject('BP_IMAGE_INPUT');
}
function editPrompt(r){
 if(r.edit===undefined){if(r.operation==='interactive_edit'||/<\/?(?:point|bbox)\b/i.test(r.prompt??''))reject('BP_IMAGE_EDIT');return {prompt:r.prompt};}
 if(r.operation!=='interactive_edit'||/<\/?(?:point|bbox)\b/i.test(r.prompt??''))reject('BP_IMAGE_EDIT');
 const e=r.edit;exact(e,['assetNodeId','mediaVersionId','marks']);const index=r.references.findIndex(v=>v.assetNodeId===e.assetNodeId&&v.mediaVersionId===e.mediaVersionId);
 if(index<0||!Array.isArray(e.marks)||e.marks.length<1||e.marks.length>64)reject('BP_IMAGE_EDIT');
 const marks=e.marks.map(m=>{
  exact(m,['kind','coordinates']);const a=m.coordinates,n=m.kind==='point'?2:m.kind==='bbox'?4:0;
  if(!n||!Array.isArray(a)||a.length!==n||a.some(n=>!int(n,0,999))||n===4&&(a[0]>=a[2]||a[1]>=a[3]))reject('BP_IMAGE_EDIT');
  return 'Image '+(index+1)+' <'+m.kind+'>'+a.join(' ')+'</'+m.kind+'>';
 });
 return {prompt:r.prompt+'\n'+marks.join('\n'),editBinding:{assetNodeId:e.assetNodeId,mediaVersionId:e.mediaVersionId,sequenceIndex:index,marks:e.marks}};
}
function check(value,endpointSelector){
 const r=data(value);exact(r,['contractKind','contractVersion','provider','region','canonicalModelId','operation','references','output'],['prompt','edit']);
 const rt=route(r,endpointSelector),layer=r.operation==='layer_decomposition';
 if(r.contractKind!=='byteplus.image-input'||!['generate','interactive_edit','layer_decomposition'].includes(r.operation))reject('BP_IMAGE_MODE');
 if(!Array.isArray(r.references)||r.references.length>10)reject('BP_IMAGE_INPUT');
 r.references.forEach((v,i)=>reference(v,i,layer));
 if(new Set(r.references.map(v=>v.assetNodeId+'\0'+v.mediaVersionId)).size!==r.references.length)reject('BP_IMAGE_INPUT');
 if(layer&&r.references.length!==1||r.operation==='interactive_edit'&&!r.references.length)reject('BP_IMAGE_MODE');
 const p=r.output;exact(p,['size','output_format','response_format','watermark','background','optimize_prompt_options']);exact(p.optimize_prompt_options,['mode']);
 if(!['png','jpeg'].includes(p.output_format)||!['url','b64_json'].includes(p.response_format)||typeof p.watermark!=='boolean'||!['opaque','transparent'].includes(p.background)||!['standard','fast'].includes(p.optimize_prompt_options.mode))reject('BP_IMAGE_OUTPUT');
 if(p.background==='transparent'&&(layer||r.references.length!==1||!r.references[0].hasAlpha||p.output_format!=='png'))reject('BP_IMAGE_MODE');
 if(r.prompt!==undefined&&(typeof r.prompt!=='string'||r.prompt.includes('\0'))||!layer&&!(typeof r.prompt==='string'&&r.prompt.trim()))reject('BP_IMAGE_PROMPT');
 const edit=editPrompt(r);if(Buffer.byteLength(edit.prompt??'','utf8')>16000)reject('BP_IMAGE_PROMPT');
 const body={model:rt.selectorValue,...(edit.prompt!==undefined?{prompt:edit.prompt}:{}),size:validateSeedreamSize(p.size,r.operation),output_format:p.output_format,response_format:p.response_format,watermark:p.watermark,background:p.background,optimize_prompt_options:p.optimize_prompt_options,...(layer?{layer_decomposition:true}:{})};
 return {request:r,route:rt,body,editBinding:edit.editBinding};
}
function time(clock){if(typeof clock!=='function')reject('BP_IMAGE_CLOCK');const t=clock();if(!int(t,0,8640000000000000))reject('BP_IMAGE_CLOCK');return t;}
const prefix=r=>'data:'+r.mimeType+';base64,';
function provenOversize(body,refs){
 const shell={...body,...(refs.length?{image:refs.map(prefix)}:{})};let overhead=0;
 try{const n=Buffer.byteLength(JSON.stringify(shell),'utf8');if(int(n,0,Number.MAX_SAFE_INTEGER))overhead=n;}catch{/* Unknown overhead is zero; exact final JSON remains authoritative. */}
 const lower=refs.reduce((n,r)=>n+4n*((BigInt(r.byteSize)+2n)/3n),BigInt(overhead));if(lower>BigInt(BODY_MAX))reject('BP_BODY_LIMIT');
}
function resolved(v,r,at){
 try{
  if(!v||Object.getPrototypeOf(v)!==Object.prototype)reject('BP_IMAGE_REFERENCE');
  const own={};for(const k of Reflect.ownKeys(v)){const d=Object.getOwnPropertyDescriptor(v,k);if(typeof k!=='string'||!Object.hasOwn(d,'value'))reject('BP_IMAGE_REFERENCE');own[k]=d.value;}
  const expected={...r};delete expected.sequenceIndex;delete expected.assetNodeId;
  const version=data(own.version);
  if(own.status!=='available'||own.assetNodeId!==r.assetNodeId||own.currentMediaVersionId!==r.mediaVersionId||Object.keys(version).length!==Object.keys(expected).length||Object.keys(expected).some(k=>version[k]!==expected[k])||own.expiresAtMs!==null&&!int(own.expiresAtMs,at+1,8640000000000000)||!(own.bytes instanceof Uint8Array))reject('BP_IMAGE_REFERENCE');
  const bytes=Buffer.from(own.bytes);if(bytes.length!==r.byteSize||hash(bytes)!==r.contentSha256)reject('BP_IMAGE_REFERENCE');
  return {bytes,expiresAtMs:own.expiresAtMs};
 }catch{reject('BP_IMAGE_REFERENCE');}
}
export async function serializeBytePlusImageRequest(value,context){
 const c=check(value,context?.endpointSelector),r=c.request,clock=context?.clock,at=time(clock);
 if(r.references.length&&typeof context?.resolveMedia!=='function')reject('BP_IMAGE_REFERENCE');
 provenOversize(c.body,r.references);const images=[],expires=[];
 for(const ref of r.references){
  let v;try{v=await context.resolveMedia(freeze({assetNodeId:ref.assetNodeId,mediaVersionId:ref.mediaVersionId}));}catch{reject('BP_IMAGE_REFERENCE');}
  const current=resolved(v,ref,time(clock));images.push(prefix(ref)+current.bytes.toString('base64'));expires.push(current.expiresAtMs);
 }
 const end=time(clock);if(end<at||expires.some(t=>t!==null&&t<=end))reject('BP_IMAGE_REFERENCE');
 const body={...c.body,...(images.length?{image:images}:{})},json=JSON.stringify(body),byteLength=Buffer.byteLength(json,'utf8');
 if(byteLength>BODY_MAX)reject('BP_BODY_LIMIT');
 const out=freeze({contractKind:'byteplus.image-request',contractVersion:1,operation:r.operation,body,json,byteLength,bodySha256:hash(json),route:c.route,mediaBindings:r.references,...(c.editBinding?{editBinding:c.editBinding}:{}),preparedAtMs:end,accountEntitlement:'UNKNOWN',endpointBinding:'UNKNOWN',submissionAuthorization:'BLOCK',requiresRevalidation:true,requiresNewPaidConfirmation:true,autoPostRetry:false});
 requests.add(out);return out;
}
function size(v){const m=typeof v==='string'&&/^([1-9][0-9]{0,5})x([1-9][0-9]{0,5})$/.exec(v);if(!m)reject('BP_IMAGE_RESULT');const w=Number(m[1]),h=Number(m[2]);if(w*h<921600||w*h>4624220||w/h<1/16||w/h>16)reject('BP_IMAGE_RESULT');return {width:w,height:h};}
function box(v,w,h){
 exact(v,['absolute','normalized']);const {absolute:a,normalized:n}=v;
 if(!Array.isArray(a)||!Array.isArray(n)||a.length!==4||n.length!==4||a.some((x,i)=>!int(x,0,i%2?h:w))||n.some(x=>!int(x,0,1000))||a[0]>=a[2]||a[1]>=a[3]||n[0]>=n[2]||n[1]>=n[3]||n.some((x,i)=>Math.abs(x-a[i]/(i%2?h:w)*1000)>1))reject('BP_IMAGE_RESULT');
 return v;
}
function carrier(d,format){
 if(format==='b64_json'){
  const b=d.b64_json;if(Object.hasOwn(d,'url')||typeof b!=='string'||!b.length||b.length>4*Math.ceil(IMAGE_MAX/3)||b.length%4||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(b))reject('BP_IMAGE_RESULT');
  const bytes=Buffer.from(b,'base64');if(!bytes.length||bytes.length>IMAGE_MAX||bytes.toString('base64')!==b)reject('BP_IMAGE_RESULT');return {b64_json:b,byteSize:bytes.length,contentSha256:hash(bytes)};
 }
 let u;try{u=new URL(d.url);}catch{reject('BP_IMAGE_RESULT');}
 if(Object.hasOwn(d,'b64_json')||typeof d.url!=='string'||d.url.length>16384||/[\x00-\x20\x7f]/.test(d.url)||u.protocol!=='https:'||u.username||u.password||u.port||u.hash)reject('BP_IMAGE_RESULT');
 return {url:d.url,transportAuthorization:'BLOCK',sourceTrust:'UNVERIFIED'};
}
export function parseBytePlusImageResponse(value,artifact){
 if(!requests.has(artifact))reject('BP_IMAGE_ARTIFACT');
 const failed=code=>freeze({contractKind:'byteplus.image-results',contractVersion:1,status:'failed',errorCode:code,results:[],bodySha256:artifact.bodySha256,publishAuthorization:'BLOCK',autoPostRetry:false});
 try{
  const v=data(value),layer=artifact.operation==='layer_decomposition';exact(v,['model','created','data'],['usage','error']);
  if(v.error)return failed('BP_IMAGE_PROVIDER_ERROR');
  if(v.model!==MODEL||!int(v.created,0,8640000000000)||!Array.isArray(v.data)||(!layer&&v.data.length!==1)||(layer&&(v.data.length<2||v.data.length>17)))return failed('BP_IMAGE_RESULT');
  const usage={};if(v.usage!==undefined){exact(v.usage,[],['generated_images','input_images','output_tokens','total_tokens']);for(const [k,n] of Object.entries(v.usage)){if(!int(n,0,Number.MAX_SAFE_INTEGER))reject('BP_IMAGE_RESULT');usage[k]=n;}}
  if(usage.generated_images!==undefined&&usage.generated_images!==v.data.length)reject('BP_IMAGE_RESULT');
  const results=v.data.map((d,wireIndex)=>{
   exact(d,['size'],['url','b64_json','output_format','z_index','bounding_box','name','description','error']);if(d.error)reject('BP_IMAGE_PROVIDER_ERROR');
   const z=layer?d.z_index:0;if(!int(z,0,16)||!layer&&['z_index','bounding_box','name','description'].some(k=>Object.hasOwn(d,k)))reject('BP_IMAGE_RESULT');
   const output_format=d.output_format??(layer&&z>0?'png':artifact.body.output_format);
   if(output_format!==(layer&&z>0?'png':artifact.body.output_format))reject('BP_IMAGE_RESULT');
   const dimensions=size(d.size);
   if(!layer&&artifact.body.size.includes('x')&&d.size!==artifact.body.size)reject('BP_IMAGE_RESULT');
   if(layer&&(typeof d.name!=='string'||d.name.length>1024||typeof d.description!=='string'||d.description.length>8192||z===0&&d.bounding_box!==undefined||z>0&&d.bounding_box===undefined))reject('BP_IMAGE_RESULT');
   const transport=carrier(d,artifact.body.response_format);
   return {wireIndex,z_index:z,...dimensions,output_format,mimeType:'image/'+output_format,...(layer?{name:d.name,description:d.description,...(z>0?{bounding_box:d.bounding_box}:{})}:{}),...transport,...(transport.url?{expiresAtMs:v.created*1000+86400000}:{}),resultId:'bp4-'+hash(JSON.stringify([artifact.bodySha256,v.created,z,transport.contentSha256??transport.url]))};
  });
  if(results.reduce((n,r)=>n+(r.byteSize??0),0)>128*1024*1024)reject('BP_IMAGE_RESULT');
  if(layer){
   results.sort((a,b)=>a.z_index-b.z_index);if(results.some((r,i)=>r.z_index!==i))reject('BP_IMAGE_RESULT');
   const base=results[0],ref=artifact.mediaBindings[0];if(Math.abs(base.width/base.height-ref.width/ref.height)>1/Math.min(base.height,ref.height))reject('BP_IMAGE_RESULT');
   results.slice(1).forEach(r=>box(r.bounding_box,base.width,base.height));
  }
  const out=freeze({contractKind:'byteplus.image-results',contractVersion:1,status:'parsed',operation:artifact.operation,created:v.created,model:v.model,usage,results,bodySha256:artifact.bodySha256,mediaBindings:artifact.mediaBindings,requiresAlpha:artifact.body.background==='transparent',publishAuthorization:'BLOCK',requiresDecode:true,autoPostRetry:false});parsedSets.add(out);return out;
 }catch{return failed('BP_IMAGE_RESULT');}
}
export async function prepareBytePlusImageResults(parsed,{decodeImage}={}){
 if(!parsedSets.has(parsed))reject('BP_IMAGE_ARTIFACT');
 if(parsed.results.some(r=>r.url))reject('BP_IMAGE_TRANSPORT_BLOCKED');
 if(typeof decodeImage!=='function')reject('BP_IMAGE_DECODE');
 const prepared=[];
 for(const r of parsed.results){
  const bytes=Buffer.from(r.b64_json,'base64');let m;
  try{m=data(await decodeImage(bytes));}catch{reject('BP_IMAGE_DECODE');}
  if(m?.fullyDecoded!==true||m.width!==r.width||m.height!==r.height||m.mimeType!==r.mimeType||typeof m.hasAlpha!=='boolean'||(parsed.requiresAlpha||parsed.operation==='layer_decomposition'&&r.z_index>0)&&!m.hasAlpha||hash(bytes)!==r.contentSha256)reject('BP_IMAGE_DECODE');
  prepared.push({...r,hasAlpha:m.hasAlpha,fullyDecoded:true});
 }
 // One return after ALL members decode. This is preparation, never graph commit.
 return freeze({...parsed,status:'prepared',results:prepared,requiresDecode:false,publishAuthorization:'BLOCK'});
}

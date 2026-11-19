// UI-only selection/geometry. The existing main-process Pro contract is authoritative.
export const IMAGE_UI_MODES=['TEXT_TO_IMAGE','IMAGE_REFERENCE','INTERACTIVE_EDIT','LAYER_DECOMPOSITION'];
export const IMAGE_UI_LABELS={TEXT_TO_IMAGE:'文字生圖',IMAGE_REFERENCE:'參考圖生成',INTERACTIVE_EDIT:'圖片互動編輯',LAYER_DECOMPOSITION:'圖片層分解'};
const fail=code=>{throw Object.assign(Error(code),{code});};
export const imageIdentity=r=>[r.assetNodeId,r.mediaVersionId,r.contentSha256].join('|');
export function imagePoint(rect,x,y){if(!rect||!Number.isFinite(rect.width)||!Number.isFinite(rect.height)||rect.width<=0||rect.height<=0||x<rect.left||y<rect.top||x>rect.left+rect.width||y>rect.top+rect.height)return null;return [Math.round((x-rect.left)/rect.width*999),Math.round((y-rect.top)/rect.height*999)];}
export function imageBox(a,b){if(!a||!b)return null;const box=[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1])];return box[0]<box[2]&&box[1]<box[3]?box:null;}
export function imageUiOptions(savedDefaults={},overrides={},mode='TEXT_TO_IMAGE'){
 const allowed=['size','output_format','response_format','watermark','background','optimize_prompt_options'];
 if([...Object.keys(savedDefaults),...Object.keys(overrides)].some(k=>!allowed.includes(k)))fail('BP_IMAGE_OUTPUT');
 const options={size:mode==='LAYER_DECOMPOSITION'?{kind:'tier',value:'auto'}:{kind:'dimensions',width:1024,height:1024},output_format:'png',response_format:'b64_json',watermark:false,background:'opaque',optimize_prompt_options:{mode:'standard'},...structuredClone(savedDefaults),...structuredClone(overrides)};
 if(typeof options.size==='string'){const match=/^([1-9][0-9]*)x([1-9][0-9]*)$/.exec(options.size);if(match)options.size={kind:'dimensions',width:Number(match[1]),height:Number(match[2])};else if(['1K','1.5K','2K','auto'].includes(options.size))options.size={kind:'tier',value:options.size};else fail('BP_IMAGE_SIZE');}
 if(!options.size||typeof options.size!=='object'||!['tier','dimensions'].includes(options.size.kind))fail('BP_IMAGE_SIZE');
 return options;
}
export function buildImageUiRequest({mode,prompt,selections=[],materials=[],options={},savedDefaults={},edit,canonicalModelId}){
 if(canonicalModelId!=='dola-seedream-5-0-pro-260628'||!IMAGE_UI_MODES.includes(mode))fail('BP_IMAGE_ROUTE');
 if(typeof prompt!=='string'||/<\/?(?:point|bbox)\b/i.test(prompt)||new TextEncoder().encode(prompt).length>16000)fail('BP_IMAGE_EDIT');
 const operation=mode==='INTERACTIVE_EDIT'?'interactive_edit':mode==='LAYER_DECOMPOSITION'?'layer_decomposition':'generate';
 const refs=(mode==='TEXT_TO_IMAGE'?[]:selections).map((r,i)=>{const current=materials.find(m=>m.imageReference&&imageIdentity(m.imageReference)===imageIdentity(r))?.imageReference;if(!current||['mimeType','byteSize','width','height','hasAlpha'].some(k=>current[k]!==r[k]))fail('BP_MEDIA_VERSION_CHANGED');return {...structuredClone(r),sequenceIndex:i};});
 if(refs.length>10||mode!=='TEXT_TO_IMAGE'&&!refs.length||operation==='layer_decomposition'&&refs.length!==1||new Set(refs.map(imageIdentity)).size!==refs.length)fail('BP_IMAGE_INPUT');
 for(const ref of refs)if(!['image/png','image/jpeg',...(operation==='layer_decomposition'?[]:['image/webp'])].includes(ref.mimeType)||ref.byteSize<=0||ref.byteSize>30000000||typeof ref.hasAlpha!=='boolean'||ref.width*ref.height>36000000||ref.width*ref.height<(operation==='layer_decomposition'?262144:196)||ref.width/ref.height<1/16||ref.width/ref.height>16)fail('BP_IMAGE_INPUT');
 const output=imageUiOptions(savedDefaults,options,mode);
 const size=output.size;
 if(size.kind==='tier'){if(!['1K','1.5K','2K',...(operation==='layer_decomposition'?['auto']:[])].includes(size.value))fail('BP_IMAGE_SIZE');}
 else if(size.kind!=='dimensions'||operation==='layer_decomposition'||![size.width,size.height].every(n=>Number.isSafeInteger(n)&&n>=15&&n<=100000)||size.width*size.height<921600||size.width*size.height>4624220||size.width/size.height<1/16||size.width/size.height>16)fail('BP_IMAGE_SIZE');
 if(!['png','jpeg'].includes(output.output_format)||!['url','b64_json'].includes(output.response_format)||!['opaque','transparent'].includes(output.background)||typeof output.watermark!=='boolean'||!['standard','fast'].includes(output.optimize_prompt_options?.mode))fail('BP_IMAGE_OUTPUT');
 if(output.background==='transparent'&&(operation==='layer_decomposition'||refs.length!==1||!refs[0].hasAlpha||output.output_format!=='png'))fail('BP_IMAGE_MODE');
 if(operation!=='layer_decomposition'&&!prompt.trim())fail('BP_IMAGE_PROMPT');
 if(refs.reduce((n,r)=>n+4*Math.ceil(r.byteSize/3),0)>64000000)fail('BP_BODY_LIMIT');
 const request={contractKind:'byteplus.image-input',contractVersion:1,provider:'byteplus-modelark',region:'ap-southeast-1',canonicalModelId,operation,prompt,references:refs,output};
 if(operation==='interactive_edit'){
  if(!edit||!refs.some(r=>imageIdentity(r)===imageIdentity(edit))||!Array.isArray(edit.marks)||edit.marks.length<1||edit.marks.length>64)fail('BP_IMAGE_EDIT');
  for(const m of edit.marks){const n=m.kind==='point'?2:m.kind==='bbox'?4:0;if(!n||m.coordinates?.length!==n||m.coordinates.some(x=>!Number.isSafeInteger(x)||x<0||x>999)||n===4&&(m.coordinates[0]>=m.coordinates[2]||m.coordinates[1]>=m.coordinates[3]))fail('BP_IMAGE_EDIT');}
  request.edit={assetNodeId:edit.assetNodeId,mediaVersionId:edit.mediaVersionId,marks:structuredClone(edit.marks)};
 }
 return request;
}

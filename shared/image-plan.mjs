import {supportsImageModel,IMAGE_CATALOG,supportsImageSize} from './byteplus-image-models.mjs';
// Provider-neutral traceability plus one deliberately narrow Ark image contract.
export const MODEL='doubao-seedream-5-0-flash-260915';
export const CAPABILITY='ark-cn/image-generation/1';
export const PURPOSES={character:{label:'人物',description:'指定人物外貌、髮型與服裝，維持同一人物'},product:{label:'產品',description:'保留產品形狀、顏色、包裝與細節'},scene:{label:'場景',description:'參考環境、背景、空間與氛圍'},style:{label:'風格',description:'參考色調、光影與質感'},studio:{label:'攝影棚',description:'參考構圖、姿勢、機位與產品位置'},reference:{label:'一般參考',description:'依照主需求使用這張參考圖'}};
const fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
export function imagePlan(g,n,effective){
 if(n.kind!=='generate.image')fail('IMAGE_ONLY','第一輪只測圖片；影片首尾幀留第二輪');
 if(!(n.payload.parameters.model===MODEL||supportsImageModel(n.payload.parameters.model))||!supportsImageSize(n.payload.parameters.model,n.payload.parameters.size))fail('IMAGE_CAPABILITY','只支援所選圖片模型列出的 PNG 尺寸');
 if(effective.errors.length)fail('IMAGE_INPUT',effective.errors.join('；'));
 const images=[],lookup=new Map();
 for(const ref of effective.media){
  const purpose=PURPOSES[ref.role],m=g.mediaVersions[ref.mediaRef.mediaVersionId];
  if(!purpose||ref.type!=='image')fail('IMAGE_ROLE','此模型不支援這個素材用途或媒體類型');
  if(!m||!['image/png','image/jpeg','image/webp'].includes(m.mime))fail('IMAGE_FORMAT','請使用 PNG、JPEG 或靜態 WebP');
  if(m.size>30000000||m.width<=14||m.height<=14||m.width/m.height<1/16||m.width/m.height>16||m.width*m.height>24000000)fail('IMAGE_LIMIT','參考圖片超過本候選尺寸／容量限制');
  let item=lookup.get(ref.mediaRef.mediaVersionId);
  if(!item){item={index:images.length+1,mediaRef:structuredClone(ref.mediaRef),sha256:m.sha256,mime:m.mime,size:m.size,width:m.width,height:m.height,name:m.name??'參考圖片',purposes:[],bindings:[]};images.push(item);lookup.set(ref.mediaRef.mediaVersionId,item);}
  if(!item.purposes.includes(ref.role))item.purposes.push(ref.role);
  item.bindings.push({edgeId:ref.edgeId,sourceNodeId:ref.sourceNodeId,mediaVersionId:ref.mediaRef.mediaVersionId,inputOrder:ref.inputOrder,role:ref.role,source:structuredClone({kind:ref.mediaRef.kind==='result'?'canvas-result':'canvas-import',studioSnapshot:'not-connected',provenance:m.provenance??{platform:null,model:null,generationMode:'unknown',generatedAt:null,originalResultId:null,originalSha256:m.sha256,accountScope:'unknown',portraitAuthorization:'unknown',videoAdmission:'unknown'}})});
 }
 if(images.length>10)fail('IMAGE_TOTAL','Seedream 5.0每次最多10張不同參考圖；每張最多30MB，另有明示本地64MB JSON資源保護');
 const lines=images.map(i=>'圖'+i.index+'用途：'+i.purposes.map(p=>PURPOSES[p].label+'（'+PURPOSES[p].description+'）').join('；')+'。');
 const intent=n.payload.intentPurpose?PURPOSES[n.payload.intentPurpose]:null;
 const prompt=[effective.prompt,...(intent?['這次要生成的素材用途：'+intent.label+'（'+intent.description+'）。請依這個用途製作一張可獨立使用的素材圖。']:[]),...(lines.length?['以下圖片按提交順序編號，僅依標註用途參考；同一張圖可有多種明確用途。',...lines]:[])].filter(Boolean).join('\n\n');
 if(!prompt.trim())fail('IMAGE_EMPTY','先寫需求或選擇參考素材');
 if(new TextEncoder().encode(prompt).length>16000)fail('IMAGE_PROMPT_LIMIT','包含素材用途的提示詞超過本候選16KB限制');
 const byteplus=supportsImageModel(n.payload.parameters.model);
 return {version:1,capability:byteplus?'byteplus-modelark/image-generation/1':CAPABILITY,provider:byteplus?'byteplus-modelark':'ark-cn',region:byteplus?'ap-southeast-1':'cn-beijing',model:n.payload.parameters.model,endpoint:byteplus?'https://ark.ap-southeast.bytepluses.com/api/v3/images/generations':'https://ark.cn-beijing.volces.com/api/v3/images/generations',nativeRoleFields:false,intendedPurpose:n.payload.intentPurpose??'reference',originalPrompt:effective.prompt,prompt,images,parameters:{size:n.payload.parameters.size,output_format:'png',response_format:'b64_json',watermark:true},outputCount:1,limitations:['用途由有序圖片及文字映射，效果不保證完全遵循','攝影棚原生入口尚未接入；普通圖指定構圖用途不等於來源快照','離線測試只驗證接線，輸出為合成圖片']};
}

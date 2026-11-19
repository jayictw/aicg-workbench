const {hash,error}=require('./media.cjs');
// Reuses M8 wire semantics, not its credential modules, accounts, data or budgets.
function body(plan,read){
 if(!['doubao-seedream-5-0-flash-260915',...require('../shared/byteplus-image-models.json').models.map(m=>m.id)].includes(plan.model)||plan.outputCount!==1)throw error('IMAGE_CAPABILITY','模型或結果數不在本輪範圍');
 const image=plan.images.map(m=>{const b=read(m);if(!Buffer.isBuffer(b)||hash(b)!==m.sha256||b.length!==m.size)throw error('IMAGE_BYTES','固定素材字節已變化');return 'data:'+m.mime+';base64,'+b.toString('base64');});
 return {model:plan.model,prompt:plan.prompt,...plan.parameters,...(image.length?{image}:{})};
}
function evidence(plan,request){return {capability:plan.capability,model:plan.model,nativeRoleFields:false,prompt:request.prompt,parameters:plan.parameters,images:plan.images,wireBodySha256:hash(JSON.stringify(request)),wireImageCount:request.image?.length??0,containsSecret:false,transport:'offline-only'};}
function parse(response,model){
 if(!response||!Number.isInteger(response.status))throw error('IMAGE_UNKNOWN','未取得可靠提交結果；先查原操作');
 if(response.status!==200)return {state:[400,401,403,404,422].includes(response.status)?'failed':'submissionUnknown'};
 if(response.contentType!=='application/json'||!Buffer.isBuffer(response.body)||response.body.length>48*1024*1024)throw error('IMAGE_RESPONSE','圖片回應格式或容量不符');
 let v;try{v=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(response.body));}catch{throw error('IMAGE_RESPONSE','圖片回應不是完整JSON');}
 if(v.model!==model||!Array.isArray(v.data)||v.data.length!==1)throw error('IMAGE_RESPONSE','模型或結果數與本批不符');
 const d=v.data[0];if(d.error||d.url||d.output_format!=='png'||d.size!=='1024x1024'||typeof d.b64_json!=='string'||!d.b64_json.length||d.b64_json.length>44*1024*1024)throw error('IMAGE_RESPONSE','只接受本批的一張完整PNG內嵌結果');
 const bytes=Buffer.from(d.b64_json,'base64');if(bytes.toString('base64')!==d.b64_json)throw error('IMAGE_RESPONSE','圖片Base64不完整');return {state:'succeeded',bytes};
}
function live(){throw error('LIVE_BATCH_NOT_AUTHORIZED','真實單張入口未啟用；收費生成只走另行批准且帳戶接通的固定批次');}
module.exports={body,evidence,parse,live};

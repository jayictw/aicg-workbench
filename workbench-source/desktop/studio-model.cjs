'use strict';
const c=require('./d1-json.cjs');
const fail=()=>{throw Object.assign(Error('C_STUDIO_INPUT'),{code:'C_STUDIO_INPUT'})};
const sizes=Object.freeze({'1:1':'1024x1024','4:3':'1152x864','3:4':'864x1152','16:9':'1280x720','9:16':'720x1280'});
function source(json,taskId){
 if(!c.text(json,64000,{prompt:true}))fail();const s=c.parse(Buffer.from(json));require('./work-schema.cjs').validatePromptSource(s,taskId||s.task?.id);
 if(s.kind!=='output'||s.task.kind!=='image'||s.scene.subject.kind!=='builtin'||s.scene.backdrop.mode!=='color'||s.scene.backdrop.lighting||s.scene.backdrop.image||s.scene.backdrop.hdr)fail();
 // Deliberately bounded first slice: current rendered built-ins and solid backgrounds.
 if(!sizes[s.scene.ratio])fail();return s;
}
function description(studio){return require(studio.version===1?'./model-description-v1.cjs':'./model-description.cjs')}
function validate(studio,taskId){
 if(studio.version===3&&(['A','C'].includes(studio.group)?!studio.manualText?.trim():studio.manualText!==''))fail();
 c.keys(studio,['version','group','sourceJson','sourceSha256','originalText','automaticText','manualText']);
 if(![1,2,3].includes(studio.version)||!['BASE','A','B','C'].includes(studio.group)||!c.text(studio.originalText,4096,{prompt:true})||!c.text(studio.manualText,4096,{prompt:true,empty:true})||studio.sourceSha256!==c.hash(Buffer.from(studio.sourceJson)))fail();
 const s=source(studio.sourceJson,taskId);if(studio.automaticText!==description(studio).modelDescription(s))fail();return s;
}
function prepare(packet,original,taskId,target){
 c.keys(packet,['group','sourceJson','manualText'],['referenceBase64','daily']);const s=source(packet.sourceJson,taskId);
 const studio={version:packet.daily===true?3:2,group:packet.group,sourceJson:packet.sourceJson,sourceSha256:c.hash(Buffer.from(packet.sourceJson)),originalText:original,automaticText:require('./model-description.cjs').modelDescription(s),manualText:packet.daily===true&&['B','BASE'].includes(packet.group)?'':packet.manualText};validate(studio,taskId);
 const withImage=['B','C'].includes(packet.group);let bytes=null,inputs=[];
 if(withImage){bytes=decode(packet.referenceBase64);const v=require('./studio-png.cjs').verifyPNG(bytes);if(Math.max(v.width,v.height)!==1024&&Math.max(v.width,v.height)!==2048||Math.abs(v.width/v.height-Number(s.scene.ratio.split(':')[0])/Number(s.scene.ratio.split(':')[1]))>.003)fail();inputs=[{role:'reference',index:0,sha256:v.sha256,mime:'image/png',byteSize:v.size}];}
 else if(packet.referenceBase64!==undefined)fail();
 const effective={version:2,target,operation:withImage?'image-edit':'text-to-image',prompt:studio.version===3?require('./daily-text.cjs').dailyText(original,studio.manualText,packet.group):require('./model-description.cjs').effectiveText(original,studio.automaticText,studio.manualText,packet.group),inputs,parameters:[{key:'output_format',value:'png'},{key:'size',value:sizes[s.scene.ratio]},{key:'watermark',value:true}],outputCount:1,studio};
 return {effective,base64:bytes?bytes.toString('base64'):null};
}
function decode(base64){if(typeof base64!=='string'||!base64.length||base64.length>4*Math.ceil(8*1024*1024/3)||base64.length%4!==0||/[^A-Za-z0-9+/=]/.test(base64))fail();const padding=base64.indexOf('=');if(padding!==-1&&(padding<base64.length-2||!['=','=='].includes(base64.slice(padding))))fail();const b=Buffer.from(base64,'base64');if(b.length>8*1024*1024||b.toString('base64')!==base64)fail();return b}
function effective(e){
 if(!require('./image-policies.cjs').target(e.target))fail();
 const s=validate(e.studio);if(e.version!==2||e.outputCount!==1||!c.text(e.prompt,4096,{prompt:true})||e.prompt!==(e.studio.version===3?require('./daily-text.cjs').dailyText(e.studio.originalText,e.studio.manualText,e.studio.group):description(e.studio).effectiveText(e.studio.originalText,e.studio.automaticText,e.studio.manualText,e.studio.group)))fail();
 const image=['B','C'].includes(e.studio.group);if(e.operation!==(image?'image-edit':'text-to-image')||e.inputs.length!==(image?1:0)||image&&(e.inputs[0].role!=='reference'||e.inputs[0].index!==0||e.inputs[0].mime!=='image/png'))fail();
 if(!c.same(e.parameters,[{key:'output_format',value:'png'},{key:'size',value:sizes[s.scene.ratio]},{key:'watermark',value:true}]))fail();return s;
}
function reference(e,base64){effective(e);if(!e.inputs.length){if(base64!==null&&base64!==undefined)fail();return null}const b=decode(base64),v=require('./studio-png.cjs').verifyPNG(b),i=e.inputs[0];if(v.sha256!==i.sha256||v.size!==i.byteSize)fail();const s=source(e.studio.sourceJson);if(![1024,2048].includes(Math.max(v.width,v.height))||Math.abs(v.width/v.height-Number(s.scene.ratio.split(':')[0])/Number(s.scene.ratio.split(':')[1]))>.003)fail();return b}
function media(e,read){if(!e.inputs.length)return [];const i=e.inputs[0],bytes=read();reference(e,bytes.toString('base64'));return [{id:'m-'+i.sha256,sha256:i.sha256,size:i.byteSize,mime:'image/png',base64:bytes.toString('base64')}]}
module.exports={source,validate,prepare,effective,reference,media,sizes};

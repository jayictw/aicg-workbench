// P2-01: renderer selection only; existing B2/B3 contracts remain authoritative.
import {validateBytePlusVideoInput,BYTEPLUS_MEDIA_LIMITS} from './byteplus-media-contract.mjs';
export const BYTEPLUS_VIDEO_MODES=['TEXT_TO_VIDEO','FIRST_FRAME','FIRST_LAST_FRAME','MULTI_REFERENCE','VIDEO_REFERENCE'];
export const BYTEPLUS_VIDEO_LABELS={TEXT_TO_VIDEO:'文字生影片',FIRST_FRAME:'指定首幀',FIRST_LAST_FRAME:'指定首尾幀',MULTI_REFERENCE:'多參考圖',VIDEO_REFERENCE:'參考影片生影片'};
const fail=code=>{throw Object.assign(Error(code),{code});};
export function pickBytePlusMaterial(material,role){
 if(!material?.reference)fail('BP_UI_MATERIAL_MISSING');
 return {...structuredClone(material.reference),role};
}
export function validateBytePlusUiOutput(p){if(!['480p','720p','1080p'].includes(p.resolution)||typeof p.generate_audio!=='boolean'||typeof p.watermark!=='boolean'||!['mp4','mov'].includes(p.output_format))fail('BP_VIDEO_OUTPUT');return p;}
export function buildBytePlusUiRequest({mode,operation,prompt,selections=[],materials=[],parameters={},canonicalModelId,nowMs=Date.now()}){
 if(!BYTEPLUS_VIDEO_MODES.includes(mode)||canonicalModelId!==BYTEPLUS_MEDIA_LIMITS.canonicalModelId)fail('BP_UI_CAPABILITY');
 const refMode=['MULTI_REFERENCE','VIDEO_REFERENCE'].includes(mode),op=operation??(refMode?'reference':'generate');
 if((!refMode&&op!=='generate')||(mode==='MULTI_REFERENCE'&&op!=='reference'))fail('BP_INPUT_OPERATION');
 const allowed=['duration','ratio','resolution','generate_audio','watermark','output_format','execution_expires_after'];
 if(Object.keys(parameters).some(k=>!allowed.includes(k)))fail('BP_UI_PARAMETERS');
 const p={duration:4,ratio:'adaptive',resolution:'480p',generate_audio:true,watermark:true,output_format:'mp4',...parameters};
 validateBytePlusUiOutput(p);if(p.execution_expires_after!==undefined&&(!Number.isSafeInteger(p.execution_expires_after)||p.execution_expires_after<3600||p.execution_expires_after>259200))fail('BP_UI_TASK_PARAMETERS');
 const refs=selections.map((pick,i)=>{
  const current=materials.find(m=>m.reference?.assetNodeId===pick.assetNodeId);
  if(!current||['mediaVersionId','contentSha256','byteSize','mimeType','mediaKind'].some(k=>current.reference[k]!==pick[k])||JSON.stringify(current.reference.metadata)!==JSON.stringify(pick.metadata))fail('BP_MEDIA_VERSION_CHANGED');
  if(pick.mediaKind==='video'&&pick.source?.kind!=='remote')fail('BP_UI_VIDEO_CARRIER_REQUIRED');
  if([pick.source?.expiresAtMs,pick.availability?.expiresAtMs].some(t=>t!==null&&(!Number.isSafeInteger(t)||t<=nowMs)))fail('BP_MEDIA_EXPIRED');
  return {...structuredClone(pick),sequenceIndex:i};
 });
 const input={contractKind:'byteplus.video-input',contractVersion:1,provider:'byteplus-modelark',region:'ap-southeast-1',canonicalModelId,mode:mode==='MULTI_REFERENCE'?'MULTI_IMAGE_REFERENCE':mode,operation:op,prompt,mediaReferences:refs,parameters:{duration:p.duration,ratio:p.ratio}};
 validateBytePlusVideoInput(input);
 return {...(p.execution_expires_after===undefined?{}:{task:{execution_expires_after:p.execution_expires_after}}),input,output:{resolution:p.resolution,generate_audio:p.generate_audio,watermark:p.watermark,output_format:p.output_format},lifecycle:'standard'};
}

// Each mode/operation has its own remembered overrides in the panel. Apply the
// contract's fixed constraints to that mode's visible effective parameter view.
export function byteplusModeParameters(values,mode,operation){
 const out={...values};
 if(['FIRST_FRAME','FIRST_LAST_FRAME'].includes(mode)||['edit','extend'].includes(operation))out.ratio='adaptive';
 if(operation==='edit')out.duration=-1;
 else if(out.duration===-1)out.duration=4;
 return out;
}

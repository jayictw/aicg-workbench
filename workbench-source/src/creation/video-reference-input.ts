import {workspace} from '../management/store'
import {generated} from '../generated/store'
import {stageWork} from '../stage3d/work-state'
import {promptSession} from '../stage3d/scene-prompt-session'
import {modelDescription} from '../stage3d/model-description'
import {isDirectStudio,referencePackets} from './reference-packet'
import {videoLocalMode,unsupportedGeneratedVideo} from './input-state'
import type {RefImage} from '../studio/state'
import type {VideoDraft} from '../video/state'
import type {ReferencePacket} from './reference-packet'
export function studioReference(d:VideoDraft,taskId:string){const refs=d.refs.filter(r=>isDirectStudio(r,taskId));return d.creationInput?.studioReferenceId?refs.find(r=>r.id===d.creationInput!.studioReferenceId):refs.at(-1)}
export function selectedVideoReferences(d:VideoDraft,taskId:string){return d.creationInput?.referenceUse==='retained'?[]:d.refs.filter(r=>!isDirectStudio(r,taskId)&&r.generationUse!=='retained')}
export function effectiveVideoReferences(d:VideoDraft,taskId:string){const mode=videoLocalMode(d,generated.draft(taskId)),image=['B','C'].includes(mode)?studioReference(d,taskId):undefined,a=[...selectedVideoReferences(d,taskId),...(image?[image]:[])],order=d.creationInput?.videoOrder||[];return a.map((r,n)=>({r,n,k:order.indexOf(r.id)})).sort((x,y)=>(x.k<0?order.length+x.n:x.k)-(y.k<0?order.length+y.n:y.k)).map(x=>x.r)}
export function videoInputSummary(d:VideoDraft,taskId:string){const mode=videoLocalMode(d,generated.draft(taskId)),a=effectiveVideoReferences(d,taskId),names={character:'人物图',product:'产品图',scene:'场景图',style:'风格图'},parts=['主提示词'];for(const [key,name]of Object.entries({studio:'棚图',...names})){const n=a.filter(r=>key==='studio'?isDirectStudio(r,taskId):!isDirectStudio(r,taskId)&&r.category===key).length;if(n)parts.push(name+' '+n+' 张')}if(['A','C'].includes(mode))parts.push('已确认棚文字');return '本次：'+parts.join('＋')+(['A','C'].includes(mode)?'':'；不含棚文字')}
export function videoReferenceIssue(d:VideoDraft,taskId:string){const mode=videoLocalMode(d,generated.draft(taskId)),ordinary=selectedVideoReferences(d,taskId),image=['B','C'].includes(mode)?studioReference(d,taskId):undefined;
 if(d.creationInput?.referenceUse!=='retained'&&(d.first||d.last||d.mode!=='text'||unsupportedGeneratedVideo(generated.draft(taskId))))return '历史首尾帧或其他生成输入尚未接入；请明确选择仅主提示词，保留原资料后再调整。'
 if(ordinary.length+(image?1:0)>30)return '最多发送30张外观／内容参考图。请取消多余素材勾选，或调整摄影棚方式；不会自动删图。'
 if(['B','C'].includes(mode)&&!image)return '摄影棚图片尚未明确套回，请先套回或选择不用摄影棚。'
 if(['A','C'].includes(mode)&&!d.supplement?.text.trim())return '当前摄影棚方式需要已确认的补充文字，请先套回或调整方式。'
 return ''
}
async function encodeStudio(r:RefImage):Promise<Omit<ReferencePacket,'origin'>&{origin:'studio-snapshot'}>{
 const m=r.src.match(/^data:(image\/png);base64,(.+)$/s);if(!m)throw Error('C_VIDEO_REFERENCE_MISSING');const bytes=Uint8Array.from(atob(m[2]),c=>c.charCodeAt(0));if(!bytes.length||bytes.length>8*1024*1024)throw Error('C_VIDEO_REFERENCE_SIZE');const bitmap=await createImageBitmap(new Blob([bytes],{type:'image/png'}));bitmap.close();const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(n=>n.toString(16).padStart(2,'0')).join('');return {referenceId:r.id,assetId:null,origin:'studio-snapshot',category:'scene',name:r.name,mime:'image/png',sha256:hash,byteSize:bytes.length,base64:m[2]} as Omit<ReferencePacket,'origin'>&{origin:'studio-snapshot'}
}
export async function videoReferencePacket(taskId:string){
 const d=workspace.get().videos[taskId]?.draft;if(!d)throw Error('C_VIDEO_REFERENCE_MISSING');const issue=videoReferenceIssue(d,taskId);if(issue)throw Error(issue);const mode=videoLocalMode(d,generated.draft(taskId)),references=await referencePackets(taskId,'video');
 const order=effectiveVideoReferences(d,taskId).map(r=>r.id);if(mode==='BASE')return {references,studio:{mode},order}
 const image=studioReference(d,taskId),out=stageWork.get(taskId)?.result,stored=['B','C'].includes(mode)?image?.stageSource?.promptSourceJson:d.supplement?.source.promptSourceJson,source=stored?JSON.parse(stored) as import('../stage3d/scene-prompt-state').PromptSource:['B','C'].includes(mode)?out?.promptSnapshot:[out?.promptSnapshot,promptSession.get(taskId)?.source].find(s=>s?.sceneSignature===d.supplement?.source.sceneSignature&&s?.task.id===taskId);
 if(!source||source.task.kind!=='video'||source.task.id!==taskId||['B','C'].includes(mode)&&(!image||image.stageSource?.outputId!==source.id||source.kind!=='output'||image.stageSource.sceneSignature!==source.sceneSignature))throw Error('C_VIDEO_STUDIO_STALE');
 if(['A','C'].includes(mode)&&d.supplement?.source.sceneSignature!==source.sceneSignature)throw Error('C_VIDEO_STUDIO_STALE');
 return {references,order,studio:{mode,sourceJson:JSON.stringify(source),automaticText:modelDescription(source),adoptedText:d.supplement?.text||'',...(['B','C'].includes(mode)?{reference:await encodeStudio(image!)}:{})}}
}

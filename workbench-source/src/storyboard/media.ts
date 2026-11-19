import { assertReference } from './reference-state'
import { prepareStageImage } from './stage-image-media'
import type { RefImage } from '../studio/state'
import type { Workspace } from '../management/state'
export async function prepareMedia(s:Workspace,refs:RefImage[]):Promise<RefImage[]>{return Promise.all(refs.map(async ref=>{
 if(ref.stageSelection){assertReference(s,ref);const verified=await prepareStageImage({key:'snapshot',token:'snapshot',projectId:ref.stageSelection.projectId,taskId:ref.stageSelection.holderTaskId,taskName:ref.stageSelection.holderTaskName,kind:ref.stageSelection.holderKind,slot:ref.stageSelection.holderSlot,ref,width:ref.stageSelection.width,height:ref.stageSelection.height});if(verified.pngSha256!==ref.stageSelection.pngSha256)throw new Error('摄影棚快照内容校验不符，请重新选取。');return structuredClone(ref)}
 const asset=s.assets.find(a=>a.id===(ref.assetId||ref.id));if(!asset||asset.media!=='image')throw new Error('素材已失效，请重新选择。')
 const url=new URL(asset.src,location.href);if(!['blob:','data:'].includes(url.protocol)&&url.origin!==location.origin)throw new Error('本轮不读取外部图片，请先使用现有本地素材。')
 const response=await fetch(url);if(!response.ok)throw new Error('素材读取失败，请重新选择或重试。');const blob=await response.blob();if(blob.size>20*1024*1024)throw new Error('素材超过20MB，未创建任务。')
 const objectUrl=URL.createObjectURL(blob);try{const image=new Image();image.src=objectUrl;await image.decode();if(!image.naturalWidth||image.naturalWidth*image.naturalHeight>32000000)throw new Error('素材尺寸无效或超过3200万像素。');const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('图片快照不可用。');ctx.drawImage(image,0,0);const src=canvas.toDataURL('image/png');canvas.width=canvas.height=1;return {...structuredClone(ref),src,assetId:asset.id}}finally{URL.revokeObjectURL(objectUrl)}
}))}

import type {ChangeReceipt} from './commands.ts'
import type { StagePickReceipt } from '../storyboard/stage-image-types.ts'
import type { TaskLink, UpdateReceipt, FieldOrigins } from '../storyboard/update-types.ts'
import type { Board, StoryboardReceipt, StoryboardSource, ShotSnapshot } from '../storyboard/types.ts'
import type { StageProvenance } from '../studio/stage-handoff-types.ts'
import { immutable } from '../studio/simulation.ts'
import { stageIssues } from '../stage3d/state.ts'
import type { StageSettings } from '../stage3d/state.ts'
import { sampleAssets } from '../studio/catalog.ts'
import { createState, tick } from '../studio/state.ts'
import type { Category, RefImage, StudioState } from '../studio/state.ts'
import { videoCreate, videoTick } from '../video/state.ts'
import type { VideoState } from '../video/state.ts'
import { taskGroupStatus } from '../studio/simulation.ts'
export type TaskKind = 'image' | 'video'
export type Project = { id: string; name: string; description: string; createdAt: number; updatedAt: number }
export type CreativeTask = { storyboardFields?:FieldOrigins; storyboardSource?:StoryboardSource; storyboardSnapshot?:ShotSnapshot; id: string; kind: TaskKind; name: string; projectId: string | null; createdAt: number; updatedAt: number }
export type Asset = { stageSource?: StageProvenance; id: string; name: string; media: 'image' | 'video' | 'audio'; src: string; usages: Category[]; tags: string[]; description: string; favorite: boolean; example: boolean; origin: 'sample' | 'local' | 'result'; entityId?: string; view?: string; mime?: string; fileName?: string; size?: number; lastModified?: number; duration?: number; width?: number; height?: number; source?: { taskId: string; taskName: string; resultId: string; kind: TaskKind }; createdAt: number; updatedAt: number }
export type Entity = { id: string; kind: 'character' | 'product'; name: string; description: string; tags: string[]; favorite: boolean; coverId: string | null; photos: { assetId: string; view: string }[]; model: { name: string; size: number; file?: File } | null; createdAt: number; updatedAt: number }
export type Workspace = {controlledChangesVersion?:1; commandRevisions?:Record<string,number>; changeReceipts?:ChangeReceipt[]; commandAudit?:{id:string;actor:string;fields:string[];at:number}[]; stagePickReceipts?:Record<string,StagePickReceipt>; storyboardLinks?:TaskLink[]; storyboardUpdates?:Record<string,UpdateReceipt>; storyboards?:Record<string,Board>; storyboardReceipts?:Record<string,StoryboardReceipt>; stages: Record<string, StageSettings>; projects: Project[]; tasks: CreativeTask[]; images: Record<string, StudioState>; videos: Record<string, VideoState>; activeImage: string | null; activeVideo: string | null; assets: Asset[]; entities: Entity[] }
export function workspaceInitial(): Workspace {
 const assets: Asset[] = sampleAssets.map(r => ({ id:r.id,name:r.name,media:'image',src:r.src,usages:[r.category],tags:['示例'],description:'本地原创示例插画，不是真实照片或 AI 生成。',favorite:false,example:true,origin:'sample',entityId:r.entityId,view:r.view,createdAt:0,updatedAt:0 }))
 const entities: Entity[] = ['sample-bottle','sample-lin','sample-he'].map(id => { const photos=sampleAssets.filter(r=>r.entityId===id); return {id,kind:id==='sample-bottle'?'product':'character',name:photos[0].name,description:'示例资料卡 · 多角度原创示意图，非真实人物或产品照片。',tags:['示例'],favorite:false,coverId:photos[0].id,photos:photos.map(r=>({assetId:r.id,view:r.view})),model:null,createdAt:0,updatedAt:0} })
 return {stages:{},projects:[],tasks:[],images:{},videos:{},activeImage:null,activeVideo:null,assets,entities}
}
function validProject(s: Workspace, id: string | null) { if(id && !s.projects.some(p=>p.id===id)) throw new Error('项目不存在，请重新选择。') }
export function addProject(s: Workspace, id: string, name: string, description: string, now: number): Workspace {
 if(!name.trim()) throw new Error('请填写项目名称。')
 if(s.projects.some(p=>p.id===id)) throw new Error('项目 ID 已存在。')
 return {...s,projects:[{id,name:name.trim(),description,createdAt:now,updatedAt:now},...s.projects]}
}
export function editProject(s: Workspace, id: string, name: string, description: string, now: number): Workspace { if(!name.trim())throw new Error('请填写项目名称。');return {...s,projects:s.projects.map(p=>p.id===id?{...p,name:name.trim(),description,updatedAt:now}:p)} }
export function addCreativeTask(s: Workspace, id: string, kind: TaskKind, name: string, projectId: string | null, now: number): Workspace {
 validProject(s,projectId); if(!name.trim())throw new Error('请填写任务名称。');if(s.tasks.some(t=>t.id===id))throw new Error('任务 ID 已存在。')
 const task={id,kind,name:name.trim(),projectId,createdAt:now,updatedAt:now}
 return {...s,tasks:[task,...s.tasks],...(kind==='image'?{images:{...s.images,[id]:createState()},activeImage:id}:{videos:{...s.videos,[id]:videoCreate()},activeVideo:id}),projects:s.projects.map(p=>p.id===projectId?{...p,updatedAt:now}:p)}
}
export function activateTask(s: Workspace, id: string): Workspace {const task=s.tasks.find(t=>t.id===id);if(!task)throw new Error('任务不存在；刷新后临时任务不会保留。');return {...s,...(task.kind==='image'?{activeImage:id}:{activeVideo:id})} }
export function editCreativeTask(s: Workspace, id: string, name: string, projectId: string | null, now: number): Workspace {
 validProject(s,projectId);if(!name.trim())throw new Error('请填写任务名称。');const old=s.tasks.find(t=>t.id===id)
 return {...s,tasks:s.tasks.map(t=>t.id===id?{...t,name:name.trim(),projectId,updatedAt:now}:t),projects:s.projects.map(p=>p.id===projectId||p.id===old?.projectId?{...p,updatedAt:now}:p)}
}
function touched(s: Workspace, id: string, now: number) { const task=s.tasks.find(t=>t.id===id);return {tasks:s.tasks.map(t=>t.id===id?{...t,updatedAt:now}:t),projects:s.projects.map(p=>p.id===task?.projectId?{...p,updatedAt:now}:p)} }
export function updateImage(s: Workspace,id:string,fn:(data:StudioState)=>StudioState,now:number):Workspace {const current=s.images[id];if(!current)throw new Error('图片任务不存在。');const next=fn(current);return next===current?s:{...s,images:{...s.images,[id]:next},...touched(s,id,now)} }
export function updateVideo(s: Workspace,id:string,fn:(data:VideoState)=>VideoState,now:number):Workspace {const current=s.videos[id];if(!current)throw new Error('视频任务不存在。');const next=fn(current);return next===current?s:{...s,videos:{...s.videos,[id]:next},...touched(s,id,now)} }
export function tickWorkspace(s:Workspace,now:number):Workspace {let next=s;for(const id of Object.keys(s.images))next=updateImage(next,id,d=>tick(d,now),now);for(const id of Object.keys(s.videos))next=updateVideo(next,id,d=>videoTick(d,now),now);return next}
export function taskStatus(s:Workspace,t:CreativeTask):string {const batches=t.kind==='image'?s.images[t.id]?.batches:s.videos[t.id]?.batches;if(!batches)return '来源记录任务';if(!batches.length)return '未生成';return taskGroupStatus(batches.map(b=>b.tasks).flat())}
export const projectName=(s:Workspace,id:string|null)=>s.projects.find(p=>p.id===id)?.name||'未归属'
export function submissionContext(s:Workspace,id:string) {const task=s.tasks.find(t=>t.id===id)!;return {taskId:id,taskName:task.name,projectId:task.projectId,projectName:projectName(s,task.projectId)} }
export function addAsset(s:Workspace,asset:Asset):Workspace {if(s.assets.some(a=>a.id===asset.id||!!asset.source&&a.source?.taskId===asset.source.taskId&&a.source.resultId===asset.source.resultId))return s;return {...s,assets:[asset,...s.assets]} }
export function editAsset(s:Workspace,id:string,patch:Pick<Asset,'name'|'description'|'tags'|'usages'>,now:number):Workspace {if(!patch.name.trim())throw new Error('请填写素材名称。');return {...s,assets:s.assets.map(a=>a.id===id?{...a,...patch,name:patch.name.trim(),updatedAt:now}:a)} }
export function toggleAsset(s:Workspace,id:string):Workspace{return {...s,assets:s.assets.map(a=>a.id===id?{...a,favorite:!a.favorite}:a)} }
export function saveEntity(s:Workspace,entity:Entity,staged:Asset[]=[]):Workspace {if(!entity.name.trim())throw new Error('请填写资料卡名称。');const assets=[...s.assets,...staged.filter(a=>!s.assets.some(old=>old.id===a.id))];if(entity.photos.some(p=>!assets.some(a=>a.id===p.assetId&&a.media==='image')))throw new Error('照片引用无效。');if(entity.coverId&&!entity.photos.some(p=>p.assetId===entity.coverId))throw new Error('封面需属于当前照片。');return {...s,assets,entities:s.entities.some(e=>e.id===entity.id)?s.entities.map(e=>e.id===entity.id?{...entity,name:entity.name.trim()}:e):[{...entity,name:entity.name.trim()},...s.entities]} }
export function duplicateAssets(s:Workspace,file:{name:string;size:number;lastModified:number;type:string}) {return s.assets.filter(a=>(a.fileName||a.name)===file.name&&a.size===file.size&&a.lastModified===file.lastModified&&a.mime===file.type)}
export function assetReference(s:Workspace,a:Asset,entity?:Entity):RefImage {
 const owner=entity||s.entities.find(e=>e.id===a.entityId)||s.entities.find(e=>e.photos.some(p=>p.assetId===a.id))
 return {...(a.stageSource?{stageSource:structuredClone(a.stageSource)}:{}),id:owner&&a.entityId!==owner.id?`${a.id}::${owner.id}`:a.id,assetId:a.id,src:a.src,name:owner?.name||a.name,category:owner?.kind||a.usages[0]||'scene',entityId:owner?.id||a.entityId||a.id,view:owner?.photos.find(p=>p.assetId===a.id)?.view||a.view||'参考图',origin:a.origin==='sample'?'sample':'library',example:a.example,sourceTaskId:a.source?.taskId,sourceResultId:a.source?.resultId,sourceTaskName:a.source?.taskName,sourceKind:a.source?.kind}
}
export function pickerReferences(s:Workspace):RefImage[]{return s.assets.filter(a=>a.media==='image').map(a=>assetReference(s,a))}
export function assetFromReference(ref:RefImage,now:number):Asset{return {...(ref.stageSource?{stageSource:structuredClone(ref.stageSource)}:{}),id:ref.assetId||ref.id,name:ref.name,media:'image',src:ref.src,usages:[ref.category],tags:ref.example||ref.origin==='sample'?['示例']:[],description:'从本次创作的临时引用明确加入素材库。',favorite:false,example:!!ref.example||ref.origin==='sample',origin:ref.sourceTaskId&&ref.sourceResultId?'result':ref.origin==='sample'?'sample':'local',...(ref.sourceTaskId&&ref.sourceResultId?{source:{taskId:ref.sourceTaskId,taskName:ref.sourceTaskName||'来源任务',resultId:ref.sourceResultId,kind:ref.sourceKind||'image'}}:{}),view:ref.view,entityId:ref.entityId,size:ref.size,fileName:ref.name,mime:ref.mime,lastModified:ref.lastModified,createdAt:now,updatedAt:now}}

export function applyStageSettings(s:Workspace,id:string,settings:StageSettings,now:number):Workspace { if(!s.tasks.some(t=>t.id===id))throw new Error('任务已不可用。'); const issues=stageIssues(settings); if(issues.length)throw new Error(issues.join(' ')); return {...s,stages:{...s.stages,[id]:immutable(settings)},...touched(s,id,now)} }

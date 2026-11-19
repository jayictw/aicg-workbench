import {executeCommand,commandTarget} from './commands.ts'
import type {BusinessCommand,ChangeReceipt} from './commands.ts'
import {generated} from '../generated/store.ts'
import {emptyCreationDraft} from '../creation/input-state.ts'
import type {CreationInput} from '../creation/input-state.ts'
import type {StageSupplement} from '../studio/stage-handoff-types.ts'
import { selectStageImage } from '../storyboard/stage-images-state.ts'
import type { StagePickRequest, PreparedStageImage } from '../storyboard/stage-image-types.ts'
import { linkTask, unlinkTask, applyTaskUpdate, undoTaskUpdate, bindUpdateRequest } from '../storyboard/update-state.ts'
import type { UpdateRequest } from '../storyboard/update-types.ts'
import { createVideoFromShot } from '../storyboard/video-state.ts'
import { putBoard, createFromShot, bindRequest, stableJson } from '../storyboard/state.ts'
import type { Board, CreateRequest, VideoCreateRequest } from '../storyboard/types.ts'
import type { RefImage } from '../studio/state.ts'
import { applyHandoff, undoHandoff } from './handoff-state.ts'
import type { HandoffRequest, HandoffReceipt } from './handoff-state.ts'
import type { StageSettings } from '../stage3d/state.ts'
import { applyStageSettings, activateTask, addAsset, editAsset, editCreativeTask, saveEntity, tickWorkspace, toggleAsset, updateImage, updateVideo, workspaceInitial } from './state.ts'
import type { Asset, Entity, TaskKind, Workspace, CreativeTask } from './state.ts'
import type { StudioState } from '../studio/state.ts'
import type { VideoState } from '../video/state.ts'
let state=workspaceInitial()
const listeners=new Set<()=>void>()
let timer:ReturnType<typeof setInterval>|undefined
function commit(next:Workspace){if(next===state)return;state=next;listeners.forEach(f=>f())}
function schedule(){if(timer)return;timer=setInterval(()=>{commit(tickWorkspace(state,Date.now()));const all=[...Object.values(state.images),...Object.values(state.videos)];if(!all.some(d=>d.batches.some(b=>b.tasks.some(t=>t.status==='queued'||t.status==='running')))){clearInterval(timer);timer=undefined}},150)}
const updateAttempts=new Map<string,string>()
const storyboardAttempts=new Map<string,string>()
const receipts=new Map<string,HandoffReceipt>(),latest=new Map<string,HandoffReceipt>(),handoffDigests=new Map<string,string>()

function business(c:BusinessCommand,receipt?:ChangeReceipt,nativeProjectId?:string|null){
 const task=state.tasks.find(t=>t.id===c.id),g=generated.draft(c.id)
 let next=executeCommand(state,c,Date.now());if(nativeProjectId!==undefined){if(c.kind!=='task-edit')throw Error('MCP_ARGUMENTS');next=editCreativeTask(next,c.id,c.name??next.tasks.find(t=>t.id===c.id)!.name,nativeProjectId,Date.now())}const fields=Object.keys(c).filter(k=>['name','description','prompt'].includes(k))
 next={...next,controlledChangesVersion:1,commandRevisions:{...next.commandRevisions,[c.id]:(next.commandRevisions?.[c.id]||0)+1},commandAudit:[...(next.commandAudit||[]),{id:c.id,actor:receipt?.actor||'native-user',fields,at:Date.now()}]}
 if(receipt)next={...next,changeReceipts:[...(next.changeReceipts||[]),receipt]}
 if(c.prompt!==undefined&&task)generated.putDraft({...g||emptyCreationDraft(c.id,task.kind),prompt:c.prompt})
 commit(next);return c.id
}

export const workspace={
 business,
 commandTarget:(kind:'project'|'task',id:string)=>commandTarget(state,kind,id),
 replaceControlled:(next:Workspace)=>commit(next),
 creationEdit:(id:string,patch:{prompt?:string;refs?:RefImage[];supplement?:StageSupplement;creationInput?:CreationInput})=>{if(patch.prompt!==undefined){business({kind:'task-edit',id,prompt:patch.prompt});const {prompt:_,...rest}=patch;patch=rest;}const task=state.tasks.find(t=>t.id===id);if(!task)return;const current=(task.kind==='image'?state.images[id]:state.videos[id])?.draft;if(!current||Object.entries(patch).every(([k,v])=>JSON.stringify(current[k as keyof typeof current])===JSON.stringify(v)))return;commit(task.kind==='image'?updateImage(state,id,d=>({...d,draft:{...d.draft,...structuredClone(patch)}}),Date.now()):updateVideo(state,id,d=>({...d,draft:{...d.draft,...structuredClone(patch)}}),Date.now()))},
 acceptSourceTask:(task:CreativeTask)=>{if(state.tasks.some(x=>x.id===task.id))return;if(!['image','video'].includes(task.kind)||task.projectId!==null)throw Error('C_D1_TASK_KIND');commit({...state,tasks:[structuredClone(task),...state.tasks],[task.kind==='image'?'activeImage':'activeVideo']:task.id})},
 selectStageImage:(r:StagePickRequest,image:PreparedStageImage)=>{const result=selectStageImage(state,r,image,Date.now());commit(result.state);return result.receipt},
 linkTask:(b:string,sh:string,t:string)=>commit(linkTask(state,b,sh,t,Date.now())),
 unlinkTask:(id:string)=>commit(unlinkTask(state,id)),
 reserveTaskUpdate:(r:UpdateRequest)=>bindUpdateRequest(updateAttempts,r),
 updateTaskInputs:(r:UpdateRequest,media:RefImage[])=>{bindUpdateRequest(updateAttempts,r);const result=applyTaskUpdate(state,r,media,Date.now());commit(result.state);return result.receipt},
 undoTaskUpdate:(id:string)=>commit(undoTaskUpdate(state,id,Date.now())),
 handoff:(request:HandoffRequest)=>{const prior=receipts.get(request.id);if(prior){if(prior.taskId!==request.taskId||handoffDigests.get(request.id)!=='m5.v1:'+stableJson(request))throw new Error('提交识别绑定不同内容；请重新确认。');return prior}const result=applyHandoff(state,request,Date.now());handoffDigests.set(request.id,'m5.v1:'+stableJson(request));receipts.set(request.id,result.receipt);latest.set(request.taskId,result.receipt);commit(result.state);return result.receipt},
 handoffReceipt:(id:string)=>latest.get(id),
 undoHandoff:(id:string)=>{const r=latest.get(id);if(!r)throw new Error('没有可撤销的套回。');const next=undoHandoff(state,r,Date.now());const undone={...r,undone:true};latest.set(id,undone);receipts.set(r.id,undone);commit(next)},
 board:(b:Board)=>commit(putBoard(state,b)),
 reserveStoryboardRequest:(r:CreateRequest|VideoCreateRequest)=>bindRequest(storyboardAttempts,r),
 createFromShot:(r:CreateRequest,media:RefImage[])=>{bindRequest(storyboardAttempts,r);const result=createFromShot(state,r,media,crypto.randomUUID(),Date.now());commit(result.state);return result.receipt},
 createVideoFromShot:(r:VideoCreateRequest,media:RefImage[])=>{bindRequest(storyboardAttempts,r);const result=createVideoFromShot(state,r,media,crypto.randomUUID(),Date.now());commit(result.state);return result.receipt},
 get:()=>state,
 applyStage:(id:string,settings:StageSettings)=>commit(applyStageSettings(state,id,settings,Date.now())),
 subscribe:(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn)}},
 createProject:(name:string,description='')=>{const id=crypto.randomUUID();business({kind:'project-create',id,name,description});return id},
 editProject:(id:string,name:string,description:string)=>business({kind:'project-edit',id,name,description}),
 createTask:(kind:TaskKind,name:string,projectId:string|null=null)=>{const id=crypto.randomUUID();business({kind:'task-create',id,taskKind:kind,name,projectId});return id},
 activate:(id:string)=>{const t=state.tasks.find(t=>t.id===id);if(!t)return false;const active=t.kind==='image'?state.activeImage:state.activeVideo;if(active!==id)commit(activateTask(state,id));return true},
 editTask:(id:string,name:string,projectId:string|null)=>business({kind:'task-edit',id,name},undefined,projectId),
 image:(id:string,fn:(data:StudioState)=>StudioState)=>{commit(updateImage(state,id,fn,Date.now()));schedule()},
 video:(id:string,fn:(data:VideoState)=>VideoState)=>{commit(updateVideo(state,id,fn,Date.now()));schedule()},
 addAsset:(asset:Asset)=>commit(addAsset(state,asset)),
 editAsset:(id:string,patch:Pick<Asset,'name'|'description'|'tags'|'usages'>)=>commit(editAsset(state,id,patch,Date.now())),
 favoriteAsset:(id:string)=>commit(toggleAsset(state,id)),
 saveEntity:(entity:Entity,staged:Asset[]=[])=>commit(saveEntity(state,entity,staged)),
 favoriteEntity:(id:string)=>{const e=state.entities.find(e=>e.id===id);if(e)commit(saveEntity(state,{...e,favorite:!e.favorite}))},
}
export function taskHref(kind:TaskKind,id:string){return `#/${kind}?task=${encodeURIComponent(id)}`}
export function openTask(id:string){const task=state.tasks.find(t=>t.id===id);if(task){workspace.activate(id);window.location.hash=taskHref(task.kind,id).slice(1);window.dispatchEvent(new HashChangeEvent('hashchange'))}}

export function captureBusiness(){return {workspace:state,maps:{receipts:[...receipts],latest:[...latest],handoffDigests:[...handoffDigests].filter(([id])=>receipts.has(id)),storyboardAttempts:[...storyboardAttempts].filter(([id])=>!!state.storyboardReceipts?.[id]),updateAttempts:[...updateAttempts].filter(([id])=>!!state.storyboardUpdates?.[id])}}}
export function restoreBusiness(data:ReturnType<typeof captureBusiness>){if(timer){clearInterval(timer);timer=undefined}if(data.maps.receipts.some(([id])=>!data.maps.handoffDigests?.some(([key])=>key===id)))throw new Error('成功套回收据缺少请求摘要；拒绝不完整恢复。');receipts.clear();latest.clear();handoffDigests.clear();storyboardAttempts.clear();updateAttempts.clear();for(const [k,v] of data.maps.handoffDigests||[])handoffDigests.set(k,v);for(const [k,v] of data.maps.receipts)receipts.set(k,v);for(const [k,v] of data.maps.latest)latest.set(k,v);for(const [k,v] of data.maps.storyboardAttempts)storyboardAttempts.set(k,v);for(const [k,v] of data.maps.updateAttempts)updateAttempts.set(k,v);state=data.workspace;listeners.forEach(f=>f())}

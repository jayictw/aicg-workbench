import {workspaceBusinessChanged} from './change-classification'
import {exitEditors,exitInputRevision} from './exit-editors'
import {generated} from '../generated/store'
import {loadedFlash,savedFlash} from './flash-tracking'
import {compatibilityMessage} from './compatibility-message'
import {desktopPoses} from './pose-repository'
import {promptSession} from '../stage3d/scene-prompt-session'
import {stageWork} from '../stage3d/work-state'
import {sceneDrafts} from '../stage3d/draft-state'
import {workspace} from '../management/store'
import {uiListeners} from './ui-state'
import {captureForDisk,encodeBusiness,decodeBusiness,hydrateBusiness} from './codec'
import type {SaveAck,SelectionPreview,CreatePreview,StorageInfo,FormatVersions} from './bridge'
import './bridge'
promptSession.configure(id=>{const task=workspace.get().tasks.find(t=>t.id===id);if(!task)throw Error('文字来源任务不存在。');return task.projectId})
type SaveState={formats:FormatVersions|null;phase:'gate'|'loading'|'ready'|'saving'|'failed'|'unknown';generation:number;savedGeneration:number;revision:number;at:number;error:string;location:string;cap:string;lastBackup:string;diagnostics:{staging:number;orphans:number};selection:SelectionPreview|null;selectionBusy:boolean;newLibrary:CreatePreview|null;storageInfo:StorageInfo|null}

let state:SaveState={formats:null,phase:'gate',generation:0,savedGeneration:-1,revision:0,at:0,error:'',location:'',cap:'',lastBackup:'',newLibrary:null,storageInfo:null,selection:null,selectionBusy:false,diagnostics:{staging:0,orphans:0}};const listeners=new Set<()=>void>();let restoring=false,pending:{id:string;generation:number;request:Parameters<NonNullable<Window['workLibrary']>['save']>[0]}|null=null
const emit=()=>{listeners.forEach(f=>f());window.workLibrary?.report({dirty:state.generation!==state.savedGeneration,saving:state.phase==='saving'||state.phase==='unknown'})}
const set=(patch:Partial<SaveState>)=>{state={...state,...patch};emit()}
function changed(){if(!restoring&&state.phase!=='gate'&&state.phase!=='loading'){state={...state,generation:state.generation+1};emit()}}
generated.subscribe(changed);stageWork.subscribe(changed);sceneDrafts.subscribe(changed)
let observedWorkspace=workspace.get()
workspace.subscribe(()=>{const next=workspace.get(),businessChanged=workspaceBusinessChanged(observedWorkspace,next);observedWorkspace=next;if(businessChanged)changed()})
uiListeners.add(kind=>{if(kind==='checkpoint')changed()})
// route/theme remain in captureForDisk and hydrateBusiness for compatibility.
// Viewing updates only the next manual snapshot; no background write or business generation.


function ack(result:SaveAck,generation:number){savedFlash(state.cap,generation);pending=null;set({phase:'ready',revision:result.revision,at:result.at,savedGeneration:generation,error:''})}
async function choose(kind:'library'|'backup'|'last'){
 if(state.selectionBusy||state.phase==='saving'||state.phase==='unknown'||['saving','unknown'].includes(desktopPoses.get().phase))return;
 set({selectionBusy:true,error:''});try{const row=await (kind==='library'?window.workLibrary!.pickLibrary():kind==='backup'?window.workLibrary!.pickBackup():window.workLibrary!.lastLocation());set({selection:row,error:kind==='last'&&!row?'没有上次成功打开位置；请明确选择已有工作库或建立全新空库。':''})}catch(e){set({error:'未切换工作库：'+compatibilityMessage((e as Error).message)})}finally{set({selectionBusy:false})}
}
async function openSelection(mode:'saved'|'discard'|'save'){
 const row=state.selection;if(!row||row.kind!=='library'||state.selectionBusy)return;if(!row.eligible){set({error:compatibilityMessage('C_LEGACY_REVIEW_REQUIRED')});return}
 if(state.phase==='saving'||state.phase==='unknown'||['saving','unknown'].includes(desktopPoses.get().phase)){set({error:'提交结果未确认或正在处理，请先完成／查询原操作。'});return}
 set({selectionBusy:true,error:''});let staged=false;
 try{
  if(mode==='save'){await persistence.save({entry:'save-before-switch',origin:'ui'});if(state.phase!=='ready'||state.generation!==state.savedGeneration)throw Error('保存未确认，或保存期间又有新编辑；请重新查看后切换。')}
  if(mode==='saved'&&state.cap&&state.generation!==state.savedGeneration)throw Error('核心资料有未保存变更，请选择保存后切换或明确放弃。');
  const generation=state.generation,oldCap=state.cap;
  const loaded=await window.workLibrary!.prepareSelection({handle:row.handle,discard:mode==='discard'});staged=true;
  if(!loaded.dto)throw Error('C_STRUCTURE_INVALID');const data=await decodeBusiness(loaded.dto,loaded.libraryId);
  if(state.generation!==generation||state.cap!==oldCap)throw Error('准备期间内容发生变更，请重新预览。');
  const result=await window.workLibrary!.commitSelection({handle:row.handle});staged=false;
  // Static resource overlays are loaded under the new capability before publishing its UI.
  await window.workLibrary!.load(result.cap);
  restoring=true;try{pending=null;desktopPoses.bind(result.cap,result.libraryId,result.poseRevision||0);sceneDrafts.bind(result.libraryId);stageWork.bind(result.libraryId);hydrateBusiness(data);loadedFlash(result.cap,Object.values(data.business.workspace.images).flatMap(s=>s.batches.filter(b=>b.id.startsWith('flash-offline-')).map(b=>b.id)));const recovered=JSON.stringify(data.business).includes('"originalStatus"');set({phase:'ready',formats:result.versions||loaded.versions||null,cap:result.cap,location:result.location,revision:result.revision,at:result.at||0,generation:recovered?1:0,savedGeneration:loaded.dto?0:-1,lastBackup:'',newLibrary:null,selection:null,error:'已打开工作库：'+row.name,diagnostics:result.diagnostics||{staging:0,orphans:0}});window.dispatchEvent(new HashChangeEvent('hashchange'))}finally{restoring=false}
 }catch(e){if(staged)await window.workLibrary!.cancelSelection({handle:row.handle}).catch(()=>{});set({error:'打开未完成；未自动保存或套用：'+compatibilityMessage((e as Error).message)})}finally{set({selectionBusy:false})}
}
async function restoreSelection(){const row=state.selection;if(!row||row.kind!=='backup'||state.selectionBusy)return;if(!row.eligible){set({error:compatibilityMessage('C_LEGACY_REVIEW_REQUIRED')});return}set({selectionBusy:true,error:''});try{const restored=await window.workLibrary!.restoreSelection({handle:row.handle});set({selection:restored,error:'还原已验证完成，当前工作库未切换。请另行确认打开还原库。'})}catch(e){set({error:'还原未完成，当前工作库保留：'+compatibilityMessage((e as Error).message)})}finally{set({selectionBusy:false})}}
export const persistence={async info(){try{set({storageInfo:await window.workLibrary!.info()})}catch(e){set({error:compatibilityMessage((e as Error).message)})}},async previewNew(){if(state.selectionBusy)return;set({selectionBusy:true,error:''});try{set({newLibrary:await window.workLibrary!.newPreview()})}catch(e){set({error:compatibilityMessage((e as Error).message)})}finally{set({selectionBusy:false})}},cancelNew(){if(!state.selectionBusy){const row=state.newLibrary;set({newLibrary:null});if(row)void window.workLibrary!.newCancel({handle:row.handle}).catch(()=>{})}},async confirmNew(){if(!state.newLibrary||state.selectionBusy)return;set({selectionBusy:true,error:''});try{const row=await window.workLibrary!.newConfirm({handle:state.newLibrary.handle});set({newLibrary:null,selection:row,error:'全新空库已建立；请另行确认打开。未改当前任务或自动保存。'})}catch(e){set({error:'建立未完成：'+compatibilityMessage((e as Error).message)})}finally{set({selectionBusy:false})}},choose,openSelection,restoreSelection,cancelSelection(){if(!state.selectionBusy){const row=state.selection;set({selection:null});if(row)void window.workLibrary!.cancelSelection({handle:row.handle}).catch(()=>{})}},get:()=>state,subscribe:(f:()=>void)=>{listeners.add(f);return()=>{listeners.delete(f)}},async save(diagnostic:{entry:string;origin:string;trustedEvent?:boolean}={entry:'unidentified',origin:'unknown'}){if(state.phase==='saving'||state.phase==='unknown'||!state.cap)return;pending=null;const captured=captureForDisk(),generation=state.generation,cap=state.cap,expectedRevision=state.revision;set({phase:'saving',error:''});try{const dto=await encodeBusiness(captured),id='save-'+crypto.randomUUID(),request={cap,operationId:id,expectedRevision,dto};pending={id,generation,request};const result=await window.workLibrary!.save(request,diagnostic);if(state.cap===cap)ack(result,generation)}catch(e){const raw=(e as Error).message,message=compatibilityMessage(raw);const definitive=/C_[A-Z0-9_]+|STAGE_WORK_|SCENE_DRAFT_|MEDIA_|INJECTED_|REVISION_CONFLICT|SAVE_SCHEMA|BUSINESS_SCHEMA|WORKSPACE_SCHEMA|TASK_SCHEMA|OPERATION_CONTENT_CONFLICT|CAPABILITY_EXPIRED|NON_FINITE|KEY_REJECTED|TREE_|REQUEST_SIZE|SIZE_LIMIT/.test(raw);set({phase:pending&&!definitive?'unknown':'failed',error:message})}},async resolve(){if(!pending)return;const cap=state.cap;try{const result=await window.workLibrary!.receipt({cap:state.cap,id:pending.id});if(state.cap!==cap)return;if(result)ack(result,pending!.generation);else{set({phase:'failed',error:'查询未找到成功保存收据；内存资料保留，可重新保存。'});pending=null}}catch(e){set({phase:'unknown',error:compatibilityMessage((e as Error).message)})}},async backup(){try{set({error:''});const r=await window.workLibrary!.backup(state.cap);set({lastBackup:r.id,error:'备份完成：核心 r'+r.revision+' / 姿势 p'+r.poseRevision})}catch(e){set({error:compatibilityMessage((e as Error).message)})}},async restore(){if(!state.lastBackup)return;try{const row=await window.workLibrary!.restore({cap:state.cap,id:state.lastBackup});set({selection:row,error:'请核对已提交版本；确认还原不会自动切库。'})}catch(e){set({error:'还原失败，旧库保留：'+compatibilityMessage((e as Error).message)})}},async close(){await window.workLibrary!.close({cap:state.cap})}}





window.workLibrary?.onExitCheck?.(()=>({version:1,inputRevision:exitInputRevision(),phase:state.phase,generation:state.generation,savedGeneration:state.savedGeneration,revision:state.revision,libraryId:desktopPoses.get().libraryId,posePhase:desktopPoses.get().phase,selectionBusy:state.selectionBusy,editors:exitEditors()}))

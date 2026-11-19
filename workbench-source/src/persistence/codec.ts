import {generated} from '../generated/store'
import type {GeneratedWorkspace1} from '../generated/types'
import {stageWork,validateWork} from '../stage3d/work-state'
import type {StageWork} from '../stage3d/work-state'
import {sceneDrafts,validateDrafts} from '../stage3d/draft-state'
import type {SceneDraft} from '../stage3d/draft-state'
import {immutable} from '../studio/simulation'
import {captureBusiness,restoreBusiness} from '../management/store'
import {exportSubjectFiles,restoreSubjectFiles} from '../stage3d/sources'
import {exportBackdropFiles,restoreBackdropFiles} from '../stage3d/background-sources'
import {editorPositions} from './ui-state'
export type Media={id:string;sha256:string;size:number;mime:string;base64:string}
export type DiskDTO={schemaVersion:1|2|3|4|5;business:unknown;registries:unknown;media:Media[]}
export type Business=ReturnType<typeof captureBusiness>&{generated:GeneratedWorkspace1;d1Media?:Media[];stageWork:StageWork[];stageDrafts:SceneDraft[];ui:{route:string;theme:string;editors:typeof editorPositions}}
const evidenceKeys=new Set(['baseAppliedSignature','fingerprint','baseline','digest','valueSignature','sceneSignature','currentFingerprint','supplementFingerprint','expected','expectedSource','expectedTarget'])
const allowedData=/^data:(image\/(png|jpeg|webp|gif|avif)|video\/mp4|audio\/(wav|x-wav));base64,/
const sha=async(b:Uint8Array)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b as BufferSource))).map(x=>x.toString(16).padStart(2,'0')).join('')
function base64(b:Uint8Array){let s='';for(let i=0;i<b.length;i+=32768)s+=String.fromCharCode(...b.subarray(i,i+32768));return btoa(s)}
function unbase64(s:string){return Uint8Array.from(atob(s),c=>c.charCodeAt(0))}
export async function encodeBusiness(captured:Business):Promise<DiskDTO>{
 const {d1Media=[],...business}=captured;
 const media=new Map<string,Media>(),srcs=new Map<string,unknown>();let total=0
 async function put(bytes:Uint8Array,mime:string){if(bytes.length>128*1024*1024)throw Error('单个媒体超过128MiB测试上限');const h=await sha(bytes),id='m-'+h;if(media.has(id)&&media.get(id)!.mime!==mime)throw Error('C_D1_MEDIA_MIME_COLLISION');if(!media.has(id)){total+=bytes.length;if(total>256*1024*1024)throw Error('保存媒体超过256MiB测试上限');media.set(id,{id,sha256:h,size:bytes.length,mime,base64:base64(bytes)})}return id}
 async function encode(v:unknown,key='',path='root'):Promise<unknown>{
  if(v===undefined)return undefined
  if(v instanceof File){if(!/^root\.workspace\.entities\.\d+\.model\.file$/.test(path)&&!/^registries\.(subjects|backdrops)\.[^.]+$/.test(path))throw Error('未知File字段，保存中止：'+path);const id=await put(new Uint8Array(await v.arrayBuffer()),'application/octet-stream');if(path.startsWith('registries.subjects.')&&path.slice('registries.subjects.'.length)!==id)throw Error('MODEL_CONTENT_HASH_MISMATCH');return {$file:id,name:v.name,type:v.type,modified:v.lastModified,size:v.size}}
  if(v instanceof Blob&&/^root\.stageWork\.\d+\.result\.blob$/.test(path)){if(v.type!=='image/png'||!v.size||v.size>32*1024*1024)throw Error('STAGE_WORK_PNG');const bytes=new Uint8Array(await v.arrayBuffer());if(bytes.length<24||bytes[0]!==137||bytes[1]!==80||bytes[2]!==78||bytes[3]!==71)throw Error('STAGE_WORK_PNG');const result=business.stageWork[Number(path.split('.')[2])]?.result,view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);if(!result||view.getUint32(16)!==result.width||view.getUint32(20)!==result.height)throw Error('STAGE_WORK_PNG_DIMENSIONS');const image=await createImageBitmap(v);try{if(image.width!==result.width||image.height!==result.height)throw Error('STAGE_WORK_PNG_DIMENSIONS')}finally{image.close()}return {$png:await put(bytes,'image/png')}}
  if(v instanceof Blob)throw Error('未支持的Blob字段：'+path)
  if(typeof v==='number'&&!Number.isFinite(v))throw Error('非有限数值：'+path)
  if(typeof v==='string'){
   if(key==='src'&&v){if(srcs.has(v))return srcs.get(v);let result:unknown
    if(v.startsWith('blob:'))throw Error('发现暂时Blob URL，未保存：'+path)
    if(v.startsWith('data:')){if(!allowedData.test(v))throw Error('不支持的媒体编码：'+path);const split=v.indexOf(','),prefix=v.slice(0,split+1),mime=prefix.slice(5,prefix.indexOf(';'));result={$src:await put(unbase64(v.slice(split+1)),mime),kind:'data',prefix}}
    else if(/^\/assets\/[a-zA-Z0-9_./-]+$/.test(v)&&!v.includes('..')){const r=await fetch(v);if(!r.ok)throw Error('内置媒体读取失败：'+v);result={$src:await put(new Uint8Array(await r.arrayBuffer()),r.headers.get('content-type')||'application/octet-stream'),kind:'static',value:v}}
    else throw Error('未批准的媒体来源：'+path)
    srcs.set(v,result);return result}
   if(evidenceKeys.has(key)||(path.startsWith('root.maps.')&&v.length>1024)){return {$evidence:await put(new TextEncoder().encode(v),'text/plain; charset=utf-8')}}
   return v
  }
  if(Array.isArray(v))return Promise.all(v.map((x,i)=>encode(x,String(i),path+'.'+i)))
  if(v&&typeof v==='object'){const out:Record<string,unknown>={};for(const [k,x] of Object.entries(v)){if(['__proto__','constructor','prototype'].includes(k))throw Error('不安全字段');const value=await encode(x,k,path+'.'+k);if(value!==undefined)out[k]=value}return out}
  return v
 }
 validateWork(business.stageWork,stageWork.library(),business.workspace.tasks);const scenes={...business.workspace.stages,...stageWork.scenes(business.stageWork),...Object.fromEntries((business.stageDrafts||[]).map(d=>['draft:'+d.taskId,d.scene]))};validateDrafts(business.stageDrafts,sceneDrafts.library(),business.workspace.tasks);if(Object.values(scenes).some(s=>s.version!==2))throw Error('SCENE_FORMAT_REVIEW_REQUIRED');const registries={subjects:exportSubjectFiles(scenes),backdrops:exportBackdropFiles(scenes)}
 for(const m of d1Media){const id=await put(unbase64(m.base64),m.mime);if(id!==m.id||m.sha256!==id.slice(2)||m.size!==unbase64(m.base64).length)throw Error('C_D1_MEDIA_BYTES')}const encoded=await encode(business),files=await encode(registries,'','registries');return {schemaVersion:5,business:encoded,registries:files,media:[...media.values()]}
}
export async function decodeBusiness(dto:DiskDTO,libraryId=stageWork.library()){if(![1,2,3,4,5].includes(dto.schemaVersion)||!Array.isArray(dto.media))throw Error('未知工作格式');const media=new Map<string,Media>();for(const m of dto.media){const bytes=unbase64(m.base64);if(bytes.length!==m.size||await sha(bytes)!==m.sha256||m.id!=='m-'+m.sha256)throw Error('媒体缺失或校验失败');media.set(m.id,m)}
 function item(id:unknown){const m=media.get(String(id));if(!m)throw Error('缺失媒体：'+String(id));return m}
 function decode(v:unknown):unknown{if(Array.isArray(v))return v.map(decode);if(v&&typeof v==='object'){const o=v as Record<string,unknown>;if('$src'in o){const m=item(o.$src);if(o.kind==='data'&&typeof o.prefix==='string')return o.prefix+m.base64;if(o.kind==='static'&&typeof o.value==='string'&&o.value.startsWith('/assets/'))return o.value;throw Error('无效媒体槽')}
  if('$png'in o){const m=item(o.$png);if(m.mime!=='image/png')throw Error('STAGE_WORK_PNG');return new Blob([unbase64(m.base64)],{type:'image/png'})}
  if('$evidence'in o)return new TextDecoder('utf-8',{fatal:true}).decode(unbase64(item(o.$evidence).base64))
  if('$file'in o){const m=item(o.$file);if(typeof o.name!=='string'||typeof o.type!=='string'||typeof o.modified!=='number'||o.size!==m.size)throw Error('文件描述不匹配');return new File([unbase64(m.base64)],o.name,{type:o.type,lastModified:o.modified})}
  return Object.fromEntries(Object.entries(o).map(([k,x])=>[k,decode(x)]))}return v}
 const business=decode(dto.business) as Business,registries=decode(dto.registries) as {subjects:Record<string,File>;backdrops:Record<string,File>};if(!business?.workspace?.tasks||!business.maps||!business.ui||!registries.subjects||!registries.backdrops)throw Error('业务数据格式不兼容');if(business.maps.receipts.some(([id])=>!business.maps.handoffDigests?.some(([key])=>key===id)))throw Error('成功套回收据缺少请求摘要；未修改内存或工作库。');business.stageWork=dto.schemaVersion<3?[]:business.stageWork;validateWork(business.stageWork,libraryId,business.workspace.tasks);for(const d of business.stageWork)if(d.result){const image=await createImageBitmap(d.result.blob);try{if(image.width!==d.result.width||image.height!==d.result.height)throw Error('STAGE_WORK_PNG_DIMENSIONS')}finally{image.close()}}business.stageDrafts=dto.schemaVersion===1?[]:business.stageDrafts;validateDrafts(business.stageDrafts,libraryId,business.workspace.tasks);const sceneValues=[...Object.values(business.workspace.stages),...Object.values(stageWork.scenes(business.stageWork||[])),...(business.stageDrafts||[]).map(d=>d.scene)];if(sceneValues.some(s=>s.version!==([4,5].includes(dto.schemaVersion)?2:1)))throw Error('C_MIXED_SCENE');return {business,registries,format:dto.schemaVersion,d1Media:dto.media}
}
export function hydrateBusiness(data:Awaited<ReturnType<typeof decodeBusiness>>){if(data.format!==5)throw Error('C_LEGACY_REVIEW_REQUIRED');const {business,registries}=data;for(const d of business.stageWork)if(d.attempt?.status==='running'){d.attempt={...d.attempt,status:'interrupted',error:'进程重开，上次输出未确认完成；未自动渲染。'}}const at=Date.now();for(const state of [...Object.values(business.workspace.images),...Object.values(business.workspace.videos)])for(const batch of state.batches)for(const task of batch.tasks)if(task.status==='queued'||task.status==='running'){Object.assign(task,{recovery:{originalStatus:task.status,at,reason:'进程重开；未自动生成'},status:'interrupted'})}
 for(const group of [...Object.values(business.workspace.images),...Object.values(business.workspace.videos)])for(const batch of group.batches){Object.assign(batch,{snapshot:immutable(batch.snapshot),...(batch.context?{context:immutable(batch.context)}:{}),...(batch.storyboardOrigin?{storyboardOrigin:immutable(batch.storyboardOrigin)}:{})})}
 for(const task of business.workspace.tasks)if(task.storyboardSnapshot)task.storyboardSnapshot=immutable(task.storyboardSnapshot)
 generated.bind(business.generated,(data as typeof data&{d1Media:Media[]}).d1Media||[]);restoreSubjectFiles(registries.subjects);restoreBackdropFiles(registries.backdrops);for(const k of Object.keys(editorPositions))delete editorPositions[k];Object.assign(editorPositions,business.ui.editors);restoreBusiness(business);stageWork.bind(stageWork.library(),business.stageWork,business.workspace.tasks);sceneDrafts.bind(sceneDrafts.library(),business.stageDrafts,business.workspace.tasks)
 const route=business.ui.route;if(/^#\/(?:$|projects(?:\?|$)|image(?:\?|$)|video(?:\?|$)|storyboard(?:\?|$)|assets(?:\?|$)|settings$)/.test(route))history.replaceState(null,'',route)
 const theme=business.ui.theme==='dark'?'dark':'light';document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme;localStorage.setItem('acs-appearance',theme)
}
export function captureForDisk():Business{return structuredClone({...captureBusiness(),...generated.snapshot(),stageWork:stageWork.list(),stageDrafts:sceneDrafts.list(),ui:{route:location.hash,theme:document.documentElement.dataset.theme||'light',editors:editorPositions}})}

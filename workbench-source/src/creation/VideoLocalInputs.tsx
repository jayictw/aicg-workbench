import {ArrowUp,ArrowDown} from 'lucide-react'
import {materialPurpose} from './GenerationReview'
import {useEffect,useRef,useState,useSyncExternalStore} from 'react'
import {workspace} from '../management/store'
import {persistence} from '../persistence/session'
import {generated} from '../generated/store'
import {stageWork} from '../stage3d/work-state'
import {handoffToken} from '../management/handoff-state'
import {Modal} from '../studio/Modal'
import {InfoButton} from '../ui/InfoButton'
import {initialCreation,videoLocalMode,studioAdoptionMode} from './input-state'
import {effectiveVideoReferences,studioReference,videoReferenceIssue} from './video-reference-input'
import {isDirectStudio} from './reference-packet'
import type {StudioMode} from '../generated/daily-input'
import type {RefImage} from '../studio/state'
export function VideoLocalInputs({taskId,onChange}:{taskId:string;onChange:()=>void}){
 const w=useSyncExternalStore(workspace.subscribe,workspace.get),p=useSyncExternalStore(persistence.subscribe,persistence.get),g=useSyncExternalStore(generated.subscribe,generated.get),out=useSyncExternalStore(stageWork.subscribe,()=>stageWork.get(taskId)?.result),d=w.videos[taskId]?.draft,generatedDraft=g.drafts.find(x=>x.taskId===taskId)
 const [url,setUrl]=useState(''),[view,setView]=useState(''),[error,setError]=useState(''),[pending,setPending]=useState<{id:string;mode:StudioMode;supplement?:import('../studio/stage-handoff-types').StageSupplement}|null>(null),stamp=useRef('');stamp.current=[p.cap,p.location,taskId,out?.id].join('|')
 const receipt=workspace.handoffReceipt(taskId)
 useEffect(()=>{setPending(null);setView('')},[p.cap,p.location,taskId])
 useEffect(()=>{setUrl('');setError('');if(!out)return;let active=true;const mine=stamp.current;void out.blob.arrayBuffer().then(bytes=>{if(!active||mine!==stamp.current)return;if(out.blob.type!=='image/png'||bytes.byteLength>8*1024*1024)throw Error('摄影棚图片为空或超过8MiB本地范围。');let text='';const data=new Uint8Array(bytes);for(let i=0;i<data.length;i+=32768)text+=String.fromCharCode(...data.subarray(i,i+32768));setUrl('data:image/png;base64,'+btoa(text))}).catch(e=>{if(active&&mine===stamp.current)setError(e.message)});return()=>{active=false}},[p.cap,p.location,taskId,out])
 useEffect(()=>{
  if(!d||!receipt||receipt.undone||d.creationInput?.observedHandoffId===receipt.id)return;
  const hasImage=receipt.fields.includes('refs'),hasText=receipt.fields.includes('supplement'),next=d.refs.filter(r=>isDirectStudio(r,taskId)).at(-1),old=studioReference({...d,refs:d.refs.filter(r=>r.id!==next?.id)},taskId),mode=videoLocalMode(d,generatedDraft),nextMode:StudioMode=hasImage?studioAdoptionMode(d.creationInput):hasText?(d.creationInput?.studioMode||'A'):mode;
  onChange();
  if(hasImage&&next&&(old&&old.id!==next.id)){
   workspace.creationEdit(taskId,{...(hasText?{supplement:receipt.before.supplement}:{}),creationInput:{...d.creationInput||initialCreation(),observedHandoffId:receipt.id,studioMode:old?mode:'BASE',...(old?{studioReferenceId:old.id}:{})}});setPending({id:next.id,mode:nextMode,supplement:hasText?d.supplement:undefined});
  }else workspace.creationEdit(taskId,{creationInput:{...d.creationInput||initialCreation(),observedHandoffId:receipt.id,studioMode:nextMode,...(hasImage&&next?{studioReferenceId:next.id}:{})}})
 },[taskId,receipt?.id,receipt?.undone,d?.creationInput?.observedHandoffId])
 if(!d)return null
 const mode=videoLocalMode(d,generatedDraft),image=studioReference(d,taskId),src=image?.src||url,source=out?.promptSnapshot,newOutput=!!out&&image?.stageSource?.outputId!==out.id,issue=videoReferenceIssue(d,taskId)
 function reorder(n:number,delta:number){const a=effectiveVideoReferences(d!,taskId).map(r=>r.id);[a[n],a[n+delta]]=[a[n+delta],a[n]];onChange();workspace.creationEdit(taskId,{creationInput:{...d!.creationInput||initialCreation(),videoOrder:a}})}
 function select(mode:StudioMode){onChange();workspace.creationEdit(taskId,{creationInput:{...d!.creationInput||initialCreation(),studioMode:mode}})}
 function usePending(){const latest=workspace.get().videos[taskId]?.draft;if(!latest||!pending||!latest.refs.some(r=>r.id===pending.id))return;onChange();workspace.creationEdit(taskId,{...(pending.supplement?{supplement:pending.supplement}:{}),creationInput:{...latest.creationInput||initialCreation(),studioMode:pending.mode,studioReferenceId:pending.id}});setPending(null)}
 function adopt(){if(!out||!url||!source||source.task.id!==taskId)return;const existing=workspace.get().videos[taskId]?.draft.refs.find(r=>r.stageSource?.outputId===out.id);if(existing){setPending({id:existing.id,mode:studioAdoptionMode(d.creationInput),supplement:receipt?.after.supplement});return}const ref:RefImage={id:'stage-ref-'+out.id,category:'scene',src:url,name:'摄影棚构图参考图',entityId:'stage-'+out.id,view:'3D构图参考图，非AI生成',origin:'local',mime:'image/png',size:out.blob.size,stageSource:{version:1,taskId,snapshotId:source.id,outputId:out.id,sceneSignature:source.sceneSignature,createdAt:out.at,ruleVersion:'stage-reference.png.v1',manual:false,promptSourceJson:JSON.stringify(source)}};onChange();workspace.handoff({id:crypto.randomUUID(),taskId,expected:handoffToken(workspace.get(),taskId),image:{ref,target:'append'}})}
 return <section className="creation-video-local" data-video-local-input><div className="m2-section-heading"><h2>摄影棚输入</h2><InfoButton title="影片本地输入与送出范围"><p>摄影棚提供姿势、位置关系、构图和拍摄角度参考；人物、产品、场景与风格素材补充外观和环境信息，各类素材互相补充。用途说明不保证模型完全遵循。</p><p>最多30张外观／内容参考图（reference_image），棚图与一般素材可组合，不固定首帧；首帧图是另一种用途，本轮不开放。摄影棚方式只控制棚图与已确认的补充文字，不影响一般素材。</p><p>启用图片合计最多30张、8MiB，超限须明确调整；不会自动删图、改写主提示词或加入用途指令。</p></InfoButton></div>
 {src&&<div className="creation-studio-reference"><button onClick={()=>setView(src)} aria-label="查看影片本地参考图"><img src={src} alt="影片摄影棚参考原图" width={84} height={72}/></button><span>{image?'已套回当前任务':'最新快照待套回'}<br/>{['B','C'].includes(mode)?'本次用作外观／内容参考，不固定首帧':'摄影棚图片本次不发送'}</span></div>}
 {newOutput&&out&&url&&<div className="creation-studio-reference"><button onClick={()=>setView(url)} aria-label="查看新拍摄快照"><img src={url} width={84} height={72} alt="新快照待采用，原参考图保持"/></button><span>新拍摄快照尚未采用；原选择保留。</span></div>}
 {(newOutput||!['B','C'].includes(mode))&&out&&url&&<button data-video-adopt-local onClick={adopt}>采用这张快照（核对替换）</button>}
 <label>摄影棚本次方式<select aria-label="影片本次输入方式" value={mode} onChange={e=>select(e.target.value as StudioMode)}><option value="BASE">不使用摄影棚</option><option value="B">只使用摄影棚图片</option><option value="A">只使用已确认的补充文字</option><option value="C">使用摄影棚图片及补充文字</option></select></label>
 {['A','C'].includes(mode)&&<label>摄影棚补充文字<textarea aria-label="影片摄影棚补充文字" value={d.supplement?.text||''} disabled={!d.supplement} onChange={e=>{if(!d.supplement)return;onChange();workspace.creationEdit(taskId,{supplement:{...d.supplement,text:e.target.value,manual:true,source:{...d.supplement.source,manual:true}}})}}/>{!d.supplement&&<span>请在摄影棚整理并明确套回文字。</span>}</label>}
 <p role={issue?'alert':'status'} data-video-local-status>{issue||(['A','C'].includes(mode)?'仅加入你确认的补充文字；主提示词保留。':'主提示词保留；图片按本次明确选择发送。')}</p>
 {d.supplement&&['BASE','B'].includes(mode)&&<details><summary>查看保留的补充稿</summary><pre>{d.supplement.text}</pre></details>}
 {(d.first||d.last)&&<details><summary>历史首尾帧（本轮不发送）</summary>{[d.first,d.last].filter(Boolean).map(r=><img key={r!.id} src={r!.src} width={100} alt={r!.name}/>)}</details>}
 {pending&&<Modal title="改用这张摄影棚参考图？" onClose={()=>setPending(null)}><p>确认后替换棚图；一般素材保持启用，原棚图与主提示词保留。{['A','C'].includes(pending.mode)?'本次同时加入刚确认的补充文字。':'本次不加入补充文字。'}</p><img src={d.refs.find(r=>r.id===pending.id)?.src} width={120} alt="将采用的新摄影棚参考图"/><div className="m2-modal-footer"><button onClick={()=>setPending(null)}>取消，保留原图片选择</button><button className="primary-button" onClick={usePending}>确认替换为这张摄影棚图</button></div></Modal>}
 {error&&<p role="alert">{error}</p>}{view&&<Modal title="摄影棚参考原图" onClose={()=>setView('')} wide><img className="creation-full-reference" src={view} alt="摄影棚参考原图"/></Modal>}
 <div data-video-order><div className="reference-order-heading"><h3>本次图片顺序（不固定首帧）</h3><InfoButton title="图片序号与使用方法"><p>可在主提示词使用 @图像1、@图像2 等序号说明意图，序号对应下方实际送出顺序。</p><p>排序不会自动改写提示词引用。调整顺序后，请核对文字中的序号；本地分类不会自动变成指令。</p></InfoButton></div><div className="reference-order-list">{effectiveVideoReferences(d,taskId).map((r,n,a)=><article key={r.id} className="reference-order-card"><img src={r.src} alt={'图像 '+(n+1)+' '+r.name}/><div className="reference-order-caption"><strong>图像 {n+1} · {r.name}</strong><small>{materialPurpose[isDirectStudio(r,taskId)?'studio':r.category]}</small></div><div className="reference-order-actions"><button type="button" disabled={n===0} aria-label={'送出上移 '+r.name} onClick={()=>reorder(n,-1)}><ArrowUp size={16} aria-hidden="true"/></button><button type="button" disabled={n===a.length-1} aria-label={'送出下移 '+r.name} onClick={()=>reorder(n,1)}><ArrowDown size={16} aria-hidden="true"/></button></div></article>)}</div></div>
 </section>
}

import { TaskUpdateHistory } from './TaskUpdateHistory'
import { createPortal } from 'react-dom'
import { Modal } from '../studio/Modal'
import type { RefImage } from '../studio/state'
import { useState } from 'react'
import type { CreativeTask } from '../management/state'
import type { Draft } from '../studio/state'
import { finalPrompt } from '../studio/stage-handoff-types'
import type { StoryboardSupplement } from './types'
import './storyboard.css'
export function TaskStoryboard({task,draft,onChange}:{task:CreativeTask;draft:Pick<Draft,'prompt'|'supplement'|'storyboardSupplement'>;onChange:(value:StoryboardSupplement|undefined)=>void}){
 const [removed,setRemoved]=useState<StoryboardSupplement>(),[message,setMessage]=useState(''),[error,setError]=useState(''),origin=task.storyboardSource,supplement=draft.storyboardSupplement
 async function copyFinal(){setMessage('');setError('');try{await navigator.clipboard.writeText(finalPrompt(draft));setMessage('已复制最终提示词。')}catch{setError('复制失败，请展开最终提示词预览手动选取复制。')}}
 if(!origin&&!supplement)return <TaskUpdateHistory taskId={task.id}/>
 return <><TaskUpdateHistory taskId={task.id}/><section className="sb-origin" aria-label="分镜来源与补充"><h2>分镜来源</h2>{origin&&<><p className="m2-helper" data-testid="storyboard-origin">来自镜头 {origin.shotId} · r{origin.shotRevision} · 快照 {origin.snapshotId}。来源独立保留，移除补充不会删除。</p><a className="m2-text-button" href={`#/storyboard?project=${origin.projectId}&board=${origin.storyboardId}`}>返回来源分镜</a></>}{supplement&&<><div className="m2-section-heading"><h2>分镜补充</h2><button type="button" className="m2-text-button" onClick={()=>{setRemoved(structuredClone(supplement));onChange(undefined);setMessage('已移除分镜补充；任务建立来源与确认快照保留。')}}>移除分镜补充</button></div><label className="m2-checkbox"><input type="checkbox" checked={supplement.enabled} onChange={e=>onChange({...supplement,enabled:e.target.checked})}/>使用分镜补充</label><label className="m2-field">任务分镜补充<textarea aria-label="任务分镜补充" value={supplement.text} onChange={e=>onChange({...supplement,text:e.target.value,manual:true})}/></label><p className="m2-helper">{supplement.manual?'已手改，保留原来源；未核验文字语义。':'依已填信息本地整理。'}不修改上方原文或摄影棚补充。</p></>}{removed&&!supplement&&<button type="button" className="m2-text-button" onClick={()=>{onChange(structuredClone(removed));setRemoved(undefined)}}>恢复分镜补充</button>}<div className="sb-origin-actions"><button type="button" className="m2-text-button" onClick={()=>void copyFinal()}>复制最终提示词</button></div>{message&&<p role="status" className="m2-helper">{message}</p>}{error&&<p role="alert" className="m2-errors">{error}</p>}</section></>
}

export function StoryboardRefImage({image}:{image:RefImage}){const [open,setOpen]=useState(false);return <><button type="button" className="task-handoff-thumb" aria-label={`放大分镜参考图 ${image.name}`} onClick={()=>setOpen(true)}><img src={image.src} width="54" height="48" alt={image.name}/></button>{open&&createPortal(<Modal title="分镜参考图快照" wide onClose={()=>setOpen(false)}><div className="task-handoff-zoom"><img src={image.src} alt={image.name}/><p>任务独立持有，仅本次会话；非 AI 生成。</p></div></Modal>,document.body)}</>}

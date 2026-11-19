import type { StoryboardSupplement } from '../storyboard/types'
import { useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { workspace } from '../management/store'
import { finalPrompt } from './stage-handoff-types'
import type { StageSupplement } from './stage-handoff-types'
import type { RefImage } from './state'
import { Modal } from './Modal'
import './handoff.css'
export function HandoffImage({image}:{image:RefImage}){const[zoom,setZoom]=useState(false);return <><button type="button" className="task-handoff-thumb" aria-label={`放大摄影棚参考图 ${image.name}`} onClick={()=>setZoom(true)}><img src={image.src} alt={`${image.name} ${image.view}`} width="54" height="48"/></button>{zoom&&createPortal(<Modal title="摄影棚构图参考图" onClose={()=>setZoom(false)} wide><div className="task-handoff-zoom"><img src={image.src} width="1024" height="1024" alt="任务持有的3D构图参考图，非AI生成"/><p>独立快照 · {image.stageSource?.outputId} · 仅本次页面工作阶段</p></div></Modal>,document.body)}</>}
export function TaskSupplement({taskId,prompt,supplement,storyboardSupplement,onChange}:{taskId:string;prompt:string;supplement?:StageSupplement;storyboardSupplement?:StoryboardSupplement;onChange:(value:StageSupplement|undefined)=>void}){
 const receipt=useSyncExternalStore(workspace.subscribe,()=>workspace.handoffReceipt(taskId)),[message,setMessage]=useState(''),[error,setError]=useState(''),[removed,setRemoved]=useState<StageSupplement>()
 return <section className="task-supplement" aria-label="摄影棚补充与最终提示词">
 {receipt&&<div className="task-handoff-notice" data-handoff-notice={taskId} tabIndex={-1}><p role="status">{receipt.undone?'本次套回已撤销。':`摄影棚成果已套回：${receipt.fields.map(f=>(({refs:'参考素材',first:'首帧',last:'尾帧',mode:'明确选择的模式',supplement:'摄影棚补充'} as Record<string,string>)[f]||f)).join('、')}。未开始生成；场景设置单独保存。`}</p>{!receipt.undone&&<button type="button" className="m2-text-button" onClick={()=>{try{workspace.undoHandoff(taskId);setMessage('仅还原本次修改字段，其他输入保持。');setError('')}catch(e){setError((e as Error).message)}}}>撤销本次套回</button>}</div>}
 {supplement&&<><div className="m2-section-heading"><h2>摄影棚补充</h2><button type="button" className="m2-text-button" onClick={()=>{setRemoved(structuredClone(supplement));onChange(undefined);setMessage('已移除任务补充，原提示词与摄影棚文字草稿保留；可立即恢复。')}}>移除补充</button></div><label className="m2-checkbox"><input type="checkbox" checked={supplement.enabled} onChange={e=>onChange({...supplement,enabled:e.target.checked})}/>使用摄影棚补充</label><label className="m2-field"><span className="sr-only">任务摄影棚补充</span><textarea name="task-stage-supplement" autoComplete="off" aria-label="任务摄影棚补充" value={supplement.text} onChange={e=>onChange({...supplement,text:e.target.value,manual:true,source:{...supplement.source,manual:true}})}/></label><p className="m2-helper">{supplement.manual||supplement.source.manual?'已手动编辑；保留原快照来源，未验证文字与图像语义。':'依场景设置整理。'}不改变上方原提示词。来源：{supplement.source.snapshotId}</p></>}
 {removed&&!supplement&&<button type="button" className="m2-text-button" onClick={()=>{onChange(structuredClone(removed));setRemoved(undefined);setMessage('已恢复刚移除的任务补充。')}}>恢复移除的补充</button>}
 <details className="task-final-prompt"><summary>最终提示词预览</summary><pre data-testid="final-prompt-preview">{finalPrompt({prompt,supplement,storyboardSupplement})||'尚未填写提示词。'}</pre><p className="m2-helper">{storyboardSupplement?'固定组合：原描述＋启用的分镜补充＋启用的摄影棚补充。':'固定组合：原描述＋启用的摄影棚补充。'}提交模拟生成时冻结相同文字；不调用API。</p></details>
 {message&&<p className="m2-helper" role="status">{message}</p>}{error&&<p className="m2-errors" role="alert">{error}</p>}
 </section>
}

import './stage-ui-r4.css'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import { pauseAllMedia } from '../management/AudioPreview'
import { Component, lazy, Suspense, useState } from 'react'
import { Box } from 'lucide-react'
import { Modal } from '../studio/Modal'
import {workspace} from '../management/store'
import {appliedSignature,sceneDrafts} from './draft-state'
import type {SceneDraft} from './draft-state'
import type {StageSettings} from './state'
const StageDialog = lazy(() => import('./StageDialog'))
class StageBoundary extends Component<{children:ReactNode;onClose:()=>void},{failed:boolean}> {
 state={failed:false}
 static getDerivedStateFromError(){return {failed:true}}
 render(){return this.state.failed?<Modal title="3D 摄影棚加载失败" onClose={this.props.onClose}><p role="alert">组件加载失败，已记录草稿保留；请返回重试。原任务不受影响。</p><button onClick={this.props.onClose}>返回创作</button></Modal>:this.props.children}
}
export function StageEntry({taskId,ratio,label='3D 摄影棚',className=''}:{taskId:string;ratio:string;label?:string;className?:string}) {
 const [open,setOpen]=useState(false),[choice,setChoice]=useState<SceneDraft|null>(null),[initial,setInitial]=useState<StageSettings|undefined>(undefined)
 const task=workspace.get().tasks.find(t=>t.id===taskId),conflict=!!choice&&(choice.projectId!==(task?.projectId||null)||choice.libraryId!==sceneDrafts.library()||choice.baseAppliedSignature!==appliedSignature(workspace.get().stages[taskId],ratio))
 function enter(){pauseAllMedia();const pending=sceneDrafts.get(taskId);setInitial(undefined);if(pending)setChoice(structuredClone(pending));else setOpen(true)}
 function close(){sceneDrafts.remove(taskId);setOpen(false)}
 return <><button type="button" className={className} data-stage-entry onClick={enter} aria-haspopup="dialog"><Box aria-hidden="true" size={22}/>{label}</button>{choice&&createPortal(<Modal className="ui-r4-stage-dialog ui-r4-recovery-dialog" title={conflict?'场景草稿基线冲突':'发现未套用场景草稿'} onClose={()=>setChoice(null)}><p className="m2-info-copy">草稿版本 {choice.revision} · {new Date(choice.updatedAt).toLocaleString()}。恢复只进入编辑，不自动套用、不生成。{conflict?'当前已套用场景与草稿基线不同；保留两者，不自动合并。以旧草稿编辑后，取消将返回当前已套用场景。':''}</p><p>舍弃只移除本次会话草稿；须再次保存工作资料，磁盘旧草稿才会移除。</p><div className="m2-modal-footer"><button className="secondary-button" onClick={()=>setChoice(null)}>暂不进入</button><button className="secondary-button" onClick={()=>{sceneDrafts.remove(taskId);setChoice(null);setOpen(true)}}>舍弃草稿，使用已套用场景</button><button className="primary-button" disabled={!task||choice.projectId!==(task.projectId||null)||choice.libraryId!==sceneDrafts.library()} onClick={()=>{setInitial(structuredClone(choice.scene));setChoice(null);setOpen(true)}}>{conflict?'仍以旧草稿继续编辑':'恢复草稿'}</button></div></Modal>,document.body)}{open&&createPortal(<StageBoundary onClose={()=>setOpen(false)}><Suspense fallback={<Modal title="3D 摄影棚" onClose={()=>setOpen(false)}><p role="status">正在加载 WebGL 摄影棚…</p></Modal>}><StageDialog key={taskId} taskId={taskId} ratio={ratio} initialScene={initial} onClose={close} onPreserveReturn={()=>setOpen(false)}/></Suspense></StageBoundary>,document.body)}</>
}

import {useState,useSyncExternalStore} from 'react'
import {Modal} from '../studio/Modal'
import {persistence} from './session'
export function ConfirmSave({disabled=false,dataKey,className='primary-button',label='保存工作库'}:{disabled?:boolean;dataKey?:'data-b-save'|'data-v-save';className?:string;label?:string}){
 const [open,setOpen]=useState(false),p=useSyncExternalStore(persistence.subscribe,persistence.get)
 const blocked=disabled||p.phase==='saving'||p.phase==='unknown'||!p.cap
 return <><button className={className} {...(dataKey?{[dataKey]:true}:{})} disabled={blocked} onClick={()=>setOpen(true)}>{label}</button>{open&&<Modal title="确认保存工作库" onClose={()=>setOpen(false)} className="wb-save-dialog"><div className="m4-form"><p>本次将提交当前工作库的<strong>全部未保存核心修改</strong>，包括已加入任务的图片、影片、文字和有效场景草稿。</p><p>未加入的候选不进入业务备份。Key 与执行授权独立保留，不写入业务备份。</p><p>这是保存工作库，不会生成新内容、查询平台或下载。当前已确认版本 r{p.revision}。</p></div><div className="m2-modal-footer"><button className="secondary-button" onClick={()=>setOpen(false)}>暂不保存</button><button className="primary-button" data-confirm-save data-trace-entry="confirm-save" disabled={blocked} onClick={e=>{setOpen(false);void persistence.save({entry:'confirm-save',origin:'ui',trustedEvent:e.nativeEvent.isTrusted})}}>确认保存工作库</button></div></Modal>}</>
}

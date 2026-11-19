import {modeLabel} from './mode-display'
import './workbench-fit.css'
import {useEffect,useRef,useState,useSyncExternalStore} from 'react'
import {ArrowLeft,FolderCog} from 'lucide-react'
import {TaskContext} from '../management/common'
import {Modal} from '../studio/Modal'
import {persistence} from '../persistence/session'
import {ConfirmSave} from '../persistence/ConfirmSave'
import {InfoButton} from '../ui/InfoButton'
import {useCreationDraft} from './useCreationDraft'
import '../studio/studio.css'
import '../studio/ui-r1.css'
import '../video/ui-r2.css'
import './workbench.css'
export function WorkbenchHeader({taskId,kind,qa,modeLoading=false}:{taskId:string;kind:'image'|'video';qa?:boolean;modeLoading?:boolean}){
 return <header className="creation-heading m2-page-heading"><div className="m2-page-title"><a className="m2-icon-button" href="#/" aria-label="返回首页"><ArrowLeft aria-hidden="true" size={20}/></a><h1 id={kind==='image'?'b-title':'seedance-title'} tabIndex={-1}>{kind==='image'?'图片':'影片'}创作</h1><span className="creation-qa" role="status" data-workbench-mode>{modeLabel(qa,modeLoading)}</span></div><TaskContext taskId={taskId} compact/><InfoButton title="创作流程"><p>主提示词：说明本次创作目标，以及希望如何使用这些素材。</p><p>各类素材互相补充；以上是使用指引，不保证模型完全遵循。</p><p>主提示词 → 素材／摄影棚 → 模型参数 → 预览确认生成。成果需明确加入当前任务，再手动保存工作库。</p><p>未支持的素材会保留并阻止不兼容请求。只有明确选择仅主提示词，才会排除这些素材。</p></InfoButton></header>
}
export function PromptConflict({bridge:b}:{bridge:ReturnType<typeof useCreationDraft>}){
 const [error,setError]=useState(''),retained=b.legacy?.creationInput?.retainedPrompts||[]
 const choose=(value:'current'|'legacy')=>{setError('');try{b.choose(value)}catch(e){setError((e as Error).message)}}
 return <>{b.conflict&&<div className="creation-conflict" role="alert"><h3>发现两份不同的主提示词</h3><p>请选择本次继续编辑的稿件；另一份会保留在旧稿详情中，不会生成。</p><label>当前生成稿<textarea readOnly value={b.draft?.prompt||''}/></label><label>原任务稿<textarea readOnly value={b.legacy?.prompt||''}/></label><div className="b-actions"><button onClick={()=>choose('current')}>继续使用当前生成稿</button><button onClick={()=>choose('legacy')}>继续使用原任务稿</button></div>{error&&<p role="alert">{error}</p>}</div>}{retained.length>0&&<details data-retained-prompts><summary>冲突处理中保留的旧稿</summary>{retained.map((text,i)=><pre key={i}>{text||'（空白稿）'}</pre>)}</details>}</>
}
export function useRegistrationRefresh(taskId:string,bound:boolean,refresh:()=>void){const p=useSyncExternalStore(persistence.subscribe,persistence.get),last=useRef({token:'',revision:0});useEffect(()=>{const token=p.cap+'|'+p.location+'|'+taskId,old=last.current;last.current={token,revision:p.revision};if(old.token===token&&p.revision>old.revision&&p.phase==='ready'&&!bound)refresh()},[taskId,p.cap,p.location,p.revision,p.phase,bound])}
export function RegisterTask({kind,taskId,binding,busy}:{kind:'image'|'video';taskId:string;binding:boolean;busy:boolean}){return <div className="creation-register" role="status" data-register-task><strong>{binding?'正在准备本地任务…':'此任务尚未登记'}</strong><p>生成前需先保存并登记。确认会提交全部未保存核心修改；确认成功后自动继续，无需再次核对。</p><ConfirmSave disabled={busy||binding} dataKey={kind==='image'?'data-b-save':'data-v-save'} label="保存并登记当前任务"/><InfoButton title="任务登记与保存"><p>当前任务的输入仍可编辑。生成权限必须绑定已保存任务；这里不会自动保存其他修改，仍须你明确确认整库保存。任务：{taskId}</p></InfoButton></div>}
export function CreationStatus({message}:{message:string}){if(!message)return null;const technical=/C_[A-Z0-9_]+|[a-f0-9]{8}-[a-f0-9-]{27}|已打开工作库：/.test(message);const clean=message.startsWith('已打开工作库：')?'工作库已打开。':message.replace(/[（(]C_[A-Z0-9_]+[）)]/g,'').replace(/C_[A-Z0-9_]+/g,'详情中有诊断记录');return <div className="creation-status"><p role="status">{clean}</p>{technical&&<details><summary>查看详情</summary><p>{message}</p></details>}</div>}
export function WorkbenchSave({kind,busy}:{kind:'image'|'video';busy:boolean}){
 const p=useSyncExternalStore(persistence.subscribe,persistence.get),[manage,setManage]=useState(false)
 return <footer className="creation-save"><div className="creation-save-actions"><ConfirmSave dataKey={kind==='image'?'data-b-save':'data-v-save'} disabled={busy}/><span role="status" data-creation-save-state>{p.phase==='unknown'?'保存状态待确认':p.generation!==p.savedGeneration?'有未保存修改':'已保存'}{p.revision?' · r'+p.revision:''}</span><span className="creation-save-note">整库保存会提交全部未保存修改</span><InfoButton title="保存与备份"><p>生成、加入任务与整库保存是三个独立动作。保存工作库会提交全部未保存核心修改。</p><p>工作库管理提供备份和恢复；备份只包含已保存版本，不包含Key、执行授权或未加入候选。</p></InfoButton>{p.phase==='unknown'&&<button onClick={()=>void persistence.resolve()}>核对上次保存</button>}<button data-library-management className="secondary-button creation-library-management" onClick={()=>setManage(true)}><FolderCog aria-hidden="true" size={20}/>工作库管理</button></div><CreationStatus message={p.error.startsWith('已打开工作库：')?'':p.error}/>{manage&&<Modal title="工作库管理" className="creation-management-dialog" onClose={()=>setManage(false)}><div className="m4-form"><p>备份保存过的版本，或将备份恢复到新工作库。未保存修改不会自动写入备份。</p><button data-creation-backup disabled={busy||p.phase==='saving'||p.phase==='unknown'||!p.revision} onClick={()=>void persistence.backup()}>备份已保存版本</button><button data-creation-restore disabled={busy||p.phase==='saving'||p.phase==='unknown'||!p.lastBackup} onClick={()=>{setManage(false);location.hash='#/settings';void persistence.restore()}}>恢复到新工作库</button><a className="secondary-button" href="#/settings" onClick={()=>setManage(false)}>查看保存位置与工作库设置</a><CreationStatus message={p.error}/></div></Modal>}</footer>
}

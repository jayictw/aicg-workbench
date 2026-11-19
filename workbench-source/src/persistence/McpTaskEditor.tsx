import {WorkbenchHeader,PromptConflict,WorkbenchSave} from '../creation/WorkbenchChrome'
import {useCreationDraft} from '../creation/useCreationDraft'
import {InfoButton} from '../ui/InfoButton'
export function McpTaskEditor({taskId,kind}:{taskId:string;kind:'image'|'video'}){
 const b=useCreationDraft(taskId,kind,true)
 return <section className="creation-workbench"><WorkbenchHeader taskId={taskId} kind={kind} qa={true}/><div className="m4-form"><div className="mcp-proposal-intro"><h2>任务输入</h2><InfoButton title="QA 任务输入"><p>此入口只编辑本轮合成 QA 任务，不连接生成服务。修改与 Agent 提案使用同一业务命令入口，仍需手动保存整库。</p></InfoButton></div><PromptConflict bridge={b}/>{b.legacy?<label className="m2-field">主提示词<textarea aria-label="主提示词" maxLength={4000} rows={8} value={b.draft?.prompt||''} disabled={b.conflict} onChange={e=>b.edit(e.target.value)}/></label>:<p>此历史任务没有可编辑的主提示词输入，不补造字段。</p>}</div><WorkbenchSave kind={kind} busy={false}/></section>
}

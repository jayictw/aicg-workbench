import type {PromptDraft} from './scene-prompt-state.ts'
import {stageWork} from './work-state.ts'
let project:(id:string)=>string|null=id=>stageWork.get(id)?.projectId||null
export const promptSession={configure:(resolver:(id:string)=>string|null)=>{project=resolver},subscribe:stageWork.subscribe,get:(id:string)=>stageWork.get(id)?.prompt||undefined,selected:(id:string)=>stageWork.get(id)?.selectedSource,
 write(id:string,draft:PromptDraft){if(draft.source.task.id!==id)throw Error('文字来源任务不匹配。');stageWork.update(id,project(id),{prompt:structuredClone(draft)})},
 select(id:string,kind:'draft'|'output'){stageWork.update(id,project(id),{selectedSource:kind})},remove:stageWork.removePrompt,
 ack(id:string){const d=this.get(id);if(d)this.write(id,{...d,unacknowledged:false})}}

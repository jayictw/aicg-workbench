import {useEffect,useSyncExternalStore} from 'react'
import {generated} from '../generated/store'
import {workspace} from '../management/store'
import {emptyCreationDraft,initialCreation,keepOther,promptDecision} from './input-state'
import type {TaskKind} from '../management/state'
export function useCreationDraft(taskId:string,kind:TaskKind,passiveView=false){
 const w=useSyncExternalStore(workspace.subscribe,workspace.get),g=useSyncExternalStore(generated.subscribe,generated.get)
 const legacy=(kind==='image'?w.images[taskId]:w.videos[taskId])?.draft,draft=g.drafts.find(d=>d.taskId===taskId)
 const originalDecision=promptDecision(draft,legacy?.prompt||'')
 const decision=passiveView&&originalDecision.kind==='mirror'?{...originalDecision,kind:'conflict' as const}:originalDecision
 useEffect(()=>{if(passiveView||!legacy)return;if(decision.kind==='initialize')generated.putDraft(emptyCreationDraft(taskId,kind,decision.prompt));else if(decision.kind==='mirror')workspace.creationEdit(taskId,{prompt:decision.prompt})},[taskId,kind,draft?.prompt,legacy?.prompt,passiveView])
 function edit(prompt:string){if(!legacy||decision.kind==='conflict')return;workspace.creationEdit(taskId,{prompt})}
 function choose(choice:'current'|'legacy'){if(!legacy||!draft||decision.kind!=='conflict')return;const prompt=choice==='current'?draft.prompt:legacy.prompt,other=choice==='current'?legacy.prompt:draft.prompt;const creationInput=keepOther(legacy.creationInput||initialCreation(),other);workspace.creationEdit(taskId,{prompt,creationInput})}
 return {draft:draft||(passiveView&&legacy?emptyCreationDraft(taskId,kind,legacy.prompt):undefined),legacy,conflict:decision.kind==='conflict',edit,choose}
}

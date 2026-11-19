import { effectiveFieldOrigins } from '../storyboard/update-state.ts'
import { videoApply, videoEdit, videoFavorite, videoRetry, videoSubmit, videoTransfer } from './state.ts'
import type { VideoDraft, VideoSnapshot } from './state.ts'
import type { RefImage } from '../studio/state.ts'
import { workspace } from '../management/store.ts'
import { submissionContext } from '../management/state.ts'
import { immutable } from '../studio/simulation.ts'
export function createVideoStore(id:string){return {
 get:()=>workspace.get().videos[id], subscribe:workspace.subscribe,
 edit:(patch:Partial<VideoDraft>)=>workspace.video(id,s=>videoEdit(s,patch)),
 submit:()=>{let accepted=false;workspace.video(id,s=>{const next=videoSubmit(s,`视频批次 ${String(s.batches.length+1).padStart(2,'0')}`,Date.now());if(next===s)return s;accepted=true;return {...next,batches:[{...next.batches[0],storyboardFieldOrigins:immutable(effectiveFieldOrigins(workspace.get(),id)),context:immutable(submissionContext(workspace.get(),id)),...(workspace.get().tasks.find(t=>t.id===id)?.storyboardSnapshot?{storyboardOrigin:immutable(workspace.get().tasks.find(t=>t.id===id)!.storyboardSnapshot!)}:{})},...next.batches.slice(1)]}});return accepted},
 retry:(batch:string,task?:string)=>workspace.video(id,s=>videoRetry(s,batch,task,Date.now())),
 favorite:(task:string)=>workspace.video(id,s=>videoFavorite(s,task)),
 apply:(snapshot:Readonly<VideoSnapshot>)=>workspace.video(id,s=>videoApply(s,snapshot)),
 transfer:(image:RefImage)=>workspace.video(id,s=>videoTransfer(s,image)),
}}

import type { Batch, StudioState } from './state'
import { immutable } from './simulation'
export const FLASH_MODEL='doubao-seedream-5-0-flash-260915'
export const isFlash=(batch:Batch)=>batch.id.startsWith('flash-offline-')
export function appendFlash(state:StudioState,input:{id:string;prompt:string;src:string;taskId:string;taskName:string;projectId:string|null;projectName:string},now:number):StudioState{
 if(!input.id.startsWith('flash-offline-')||!input.prompt.trim()||!input.src.startsWith('data:image/png;base64,'))throw Error('离线Flash候选无效')
 if(state.batches.some(b=>b.id===input.id))return state
 const batch:Batch={id:input.id,createdAt:now,finalPrompt:input.prompt,context:immutable({taskId:input.taskId,taskName:input.taskName,projectId:input.projectId,projectName:input.projectName}),snapshot:immutable({prompt:input.prompt,refs:[],model:'seedream',compare:false,compareModels:[],ratio:'1:1',resolution:'1024x1024',count:1,scenario:'success'}),tasks:[{id:input.id+'-image',model:'seedream',index:0,status:'completed',attempt:1,startedAt:now,willFail:false,favorite:false,src:input.src}]}
 return {...state,batches:[batch,...state.batches]}
}

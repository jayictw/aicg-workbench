import type {StudioMode} from '../generated/daily-input.ts'
import type {Draft1,Target1,Param1} from '../generated/types.ts'
import type {VideoDraft} from '../video/state.ts'
export type CreationInput={version:1;referenceUse:'selected'|'retained';studioMode?:StudioMode;studioReferenceId?:string;videoOrder?:string[];observedHandoffId?:string;configurationId?:string;retainedPrompts:string[]}
export const initialCreation=():CreationInput=>({version:1,referenceUse:'selected',retainedPrompts:[]})
export const studioAdoptionMode=(c:CreationInput|undefined):StudioMode=>c?.studioMode||'B'
export function promptDecision(current:Draft1|undefined,legacy:string){
 if(!current)return {kind:'initialize' as const,prompt:legacy}
 if(current.prompt===legacy)return {kind:'same' as const,prompt:current.prompt}
 if(!legacy)return {kind:'mirror' as const,prompt:current.prompt}
 return {kind:'conflict' as const,prompt:current.prompt}
}
export function keepOther(c:CreationInput|undefined,other:string):CreationInput{const a=c||initialCreation();if(a.retainedPrompts.includes(other))return a;if(a.retainedPrompts.length>=16)throw Error('旧稿保留区已满；两份稿件保持，未覆盖。');return {...a,retainedPrompts:[...a.retainedPrompts,other]}}
export const emptyCreationDraft=(taskId:string,kind:'image'|'video',prompt=''):Draft1=>({taskId,prompt,target:null,operation:kind==='image'?'text-to-image':'text-to-video',inputs:[],retained:[],parameters:[],outputCount:null})
export function targetDraft(d:Draft1,target:Target1,parameters:Param1[]):Draft1{return {...d,target,parameters:structuredClone(parameters),outputCount:1}}
export const unsupportedGeneratedVideo=(d:Draft1|undefined)=>!!d&&(d.operation!=='text-to-video'||d.inputs.length>0||d.retained.length>0)
export function videoLocalMode(d:VideoDraft,generated?:Draft1):StudioMode{if(d.creationInput?.studioMode)return d.creationInput.studioMode;const image=!!d.first||!!d.last||d.mode!=='text'||unsupportedGeneratedVideo(generated)||!!d.refs.some(r=>!!r.stageSource&&(!generated||r.stageSource.taskId===generated.taskId)&&!r.assetId),text=!!d.supplement?.enabled;return image&&text?'C':image?'B':text?'A':'BASE'}
export const videoLocalBlocked=(d:VideoDraft,generated?:Draft1)=>videoLocalMode(d,generated)!=='BASE'

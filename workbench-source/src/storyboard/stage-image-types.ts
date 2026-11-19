import type { RefImage } from '../studio/state.ts'
export type HeldSlot = 'refs'|'first'|'last'
export type StageSelection = { version:1; instanceId:string; projectId:string; holderTaskId:string; holderTaskName:string; holderKind:'image'|'video'; holderSlot:HeldSlot;holderRetained?:boolean; holderRefId:string; selectedAt:number; width:number; height:number; pngSha256:string; sourceVersion:string; upstreamSelection?:StageSelection }
export type StageCandidate = { key:string; projectId:string; taskId:string; taskName:string; kind:'image'|'video'; slot:HeldSlot; retained?:boolean; ref:RefImage; width:number; height:number; token:string }
export type StagePickRequest = { id:string; boardId:string; shotId:string; projectId:string; candidateKey:string; expectedSource:string; expectedBoard:string; target:'append'|'replace'; replaceId?:string; replaceConfirmed:boolean }
export type PreparedStageImage = { sourceToken:string; src:string; width:number; height:number; pngSha256:string; sourceVersion:string }
export type StagePickReceipt = { id:string; boardId:string; shotId:string; resultRefId:string; digest:string; at:number }

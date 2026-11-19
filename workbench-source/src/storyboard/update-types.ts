import type { StoryboardSource, PromptInput, Shot } from './types.ts'
export type TaskLink = { id:string; boardId:string; shotId:string; taskId:string; at:number }
export type MediaUpdate = { sourceId:string; target:'append'|'replace'|'first'|'last'; replaceId?:string }
export type UpdateRequest = { kind:'update'; id:string; boardId:string; shotId:string; taskId:string; expectedSource:string; expectedTarget:string; prompt:boolean; supplement:boolean; media:MediaUpdate[]; allowStale:boolean }
export type FieldOrigin = { receiptId:string; source:StoryboardSource; field:string; sourceRefId?:string; valueSignature:string }
export type FieldOrigins = Record<string,FieldOrigin>
export type FieldChange = { field:string; before:unknown; after:unknown; beforeOrigin?:FieldOrigin; afterOrigin:FieldOrigin }
export type UpdateSource = { source:StoryboardSource; shot:Shot; currentInput:PromptInput; supplementInput?:PromptInput; currentFingerprint:string; supplementFingerprint?:string; keptStale:boolean }
export type UpdateReceipt = { id:string; taskId:string; at:number; digest:string; source:UpdateSource; changes:FieldChange[]; unchanged:string[]; undone?:boolean; undoneAt?:number }

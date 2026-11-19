import type { VideoMode, VideoModel } from '../video/mock.ts'
import type { VideoSnapshot } from '../video/state.ts'
import type { RefImage, ModelId } from '../studio/state.ts'
export type Section = { id:string; label:string; generated:string; text:string; enabled:boolean; manual:boolean }
export type PromptInput = { brief:{purpose:string; original:string; style:string}; visual:string; freeze:string; subject:string; scene:string; size:string; angle:string; resources:unknown[]; motion?:{action:string; camera:string; start:string; end:string} }
export type PromptDraft = { ruleVersion:'storyboard.zh.v1'|'storyboard.video.zh.v1'; fingerprint:string; input:PromptInput; sections:Section[]; at:number }
export type Shot = { id:string; revision:number; title:string; visual:string; freeze:string; subject:string; scene:string; size:string; angle:string; duration:string; refs:RefImage[]; prompt?:PromptDraft; video?:VideoPlan }
export type BoardContent = { name:string; brief:{purpose:string; original:string; style:string; ratio:string; duration:string}; shots:Shot[] }
export type Board = BoardContent & { version:1; id:string; projectId:string; revision:number; createdAt:number; updatedAt:number; undo?:{shot:Shot; index:number}; templateUndo?:BoardContent }
export type StoryboardSource = { version:1; projectId:string; storyboardId:string; shotId:string; shotRevision:number; snapshotId:string; handoffId:string; createdAt:number; ruleVersion:string; manual:boolean }
export type StoryboardSupplement = { text:string; enabled:boolean; manual:boolean; source:StoryboardSource }
export type ShotSnapshot = { taskKind?:'image'|'video'; video?:{execution:VideoExecution; effective:VideoSnapshot['effective']; retained:VideoSnapshot['retained']}; version:1; source:StoryboardSource; boardName:string; brief:Board['brief']; shot:Shot; currentPromptInput:PromptInput; supplementInput:PromptInput; supplementFingerprint:string; currentFingerprint:string; keptStale:boolean; plannedRatio:string; executionRatio:string; originalText:string; supplementText:string; finalPrompt:string; media:RefImage[] }
export type StoryboardReceipt = { id:string; taskId:string; digest:string; snapshot:ShotSnapshot }
export type CreateRequest = { id:string; boardId:string; shotId:string; expected:string; name:string; model:ModelId; ratio:string; allowStale:boolean }

export type VideoExecution = { mode:VideoMode; model:VideoModel; ratio:string; duration:number; resolution:string; count:number; firstId:string|null; lastId:string|null; refIds:string[] }
export type VideoPlan = { action:string; camera:string; start:string; end:string; dialogue:string; subtitles:string; sound:string; execution:VideoExecution; prompt?:PromptDraft }
export type VideoCreateRequest = { kind:'video'; id:string; boardId:string; shotId:string; expected:string; name:string; execution:VideoExecution; allowStale:boolean }

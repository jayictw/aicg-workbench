import type {CreationInput} from '../creation/input-state.ts'
import type { FieldOrigins } from '../storyboard/update-types.ts'
import type { StoryboardSource, StoryboardSupplement, ShotSnapshot } from '../storyboard/types.ts'
import { finalPrompt } from '../studio/stage-handoff-types.ts'
import type { StageSupplement } from '../studio/stage-handoff-types.ts'
import { characterCount } from '../studio/state.ts'
import type { RefImage } from '../studio/state.ts'
import { advance, immutable, retry, taskGroupStatus } from '../studio/simulation.ts'
import type { SimTask } from '../studio/simulation.ts'
import { modeLabels, sampleVideo, videoMock, videoModels } from './mock.ts'
import type { VideoMode, VideoModel } from './mock.ts'
export type VideoDraft = { creationInput?:CreationInput; storyboardSource?:StoryboardSource; storyboardSupplement?:StoryboardSupplement; supplement?: StageSupplement; mode: VideoMode; prompt: string; first: RefImage | null; last: RefImage | null; refs: RefImage[]; model: VideoModel; compare: boolean; compareModels: VideoModel[]; ratio: string; duration: number; resolution: string; count: number; scenario: 'success' | 'partial' | 'failure' }
export type VideoSnapshot = { input: VideoDraft; effective: { first: RefImage | null; last: RefImage | null; refs: RefImage[] }; retained: { first: RefImage | null; last: RefImage | null } }
export type VideoTask = SimTask & { id: string; model: VideoModel; index: number; favorite: boolean; src: string }
export type VideoBatch = { storyboardFieldOrigins?:FieldOrigins; storyboardOrigin?:ShotSnapshot; finalPrompt?: string; id: string; createdAt: number; snapshot: Readonly<VideoSnapshot>; context?: Readonly<{ taskId: string; taskName: string; projectId: string | null; projectName: string }>; tasks: VideoTask[] }
export type VideoState = { draft: VideoDraft; baseline: string; batches: VideoBatch[] }
export type VideoIssue = { field: string; message: string }
export const videoInitial = (): VideoDraft => ({ mode: 'text', prompt: '', first: null, last: null, refs: [], model: 'veo', compare: false, compareModels: [], ratio: '16:9', duration: 4, resolution: '360p', count: 2, scenario: 'partial' })
export const videoFingerprint = (d: Readonly<VideoDraft>) => JSON.stringify(d)
export const videoSelected = (d: Readonly<VideoDraft>): VideoModel[] => [...new Set([d.model, ...(d.compare ? d.compareModels : [])])]
export function videoInputs(d: VideoDraft) {
  return { effective: { first: d.mode !== 'text' ? d.first : null, last: d.mode === 'frames' ? d.last : null, refs: d.refs }, retained: { first: d.mode === 'text' ? d.first : null, last: d.mode !== 'frames' ? d.last : null } }
}
export function videoIssues(d: VideoDraft): VideoIssue[] {
  const issues: VideoIssue[] = []
  const add = (field: string, message: string) => issues.push({ field, message })
  if (!finalPrompt(d).trim()) add('video-prompt', '请填写完整提示词。')
  if (d.mode !== 'text' && !d.first) add('video-first', '当前模式需要首帧，请选择一张图片。')
  if (d.mode === 'frames' && !d.last) add('video-last', '首尾帧模式需要尾帧，请选择一张图片。')
  if (d.compare && videoSelected(d).length < 2) add('video-comparison', '多模型比较请再选择一个模型。')
  for (const model of videoSelected(d)) {
    const c = videoMock[model], prefix = `${videoModels[model]}（${c.profile}，模拟规则）`
    if (!(c.modes as string[]).includes(d.mode)) add('video-mode', `${prefix} 不兼容${modeLabels[d.mode]}，请调整模式或模型。`)
    if (!c.ratios.includes(d.ratio)) add('video-ratio', `${prefix} 不兼容比例 ${d.ratio}，请手动调整。`)
    if (!c.durations.includes(d.duration)) add('video-duration', `${prefix} 不兼容模拟时长 ${d.duration} 秒，请手动调整。`)
    if (!c.resolutions.includes(d.resolution)) add('video-resolution', `${prefix} 不兼容模拟分辨率 ${d.resolution}，请手动调整。`)
    if (!Number.isInteger(d.count) || d.count < 1 || d.count > c.maxCount) add('video-count', `${prefix} 每模型演示 1–${c.maxCount} 段，请调整数量。`)
    if (d.refs.length > c.maxRefs) add('video-refs', `${prefix} 最多演示 ${c.maxRefs} 张参考图，当前 ${d.refs.length} 张；首尾帧另计。`)
    if (characterCount(d.refs) > c.maxCharacters) add('video-refs', `${prefix} 最多演示 ${c.maxCharacters} 个角色，当前 ${characterCount(d.refs)} 个。`)
  }
  return issues
}
export function videoCreate(): VideoState { const draft = videoInitial(); return { draft, baseline: videoFingerprint(draft), batches: [] } }
export function videoEdit(s: VideoState, patch: Partial<VideoDraft>): VideoState { return { ...s, draft: { ...s.draft, ...patch } } }
export function videoPending(s: VideoState): boolean { return s.batches.some(b => b.tasks.some(t => t.status === 'queued' || t.status === 'running') && videoFingerprint(b.snapshot.input) === videoFingerprint(s.draft)) }
export function videoSubmit(s: VideoState, id: string, now: number): VideoState {
  if (videoPending(s)) return s
  const issues = videoIssues(s.draft); if (issues.length) throw new Error(issues.map(i => i.message).join(' '))
  const snapshot = immutable({ input: s.draft, ...videoInputs(s.draft) })
  const tasks = videoSelected(s.draft).flatMap(model => Array.from({ length: s.draft.count }, (_, index): VideoTask => ({ id: `${id}-${model}-${index}`, model, index, favorite: false, src: sampleVideo.src, status: 'queued', attempt: 1, startedAt: now, willFail: s.draft.scenario === 'failure' || s.draft.scenario === 'partial' && index % 2 === 1 })))
  return { ...s, batches: [{ id, createdAt: now, snapshot, finalPrompt: finalPrompt(snapshot.input), tasks }, ...s.batches] }
}
export function videoTick(s: VideoState, now: number): VideoState {
  let changed = false
  const batches = s.batches.map(b => ({ ...b, tasks: b.tasks.map(t => { const next = advance(t, now); if (next !== t) changed = true; return next }) }))
  return changed ? { ...s, batches } : s
}
export function videoRetry(s: VideoState, batchId: string, taskId: string | undefined, now: number): VideoState { return { ...s, batches: s.batches.map(b => b.id !== batchId ? b : { ...b, tasks: b.tasks.map(t => !taskId || t.id === taskId ? retry(t, now) : t) }) } }
export function videoFavorite(s: VideoState, taskId: string): VideoState { return { ...s, batches: s.batches.map(b => ({ ...b, tasks: b.tasks.map(t => t.id === taskId && t.status === 'completed' ? { ...t, favorite: !t.favorite } : t) })) } }
export function videoApply(s: VideoState, snapshot: Readonly<VideoSnapshot>): VideoState { const draft = structuredClone(snapshot.input); return { ...s, draft, baseline: videoFingerprint(draft) } }
export const videoBatchStatus = (b: VideoBatch) => taskGroupStatus(b.tasks)
export const videoNeedsTransferConfirm = (s: VideoState) => videoFingerprint(s.draft) !== videoFingerprint(videoInitial())
// Transfers only the requested frame and mode. Neither studio's tasks are touched.
export const videoTransfer = (s: VideoState, image: RefImage): VideoState => videoEdit(s, { first: structuredClone(image), mode: 'first' })

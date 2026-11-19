import { BatchFieldOrigins } from '../storyboard/TaskUpdateHistory'
import { TaskStoryboard, StoryboardRefImage } from '../storyboard/TaskStoryboard'
import { workspace } from '../management/store'
import { HandoffImage, TaskSupplement } from '../studio/TaskSupplement'
import { StageEntry } from '../stage3d/StageEntry'
import { TaskContext } from '../management/common'
import { AddReferenceToLibrary, AddResultToLibrary } from '../management/AddToLibrary'
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { DragEvent } from 'react'
import { ArrowLeft, ArrowLeftRight, ArrowRight, Check, ChevronDown, Clapperboard, Columns2, Heart, Info, Layers3, Maximize2, Plus, RefreshCw, RotateCcw, Sparkles, Upload, X } from 'lucide-react'
import { AssetPicker } from '../studio/AssetPicker'
import { Modal } from '../studio/Modal'
import { categories, characterCount } from '../studio/state'
import type { Category, RefImage } from '../studio/state'
import { decodeLocalImage } from './local-image'
import { modeLabels, sampleVideo, videoMock, videoModels } from './mock'
import type { VideoMode, VideoModel } from './mock'
import { videoBatchStatus, videoFingerprint, videoIssues, videoPending, videoSelected } from './state'
import type { VideoBatch, VideoDraft, VideoSnapshot, VideoTask } from './state'
import { createVideoStore } from './store'
import { pauseStudioVideos, VideoPlayer } from './VideoPlayer'
import '../studio/studio.css'
import './video.css'
import '../studio/ui-r1.css'
import './ui-r2.css'

type Slot = 'first' | 'last'
type Target = { kind: 'frame'; slot: Slot } | { kind: 'reference'; category: Category; replaceId?: string }
type Overlay = { kind: 'add' | 'library'; target: Target } | { kind: 'frame'; image: RefImage; label: string } | { kind: 'play'; task: VideoTask; batch: VideoBatch } | { kind: 'detail'; batch: VideoBatch } | { kind: 'compare' } | { kind: 'apply'; snapshot: Readonly<VideoSnapshot> } | { kind: 'info'; title: string }
const slotLabels = { first: '首帧', last: '尾帧' }
const statusLabels = { queued: '排队中', running: '生成中', completed: '完成', failed: '失败', interrupted: '已中断 · 请主动新建模拟' }
const targetLabel = (t: Target) => t.kind === 'frame' ? `视频${slotLabels[t.slot]}（单张）` : `视频${categories.find(c => c.id === t.category)?.label}参考${t.replaceId ? '替换（单张）' : ''}`
function SampleFacts({ input }: { input: VideoDraft }) {
  const mismatch = input.ratio !== sampleVideo.ratio || input.duration !== sampleVideo.duration || input.resolution !== '360p'
  return <p className="v3-sample-facts">示例影片，非 AI 生成。实测 4.0 秒 · 640×360 · 16:9 · 测试图形与合成音。{mismatch && <strong> 示例规格与任务设定不同；未按设定生成。</strong>}所有成功项播放同一本地示例，不代表模型效果。</p>
}
function VideoDetails({ batch }: { batch: VideoBatch }) {
  const { input: d, effective, retained } = batch.snapshot
  const images = [...(effective.first ? [{ image: effective.first, label: '有效首帧' }] : []), ...(effective.last ? [{ image: effective.last, label: '有效尾帧' }] : []), ...effective.refs.map(image => ({ image, label: '参考图' })), ...(retained.first ? [{ image: retained.first, label: '首帧：已保留，本次不使用' }] : []), ...(retained.last ? [{ image: retained.last, label: '尾帧：已保留，本次不使用' }] : [])]
  return <div className="m2-snapshot"><p className="m2-notice">提交时的不可变快照。查看不会修改当前输入。</p>{batch.context && <p className="m2-notice">提交任务：{batch.context.projectName} / {batch.context.taskName} · ID {batch.context.taskId}</p>}{batch.storyboardOrigin&&<><h3>分镜来源快照</h3><p data-testid="batch-storyboard-origin">{batch.storyboardOrigin.source.snapshotId} · 规划 {batch.storyboardOrigin.plannedRatio} / 实际 {d.ratio} · 计划时长 {batch.storyboardOrigin.shot.duration||'未填'} / 实际Mock {d.duration}s</p></>}<BatchFieldOrigins origins={batch.storyboardFieldOrigins}/><h3>当时的完整提示词</h3><pre>{d.prompt}</pre>{batch.finalPrompt!==undefined&&<><h3>当时的最终提示词</h3><pre data-testid="snapshot-final-prompt">{batch.finalPrompt}</pre></>}<dl><dt>模式</dt><dd>{modeLabels[d.mode]}</dd><dt>模型标签</dt><dd>{videoSelected(d).map(m => `${videoModels[m]} · ${videoMock[m].profile}`).join(' / ')}（待接入，非官方能力）</dd><dt>模拟参数</dt><dd>{d.ratio} · {d.duration} 秒 · {d.resolution} · 每模型 {d.count} 段</dd><dt>有效输入</dt><dd>{effective.first ? '含首帧' : '无首帧'} / {effective.last ? '含尾帧' : '无尾帧'} / {characterCount(effective.refs)} 个角色 · {effective.refs.length} 张参考图</dd><dt>保留未使用</dt><dd>{[retained.first && '首帧', retained.last && '尾帧'].filter(Boolean).join('、') || '无'}</dd><dt>示例流程</dt><dd>{{ success: '全部完成', partial: '部分失败', failure: '全部失败' }[d.scenario]}</dd></dl><div className="m2-snapshot-refs">{images.map(({ image, label }, index) => <figure key={`${image.id}-${index}`}><img src={image.src} alt={`${label} ${image.name}`} width="100" height="70" /><figcaption>{label} · {image.name} · {image.view}</figcaption></figure>)}</div><SampleFacts input={d} /></div>
}
export default function VideoStudio({ taskId }: { taskId: string }) {
  const videoStudio = useMemo(() => createVideoStore(taskId), [taskId])
  const state = useSyncExternalStore(videoStudio.subscribe, videoStudio.get)
  const { draft, batches } = state
  const [overlay, setOverlay] = useState<Overlay | null>(null)
  const [message, setMessage] = useState('')
  const [dragTarget, setDragTarget] = useState('')
  const [comparison, setComparison] = useState<string[]>([])
  const [attempted, setAttempted] = useState(false)
  const [decoding, setDecoding] = useState(0)
  const fileInput = useRef<HTMLInputElement>(null), promptRef = useRef<HTMLTextAreaElement>(null), errorsRef = useRef<HTMLDivElement>(null)
  const uploadTarget = useRef<Target | null>(null)
  const revisions = useRef<Record<string, number>>({})
  const mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; pauseStudioVideos() } }, [])
  useEffect(() => { if (overlay) pauseStudioVideos() }, [overlay])
  const issues = videoIssues(draft), visibleIssues = issues.filter(i => attempted || !i.message.startsWith('请填写') && !i.message.startsWith('当前模式需要') && !i.message.startsWith('首尾帧模式需要'))
  const pending = videoPending(state)
  const completed = batches.flatMap(batch => batch.tasks.filter(t => t.status === 'completed').map(task => ({ batch, task })))
  const compared = comparison.map(id => completed.find(c => c.task.id === id)).filter(c => c !== undefined)
  const close = () => { pauseStudioVideos(); setOverlay(null) }
  const keyFor = (t: Target) => t.kind === 'frame' ? t.slot : t.replaceId || `refs-${t.category}`
  const invalidate = (key: string) => { revisions.current[key] = (revisions.current[key] || 0) + 1; return revisions.current[key] }
  function applyImages(target: Target, images: RefImage[], fromLibrary = false) {
    const current = videoStudio.get().draft
    invalidate(keyFor(target))
    if (target.kind === 'frame') videoStudio.edit({ [target.slot]: images[0] })
    else if (target.replaceId) {
      if (!current.refs.some(r => r.id === target.replaceId)) return
      videoStudio.edit({ refs: current.refs.map(r => r.id === target.replaceId ? { ...images[0], category: target.category } : r) })
    } else videoStudio.edit({ refs: fromLibrary ? images : [...current.refs, ...images] })
  }
  function upload(target: Target) { uploadTarget.current = target; if (fileInput.current) { fileInput.current.multiple = target.kind === 'reference' && !target.replaceId; fileInput.current.value = ''; fileInput.current.click() } }
  async function addFiles(files: File[], target: Target) {
    if (!files.length) return
    if ((target.kind === 'frame' || target.replaceId) && files.length !== 1) { setMessage('此目标只接受一张图片，原有图片已保留。'); return }
    const key = keyFor(target), revision = invalidate(key)
    const old = target.kind === 'reference' ? videoStudio.get().draft.refs.find(r => r.id === target.replaceId) : null
    const entityId = old?.entityId || `video-local-${crypto.randomUUID()}`
    setDecoding(n => n + 1); setMessage(`正在本地校验${targetLabel(target)}图片…`)
    const results = await Promise.allSettled(files.map(f => decodeLocalImage(f, target.kind === 'frame' ? 'scene' : target.category, entityId)))
    if (!mounted.current) return
    setDecoding(n => n - 1)
    if (revisions.current[key] !== revision) { setMessage('该目标已有更新，未套用较早的文件选择。'); return }
    const valid = results.flatMap(r => r.status === 'fulfilled' ? [r.value] : [])
    const errors = results.flatMap(r => r.status === 'rejected' ? [String(r.reason.message)] : [])
    if (valid.length) applyImages(target, valid)
    setMessage(errors.length ? errors.join(' ') : `已添加${targetLabel(target)}，仅在本地浏览器预览，不上传。`)
  }
  function drop(event: DragEvent<HTMLElement>, target: Target) { event.preventDefault(); setDragTarget(''); void addFiles(Array.from(event.dataTransfer.files), target) }
  function requestApply(snapshot: Readonly<VideoSnapshot>) {
    if (videoFingerprint(draft) === videoFingerprint(snapshot.input)) { setMessage('当前输入与该快照一致，未作修改。'); close(); return }
    if (videoFingerprint(draft) !== state.baseline) setOverlay({ kind: 'apply', snapshot })
    else { videoStudio.apply(snapshot); close(); setMessage('已套用设置；没有提交新任务。') }
  }
  function toggleCompare(id: string) { if (comparison.includes(id)) setComparison(comparison.filter(v => v !== id)); else if (comparison.length < 2) setComparison([...comparison, id]); else setMessage('最多选择两段；请先取消一段。') }
  function locate(field: string) { if (field === 'video-comparison') document.querySelector<HTMLDetailsElement>('.v3-advanced')!.open = true; document.getElementById(field)?.focus() }
  function simulate() {
    setAttempted(true)
    if (issues.length) { setMessage('请先修正输入问题；没有提交任何模型。'); requestAnimationFrame(() => errorsRef.current?.focus()); return }
    if (decoding) { setMessage('请等待本地图片校验完成。'); return }
    if (!videoStudio.submit()) { setMessage('相同输入已有待完成批次，请勿重复提交。'); return }
    setMessage('已建立视频输入快照，可继续编辑或离开此页。')
  }
  function insertCamera(word: string) {
    const text = draft.prompt, start = promptRef.current?.selectionStart ?? text.length
    const insert = `${start && !/\s/.test(text[start - 1]) ? ' ' : ''}镜头${word}。${start < text.length ? ' ' : ''}`
    videoStudio.edit({ prompt: text.slice(0, start) + insert + text.slice(start) })
    requestAnimationFrame(() => { promptRef.current?.focus(); promptRef.current?.setSelectionRange(start + insert.length, start + insert.length) })
  }
  const fieldErrors = (field: string) => visibleIssues.filter(i => i.field === field)
  const inline = (field: string) => fieldErrors(field).length > 0 ? <p className="v3-inline-error" id={`${field}-error`}>{fieldErrors(field).map(i => i.message).join(' ')}</p> : null
  const target = overlay?.kind === 'add' || overlay?.kind === 'library' ? overlay.target : null
  const single = target?.kind === 'frame' || !!(target?.kind === 'reference' && target.replaceId)
  const pickerRefs = target?.kind === 'frame' ? (draft[target.slot] ? [draft[target.slot]!] : []) : target?.kind === 'reference' && target.replaceId ? draft.refs.filter(r => r.id === target.replaceId) : draft.refs
  return <div className="m2-studio v3-studio ui-r2-video" data-creative-task-id={taskId} onPointerDownCapture={e=>{e.currentTarget.dataset.inputMethod="pointer"}} onKeyDownCapture={e=>{e.currentTarget.dataset.inputMethod="keyboard"}}>
    <div className="m2-page-heading"><div className="m2-page-title"><a href="#/" aria-label="返回首页" className="m2-icon-button"><ArrowLeft aria-hidden="true" size={19} /></a><h1 tabIndex={-1}>视频创作</h1><span className="m2-pill">本地模拟</span></div><div className="m2-future-tools"><StageEntry taskId={taskId} ratio={draft.ratio}/>{['剪辑', '配乐', '字幕'].map(title => <button key={title} onClick={() => setOverlay({ kind: 'info', title })}>{title} · 待实现</button>)}</div></div>
    <TaskContext taskId={taskId} />
    <div className="m2-workspace">
      <section className="m2-input" aria-label="视频创作输入"><div className="m2-input-scroll" tabIndex={0} aria-label="视频输入区，可独立滚动">
        <div className="m2-section-heading m2-prompt-heading"><label htmlFor="video-prompt">完整提示词</label><span>原文保留 · {draft.prompt.length} 字</span></div>
        <textarea ref={promptRef} id="video-prompt" name="video-prompt" autoComplete="off" spellCheck={false} aria-invalid={fieldErrors('video-prompt').length > 0} aria-describedby={fieldErrors('video-prompt').length ? "video-prompt-error" : undefined} placeholder="描述画面、动作与镜头，可粘贴中文、English 或多行内容…" value={draft.prompt} onChange={e => videoStudio.edit({ prompt: e.target.value })} />{inline('video-prompt')}
        <details className="ui-r2-prompt-tools"><summary>提示词快捷词 · 仅插入文字</summary><div className="v3-camera" role="group" aria-label="运镜快捷词">{['推近', '拉远', '环绕', '平移'].map(word => <button key={word} className="m2-filter" onClick={() => insertCamera(word)}>插入{word}</button>)}</div><p className="m2-helper">点击才插入提示词，不覆盖原文；不是模型 API 参数。</p></details>
        <div className="m2-section-heading"><h2>创作模式</h2></div>
        <div id="video-mode" className="v3-modes" role="group" aria-label="视频创作模式" tabIndex={-1}>{Object.entries(modeLabels).map(([mode, label]) => <button key={mode} aria-pressed={draft.mode === mode} onClick={() => videoStudio.edit({ mode: mode as VideoMode })}>{label}</button>)}</div>{inline('video-mode')}<p className="ui-r2-mode-hint">{draft.mode==='text'?'文字模式：首尾帧仅保留，本次不提交。':draft.mode==='first'?'首帧模式：首帧参与输入，尾帧仅保留。':'首尾帧模式：首帧与尾帧分别作为输入。'}参考图用途独立，仍须通过 Mock 校验。</p>
        {visibleIssues.length > 0 && <div className="m2-errors v3-error-summary" ref={errorsRef} tabIndex={-1} role="alert" aria-label="视频输入问题"><strong>请调整以下输入</strong><ul>{visibleIssues.map((issue, i) => <li key={`${issue.field}-${i}`}><button className="m2-text-button" onClick={() => locate(issue.field)}>{issue.message}</button></li>)}</ul></div>}
        <div className="m2-section-heading v3-section-heading"><h2>首尾帧</h2>{draft.mode === 'frames' && <button className="m2-text-button" disabled={!draft.first || !draft.last} onClick={() => { invalidate('first'); invalidate('last'); videoStudio.edit({ first: draft.last, last: draft.first }); setMessage('已交换首尾帧。') }}><ArrowLeftRight aria-hidden="true" size={14} />交换</button>}</div>
        <div className="v3-frame-grid">{(['first', 'last'] as const).map(slot => {
          const image = draft[slot], used = slot === 'first' ? draft.mode !== 'text' : draft.mode === 'frames', t: Target = { kind: 'frame', slot }
          return <section key={slot} className={`v3-frame${!used ? ' is-unused' : ''}${dragTarget === slot ? ' is-dragging' : ''}`} data-slot={slot} onDragOver={e => { e.preventDefault(); setDragTarget(slot) }} onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragTarget('') }} onDrop={e => drop(e, t)}>
            <div className="m2-ref-heading"><h3>{slotLabels[slot]}</h3><span>{used ? '必填 · 单张' : '本次不使用'}</span></div>
            <button id={`video-${slot}`} className="v3-frame-image" aria-label={image ? `预览${slotLabels[slot]} ${image.name}` : `添加${slotLabels[slot]}`} aria-describedby={fieldErrors(`video-${slot}`).length ? `video-${slot}-error` : undefined} aria-invalid={fieldErrors(`video-${slot}`).length > 0} onClick={() => image ? setOverlay({ kind: 'frame', image, label: slotLabels[slot] }) : setOverlay({ kind: 'add', target: t })}>{image ? <img src={image.src} alt={`${slotLabels[slot]} ${image.name}`} width="170" height="100" /> : <><Plus aria-hidden="true" size={22} /><span>拖入或选择图片</span></>}</button>
            {image && <><div className="v3-frame-actions"><button className="m2-text-button" onClick={() => setOverlay({ kind: 'add', target: t })}><RefreshCw aria-hidden="true" size={12} />替换</button><button className="m2-text-button v3-remove" aria-label={`移除${slotLabels[slot]}引用`} onClick={() => { invalidate(slot); videoStudio.edit({ [slot]: null }); setMessage('仅移除引用，未删除原文件。') }}><X aria-hidden="true" size={12} />移除</button></div><p className="v3-frame-name" title={image.name}>{image.name}</p><AddReferenceToLibrary image={image} /><p className={`v3-retained${used ? " is-effective" : ""}`}>{used ? "通过校验后使用" : "已保留，本次不使用"}</p></>}
          </section>
        })}</div>{inline('video-first')}{inline('video-last')}
        <div className="m2-section-heading v3-section-heading"><h2 id="video-refs" tabIndex={-1}>参考素材</h2><span>与首尾帧分开 · 选填</span></div>
        <div className="m2-reference-grid">{categories.map(category => {
          const refs = draft.refs.filter(r => r.category === category.id), t: Target = { kind: 'reference', category: category.id }, key = keyFor(t)
          return <section key={category.id} className={`m2-reference-box${dragTarget === key ? ' is-dragging' : ''}`} data-category={category.id} onDragOver={e => { e.preventDefault(); setDragTarget(key) }} onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragTarget('') }} onDrop={e => drop(e, t)} aria-label={`视频${category.label}参考`}><div className="m2-ref-heading"><h3>{category.label}</h3><button className="m2-add-button" aria-label={`添加视频${category.label}参考`} onClick={() => setOverlay({ kind: 'add', target: t })}><Plus aria-hidden="true" size={17} /></button></div>{refs.length ? <div className="m2-reference-thumbs">{refs.map(image => <div className="m2-reference-thumb" key={image.id}>{image.stageSource?<HandoffImage image={image}/>:(draft.storyboardSource||workspace.get().tasks.find(t=>t.id===taskId)?.storyboardFields?.['refs:'+image.id])?<StoryboardRefImage image={image}/>:<img src={image.src} alt={`${image.name} ${image.view}`} width="54" height="48" />}<div className="m2-reference-actions"><button aria-label={`替换视频参考 ${image.name} ${image.view}`} onClick={() => setOverlay({ kind: 'add', target: { ...t, replaceId: image.id } })}><RefreshCw aria-hidden="true" size={12} /></button><button aria-label={`移除视频参考 ${image.name} ${image.view}`} onClick={() => { invalidate(image.id); videoStudio.edit({ refs: draft.refs.filter(r => r.id !== image.id) }); setMessage('已移除任务引用，素材原件保留。') }}><X aria-hidden="true" size={12} /></button></div><AddReferenceToLibrary image={image} /></div>)}</div> : <button className="m2-drop-hint" onClick={() => setOverlay({ kind: 'add', target: t })}>拖入图片或添加</button>}</section>
        })}</div><p className="m2-reference-count">{characterCount(draft.refs)} 个角色<span />{draft.refs.length} 张参考图<small>首尾帧另计；仅任务引用</small></p>{inline('video-refs')}
        <TaskStoryboard task={workspace.get().tasks.find(t=>t.id===taskId)!} draft={draft} onChange={storyboardSupplement=>videoStudio.edit({storyboardSupplement})}/>
        <TaskSupplement storyboardSupplement={draft.storyboardSupplement} taskId={taskId} prompt={draft.prompt} supplement={draft.supplement} onChange={supplement=>videoStudio.edit({supplement})}/>
          <div className="m2-section-heading m2-settings-heading"><h2>模拟设置</h2></div>
        <label className="m2-field">模型服务标签<select id="video-model" name="video-model" aria-label="视频模型服务标签" value={draft.model} onChange={e => videoStudio.edit({ model: e.target.value as VideoModel })}>{Object.entries(videoModels).map(([id, label]) => <option key={id} value={id}>{label} · 待接入</option>)}</select></label>
        <p className="m2-helper">本版三平台影片API均未适配；OpenAI影片入口不提供可调用模型。以下仅保留历史示例，不代表新D1影片能力。{videoMock[draft.model].profile} 为独立虚构能力配置。版本、时长、分辨率和输入上限未核实，不代表官方支持。</p>
        <div className="m2-parameter-grid">
          <label className="m2-field">比例<select id="video-ratio" name="video-ratio" aria-label="视频比例" value={draft.ratio} aria-invalid={fieldErrors('video-ratio').length > 0} aria-describedby={fieldErrors('video-ratio').length ? "video-ratio-error" : undefined} onChange={e => videoStudio.edit({ ratio: e.target.value })}>{['16:9', '9:16', '1:1'].map(v => <option key={v}>{v}</option>)}</select>{inline('video-ratio')}</label>
          <label className="m2-field">时长<select id="video-duration" name="video-duration" aria-label="模拟视频时长" value={draft.duration} aria-invalid={fieldErrors('video-duration').length > 0} aria-describedby={fieldErrors('video-duration').length ? "video-duration-error" : undefined} onChange={e => videoStudio.edit({ duration: Number(e.target.value) })}>{[4, 6, 8].map(v => <option key={v} value={v}>模拟 {v} 秒</option>)}</select>{inline('video-duration')}</label>
          <label className="m2-field">分辨率<select id="video-resolution" name="video-resolution" aria-label="模拟视频分辨率" value={draft.resolution} aria-invalid={fieldErrors('video-resolution').length > 0} aria-describedby={fieldErrors('video-resolution').length ? "video-resolution-error" : undefined} onChange={e => videoStudio.edit({ resolution: e.target.value })}>{['360p', '720p'].map(v => <option key={v} value={v}>模拟 {v}</option>)}</select>{inline('video-resolution')}</label>
          <label className="m2-field">每模型数量<select id="video-count" name="video-count" aria-label="每模型视频数量" value={draft.count} aria-invalid={fieldErrors('video-count').length > 0} aria-describedby={fieldErrors('video-count').length ? "video-count-error" : undefined} onChange={e => videoStudio.edit({ count: Number(e.target.value) })}>{[1, 2, 3, 4].map(v => <option key={v} value={v}>{v} 段</option>)}</select>{inline('video-count')}</label>
        </div>
        <details className="m2-advanced v3-advanced"><summary>多模型比较与示例流程<ChevronDown aria-hidden="true" size={15} /></summary><label className="m2-checkbox"><input id="video-comparison" type="checkbox" checked={draft.compare} onChange={e => videoStudio.edit({ compare: e.target.checked })} />开启视频多模型比较（选填）</label>{draft.compare && <div className="m2-model-checks">{Object.entries(videoModels).map(([id, label]) => <label className="m2-checkbox" key={id}><input type="checkbox" aria-label={`比较视频模型 ${label}`} checked={draft.model === id || draft.compareModels.includes(id as VideoModel)} disabled={draft.model === id} onChange={e => videoStudio.edit({ compareModels: e.target.checked ? [...draft.compareModels, id as VideoModel] : draft.compareModels.filter(m => m !== id) })} />{label}{id === draft.model && '（主模型）'}</label>)}</div>}{inline('video-comparison')}<label className="m2-field">可重现的模拟流程<select aria-label="视频模拟流程" value={draft.scenario} onChange={e => videoStudio.edit({ scenario: e.target.value as VideoDraft['scenario'] })}><option value="partial">部分失败（每模型偶数项失败）</option><option value="success">全部完成</option><option value="failure">全部失败</option></select></label><p className="m2-helper">排队约 0.7 秒后进入生成中，约 3 秒结束。单段“部分失败”会完成；重试失败项会完成。</p></details>
      </div><div className="m2-submit-bar"><p>{pending ? '相同输入正在模拟，可继续编辑。' : decoding ? '正在本地校验图片…' : '仅模拟 · 本地预览 · 不连接服务'}</p><button className="primary-button" disabled={pending || decoding > 0} onClick={simulate} data-testid="video-simulate"><Sparkles aria-hidden="true" size={18} />模拟生成<ArrowRight aria-hidden="true" size={17} /></button></div></section>
      <section className="m2-results" aria-label="视频创作结果"><div className="m2-results-heading"><div><h2>视频结果</h2><span>{batches.length} 个批次 · {completed.length} 段完成 · 本地示例</span></div><button className="secondary-button" disabled={compared.length !== 2} onClick={() => setOverlay({ kind: 'compare' })}><Columns2 aria-hidden="true" size={16} />并排查看 {compared.length}/2</button></div><p className="m2-status-message" role="status">{message || (window.workLibrary?'桌面工作资料需手动保存；可恢复最后成功版本，未保存修改仍会遗失。':'刷新将重置输入、任务与模拟收藏；不会自动保存草稿。')}</p>
        <div className="m2-results-scroll" tabIndex={0} aria-label="视频结果区，可独立滚动">{!batches.length ? <div className="m2-result-empty"><span><Clapperboard aria-hidden="true" size={38} strokeWidth={1.25} /></span><h3>从一段描述，或一张画面开始</h3><p>选择模式，完成左侧输入后点击“模拟生成”。</p><small>成功时播放本地测试短片，不会调用 AI 服务。</small></div> : batches.map(batch => <article className="m2-batch" key={batch.id} data-batch-id={batch.id}><div className="m2-batch-heading"><div><h3>{batch.id}</h3><time>{new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(batch.createdAt)}</time><span className="ui-r2-batch-params">{modeLabels[batch.snapshot.input.mode]} · {batch.snapshot.input.ratio} · 模拟 {batch.snapshot.input.duration}s / {batch.snapshot.input.resolution}</span><span className={`m2-state state-${videoBatchStatus(batch)}`}>{videoBatchStatus(batch)}</span></div><button className="m2-text-button" onClick={() => setOverlay({ kind: 'detail', batch })}>提示词与设置</button></div>
          {videoSelected(batch.snapshot.input).map(model => <section className="m2-model-results" key={model}><div className="m2-model-label"><span>{videoModels[model]}</span><small>{videoMock[model].profile} · 待接入</small></div><div className="m2-result-grid">{batch.tasks.filter(t => t.model === model).map(task => <div className="m2-task v3-task" key={task.id} data-task-id={task.id} data-status={task.status}>{task.status === 'completed' ? <><VideoPlayer variant="creative-ui-r2" src={task.src} label={`${batch.id} ${videoModels[model]} 第${task.index + 1}段示例影片，非 AI 生成`} /><p className="v3-task-caption">示例影片，非 AI 生成</p><div className="m2-task-actions"><label className="m2-checkbox"><input type="checkbox" aria-label={`比较 ${batch.id} ${videoModels[model]} 第${task.index + 1}段`} checked={comparison.includes(task.id)} onChange={() => toggleCompare(task.id)} />比较</label><button className="m2-icon-button" aria-label={`放大 ${batch.id} ${videoModels[model]} 第${task.index + 1}段`} onClick={() => setOverlay({ kind: 'play', batch, task })}><Maximize2 aria-hidden="true" size={16} /></button><button className={`m2-icon-button${task.favorite ? ' is-favorite' : ''}`} aria-label={`${task.favorite ? '取消收藏' : '收藏'} ${batch.id} ${videoModels[model]} 第${task.index + 1}段`} aria-pressed={task.favorite} title="仅本次模拟状态" onClick={() => videoStudio.favorite(task.id)}><Heart aria-hidden="true" size={17} fill={task.favorite ? 'currentColor' : 'none'} /></button></div><AddResultToLibrary ownerId={taskId} resultId={task.id} src={task.src} kind="video" label={`${batch.id} 第${task.index+1}段`} /></> : <div className={`m2-task-pending${task.status === 'failed' ? ' is-failed' : ''}`}><span className="m2-state">{statusLabels[task.status]}</span><p>第 {task.index + 1} 段{task.attempt > 1 && ` · 重试 ${task.attempt - 1}`}</p>{task.status === 'failed' ? <><small>固定示例流程设定失败，未调用服务。</small><button className="secondary-button" onClick={() => videoStudio.retry(batch.id, task.id)}><RotateCcw aria-hidden="true" size={15} />重试失败项</button></> : <><Layers3 aria-hidden="true" size={28} /><small>{task.status === 'interrupted' ? '重开后未自动继续；旧批次保留，请主动发起新模拟' : task.status === 'queued' ? '等待模拟处理' : '正在运行固定示例流程'}</small></>}</div>}</div>)}</div></section>)}
          <p className="v3-batch-settings">{modeLabels[batch.snapshot.input.mode]} · 任务设定：{batch.snapshot.input.ratio} / 模拟 {batch.snapshot.input.duration} 秒 / {batch.snapshot.input.resolution} / 每模型 {batch.snapshot.input.count} 段</p><SampleFacts input={batch.snapshot.input} />{batch.tasks.some(t => t.status === 'failed') && <button className="m2-text-button m2-retry-all" onClick={() => videoStudio.retry(batch.id)}>仅重试本批次失败项</button>}
        </article>)}</div>
      </section>
    </div>
    <input ref={fileInput} type="file" hidden accept="image/png,image/jpeg,image/webp,image/gif,image/avif" onChange={e => { const t = uploadTarget.current; if (t) void addFiles(Array.from(e.target.files || []), t); e.target.value = '' }} />
    {overlay?.kind === 'add' && <Modal title={`添加${targetLabel(overlay.target)}`} onClose={close}><div className="m2-add-choices"><button onClick={() => { const t = overlay.target; close(); upload(t) }}><Upload aria-hidden="true" size={22} /><strong>选择本地图片</strong><span>本地解码校验，不上传</span></button><button onClick={() => setOverlay({ kind: 'library', target: overlay.target })}><Layers3 aria-hidden="true" size={22} /><strong>从素材库选择</strong><span>{single ? '仅选择一张，确认后替换此目标' : '可多选本次使用的角度图'}</span></button></div><p className="m2-modal-note">单张最多 10 MB。仅移除任务引用，不删除文件。取消不改变输入。</p></Modal>}
    {overlay?.kind === 'library' && target && <AssetPicker variant="image-ui-r1" key={`video-picker-${keyFor(target)}`} initialCategory={target.kind === 'frame' ? 'scene' : target.category} refs={pickerRefs} single={single} target={targetLabel(target)} onClose={close} onConfirm={images => { applyImages(target, images, true); close(); setMessage(`已确认${targetLabel(target)}，未提交生成。`) }} />}
    {overlay?.kind === 'frame' && <Modal title={`预览${overlay.label}`} onClose={close}><div className="v3-frame-preview"><img src={overlay.image.src} alt={overlay.image.name} width="500" height="350" /><p>{overlay.image.name} · {overlay.image.view} · 仅本次输入引用</p></div></Modal>}
    {overlay?.kind === 'play' && <Modal title={`${overlay.batch.id} · ${videoModels[overlay.task.model]} · 示例预览`} onClose={close} wide><div className="v3-preview"><VideoPlayer variant="creative-ui-r2" src={overlay.task.src} label="放大示例影片" /><SampleFacts input={overlay.batch.snapshot.input} /></div><div className="m2-modal-footer"><button className="secondary-button" onClick={() => setOverlay({ kind: 'detail', batch: overlay.batch })}>提示词与设置</button><button className="primary-button" onClick={() => requestApply(overlay.batch.snapshot)}>套用设置</button></div></Modal>}
    {overlay?.kind === 'compare' && <Modal title="两段示例影片并排查看" onClose={close} wide><div className="m2-compare-grid v3-compare">{compared.map(({ batch, task }) => <figure key={task.id}><VideoPlayer variant="creative-ui-r2" src={task.src} label={`并排查看 ${batch.id} 第${task.index + 1}段`} /><figcaption><strong>{batch.id} · {videoModels[task.model]} · 第 {task.index + 1} 段</strong><span>任务设定 {batch.snapshot.input.ratio} / {batch.snapshot.input.duration} 秒 / {batch.snapshot.input.resolution}</span></figcaption><button className="secondary-button" onClick={() => setOverlay({ kind: 'detail', batch })}>提示词与设置</button></figure>)}</div><p className="m2-modal-note">示例影片，非 AI 生成；实测均为 4.0 秒、640×360、16:9。按实际比例播放，不同步；播放一段会暂停另一段。</p></Modal>}
    {overlay?.kind === 'detail' && <Modal title={`${overlay.batch.id} · 当时的提示词与设置`} onClose={close} wide><VideoDetails batch={overlay.batch} /><div className="m2-modal-footer"><span>查看不会修改输入。</span><button className="primary-button" onClick={() => requestApply(overlay.batch.snapshot)}>套用设置</button></div></Modal>}
    {overlay?.kind === 'apply' && <Modal title="替换当前视频输入？" onClose={close}><div className="m2-confirm-copy"><Info aria-hidden="true" size={24} /><p>当前输入有修改。确认将替换模式、完整提示词、首尾帧、参考引用、模型与参数；已提交任务和图片页不受影响。不会自动生成。</p></div><div className="m2-modal-footer"><button className="secondary-button" onClick={close}>取消</button><button className="primary-button" onClick={() => { videoStudio.apply(overlay.snapshot); close(); setMessage('已套用视频快照，没有提交新任务。') }}><Check aria-hidden="true" size={16} />确认套用设置</button></div></Modal>}
    {overlay?.kind === 'info' && <Modal title={`${overlay.title} · 待实现`} onClose={close}><p className="m2-info-copy">{overlay.title}尚未实现。本次没有执行剪辑、配乐、字幕、3D 或导出操作。</p><div className="m2-modal-footer"><span /><button className="primary-button" onClick={close}>知道了</button></div></Modal>}
  </div>
}

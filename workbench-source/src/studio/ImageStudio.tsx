import FlashPanel from './FlashPanel'
import {isFlash} from './flash-state'
import { BatchFieldOrigins } from '../storyboard/TaskUpdateHistory'
import { TaskStoryboard, StoryboardRefImage } from '../storyboard/TaskStoryboard'
import { workspace } from '../management/store'
import { HandoffImage, TaskSupplement } from '../studio/TaskSupplement'
import { StageEntry } from '../stage3d/StageEntry'
import { decodeLocalImage } from '../video/local-image'
import { TaskContext } from '../management/common'
import { AddReferenceToLibrary, AddResultToLibrary } from '../management/AddToLibrary'
import { TransferToVideo } from '../management/TransferToVideo'
import { useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { DragEvent } from 'react'
import { ArrowLeft, ArrowRight, Check, ChevronDown, Clapperboard, Columns2, Heart, Image as ImageIcon, Info, Layers3, Maximize2, Plus, RefreshCw, RotateCcw, Scissors, Sparkles, Upload, X } from 'lucide-react'
import { AssetPicker } from './AssetPicker'
import { Modal } from './Modal'
import { ResultArtwork } from './ResultArtwork'
import { createImageStore } from './store'
import { batchStatus, categories, characterCount, fingerprint, hasPendingInput, mockCapabilities, modelLabels, selectedModels, validate } from './state'
import type { Batch, Category, Draft, ModelId, RefImage, Task } from './state'
import './studio.css'
import './ui-r1.css'

type Overlay = { kind: 'transfer'; image: RefImage } | { kind: 'add'; category: Category } | { kind: 'library'; category: Category } | { kind: 'zoom'; task: Task; batch: Batch } | { kind: 'detail'; batch: Batch } | { kind: 'compare' } | { kind: 'apply'; snapshot: Readonly<Draft> } | { kind: 'info'; title: string; message: string }
const statusLabels = { queued: '排队中', running: '生成中', completed: '完成', failed: '失败', interrupted: '已中断 · 请主动新建模拟' }
function SnapshotDetails({ batch }: { batch: Batch }) {
  const d = batch.snapshot
  return <div className="m2-snapshot"><p className="m2-notice">这是提交时的不可变快照，当前输入的编辑不会影响它。</p>{batch.context && <p className="m2-notice">提交任务：{batch.context.projectName} / {batch.context.taskName} · ID {batch.context.taskId}</p>}{batch.storyboardOrigin&&<><h3>分镜来源快照</h3><p data-testid="batch-storyboard-origin">{batch.storyboardOrigin.source.snapshotId} · {batch.storyboardOrigin.source.shotId} · 规划 {batch.storyboardOrigin.plannedRatio} / 实际 {d.ratio}</p></>}<BatchFieldOrigins origins={batch.storyboardFieldOrigins}/><h3>当时的完整提示词</h3><pre>{d.prompt}</pre>{batch.finalPrompt!==undefined&&<><h3>当时的最终提示词</h3><pre data-testid="snapshot-final-prompt">{batch.finalPrompt}</pre></>}<dl><dt>服务标签</dt><dd>{selectedModels(d).map(id => modelLabels[id]).join(' / ')}（均待接入）</dd><dt>参数</dt><dd>{d.ratio} · {d.resolution} · 每模型 {d.count} 张</dd><dt>参考输入</dt><dd>{characterCount(d.refs)} 个角色 · {d.refs.length} 张参考图</dd><dt>示例流程</dt><dd>{{ success: '全部完成', partial: '部分失败', failure: '全部失败' }[d.scenario]}</dd></dl>{d.refs.length > 0 && <div className="m2-snapshot-refs">{d.refs.map(ref => <figure key={ref.id}><img src={ref.src} alt={ref.name} width="80" height="64" /><figcaption>{ref.name} · {ref.view}</figcaption></figure>)}</div>}</div>
}
export default function ImageStudio({ taskId }: { taskId: string }) {
  const studio = useMemo(() => createImageStore(taskId), [taskId])
  const state = useSyncExternalStore(studio.subscribe, studio.get)
  const { draft } = state
  const batches=state.batches.filter(batch=>!isFlash(batch))
  const [entry,setEntry]=useState<'flash'|'mock'>('flash')
  const [overlay, setOverlay] = useState<Overlay | null>(null)
  const [message, setMessage] = useState('')
  const [dragCategory, setDragCategory] = useState<Category | null>(null)
  const [comparison, setComparison] = useState<string[]>([])
  const [attempted, setAttempted] = useState(false)
  const [decoding, setDecoding] = useState(0)
  const fileInput = useRef<HTMLInputElement>(null)
  const uploadTarget = useRef<{ category: Category; replaceId?: string } | null>(null)
  const promptRef = useRef<HTMLTextAreaElement>(null)
  const duplicatePending = hasPendingInput(state)
  const errorRef = useRef<HTMLUListElement>(null)
  const errors = validate(draft)
  const visibleErrors = errors.filter(e => attempted || !e.startsWith('请填写'))
  const completed = batches.flatMap(batch => batch.tasks.filter(t => t.status === 'completed').map(task => ({ batch, task })))
  const compared = comparison.map(id => completed.find(item => item.task.id === id)).filter(item => item !== undefined)
  const close = () => setOverlay(null)
  function upload(category: Category, replaceId?: string) {
    uploadTarget.current = { category, replaceId }
    if (fileInput.current) { fileInput.current.multiple = !replaceId; fileInput.current.value = ''; fileInput.current.click() }
  }
  async function addFiles(files: File[], category: Category, replaceId?: string) {
    if (!files.length) return
    if (replaceId && files.length !== 1) { setMessage('替换只接受一张图片，原有引用已保留。'); return }
    const previous = replaceId ? studio.get().draft.refs.find(ref => ref.id === replaceId) : undefined
    const entityId = previous?.entityId ?? `local-entity-${crypto.randomUUID()}`
    setDecoding(n => n + 1)
    const outcomes = await Promise.allSettled(files.map(file => decodeLocalImage(file, category, entityId)))
    const refs = outcomes.flatMap(item => item.status === 'fulfilled' ? [{ ...item.value, ...(previous ? { view: previous.view } : {}) }] : [])
    const errors = outcomes.flatMap(item => item.status === 'rejected' ? [String(item.reason.message)] : [])
    if (refs.length && (!replaceId || studio.get().draft.refs.some(r => r.id === replaceId))) studio.edit({ refs: [...studio.get().draft.refs.filter(r => r.id !== replaceId), ...refs] })
    setDecoding(n => n - 1)
    setMessage(errors.length ? errors.join(' ') : `已添加 ${refs.length} 张本地参考图，仅在浏览器预览。${category === 'character' ? '本次添加的图片视为同一角色的多角度图。' : ''}`)
  }
  function drop(event: DragEvent<HTMLElement>, category: Category) { event.preventDefault(); setDragCategory(null); addFiles(Array.from(event.dataTransfer.files), category) }
  function requestApply(snapshot: Readonly<Draft>) {
    if (fingerprint(draft) === fingerprint(snapshot)) { setOverlay({ kind: 'info', title: '设置已一致', message: '当前输入与该批次的提交快照一致，无需替换。' }); return }
    if (fingerprint(draft) !== state.baseline) setOverlay({ kind: 'apply', snapshot })
    else { studio.apply(snapshot); close(); setMessage('已套用该批次的提示词、参考图与设置，未提交新任务。') }
  }
  function transferResult(task: Task, batch: Batch) {
    const image: RefImage = { id: `image-result-${taskId}-${task.id}`, category: 'scene', src: task.src, name: `${batch.id} · ${modelLabels[task.model]} · 第${task.index + 1}张（示例）`, entityId: `${taskId}:${task.id}`, view: '图片结果', origin: 'sample' }
    setOverlay({ kind: 'transfer', image: { ...image, example: true, sourceTaskId: taskId, sourceResultId: task.id } })
  }
  function toggleCompare(id: string) {
    if (comparison.includes(id)) setComparison(comparison.filter(item => item !== id))
    else if (comparison.length < 2) setComparison([...comparison, id])
    else setMessage('比较最多选择两张；请先取消其中一张，再选择其他结果。')
  }
  function simulate() {
    setAttempted(true)
    if (errors.length) { setMessage('请先调整列出的输入问题，当前输入未被更改。'); if (!draft.prompt.trim()) promptRef.current?.focus(); else errorRef.current?.focus(); return }
    if (!studio.submit()) { setMessage('相同输入已有排队或生成中的批次，请等待完成或修改输入后再提交。'); return }
    setMessage('已建立输入快照并提交模拟批次，可继续编辑或离开此页。')
  }
  return <div className="m2-studio ui-r1-image" data-creative-task-id={taskId} onPointerDownCapture={e=>{e.currentTarget.dataset.inputMethod='pointer'}} onKeyDownCapture={e=>{e.currentTarget.dataset.inputMethod='keyboard'}}>
    <div className="m2-page-heading"><div className="m2-page-title"><a href="#/" aria-label="返回首页" className="m2-icon-button"><ArrowLeft aria-hidden="true" size={19} /></a><h1 tabIndex={-1}>图片创作</h1><span className="m2-pill">本地模拟</span></div><div className="m2-future-tools"><StageEntry taskId={taskId} ratio={draft.ratio}/>{[{ label: '局部修改', icon: Scissors }, { label: '转影片', icon: Clapperboard }].map(({ label, icon: Icon }) => <button key={label} onClick={() => setOverlay({ kind: 'info', title: label, message: label === '转影片' ? '请在一张已完成的结果卡点击“转视频”，将该图带入视频首帧。本入口尚未执行任何操作。' : `${label}将在后续阶段提供。本轮仅保留入口，尚未执行任何生成、编辑或导出操作。` })}><Icon aria-hidden="true" size={16} />{label}</button>)}</div></div>
    <TaskContext taskId={taskId} />
    <div className="flash-entry-switch" aria-label="图片执行方式"><button className="secondary-button" aria-pressed={entry==='flash'} onClick={()=>setEntry('flash')}>Flash 单张文生图</button><button className="secondary-button" aria-pressed={entry==='mock'} onClick={()=>setEntry('mock')}>原有 Mock 示例</button></div>
    {entry==='flash'&&<FlashPanel taskId={taskId} prompt={draft.prompt} onPrompt={prompt=>studio.edit({prompt})}/>}
    <div className="m2-workspace" hidden={entry!=='mock'} style={entry!=='mock'?{display:'none'}:undefined}>
      <section className="m2-input" aria-label="创作输入">
        <div className="m2-input-scroll" tabIndex={0} aria-label="输入区，可独立滚动">
          <div className="m2-section-heading m2-prompt-heading"><label htmlFor="image-prompt">完整提示词</label><span>原文保留 · {draft.prompt.length} 字</span></div>
          <textarea ref={promptRef} id="image-prompt" name="image-prompt" autoComplete="off" spellCheck={false} placeholder="描述你希望看见的画面，可直接粘贴中文、English 或多行内容…" value={draft.prompt} onChange={e => studio.edit({ prompt: e.target.value })} />
          <div className="m2-section-heading"><h2>参考素材</h2><span>选填 · 不改变原素材</span></div>
          <div className="m2-reference-grid">{categories.map(category => {
            const refs = draft.refs.filter(r => r.category === category.id)
            return <section key={category.id} aria-label={`${category.label}参考`} className={`m2-reference-box${dragCategory === category.id ? ' is-dragging' : ''}`} onDragOver={e => { e.preventDefault(); setDragCategory(category.id) }} onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragCategory(null) }} onDrop={e => drop(e, category.id)} data-category={category.id}>
              <div className="m2-ref-heading"><h3>{category.label}</h3><button className="m2-add-button" aria-label={`添加${category.label}参考`} onClick={() => setOverlay({ kind: 'add', category: category.id })}><Plus aria-hidden="true" size={17} /></button></div>
              {refs.length ? <div className="m2-reference-thumbs">{refs.map(ref => <div className="m2-reference-thumb" key={ref.id}>{ref.stageSource?<HandoffImage image={ref}/>:(draft.storyboardSource||workspace.get().tasks.find(t=>t.id===taskId)?.storyboardFields?.['refs:'+ref.id])?<StoryboardRefImage image={ref}/>:<img src={ref.src} alt={`${ref.name} ${ref.view}`} width="54" height="48" />}<div className="m2-reference-actions"><button aria-label={`替换${ref.name} ${ref.view}`} title="选择本地图片替换" onClick={() => upload(category.id, ref.id)}><RefreshCw aria-hidden="true" size={12} /></button><button aria-label={`移除${ref.name} ${ref.view}任务引用`} title="仅移除本次引用，不删除素材" onClick={() => { studio.edit({ refs: draft.refs.filter(r => r.id !== ref.id) }); setMessage('已移除本次任务引用，未删除素材。') }}><X aria-hidden="true" size={12} /></button></div><AddReferenceToLibrary image={ref} /></div>)}</div> : <button className="m2-drop-hint" onClick={() => setOverlay({ kind: 'add', category: category.id })}>拖入图片或添加</button>}
            </section>
          })}</div>
          <p className="m2-reference-count" data-testid="reference-count">{characterCount(draft.refs)} 个角色<span />{draft.refs.length} 张参考图 <small>仅本次任务引用</small></p>
          <TaskStoryboard task={workspace.get().tasks.find(t=>t.id===taskId)!} draft={draft} onChange={storyboardSupplement=>studio.edit({storyboardSupplement})}/>
          <TaskSupplement storyboardSupplement={draft.storyboardSupplement} taskId={taskId} prompt={draft.prompt} supplement={draft.supplement} onChange={supplement=>studio.edit({supplement})}/>
          <div className="m2-section-heading m2-settings-heading"><h2>生成设置</h2></div>
          <label className="m2-field">模型服务标签<select aria-label="模型服务标签" value={draft.model} onChange={e => studio.edit({ model: e.target.value as ModelId })}>{Object.entries(modelLabels).map(([id, label]) => <option value={id} key={id}>{label} · 待接入</option>)}</select></label>
          <p className="m2-helper">版本与真实能力未核实。下列兼容性仅由独立的 {mockCapabilities[draft.model].profile} 演示，不是官方限制。</p>
          <div className="m2-parameter-grid"><label className="m2-field">比例<select aria-label="图片比例" value={draft.ratio} onChange={e => studio.edit({ ratio: e.target.value })}>{['1:1', '4:3', '3:4', '16:9'].map(v => <option key={v} value={v}>{v}{mockCapabilities[draft.model].ratios.includes(v) ? '' : '（当前 Mock 不兼容）'}</option>)}</select></label><label className="m2-field">分辨率<select aria-label="图片分辨率" value={draft.resolution} onChange={e => studio.edit({ resolution: e.target.value })}>{['1K', '2K', '4K'].map(v => <option key={v} value={v}>{v}{mockCapabilities[draft.model].resolutions.includes(v) ? '' : '（当前 Mock 不兼容）'}</option>)}</select></label><label className="m2-field">每模型数量<select aria-label="每模型生成数量" value={draft.count} onChange={e => studio.edit({ count: Number(e.target.value) })}>{[1, 2, 3, 4].map(v => <option key={v} value={v}>{v} 张{v > mockCapabilities[draft.model].maxCount ? '（当前 Mock 不兼容）' : ''}</option>)}</select></label></div>
          <details className="m2-advanced"><summary>多模型比较与示例流程<ChevronDown aria-hidden="true" size={15} /></summary><label className="m2-checkbox"><input type="checkbox" checked={draft.compare} onChange={e => studio.edit({ compare: e.target.checked })} />开启多模型比较（选填）</label>{draft.compare && <div className="m2-model-checks">{Object.entries(modelLabels).map(([id, label]) => <label className="m2-checkbox" key={id}><input type="checkbox" aria-label={`比较模型 ${label}`} disabled={id === draft.model} checked={id === draft.model || draft.compareModels.includes(id as ModelId)} onChange={e => studio.edit({ compareModels: e.target.checked ? [...draft.compareModels, id as ModelId] : draft.compareModels.filter(m => m !== id) })} />{label}{id === draft.model && '（主模型）'}</label>)}</div>}<label className="m2-field">可重现的模拟流程<select aria-label="模拟流程" value={draft.scenario} onChange={e => studio.edit({ scenario: e.target.value as Draft['scenario'] })}><option value="partial">部分失败（每模型偶数项失败）</option><option value="success">全部完成</option><option value="failure">全部失败</option></select></label><p className="m2-helper">单张使用“部分失败”会完成；选择两张及以上可观察部分成功。手动重试失败项会完成。</p></details>
          {visibleErrors.length > 0 && <ul ref={errorRef} tabIndex={-1} role="alert" className="m2-errors" aria-label="输入相容性问题">{visibleErrors.map(error => <li key={error}>{error}</li>)}</ul>}
        </div>
        <div className="m2-submit-bar"><p>{duplicatePending ? '相同输入正在模拟；可继续编辑，调整后可提交新批次。' : '仅模拟 · 不上传图片 · 不连接服务'}</p><button className="primary-button" onClick={simulate} disabled={duplicatePending || decoding > 0} data-testid="simulate"><Sparkles aria-hidden="true" size={18} />模拟生成<ArrowRight aria-hidden="true" size={17} /></button></div>
      </section>
      <section className="m2-results" aria-label="创作结果">
        <div className="m2-results-heading"><div><h2>创作结果</h2><span>{batches.length} 个批次 · {completed.length} 张完成 · 均为本地示例</span></div><button className="secondary-button" disabled={compared.length !== 2} onClick={() => setOverlay({ kind: 'compare' })}><Columns2 aria-hidden="true" size={16} />并排比较 {compared.length}/2</button></div>
        <p className="m2-status-message" role="status">{message || (window.workLibrary?'桌面工作资料需手动保存；可恢复最后成功版本，未保存修改仍会遗失。':'输入不会自动保存；刷新或关闭后，本轮输入、任务和收藏将重置。')}</p>
        <div className="m2-results-scroll" tabIndex={0} aria-label="结果区，可独立滚动">
          {batches.length === 0 ? <div className="m2-result-empty"><span><ImageIcon aria-hidden="true" size={38} strokeWidth={1.25} /></span><h3>让你的下一张画面，从这里开始</h3><p>在左侧描述想法，点击“模拟生成”。</p><small>此处将展示示例图片，不是真实 AI 生成结果。</small></div> : batches.map(batch => <article className="m2-batch" key={batch.id} data-batch-id={batch.id}>
            <div className="m2-batch-heading"><div><h3>{batch.id}</h3><time>{new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Shanghai' }).format(batch.createdAt)}</time><span className="ui-r1-batch-params">{batch.snapshot.ratio} · {batch.snapshot.resolution} · {batch.tasks.length} 张</span><span className={`m2-state state-${batchStatus(batch)}`}>{batchStatus(batch)}</span></div><button className="m2-text-button" onClick={() => setOverlay({ kind: 'detail', batch })}>提示词与设置</button></div>
            {selectedModels(batch.snapshot).map(model => <section className="m2-model-results" key={model}><div className="m2-model-label"><span>{modelLabels[model]}</span><small>{mockCapabilities[model].profile} · 待接入</small></div><div className="m2-result-grid">{batch.tasks.filter(t => t.model === model).map(task => <div key={task.id} className="m2-task" data-task-id={task.id} data-status={task.status}>
              {task.status === 'completed' ? <><button className="m2-result-image" aria-label={`放大 ${batch.id} ${modelLabels[model]} 第${task.index + 1}张`} onClick={() => setOverlay({ kind: 'zoom', task, batch })}><ResultArtwork src={task.src} ratio={batch.snapshot.ratio} alt={`${modelLabels[model]} 第${task.index + 1}张本地示例，非真实生成`} /><span>示例结果 · {batch.snapshot.ratio}<Maximize2 aria-hidden="true" size={15} /></span></button><div className="m2-task-actions"><label className="m2-checkbox"><input type="checkbox" aria-label={`比较 ${batch.id} ${modelLabels[model]} 第${task.index + 1}张`} checked={comparison.includes(task.id)} onChange={() => toggleCompare(task.id)} />比较</label><button className="m2-text-button" aria-label={`转视频 ${batch.id} ${modelLabels[model]} 第${task.index + 1}张`} onClick={() => transferResult(task, batch)}><Clapperboard aria-hidden="true" size={14} />转视频</button><button className={`m2-icon-button${task.favorite ? ' is-favorite' : ''}`} aria-label={`${task.favorite ? '取消收藏' : '收藏'} ${batch.id} ${modelLabels[model]} 第${task.index + 1}张`} aria-pressed={task.favorite} title="收藏仅为本次模拟状态" onClick={() => studio.favorite(task.id)}><Heart aria-hidden="true" size={17} fill={task.favorite ? 'currentColor' : 'none'} /></button></div><AddResultToLibrary ownerId={taskId} resultId={task.id} src={task.src} kind="image" label={`${batch.id} 第${task.index+1}张`} /></> : <div className={`m2-task-pending ${task.status === 'failed' ? 'is-failed' : ''}`}><span className="m2-state">{statusLabels[task.status]}</span><p>第 {task.index + 1} 张{task.attempt > 1 && ` · 重试 ${task.attempt - 1}`}</p>{task.status === 'failed' ? <><small>示例流程设定失败，未调用真实服务。</small><button className="secondary-button" onClick={() => studio.retry(batch.id, task.id)}><RotateCcw aria-hidden="true" size={15} />重试失败项</button></> : <><Layers3 aria-hidden="true" size={28} strokeWidth={1.3} /><small>{task.status === 'interrupted' ? '重开后未自动继续；旧批次保留，请主动发起新模拟' : task.status === 'queued' ? '等待模拟处理' : '正在运行固定示例流程'}</small></>}</div>}
              </div>)}</div></section>)}
            {batch.tasks.some(t => t.status === 'failed') && <button className="m2-text-button m2-retry-all" onClick={() => studio.retry(batch.id)}>仅重试本批次失败项</button>}
          </article>)}
        </div>
      </section>
    </div>
    <input ref={fileInput} type="file" hidden accept="image/png,image/jpeg,image/webp,image/gif,image/avif" onChange={event => { const target = uploadTarget.current; if (target) addFiles(Array.from(event.target.files || []), target.category, target.replaceId); event.target.value = '' }} />
    {overlay?.kind === 'add' && <Modal title={`添加${categories.find(c => c.id === overlay.category)?.label}参考`} onClose={close}><div className="m2-add-choices"><button onClick={() => { const category = overlay.category; close(); upload(category) }}><Upload aria-hidden="true" size={22} /><strong>选择本地图片</strong><span>仅浏览器预览，不上传</span></button><button onClick={() => setOverlay({ kind: 'library', category: overlay.category })}><Layers3 aria-hidden="true" size={22} /><strong>从素材库选择</strong><span>可多选本次使用的角度图</span></button></div><p className="m2-modal-note">PNG / JPEG / WebP / GIF / AVIF，单张最多 10 MB。同次添加的角色图片视为同一角色的多角度图。</p></Modal>}
    {overlay?.kind === 'library' && <AssetPicker variant="image-ui-r1" key={`picker-${overlay.category}`} initialCategory={overlay.category} refs={draft.refs} onClose={close} onConfirm={refs => { studio.edit({ refs }); close(); setMessage('已确认素材库参考图，仅更新本次任务引用。') }} />}
    {overlay?.kind === 'zoom' && <Modal title={`${overlay.batch.id} · ${modelLabels[overlay.task.model]} · 示例结果`} onClose={close} wide><div className="m2-zoom"><ResultArtwork src={overlay.task.src} ratio={overlay.batch.snapshot.ratio} alt="放大的本地示例结果，非真实生成" /><p>模拟画布 {overlay.batch.snapshot.ratio}；本地示意图按原比例完整展示，非真实生成。收藏仅保留在本次打开期间。</p></div><div className="m2-modal-footer"><button className="secondary-button" onClick={() => setOverlay({ kind: 'detail', batch: overlay.batch })}>查看当时提示词与设置</button><button className="primary-button" onClick={() => requestApply(overlay.batch.snapshot)}>套用设置</button></div></Modal>}
    {overlay?.kind === 'detail' && <Modal title={`${overlay.batch.id} · 当时的提示词与设置`} onClose={close} wide><SnapshotDetails batch={overlay.batch} /><div className="m2-modal-footer"><p>查看不会修改当前输入。</p><button className="primary-button" onClick={() => requestApply(overlay.batch.snapshot)}>套用设置</button></div></Modal>}
    {overlay?.kind === 'compare' && <Modal title="两张示例结果并排比较" onClose={close} wide><div className="m2-compare-grid">{compared.map(({ task, batch }) => <figure key={task.id}><div className="m2-compare-media"><ResultArtwork src={task.src} ratio={batch.snapshot.ratio} alt={`${modelLabels[task.model]} 本地示例比较图，非真实生成`} /></div><figcaption><strong>{batch.id} · {modelLabels[task.model]}</strong><span>{batch.snapshot.ratio} · {batch.snapshot.resolution} · 第 {task.index + 1} 张</span></figcaption><button className="secondary-button" onClick={() => setOverlay({ kind: 'detail', batch })}>提示词与设置</button></figure>)}</div><p className="m2-modal-note">仅比较本地示例图，不代表任何模型的真实效果或能力。</p></Modal>}
    {overlay?.kind === 'apply' && <Modal title="替换当前输入？" onClose={close}><div className="m2-confirm-copy"><Info aria-hidden="true" size={24} /><p>当前输入有修改。套用将替换完整提示词、所有参考引用、模型与参数。已提交批次和成功结果不受影响。</p></div><div className="m2-modal-footer"><button className="secondary-button" onClick={close}>取消</button><button className="primary-button" onClick={() => { studio.apply(overlay.snapshot); close(); setMessage('已套用提交快照，未提交新任务。') }}><Check aria-hidden="true" size={16} />确认套用设置</button></div></Modal>}
    {overlay?.kind === 'transfer' && <TransferToVideo image={overlay.image} sourceTaskId={taskId} onClose={close} />}
    {overlay?.kind === 'info'  && <Modal title={overlay.title} onClose={close}><p className="m2-info-copy">{overlay.message}</p><div className="m2-modal-footer"><span /><button className="primary-button" onClick={close}>知道了</button></div></Modal>}
  </div>
}

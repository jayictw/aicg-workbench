import { assertPreparedReferences } from './reference-state.mjs';
import { addCreativeTask } from '../management/state.mjs';
import { immutable } from '../studio/simulation.mjs';
import { initialDraft, validate } from '../studio/state.mjs';
import { finalPrompt } from '../studio/stage-handoff-types.mjs';
export function stableJson(value) { if (Array.isArray(value))
    return '[' + value.map(stableJson).join(',') + ']'; if (value && typeof value === 'object')
    return '{' + Object.entries(value).filter(([, v]) => v !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => JSON.stringify(k) + ':' + stableJson(v)).join(',') + '}'; return JSON.stringify(value) ?? 'null'; }
export const blankShot = (id = crypto.randomUUID(), title = '新镜头') => ({ id, revision: 1, title, visual: '', freeze: '', subject: '', scene: '', size: '', angle: '', duration: '', refs: [] });
export function newBoard(projectId, id = crypto.randomUUID(), now = Date.now()) { return { version: 1, id, projectId, revision: 1, name: '未命名分镜', createdAt: now, updatedAt: now, brief: { purpose: '', original: '', style: '', ratio: '16:9', duration: '' }, shots: [] }; }
export function content(b) { return structuredClone({ name: b.name, brief: b.brief, shots: b.shots }); }
export function putBoard(s, b) { if (!s.projects.some(p => p.id === b.projectId))
    throw new Error('来源项目已不可用。'); return { ...s, storyboards: { ...s.storyboards, [b.id]: b } }; }
export function patchBoard(b, patch) { return { ...b, ...patch, revision: b.revision + 1, updatedAt: Date.now() }; }
export function patchShot(b, id, patch) { return patchBoard(b, { shots: b.shots.map(sh => sh.id === id ? { ...sh, ...patch, id: sh.id, revision: sh.revision + 1 } : sh) }); }
export function deleteShot(b, id) { const index = b.shots.findIndex(s => s.id === id); if (index < 0)
    return b; return { ...patchBoard(b, { shots: b.shots.filter(s => s.id !== id) }), undo: { shot: structuredClone(b.shots[index]), index } }; }
export function undoDelete(b) { if (!b.undo)
    return b; const shots = [...b.shots]; if (shots.some(s => s.id === b.undo.shot.id))
    return b; shots.splice(Math.min(b.undo.index, shots.length), 0, b.undo.shot); return { ...patchBoard(b, { shots }), undo: undefined }; }
export function duplicateShot(b, id, newId = crypto.randomUUID()) { const index = b.shots.findIndex(s => s.id === id); if (index < 0)
    return b; const sh = structuredClone(b.shots[index]), shots = [...b.shots]; shots.splice(index + 1, 0, { ...sh, id: newId, revision: 1, title: sh.title + ' 副本' }); return patchBoard(b, { shots }); }
export function moveShot(b, id, offset) { const i = b.shots.findIndex(s => s.id === id), j = i + offset; if (i < 0 || j < 0 || j >= b.shots.length)
    return b; const shots = [...b.shots]; [shots[i], shots[j]] = [shots[j], shots[i]]; return patchBoard(b, { shots }); }
export function template(b, replace = false) { const shots = ['开场', '细节', '收束'].map(t => blankShot(crypto.randomUUID(), t)); return { ...patchBoard(b, { shots: replace ? shots : [...b.shots, ...shots] }), templateUndo: content(b) }; }
export function durationError(raw) { return raw.trim() !== '' && (!Number.isFinite(Number(raw)) || Number(raw) <= 0) ? '计划时长须为有限正数；未填可留空。' : ''; }
export function sourceInput(s, b, sh) { return { brief: { purpose: b.brief.purpose, original: b.brief.original, style: b.brief.style }, visual: sh.visual, freeze: sh.freeze, subject: sh.subject, scene: sh.scene, size: sh.size, angle: sh.angle, resources: sh.refs.map(r => { const a = r.stageSelection ? undefined : s.assets.find(a => a.id === (r.assetId || r.id)); const e = r.stageSelection ? undefined : s.entities.find(e => e.id === r.entityId); return { ...(r.stageSelection ? { frozen: { src: r.src, stageSource: r.stageSource, stageSelection: r.stageSelection } } : {}), link: { id: r.id, assetId: r.assetId, entityId: r.entityId, category: r.category, view: r.view }, asset: a ? { id: a.id, name: a.name, description: a.description, updatedAt: a.updatedAt, src: a.src, stageSource: a.stageSource } : null, entity: e ? { id: e.id, name: e.name, description: e.description, updatedAt: e.updatedAt, photos: e.photos } : null }; }) }; }
export function sourceFingerprint(s, b, sh) { return JSON.stringify(sourceInput(s, b, sh)); }
export function stale(s, b, sh) { return !!sh.prompt && sh.prompt.fingerprint !== sourceFingerprint(s, b, sh); }
export function organize(s, b, sh) { const input = sourceInput(s, b, sh), pairs = [['subject', '主体', sh.subject], ['scene', '场景', sh.scene], ['frame', '景别／角度', [sh.size, sh.angle].filter(Boolean).join('，')], ['freeze', '选填定格', sh.freeze], ['style', '风格', b.brief.style], ['refs', '参考约束', sh.refs.length ? '以所选参考图为依据；未填写的信息不作推断。' : '']]; return { ruleVersion: 'storyboard.zh.v1', input: structuredClone(input), fingerprint: JSON.stringify(input), at: Date.now(), sections: pairs.map(([id, label, text]) => ({ id, label, generated: text, text, enabled: !!text, manual: false })) }; }
export function supplementText(sh) { return sh.prompt?.sections.filter(p => p.enabled && p.text.trim()).map(p => p.label + '：' + p.text).join('\n') || ''; }
export function confirmationToken(s, b, sh) { const project = s.projects.find(p => p.id === b.projectId); return JSON.stringify({ project: project && { id: project.id, name: project.name }, board: content(b), boardId: b.id, shotId: sh.id, input: sourceInput(s, b, sh) }); }
export function currentRequest(s, r) { const b = s.storyboards?.[r.boardId], sh = b?.shots.find(x => x.id === r.shotId); if (!b || !sh)
    throw new Error('来源分镜或镜头不可用。'); if (r.expected !== confirmationToken(s, b, sh))
    throw new Error('确认内容已变化，请取消并重新预览；未创建任务。'); return { b, sh }; }
export function createFromShot(s, r, media, taskId, now) {
    const digest = stableJson({ request: r, media }), prior = s.storyboardReceipts?.[r.id];
    if (prior) {
        if (prior.digest !== digest)
            throw new Error('同一交接 ID 的请求内容不同；拒绝重用，请重新确认。');
        return { state: s, receipt: prior };
    }
    const { b, sh } = currentRequest(s, r);
    if (!sh.visual.trim())
        throw new Error('请填写此镜头要生成的单张画面。');
    if (!sh.prompt)
        throw new Error('请先依已填信息整理补充。');
    const outOfDate = stale(s, b, sh);
    if (outOfDate && !r.allowStale)
        throw new Error('整理来源已过期，请重新整理或明确沿用旧补充。');
    if (durationError(sh.duration) || durationError(b.brief.duration))
        throw new Error('计划时长无效，请修正或留空。');
    assertPreparedReferences(s, sh.refs, media);
    const source = { version: 1, projectId: b.projectId, storyboardId: b.id, shotId: sh.id, shotRevision: sh.revision, snapshotId: 'shot-' + r.id, handoffId: r.id, createdAt: now, ruleVersion: sh.prompt.ruleVersion, manual: sh.prompt.sections.some(p => p.manual) };
    const text = supplementText(sh), draft = { ...initialDraft(), model: r.model, ratio: r.ratio, prompt: sh.visual, refs: structuredClone(media), storyboardSource: source, ...(text ? { storyboardSupplement: { text, enabled: true, manual: source.manual, source } } : {}) };
    const issues = validate(draft);
    if (issues.length)
        throw new Error(issues.join(' ') + ' 板规划值未修改，未创建任务。');
    const snapshot = immutable({ version: 1, source, boardName: b.name, brief: structuredClone(b.brief), shot: structuredClone(sh), currentPromptInput: sourceInput(s, b, sh), supplementInput: sh.prompt.input, supplementFingerprint: sh.prompt.fingerprint, currentFingerprint: sourceFingerprint(s, b, sh), keptStale: outOfDate, plannedRatio: b.brief.ratio, executionRatio: r.ratio, originalText: sh.visual, supplementText: text, finalPrompt: finalPrompt(draft), media: structuredClone(media) });
    const receipt = immutable({ id: r.id, taskId, digest, snapshot });
    let next = addCreativeTask(s, taskId, 'image', r.name, b.projectId, now);
    next = { ...next, tasks: next.tasks.map(t => t.id === taskId ? { ...t, storyboardSource: structuredClone(source), storyboardSnapshot: snapshot } : t), images: { ...next.images, [taskId]: { ...next.images[taskId], draft: immutable(draft) } }, storyboardReceipts: { ...next.storyboardReceipts, [r.id]: receipt } };
    return { state: next, receipt };
}
/** Bind before asynchronous media preparation. Failed attempts also cannot change payload under one ID. */
export function bindRequest(attempts, r) { const digest = stableJson(r), prior = attempts.get(r.id); if (prior !== undefined && prior !== digest)
    throw new Error('交接 ID 已绑定不同请求，请取消并重新预览。'); attempts.set(r.id, digest); }

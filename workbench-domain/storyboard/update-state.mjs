import { assertReference, assertPreparedReferences } from './reference-state.mjs';
import { updateImage, updateVideo } from '../management/state.mjs';
import { taskInput } from '../management/handoff-state.mjs';
import { validate } from '../studio/state.mjs';
import { videoIssues } from '../video/state.mjs';
import { immutable } from '../studio/simulation.mjs';
import { confirmationToken, sourceInput, sourceFingerprint, stale, stableJson, supplementText } from './state.mjs';
import { videoConfirmationToken, videoSource, videoFingerprint, videoStale, videoText } from './video-state.mjs';
export function linkTask(s, boardId, shotId, taskId, now) {
    const b = s.storyboards?.[boardId], t = s.tasks.find(t => t.id === taskId);
    if (!b?.shots.some(sh => sh.id === shotId) || !s.projects.some(p => p.id === b.projectId) || !t || t.projectId !== b.projectId)
        throw new Error('只能关联同项目内仍存在的任务和镜头。');
    const id = JSON.stringify([boardId, shotId, taskId]);
    if (s.storyboardLinks?.some(x => x.id === id))
        return s;
    return { ...s, storyboardLinks: [...(s.storyboardLinks || []), { id, boardId, shotId, taskId, at: now }] };
}
export function unlinkTask(s, id) { return { ...s, storyboardLinks: (s.storyboardLinks || []).filter(x => x.id !== id) }; }
export function updateTargetToken(s, id) { const t = s.tasks.find(t => t.id === id); return stableJson({ task: t && { id: t.id, name: t.name, kind: t.kind, projectId: t.projectId }, input: taskInput(s, id), origins: t?.storyboardFields }); }
export function updateSourceToken(s, b, sh, kind) { return kind === 'video' ? videoConfirmationToken(s, b, sh) : confirmationToken(s, b, sh); }
export function currentUpdate(s, r) {
    const b = s.storyboards?.[r.boardId], sh = b?.shots.find(sh => sh.id === r.shotId), task = s.tasks.find(t => t.id === r.taskId);
    if (!b || !sh || !s.projects.some(p => p.id === b.projectId) || !task || task.projectId !== b.projectId)
        throw new Error('目标或来源失效／不在同项目；未更新，也不新建替代任务。');
    if (updateSourceToken(s, b, sh, task.kind) !== r.expectedSource)
        throw new Error('来源确认内容已变化，请取消后重新查看差异。');
    if (updateTargetToken(s, task.id) !== r.expectedTarget)
        throw new Error('目标输入在确认后已变化，请取消后重新查看差异。');
    return { b, sh, task };
}
export function fieldValue(input, key) { if (key.startsWith('refs:'))
    return input.refs.find(r => r.id === key.slice(5)); return input[key]; }
export function effectiveFieldOrigins(s, id) { const input = taskInput(s, id), t = s.tasks.find(t => t.id === id); return Object.fromEntries(Object.entries(t.storyboardFields || {}).filter(([key, o]) => stableJson(fieldValue(input, key)) === o.valueSignature)); }
export function updateMediaRefs(sh, r) { const ids = [...new Set(r.media.map(m => m.sourceId))]; return ids.map(id => { const ref = sh.refs.find(x => x.id === id); if (!ref)
    throw new Error('指定的来源图片已失效。'); return ref; }); }
function writeFields(input, changes) {
    let next = structuredClone(input);
    for (const c of changes) {
        if (c.field.startsWith('refs:')) {
            const id = c.field.slice(5), i = next.refs.findIndex(x => x.id === id);
            if (c.value === undefined) {
                next.refs = next.refs.filter(x => x.id !== id);
            }
            else if (i < 0)
                next.refs = [...next.refs, structuredClone(c.value)];
            else
                next.refs = next.refs.map(x => x.id === id ? structuredClone(c.value) : x);
        }
        else
            next = { ...next, [c.field]: structuredClone(c.value) };
    }
    return next;
}
export function previewUpdate(s, r, media) {
    const { b, sh, task } = currentUpdate(s, r), input = taskInput(s, task.id), isVideo = task.kind === 'video', prompt = isVideo ? sh.video?.prompt : sh.prompt, text = isVideo ? videoText(sh) : supplementText(sh), outdated = isVideo ? videoStale(s, b, sh) : stale(s, b, sh);
    if (!r.prompt && !r.supplement && !r.media.length)
        throw new Error('请勾选至少一项更新；目前没有写入。');
    if (r.prompt && !sh.visual.trim())
        throw new Error('来源原提示词为空，不提供清空操作。');
    if (r.supplement && (!prompt || !text.trim()))
        throw new Error('来源分镜补充为空，请先整理；不提供清空操作。');
    const source = { version: 1, projectId: b.projectId, storyboardId: b.id, shotId: sh.id, shotRevision: sh.revision, snapshotId: 'update-' + r.id, handoffId: r.id, createdAt: 0, ruleVersion: prompt?.ruleVersion || (isVideo ? 'storyboard.video.zh.v1' : 'storyboard.zh.v1'), manual: !!prompt?.sections.some(x => x.manual) };
    const origins = task.storyboardFields || {}, changes = [], seen = new Set(), push = (field, after, sourceRefId) => { if (seen.has(field))
        throw new Error('同一字段只能指定一种更新。'); seen.add(field); const before = fieldValue(input, field); if (stableJson(before) === stableJson(after))
        return; changes.push({ field, before: structuredClone(before), after: structuredClone(after), beforeOrigin: origins[field], afterOrigin: { receiptId: r.id, source, field, sourceRefId, valueSignature: stableJson(after) } }); };
    if (r.prompt)
        push('prompt', sh.visual);
    if (r.supplement && !(input.storyboardSupplement?.text === text && input.storyboardSupplement.enabled))
        push('storyboardSupplement', { text, enabled: true, manual: source.manual, source });
    const chosen = updateMediaRefs(sh, r), prepared = media || chosen;
    if (prepared.length !== chosen.length || prepared.some((m, i) => m.id !== chosen[i].id || m.assetId !== chosen[i].assetId || stableJson(m.stageSource) !== stableJson(chosen[i].stageSource)))
        throw new Error('媒体与确认来源不匹配。');
    for (const [i, op] of r.media.entries()) {
        const ref = prepared.find(x => x.id === op.sourceId);
        if (!ref)
            throw new Error('来源图片不可用。');
        assertReference(s, ref);
        const value = { ...structuredClone(ref), id: op.target === 'replace' ? op.replaceId : 'sb-u-' + r.id + '-' + i };
        if (op.target === 'append')
            push('refs:' + value.id, value, op.sourceId);
        else if (op.target === 'replace') {
            if (!op.replaceId || !input.refs.some(x => x.id === op.replaceId))
                throw new Error('请选择仍存在的目标引用ID。');
            push('refs:' + op.replaceId, value, op.sourceId);
        }
        else if (op.target === 'first' || op.target === 'last') {
            if (!isVideo || op.target === 'first' && input.mode === 'text' || op.target === 'last' && input.mode !== 'frames')
                throw new Error('指定帧用途与目标当前模式不兼容；请到原任务调整，不自动切模式或清图。');
            push(op.target, value, op.sourceId);
        }
        else
            throw new Error('未知图片用途。');
    }
    if (!changes.length)
        throw new Error('没有实际差异；未制造更新记录。');
    const next = writeFields(input, changes.map(c => ({ field: c.field, value: c.after }))), issues = isVideo ? videoIssues(next).map(x => x.message) : validate(next);
    if (issues.length)
        throw new Error(issues.join(' ') + ' 请先到原任务调整；本轮不修改模型、模式或参数。仅为Mock能力。');
    const unchanged = ['prompt', 'storyboardSupplement', 'supplement', 'first', 'last', 'refs', 'model', 'mode', 'ratio', 'duration', 'resolution', 'count', 'compare', 'scenario'].filter(k => (k in input) && !changes.some(c => c.field === k || k === 'refs' && c.field.startsWith('refs:')));
    return { input, next, changes, source, outdated, unchanged, b, sh, task, prompt };
}
export function bindUpdateRequest(attempts, r) { const digest = stableJson(r), prior = attempts.get(r.id); if (prior !== undefined && prior !== digest)
    throw new Error('同一交接ID已绑定不同请求，请重新预览。'); attempts.set(r.id, digest); }
export function applyTaskUpdate(s, r, media, now) {
    const digest = stableJson({ request: r, media }), prior = s.storyboardUpdates?.[r.id];
    if (prior) {
        if (prior.digest !== digest)
            throw new Error('同一交接ID请求不同，拒绝重用。');
        return { state: s, receipt: prior };
    }
    const p = previewUpdate(s, r, media);
    assertPreparedReferences(s, updateMediaRefs(p.sh, r), media);
    if (r.supplement && p.outdated && !r.allowStale)
        throw new Error('整理来源已过期，请重整或明确沿用旧补充；未更新。');
    if (media.some(m => !/^data:image\/(png|jpeg|webp);base64,/.test(m.src)))
        throw new Error('媒体快照无效，未更新。');
    const source = { ...p.source, createdAt: now }, changes = p.changes.map(c => { let after = c.after; if (c.field === 'storyboardSupplement')
        after = { ...after, source }; return { ...c, after, afterOrigin: { ...c.afterOrigin, source, valueSignature: stableJson(after) } }; });
    const snapshot = { source, shot: structuredClone(p.sh), currentInput: p.task.kind === 'video' ? videoSource(s, p.b, p.sh) : sourceInput(s, p.b, p.sh), supplementInput: r.supplement ? p.prompt?.input : undefined, currentFingerprint: p.task.kind === 'video' ? videoFingerprint(s, p.b, p.sh) : sourceFingerprint(s, p.b, p.sh), supplementFingerprint: r.supplement ? p.prompt?.fingerprint : undefined, keptStale: r.supplement && p.outdated };
    const receipt = immutable({ id: r.id, taskId: r.taskId, at: now, digest, source: snapshot, changes, unchanged: p.unchanged }), nextInput = writeFields(p.input, changes.map(c => ({ field: c.field, value: c.after })));
    let next = p.task.kind === 'image' ? updateImage(s, r.taskId, d => ({ ...d, draft: immutable(nextInput) }), now) : updateVideo(s, r.taskId, d => ({ ...d, draft: immutable(nextInput) }), now);
    next = linkTask(next, r.boardId, r.shotId, r.taskId, now);
    next = { ...next, tasks: next.tasks.map(t => t.id === r.taskId ? { ...t, storyboardFields: { ...t.storyboardFields, ...Object.fromEntries(changes.map(c => [c.field, c.afterOrigin])) } } : t), storyboardUpdates: { ...next.storyboardUpdates, [r.id]: receipt } };
    return { state: next, receipt };
}
export function undoTaskUpdate(s, id, now) {
    const r = s.storyboardUpdates?.[id];
    if (!r)
        throw new Error('更新记录不可用。');
    if (r.undone)
        return s;
    const input = taskInput(s, r.taskId), t = s.tasks.find(t => t.id === r.taskId);
    if (t.projectId !== r.source.source.projectId)
        throw new Error('目标已移出来源项目，不能撤销。');
    for (const c of r.changes)
        if (stableJson(fieldValue(input, c.field)) !== stableJson(c.after) || stableJson(t.storyboardFields?.[c.field]) !== stableJson(c.afterOrigin))
            throw new Error('撤销冲突：受影响字段之后已修改；整笔没有还原。');
    const nextInput = writeFields(input, r.changes.map(c => ({ field: c.field, value: c.before }))), origins = { ...t.storyboardFields };
    for (const c of r.changes) {
        if (c.beforeOrigin)
            origins[c.field] = c.beforeOrigin;
        else
            delete origins[c.field];
    }
    const next = t.kind === 'image' ? updateImage(s, r.taskId, d => ({ ...d, draft: nextInput }), now) : updateVideo(s, r.taskId, d => ({ ...d, draft: nextInput }), now);
    return { ...next, tasks: next.tasks.map(t => t.id === r.taskId ? { ...t, storyboardFields: origins } : t), storyboardUpdates: { ...next.storyboardUpdates, [r.id]: immutable({ ...r, undone: true, undoneAt: now }) } };
}

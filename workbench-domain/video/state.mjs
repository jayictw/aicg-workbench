import { finalPrompt } from '../studio/stage-handoff-types.mjs';
import { characterCount } from '../studio/state.mjs';
import { advance, immutable, retry, taskGroupStatus } from '../studio/simulation.mjs';
import { modeLabels, sampleVideo, videoMock, videoModels } from './mock.mjs';
export const videoInitial = () => ({ mode: 'text', prompt: '', first: null, last: null, refs: [], model: 'veo', compare: false, compareModels: [], ratio: '16:9', duration: 4, resolution: '360p', count: 2, scenario: 'partial' });
export const videoFingerprint = (d) => JSON.stringify(d);
export const videoSelected = (d) => [...new Set([d.model, ...(d.compare ? d.compareModels : [])])];
export function videoInputs(d) {
    return { effective: { first: d.mode !== 'text' ? d.first : null, last: d.mode === 'frames' ? d.last : null, refs: d.refs }, retained: { first: d.mode === 'text' ? d.first : null, last: d.mode !== 'frames' ? d.last : null } };
}
export function videoIssues(d) {
    const issues = [];
    const add = (field, message) => issues.push({ field, message });
    if (!finalPrompt(d).trim())
        add('video-prompt', '请填写完整提示词。');
    if (d.mode !== 'text' && !d.first)
        add('video-first', '当前模式需要首帧，请选择一张图片。');
    if (d.mode === 'frames' && !d.last)
        add('video-last', '首尾帧模式需要尾帧，请选择一张图片。');
    if (d.compare && videoSelected(d).length < 2)
        add('video-comparison', '多模型比较请再选择一个模型。');
    for (const model of videoSelected(d)) {
        const c = videoMock[model], prefix = `${videoModels[model]}（${c.profile}，模拟规则）`;
        if (!c.modes.includes(d.mode))
            add('video-mode', `${prefix} 不兼容${modeLabels[d.mode]}，请调整模式或模型。`);
        if (!c.ratios.includes(d.ratio))
            add('video-ratio', `${prefix} 不兼容比例 ${d.ratio}，请手动调整。`);
        if (!c.durations.includes(d.duration))
            add('video-duration', `${prefix} 不兼容模拟时长 ${d.duration} 秒，请手动调整。`);
        if (!c.resolutions.includes(d.resolution))
            add('video-resolution', `${prefix} 不兼容模拟分辨率 ${d.resolution}，请手动调整。`);
        if (!Number.isInteger(d.count) || d.count < 1 || d.count > c.maxCount)
            add('video-count', `${prefix} 每模型演示 1–${c.maxCount} 段，请调整数量。`);
        if (d.refs.length > c.maxRefs)
            add('video-refs', `${prefix} 最多演示 ${c.maxRefs} 张参考图，当前 ${d.refs.length} 张；首尾帧另计。`);
        if (characterCount(d.refs) > c.maxCharacters)
            add('video-refs', `${prefix} 最多演示 ${c.maxCharacters} 个角色，当前 ${characterCount(d.refs)} 个。`);
    }
    return issues;
}
export function videoCreate() { const draft = videoInitial(); return { draft, baseline: videoFingerprint(draft), batches: [] }; }
export function videoEdit(s, patch) { return { ...s, draft: { ...s.draft, ...patch } }; }
export function videoPending(s) { return s.batches.some(b => b.tasks.some(t => t.status === 'queued' || t.status === 'running') && videoFingerprint(b.snapshot.input) === videoFingerprint(s.draft)); }
export function videoSubmit(s, id, now) {
    if (videoPending(s))
        return s;
    const issues = videoIssues(s.draft);
    if (issues.length)
        throw new Error(issues.map(i => i.message).join(' '));
    const snapshot = immutable({ input: s.draft, ...videoInputs(s.draft) });
    const tasks = videoSelected(s.draft).flatMap(model => Array.from({ length: s.draft.count }, (_, index) => ({ id: `${id}-${model}-${index}`, model, index, favorite: false, src: sampleVideo.src, status: 'queued', attempt: 1, startedAt: now, willFail: s.draft.scenario === 'failure' || s.draft.scenario === 'partial' && index % 2 === 1 })));
    return { ...s, batches: [{ id, createdAt: now, snapshot, finalPrompt: finalPrompt(snapshot.input), tasks }, ...s.batches] };
}
export function videoTick(s, now) {
    let changed = false;
    const batches = s.batches.map(b => ({ ...b, tasks: b.tasks.map(t => { const next = advance(t, now); if (next !== t)
            changed = true; return next; }) }));
    return changed ? { ...s, batches } : s;
}
export function videoRetry(s, batchId, taskId, now) { return { ...s, batches: s.batches.map(b => b.id !== batchId ? b : { ...b, tasks: b.tasks.map(t => !taskId || t.id === taskId ? retry(t, now) : t) }) }; }
export function videoFavorite(s, taskId) { return { ...s, batches: s.batches.map(b => ({ ...b, tasks: b.tasks.map(t => t.id === taskId && t.status === 'completed' ? { ...t, favorite: !t.favorite } : t) })) }; }
export function videoApply(s, snapshot) { const draft = structuredClone(snapshot.input); return { ...s, draft, baseline: videoFingerprint(draft) }; }
export const videoBatchStatus = (b) => taskGroupStatus(b.tasks);
export const videoNeedsTransferConfirm = (s) => videoFingerprint(s.draft) !== videoFingerprint(videoInitial());
// Transfers only the requested frame and mode. Neither studio's tasks are touched.
export const videoTransfer = (s, image) => videoEdit(s, { first: structuredClone(image), mode: 'first' });

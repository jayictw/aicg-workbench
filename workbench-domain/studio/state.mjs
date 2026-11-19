import { finalPrompt } from './stage-handoff-types.mjs';
import { advance, immutable, retry, taskGroupStatus } from './simulation.mjs';
export const categories = [{ id: 'product', label: '产品' }, { id: 'character', label: '角色' }, { id: 'scene', label: '场景' }, { id: 'style', label: '风格' }];
export const modelLabels = { google: 'Google 图像', gpt: 'OpenAI（示例）', seedream: '火山方舟 Seedream（示例）' };
// Independent, fictional profiles for this prototype; never official provider limits.
export const mockCapabilities = {
    google: { profile: 'Mock A', ratios: ['1:1', '4:3', '3:4', '16:9'], resolutions: ['1K', '2K'], maxRefs: 8, maxCharacters: 2, maxCount: 4 },
    gpt: { profile: 'Mock B', ratios: ['1:1', '3:4'], resolutions: ['1K', '2K'], maxRefs: 4, maxCharacters: 1, maxCount: 2 },
    seedream: { profile: 'Mock C', ratios: ['1:1', '4:3', '16:9'], resolutions: ['2K', '4K'], maxRefs: 6, maxCharacters: 2, maxCount: 4 },
};
export const initialDraft = () => ({ prompt: '', refs: [], model: 'google', compare: false, compareModels: [], ratio: '1:1', resolution: '1K', count: 2, scenario: 'partial' });
export const fingerprint = (draft) => JSON.stringify(draft);
export const selectedModels = (draft) => [...new Set([draft.model, ...(draft.compare ? draft.compareModels : [])])];
export const characterCount = (refs) => new Set(refs.filter(r => r.category === 'character').map(r => r.entityId)).size;
export function validate(draft) {
    const errors = [];
    if (!finalPrompt(draft).trim())
        errors.push('请填写完整提示词。');
    if (draft.compare && selectedModels(draft).length < 2)
        errors.push('多模型比较请至少再选择一个模型。');
    for (const id of selectedModels(draft)) {
        const c = mockCapabilities[id], prefix = `${modelLabels[id]}（${c.profile}）`;
        if (!c.ratios.includes(draft.ratio))
            errors.push(`${prefix} 不兼容比例 ${draft.ratio}，请手动调整。`);
        if (!c.resolutions.includes(draft.resolution))
            errors.push(`${prefix} 不兼容分辨率 ${draft.resolution}，请手动调整。`);
        if (draft.count > c.maxCount)
            errors.push(`${prefix} 最多演示 ${c.maxCount} 张，请手动调整数量。`);
        if (draft.refs.length > c.maxRefs)
            errors.push(`${prefix} 最多演示 ${c.maxRefs} 张参考图，当前 ${draft.refs.length} 张。`);
        if (characterCount(draft.refs) > c.maxCharacters)
            errors.push(`${prefix} 最多演示 ${c.maxCharacters} 个角色，当前 ${characterCount(draft.refs)} 个。`);
    }
    return errors;
}
export function makeBatch(draft, id, now) {
    const errors = validate(draft);
    if (errors.length)
        throw new Error(errors.join(' '));
    const snapshot = immutable(draft);
    const tasks = selectedModels(snapshot).flatMap(model => Array.from({ length: snapshot.count }, (_, index) => ({ id: `${id}-${model}-${index}`, model, index, status: 'queued', attempt: 1, startedAt: now, willFail: snapshot.scenario === 'failure' || snapshot.scenario === 'partial' && index % 2 === 1, favorite: false, src: `/assets/${['ribbon', 'landscape', 'objects', 'orbit'][(index + { google: 0, gpt: 1, seedream: 2 }[model]) % 4]}.svg` })));
    return { id, createdAt: now, snapshot, finalPrompt: finalPrompt(snapshot), tasks };
}
export function createState() { const draft = initialDraft(); return { draft, baseline: fingerprint(draft), batches: [] }; }
export function edit(state, patch) { return { ...state, draft: { ...state.draft, ...patch } }; }
export function hasPendingInput(state) {
    const input = fingerprint(state.draft);
    return state.batches.some(batch => batch.tasks.some(task => task.status === 'queued' || task.status === 'running') && fingerprint(batch.snapshot) === input);
}
export function submit(state, id, now) {
    if (hasPendingInput(state))
        return state;
    return { ...state, batches: [makeBatch(state.draft, id, now), ...state.batches] };
}
export function tick(state, now) {
    let changed = false;
    const batches = state.batches.map(batch => ({ ...batch, tasks: batch.tasks.map(task => {
            const next = advance(task, now);
            if (next !== task)
                changed = true;
            return next;
        }) }));
    return changed ? { ...state, batches } : state;
}
export function retryFailed(state, batchId, taskId, now) {
    return { ...state, batches: state.batches.map(batch => batch.id !== batchId ? batch : { ...batch, tasks: batch.tasks.map(task => task.status === 'failed' && (!taskId || task.id === taskId) ? retry(task, now) : task) }) };
}
export function toggleFavorite(state, id) { return { ...state, batches: state.batches.map(batch => ({ ...batch, tasks: batch.tasks.map(task => task.id === id && task.status === 'completed' ? { ...task, favorite: !task.favorite } : task) })) }; }
export function applySnapshot(state, snapshot) { const draft = structuredClone(snapshot); return { ...state, draft, baseline: fingerprint(draft) }; }
export function batchStatus(batch) { return taskGroupStatus(batch.tasks); }

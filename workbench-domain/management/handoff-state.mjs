import { updateImage, updateVideo } from './state.mjs';
import { validate } from '../studio/state.mjs';
import { videoIssues } from '../video/state.mjs';
import { immutable } from '../studio/simulation.mjs';
export function taskInput(s, id) { const task = s.tasks.find(t => t.id === id); const input = task?.kind === 'image' ? s.images[id]?.draft : task?.kind === 'video' ? s.videos[id]?.draft : undefined; if (!input)
    throw new Error('来源任务已失效；未写入任何内容。'); return input; }
export function handoffToken(s, id) { const t = s.tasks.find(t => t.id === id); return JSON.stringify({ task: t && { id: t.id, name: t.name, kind: t.kind, projectId: t.projectId }, input: taskInput(s, id) }); }
export function sourcesMatch(image, text) { return !image || !text || !!image.stageSource && image.stageSource.taskId === text.source.taskId && image.stageSource.sceneSignature === text.source.sceneSignature; }
function setInput(s, id, patch, now) { return s.tasks.find(t => t.id === id)?.kind === 'image' ? updateImage(s, id, d => ({ ...d, draft: { ...d.draft, ...patch } }), now) : updateVideo(s, id, d => ({ ...d, draft: { ...d.draft, ...patch } }), now); }
export function applyHandoff(s, r, now) {
    const old = taskInput(s, r.taskId), task = s.tasks.find(t => t.id === r.taskId);
    if (handoffToken(s, r.taskId) !== r.expected)
        throw new Error('确认后来源任务内容已变化。请关闭确认窗、检查新输入后重新确认；本次没有写入。');
    if (!r.image && !r.supplement)
        throw new Error('请选择有效图片或文字。');
    if (r.image && (!r.image.ref.src.startsWith('data:image/png;base64,') || !r.image.ref.stageSource?.outputId))
        throw new Error('参考图数据不可用，请重新输出。');
    for (const p of [r.image?.ref.stageSource, r.supplement?.source])
        if (p && (p.taskId !== r.taskId || !p.snapshotId || !p.sceneSignature))
            throw new Error('来源任务或快照不匹配，未写入。');
    if (r.supplement && !r.supplement.text.trim())
        throw new Error('补充文字为空，不能覆盖任务。');
    if (!sourcesMatch(r.image?.ref, r.supplement))
        throw new Error('图片与文字来自不同场景快照，请先选择处理方式。');
    const patch = {};
    if (r.supplement)
        patch.supplement = structuredClone(r.supplement);
    if (r.image) {
        const { ref, target, replaceId } = r.image;
        const image = structuredClone(ref);
        if (target === 'append') {
            const existing = old.refs.find(x => x.stageSource?.outputId === image.stageSource?.outputId && x.stageSource?.taskId === r.taskId);
            patch.refs = existing ? old.refs.map(x => x === existing ? { ...image, id: x.id } : x) : [...old.refs, image];
        }
        else if (target === 'replace') {
            if (task.kind !== 'image' || !replaceId || !old.refs.some(x => x.id === replaceId))
                throw new Error('请选择仍存在的被替换参考图。');
            patch.refs = old.refs.map(x => x.id === replaceId ? image : x);
        }
        else {
            if (task.kind !== 'video')
                throw new Error('图片任务不能写入视频帧。');
            const mode = r.videoMode ?? old.mode;
            if (target === 'last' && mode !== 'frames' || target === 'first' && mode === 'text')
                throw new Error('该用途需要明确选择首帧或首尾帧模式；原模式与输入保持。');
            Object.assign(patch, { [target]: image });
            if (mode !== old.mode)
                Object.assign(patch, { mode });
        }
    }
    const next = { ...old, ...patch };
    const normalVideo = task.kind === 'video' && !!old.creationInput && (!r.image || r.image.target === 'append') && !r.videoMode;
    const issues = normalVideo ? [] : task.kind === 'image' ? validate(next).filter(e => e !== '请填写完整提示词。') : videoIssues(next).filter(i => !['video-prompt', 'video-first', 'video-last'].includes(i.field)).map(i => i.message);
    if (issues.length)
        throw new Error(issues.join(' ') + ' 未修改任何输入；请先在任务调整兼容设置或释放容量。以上仅为原型Mock规则。');
    const before = {}, after = {};
    for (const key of Object.keys(patch)) {
        Object.assign(before, { [key]: structuredClone(old[key]) });
        Object.assign(after, { [key]: structuredClone(next[key]) });
    }
    const receipt = immutable({ id: r.id, taskId: r.taskId, at: now, before, after, fields: Object.keys(patch) });
    return { state: setInput(s, r.taskId, structuredClone(patch), now), receipt };
}
export function undoHandoff(s, r, now) {
    if (r.undone)
        throw new Error('本次套回已撤销。');
    const input = taskInput(s, r.taskId);
    for (const key of r.fields)
        if (JSON.stringify(input[key]) !== JSON.stringify(r.after[key]))
            throw new Error('撤销冲突：本次修改的字段之后又被编辑；已保留新输入，没有还原。');
    return setInput(s, r.taskId, structuredClone(r.before), now);
}

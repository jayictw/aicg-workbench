import { executeCommand, commandTarget } from './commands.mjs';
import { generated } from '../generated/store.mjs';
import { emptyCreationDraft } from '../creation/input-state.mjs';
import { selectStageImage } from '../storyboard/stage-images-state.mjs';
import { linkTask, unlinkTask, applyTaskUpdate, undoTaskUpdate, bindUpdateRequest } from '../storyboard/update-state.mjs';
import { createVideoFromShot } from '../storyboard/video-state.mjs';
import { putBoard, createFromShot, bindRequest, stableJson } from '../storyboard/state.mjs';
import { applyHandoff, undoHandoff } from './handoff-state.mjs';
import { applyStageSettings, activateTask, addAsset, editAsset, editCreativeTask, saveEntity, tickWorkspace, toggleAsset, updateImage, updateVideo, workspaceInitial } from './state.mjs';
let state = workspaceInitial();
const listeners = new Set();
let timer;
function commit(next) { if (next === state)
    return; state = next; listeners.forEach(f => f()); }
function schedule() { if (timer)
    return; timer = setInterval(() => { commit(tickWorkspace(state, Date.now())); const all = [...Object.values(state.images), ...Object.values(state.videos)]; if (!all.some(d => d.batches.some(b => b.tasks.some(t => t.status === 'queued' || t.status === 'running')))) {
    clearInterval(timer);
    timer = undefined;
} }, 150); }
const updateAttempts = new Map();
const storyboardAttempts = new Map();
const receipts = new Map(), latest = new Map(), handoffDigests = new Map();
function business(c, receipt, nativeProjectId) {
    const task = state.tasks.find(t => t.id === c.id), g = generated.draft(c.id);
    let next = executeCommand(state, c, Date.now());
    if (nativeProjectId !== undefined) {
        if (c.kind !== 'task-edit')
            throw Error('MCP_ARGUMENTS');
        next = editCreativeTask(next, c.id, c.name ?? next.tasks.find(t => t.id === c.id).name, nativeProjectId, Date.now());
    }
    const fields = Object.keys(c).filter(k => ['name', 'description', 'prompt'].includes(k));
    next = { ...next, controlledChangesVersion: 1, commandRevisions: { ...next.commandRevisions, [c.id]: (next.commandRevisions?.[c.id] || 0) + 1 }, commandAudit: [...(next.commandAudit || []), { id: c.id, actor: receipt?.actor || 'native-user', fields, at: Date.now() }] };
    if (receipt)
        next = { ...next, changeReceipts: [...(next.changeReceipts || []), receipt] };
    if (c.prompt !== undefined && task)
        generated.putDraft({ ...g || emptyCreationDraft(c.id, task.kind), prompt: c.prompt });
    commit(next);
    return c.id;
}
export const workspace = {
    business,
    commandTarget: (kind, id) => commandTarget(state, kind, id),
    replaceControlled: (next) => commit(next),
    creationEdit: (id, patch) => { if (patch.prompt !== undefined) {
        business({ kind: 'task-edit', id, prompt: patch.prompt });
        const { prompt: _, ...rest } = patch;
        patch = rest;
    } const task = state.tasks.find(t => t.id === id); if (!task)
        return; const current = (task.kind === 'image' ? state.images[id] : state.videos[id])?.draft; if (!current || Object.entries(patch).every(([k, v]) => JSON.stringify(current[k]) === JSON.stringify(v)))
        return; commit(task.kind === 'image' ? updateImage(state, id, d => ({ ...d, draft: { ...d.draft, ...structuredClone(patch) } }), Date.now()) : updateVideo(state, id, d => ({ ...d, draft: { ...d.draft, ...structuredClone(patch) } }), Date.now())); },
    acceptSourceTask: (task) => { if (state.tasks.some(x => x.id === task.id))
        return; if (!['image', 'video'].includes(task.kind) || task.projectId !== null)
        throw Error('C_D1_TASK_KIND'); commit({ ...state, tasks: [structuredClone(task), ...state.tasks], [task.kind === 'image' ? 'activeImage' : 'activeVideo']: task.id }); },
    selectStageImage: (r, image) => { const result = selectStageImage(state, r, image, Date.now()); commit(result.state); return result.receipt; },
    linkTask: (b, sh, t) => commit(linkTask(state, b, sh, t, Date.now())),
    unlinkTask: (id) => commit(unlinkTask(state, id)),
    reserveTaskUpdate: (r) => bindUpdateRequest(updateAttempts, r),
    updateTaskInputs: (r, media) => { bindUpdateRequest(updateAttempts, r); const result = applyTaskUpdate(state, r, media, Date.now()); commit(result.state); return result.receipt; },
    undoTaskUpdate: (id) => commit(undoTaskUpdate(state, id, Date.now())),
    handoff: (request) => { const prior = receipts.get(request.id); if (prior) {
        if (prior.taskId !== request.taskId || handoffDigests.get(request.id) !== 'm5.v1:' + stableJson(request))
            throw new Error('提交识别绑定不同内容；请重新确认。');
        return prior;
    } const result = applyHandoff(state, request, Date.now()); handoffDigests.set(request.id, 'm5.v1:' + stableJson(request)); receipts.set(request.id, result.receipt); latest.set(request.taskId, result.receipt); commit(result.state); return result.receipt; },
    handoffReceipt: (id) => latest.get(id),
    undoHandoff: (id) => { const r = latest.get(id); if (!r)
        throw new Error('没有可撤销的套回。'); const next = undoHandoff(state, r, Date.now()); const undone = { ...r, undone: true }; latest.set(id, undone); receipts.set(r.id, undone); commit(next); },
    board: (b) => commit(putBoard(state, b)),
    reserveStoryboardRequest: (r) => bindRequest(storyboardAttempts, r),
    createFromShot: (r, media) => { bindRequest(storyboardAttempts, r); const result = createFromShot(state, r, media, crypto.randomUUID(), Date.now()); commit(result.state); return result.receipt; },
    createVideoFromShot: (r, media) => { bindRequest(storyboardAttempts, r); const result = createVideoFromShot(state, r, media, crypto.randomUUID(), Date.now()); commit(result.state); return result.receipt; },
    get: () => state,
    applyStage: (id, settings) => commit(applyStageSettings(state, id, settings, Date.now())),
    subscribe: (fn) => { listeners.add(fn); return () => { listeners.delete(fn); }; },
    createProject: (name, description = '') => { const id = crypto.randomUUID(); business({ kind: 'project-create', id, name, description }); return id; },
    editProject: (id, name, description) => business({ kind: 'project-edit', id, name, description }),
    createTask: (kind, name, projectId = null) => { const id = crypto.randomUUID(); business({ kind: 'task-create', id, taskKind: kind, name, projectId }); return id; },
    activate: (id) => { const t = state.tasks.find(t => t.id === id); if (!t)
        return false; const active = t.kind === 'image' ? state.activeImage : state.activeVideo; if (active !== id)
        commit(activateTask(state, id)); return true; },
    editTask: (id, name, projectId) => business({ kind: 'task-edit', id, name }, undefined, projectId),
    image: (id, fn) => { commit(updateImage(state, id, fn, Date.now())); schedule(); },
    video: (id, fn) => { commit(updateVideo(state, id, fn, Date.now())); schedule(); },
    addAsset: (asset) => commit(addAsset(state, asset)),
    editAsset: (id, patch) => commit(editAsset(state, id, patch, Date.now())),
    favoriteAsset: (id) => commit(toggleAsset(state, id)),
    saveEntity: (entity, staged = []) => commit(saveEntity(state, entity, staged)),
    favoriteEntity: (id) => { const e = state.entities.find(e => e.id === id); if (e)
        commit(saveEntity(state, { ...e, favorite: !e.favorite })); },
};
export function taskHref(kind, id) { return `#/${kind}?task=${encodeURIComponent(id)}`; }
export function openTask(id) { const task = state.tasks.find(t => t.id === id); if (task) {
    workspace.activate(id);
    window.location.hash = taskHref(task.kind, id).slice(1);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
} }
export function captureBusiness() { return { workspace: state, maps: { receipts: [...receipts], latest: [...latest], handoffDigests: [...handoffDigests].filter(([id]) => receipts.has(id)), storyboardAttempts: [...storyboardAttempts].filter(([id]) => !!state.storyboardReceipts?.[id]), updateAttempts: [...updateAttempts].filter(([id]) => !!state.storyboardUpdates?.[id]) } }; }
export function restoreBusiness(data) { if (timer) {
    clearInterval(timer);
    timer = undefined;
} if (data.maps.receipts.some(([id]) => !data.maps.handoffDigests?.some(([key]) => key === id)))
    throw new Error('成功套回收据缺少请求摘要；拒绝不完整恢复。'); receipts.clear(); latest.clear(); handoffDigests.clear(); storyboardAttempts.clear(); updateAttempts.clear(); for (const [k, v] of data.maps.handoffDigests || [])
    handoffDigests.set(k, v); for (const [k, v] of data.maps.receipts)
    receipts.set(k, v); for (const [k, v] of data.maps.latest)
    latest.set(k, v); for (const [k, v] of data.maps.storyboardAttempts)
    storyboardAttempts.set(k, v); for (const [k, v] of data.maps.updateAttempts)
    updateAttempts.set(k, v); state = data.workspace; listeners.forEach(f => f()); }

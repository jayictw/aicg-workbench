import { stageIssues } from './state.mjs';
const listeners = new Set();
let libraryId = '', records = {};
const copy = (v) => structuredClone(v);
function canonical(v) { if (Array.isArray(v))
    return '[' + v.map(canonical).join(',') + ']'; if (v && typeof v === 'object')
    return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}'; return JSON.stringify(v); }
export const appliedSignature = (scene, ratio) => 'stage-baseline.v1:' + canonical(scene ? { scene } : { absent: true, ratio });
function keys(v, allowed) { if (!v || typeof v !== 'object' || Array.isArray(v) || Object.keys(v).some(k => !allowed.includes(k)))
    throw Error('SCENE_DRAFT_SCHEMA'); }
export function validScene(v) {
    keys(v, ['version', 'ratio', 'subject', 'normalize', 'scale', 'target', 'root', 'pose', 'camera', 'light', 'ambient', 'backdrop']);
    if (![1, 2].includes(v.version) || typeof v.normalize !== 'boolean' || !Number.isFinite(v.scale) || !Number.isFinite(v.ambient))
        throw Error('SCENE_DRAFT_SCHEMA');
    keys(v.subject, v.subject.kind === 'builtin' ? ['kind', 'id'] : ['kind', 'source', 'id', 'name', 'size', 'modified', ...(v.version === 2 ? ['contentId'] : [])]);
    if (v.subject.kind === 'builtin') {
        if (!['person', 'box', 'cylinder'].includes(v.subject.id))
            throw Error('SCENE_DRAFT_SUBJECT');
    }
    else if (v.subject.kind !== 'glb' || !['local', 'entity'].includes(v.subject.source) || !v.subject.id || typeof v.subject.name !== 'string' || !Number.isSafeInteger(v.subject.size) || v.subject.size < 0 || !Number.isFinite(v.subject.modified))
        throw Error('SCENE_DRAFT_SUBJECT');
    if (v.subject.kind === 'glb' && v.version === 2 && (!/^m-[a-f0-9]{64}$/.test(v.subject.contentId || '') || v.subject.size < 28 || v.subject.size > 20 * 1024 * 1024))
        throw Error('MODEL_BINDING_SCHEMA');
    keys(v.camera, ['position', 'rotation', 'aim', 'focalLengthMm', 'depthOfField']);
    keys(v.light, ['position', 'rotation', 'aim', 'power']);
    if (!['free', 'target'].includes(v.camera.aim) || !['free', 'target'].includes(v.light.aim))
        throw Error('SCENE_DRAFT_AIM');
    if (v.root)
        keys(v.root, ['position', 'rotation']);
    if (v.pose) {
        keys(v.pose, ['version', 'joints']);
        if (v.pose.version !== 1)
            throw Error('SCENE_DRAFT_POSE');
    }
    if (v.camera.depthOfField)
        keys(v.camera.depthOfField, ['enabled', 'focusDistance', 'strength']);
    keys(v.backdrop, ['mode', 'show', 'color', 'image', 'fit', 'hdr', 'rotation', 'backgroundIntensity', 'lighting', 'environmentIntensity', 'ground']);
    if (!['color', 'image', 'hdr'].includes(v.backdrop.mode) || !['cover', 'contain'].includes(v.backdrop.fit) || ['show', 'lighting', 'ground'].some(k => typeof v.backdrop[k] !== 'boolean'))
        throw Error('SCENE_DRAFT_BACKDROP');
    for (const kind of ['image', 'hdr']) {
        const ref = v.backdrop[kind];
        if (ref) {
            keys(ref, ['kind', 'id', 'name', 'size', 'modified']);
            if (ref.kind !== kind || !ref.id || typeof ref.name !== 'string' || !Number.isSafeInteger(ref.size) || !Number.isFinite(ref.modified))
                throw Error('SCENE_DRAFT_FILE');
        }
    }
    const issues = stageIssues(v);
    if (issues.length)
        throw Error('SCENE_DRAFT_INVALID: ' + issues.join('；'));
}
export function validateDrafts(list, id, tasks) { if (!Array.isArray(list))
    throw Error('SCENE_DRAFT_LIST'); const seen = new Set(); for (const d of list) {
    keys(d, ['version', 'libraryId', 'projectId', 'taskId', 'draftId', 'revision', 'baseAppliedSignature', 'createdAt', 'updatedAt', 'scene']);
    if (d.version !== 1 || d.libraryId !== id || !d.taskId || !d.draftId || !Number.isSafeInteger(d.revision) || d.revision < 1 || !Number.isFinite(d.createdAt) || !Number.isFinite(d.updatedAt) || !d.baseAppliedSignature.startsWith('stage-baseline.v1:') || seen.has(d.taskId))
        throw Error('SCENE_DRAFT_SCOPE');
    const task = tasks.find(t => t.id === d.taskId);
    if (!task || (task.projectId || null) !== d.projectId)
        throw Error('SCENE_DRAFT_TASK_MISSING_OR_MOVED');
    seen.add(d.taskId);
    validScene(d.scene);
} }
const emit = () => listeners.forEach(f => f());
export const sceneDrafts = { subscribe: (f) => { listeners.add(f); return () => { listeners.delete(f); }; }, library: () => libraryId, get: (taskId) => records[taskId], list: () => copy(Object.values(records)), scenes: () => Object.fromEntries(Object.values(records).map(d => ['draft:' + d.taskId, d.scene])),
    bind(id, list = [], tasks = []) { validateDrafts(list, id, tasks); libraryId = id; records = Object.fromEntries(copy(list).map(d => [d.taskId, d])); emit(); },
    put(taskId, projectId, scene, baseline) { if (!libraryId)
        return; validScene(scene); const old = records[taskId]; if (old && old.libraryId === libraryId && old.projectId === projectId && canonical(old.scene) === canonical(scene) && old.baseAppliedSignature === baseline)
        return; const now = Date.now(); records = { ...records, [taskId]: { version: 1, libraryId, projectId, taskId, draftId: old?.draftId || crypto.randomUUID(), revision: (old?.revision || 0) + 1, baseAppliedSignature: baseline, createdAt: old?.createdAt || now, updatedAt: now, scene: copy(scene) } }; emit(); },
    remove(taskId) { if (records[taskId]) {
        records = { ...records };
        delete records[taskId];
        emit();
    } },
    clear() { records = {}; libraryId = ''; emit(); } };

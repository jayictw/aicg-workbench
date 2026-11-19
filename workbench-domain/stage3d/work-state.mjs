import { validScene } from './draft-state.mjs';
const listeners = new Set();
let lib = 'browser-session', epoch = 0, records = {};
const copy = (v) => structuredClone(v), emit = () => listeners.forEach(f => f());
const keys = (v, allowed) => { if (!v || typeof v !== 'object' || Array.isArray(v) || Object.keys(v).some(k => !allowed.includes(k)))
    throw Error('STAGE_WORK_SCHEMA'); };
const date = (s) => typeof s === 'string' && Number.isFinite(Date.parse(s));
export function validatePromptSource(s, id, encoded = false) { keys(s, ['version', 'id', 'kind', 'task', 'at', 'scene', 'evidence', 'sceneSignature']); if (s.version !== 1 || typeof s.id !== 'string' || !s.id || !['draft', 'output'].includes(s.kind) || s.task?.id !== id || !['image', 'video'].includes(s.task.kind) || typeof s.task.name !== 'string' || !date(s.at) || (!encoded || typeof s.sceneSignature === 'string' ? s.sceneSignature !== JSON.stringify(s.scene) : !(s.sceneSignature?.$evidence)))
    throw Error('STAGE_WORK_SOURCE'); validScene(s.scene); if (!s.evidence || !['outside', 'intersects', 'unavailable'].includes(s.evidence.composition?.state) || !['off', 'active', 'fallback', 'unknown'].includes(s.evidence.effect?.state) || typeof s.evidence.effect.reason !== 'string' || s.evidence.light?.type !== 'SpotLight')
    throw Error('STAGE_WORK_EVIDENCE'); }
export function validatePrompt(d, id, encoded = false) { keys(d, ['version', 'ruleVersion', 'source', 'at', 'sections', 'originalSections', 'manualText', 'unacknowledged']); if (d.version !== 1 || d.ruleVersion !== 'scene-prompt.zh.v1' || !date(d.at) || d.manualText !== null && typeof d.manualText !== 'string' || typeof d.unacknowledged !== 'boolean')
    throw Error('STAGE_WORK_PROMPT'); validatePromptSource(d.source, id, encoded); for (const a of [d.sections, d.originalSections]) {
    if (!Array.isArray(a) || a.length !== 5 || new Set(a.map(s => s.id)).size !== 5)
        throw Error('STAGE_WORK_SECTIONS');
    for (const s of a) {
        keys(s, ['id', 'label', 'text', 'enabled']);
        if (!['camera', 'pose', 'light', 'background', 'dof'].includes(s.id) || typeof s.label !== 'string' || typeof s.text !== 'string' || typeof s.enabled !== 'boolean')
            throw Error('STAGE_WORK_SECTIONS');
    }
} }
export function validateWork(list, libraryId, tasks, binary = true) { if (!Array.isArray(list))
    throw Error('STAGE_WORK_SCHEMA'); const seen = new Set(); for (const d of list) {
    keys(d, ['version', 'libraryId', 'projectId', 'taskId', 'prompt', 'selectedSource', 'result', 'selectedOutputId', 'attempt']);
    const task = tasks.find(t => t.id === d.taskId);
    if (d.version !== 1 || d.libraryId !== libraryId || !task || d.projectId !== (task.projectId || null) || seen.has(d.taskId) || !['draft', 'output'].includes(d.selectedSource))
        throw Error('STAGE_WORK_SCOPE');
    seen.add(d.taskId);
    if (d.prompt)
        validatePrompt(d.prompt, d.taskId, !binary);
    if (d.result) {
        const o = d.result;
        keys(o, ['id', 'blob', 'width', 'height', 'effect', 'signature', 'at', 'filename', 'scene', 'promptSnapshot']);
        validScene(o.scene);
        const [w, h] = o.scene.ratio.split(':').map(Number), long = Math.max(o.width, o.height);
        if (!o.id || d.selectedOutputId !== o.id || ![1024, 2048].includes(long) || o.width !== Math.round(long * w / Math.max(w, h)) || o.height !== Math.round(long * h / Math.max(w, h)) || o.signature !== JSON.stringify(o.scene) || !date(o.at) || typeof o.filename !== 'string' || !o.filename.endsWith('.png') || !['off', 'active', 'fallback'].includes(o.effect?.state) || typeof o.effect.reason !== 'string')
            throw Error('STAGE_WORK_OUTPUT');
        if (binary && (!(o.blob instanceof Blob) || o.blob.type !== 'image/png' || !o.blob.size || o.blob.size > 32 * 1024 * 1024))
            throw Error('STAGE_WORK_PNG');
        if (o.promptSnapshot) {
            validatePromptSource(o.promptSnapshot, d.taskId, !binary);
            if (o.promptSnapshot.kind !== 'output' || o.promptSnapshot.id !== o.id || (binary || typeof o.promptSnapshot.sceneSignature === 'string') && o.promptSnapshot.sceneSignature !== o.signature)
                throw Error('STAGE_WORK_OUTPUT_SOURCE');
        }
    }
    else if (d.selectedOutputId !== null)
        throw Error('STAGE_WORK_SELECTION');
    if (d.attempt) {
        const a = d.attempt;
        keys(a, ['id', 'scene', 'size', 'startedAt', 'status', 'error']);
        validScene(a.scene);
        if (!a.id || !date(a.startedAt) || ![1024, 2048].includes(a.size) || !['running', 'failed', 'cancelled', 'interrupted'].includes(a.status) || typeof a.error !== 'string')
            throw Error('STAGE_WORK_ATTEMPT');
    }
} }
function entry(taskId, projectId) { const old = records[taskId]; if (old && (old.libraryId !== lib || old.projectId !== projectId))
    throw Error('STAGE_WORK_SCOPE'); return old || { version: 1, libraryId: lib, projectId, taskId, prompt: null, selectedSource: 'draft', result: null, selectedOutputId: null, attempt: null }; }
export const stageWork = { subscribe: (f) => { listeners.add(f); return () => { listeners.delete(f); }; }, get: (id) => records[id], list: () => copy(Object.values(records)), ticket: () => epoch, library: () => lib,
    bind(id, list = [], tasks = []) { validateWork(list, id, tasks); epoch++; lib = id; records = Object.fromEntries(copy(list).map(d => [d.taskId, d])); emit(); },
    update(id, projectId, patch, ticket = epoch) { if (ticket !== epoch)
        return false; records = { ...records, [id]: { ...entry(id, projectId), ...copy(patch) } }; emit(); return true; },
    removePrompt(id) { const d = records[id]; if (d)
        stageWork.update(id, d.projectId, { prompt: null, selectedSource: 'draft' }); }, removeOutput(id) { const d = records[id]; if (d)
        stageWork.update(id, d.projectId, { result: null, selectedOutputId: null, attempt: null }); },
    scenes(list = Object.values(records)) { const out = {}; for (const d of list) {
        if (d.prompt)
            out['prompt:' + d.taskId] = d.prompt.source.scene;
        if (d.result)
            out['result:' + d.taskId] = d.result.scene;
        if (d.result?.promptSnapshot)
            out['result-prompt:' + d.taskId] = d.result.promptSnapshot.scene;
        if (d.attempt)
            out['attempt:' + d.taskId] = d.attempt.scene;
    } return out; } };

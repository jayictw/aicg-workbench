import { effectiveFieldOrigins } from '../storyboard/update-state.mjs';
import { applySnapshot, edit, retryFailed, submit, toggleFavorite } from './state.mjs';
import { workspace } from '../management/store.mjs';
import { submissionContext } from '../management/state.mjs';
import { immutable } from './simulation.mjs';
export function createImageStore(id) {
    return {
        get: () => workspace.get().images[id], subscribe: workspace.subscribe,
        edit: (patch) => workspace.image(id, s => edit(s, patch)),
        submit: () => { let accepted = false; workspace.image(id, s => { const next = submit(s, `批次 ${String(s.batches.length + 1).padStart(2, '0')}`, Date.now()); if (next === s)
            return s; accepted = true; return { ...next, batches: [{ ...next.batches[0], storyboardFieldOrigins: immutable(effectiveFieldOrigins(workspace.get(), id)), context: immutable(submissionContext(workspace.get(), id)), ...(workspace.get().tasks.find(t => t.id === id)?.storyboardSnapshot ? { storyboardOrigin: immutable(workspace.get().tasks.find(t => t.id === id).storyboardSnapshot) } : {}) }, ...next.batches.slice(1)] }; }); return accepted; },
        retry: (batch, task) => workspace.image(id, s => retryFailed(s, batch, task, Date.now())),
        favorite: (task) => workspace.image(id, s => toggleFavorite(s, task)),
        apply: (snapshot) => workspace.image(id, s => applySnapshot(s, snapshot)),
    };
}
const objectUrls = new Set();
export function localObjectUrl(file) { return new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = () => reject(new Error('媒体读取失败，未导入。')); r.readAsDataURL(file); }); }
export async function localReference(file, category, entityId) {
    const src = await localObjectUrl(file);
    return { id: crypto.randomUUID(), category, src, name: file.name, entityId, view: '本地图片', origin: 'local', size: file.size, mime: file.type, lastModified: file.lastModified };
}
// Only browser resources are released on document exit; no file-system operation.
window.addEventListener('pagehide', event => { if (!event.persisted)
    objectUrls.forEach(url => URL.revokeObjectURL(url)); });

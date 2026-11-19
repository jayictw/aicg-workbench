import { effectiveFieldOrigins } from '../storyboard/update-state.mjs';
import { videoApply, videoEdit, videoFavorite, videoRetry, videoSubmit, videoTransfer } from './state.mjs';
import { workspace } from '../management/store.mjs';
import { submissionContext } from '../management/state.mjs';
import { immutable } from '../studio/simulation.mjs';
export function createVideoStore(id) {
    return {
        get: () => workspace.get().videos[id], subscribe: workspace.subscribe,
        edit: (patch) => workspace.video(id, s => videoEdit(s, patch)),
        submit: () => { let accepted = false; workspace.video(id, s => { const next = videoSubmit(s, `视频批次 ${String(s.batches.length + 1).padStart(2, '0')}`, Date.now()); if (next === s)
            return s; accepted = true; return { ...next, batches: [{ ...next.batches[0], storyboardFieldOrigins: immutable(effectiveFieldOrigins(workspace.get(), id)), context: immutable(submissionContext(workspace.get(), id)), ...(workspace.get().tasks.find(t => t.id === id)?.storyboardSnapshot ? { storyboardOrigin: immutable(workspace.get().tasks.find(t => t.id === id).storyboardSnapshot) } : {}) }, ...next.batches.slice(1)] }; }); return accepted; },
        retry: (batch, task) => workspace.video(id, s => videoRetry(s, batch, task, Date.now())),
        favorite: (task) => workspace.video(id, s => videoFavorite(s, task)),
        apply: (snapshot) => workspace.video(id, s => videoApply(s, snapshot)),
        transfer: (image) => workspace.video(id, s => videoTransfer(s, image)),
    };
}

export const initialCreation = () => ({ version: 1, referenceUse: 'selected', retainedPrompts: [] });
export const studioAdoptionMode = (c) => c?.studioMode || 'B';
export function promptDecision(current, legacy) {
    if (!current)
        return { kind: 'initialize', prompt: legacy };
    if (current.prompt === legacy)
        return { kind: 'same', prompt: current.prompt };
    if (!legacy)
        return { kind: 'mirror', prompt: current.prompt };
    return { kind: 'conflict', prompt: current.prompt };
}
export function keepOther(c, other) { const a = c || initialCreation(); if (a.retainedPrompts.includes(other))
    return a; if (a.retainedPrompts.length >= 16)
    throw Error('旧稿保留区已满；两份稿件保持，未覆盖。'); return { ...a, retainedPrompts: [...a.retainedPrompts, other] }; }
export const emptyCreationDraft = (taskId, kind, prompt = '') => ({ taskId, prompt, target: null, operation: kind === 'image' ? 'text-to-image' : 'text-to-video', inputs: [], retained: [], parameters: [], outputCount: null });
export function targetDraft(d, target, parameters) { return { ...d, target, parameters: structuredClone(parameters), outputCount: 1 }; }
export const unsupportedGeneratedVideo = (d) => !!d && (d.operation !== 'text-to-video' || d.inputs.length > 0 || d.retained.length > 0);
export function videoLocalMode(d, generated) { if (d.creationInput?.studioMode)
    return d.creationInput.studioMode; const image = !!d.first || !!d.last || d.mode !== 'text' || unsupportedGeneratedVideo(generated) || !!d.refs.some(r => !!r.stageSource && (!generated || r.stageSource.taskId === generated.taskId) && !r.assetId), text = !!d.supplement?.enabled; return image && text ? 'C' : image ? 'B' : text ? 'A' : 'BASE'; }
export const videoLocalBlocked = (d, generated) => videoLocalMode(d, generated) !== 'BASE';

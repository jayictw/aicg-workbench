export const editorPositions = {};
export const uiListeners = new Set();
export function rememberEditor(id, value) { if (JSON.stringify(editorPositions[id]) !== JSON.stringify(value)) {
    const kind = JSON.stringify(editorPositions[id]?.checkpoint) !== JSON.stringify(value.checkpoint) ? 'checkpoint' : 'selection';
    editorPositions[id] = structuredClone(value);
    uiListeners.forEach(f => f(kind));
} }

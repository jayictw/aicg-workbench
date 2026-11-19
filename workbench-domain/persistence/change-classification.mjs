// Active task pointers are restored with the next explicit save, not business edits.
export function workspaceBusinessChanged(before, after) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    keys.delete('activeImage');
    keys.delete('activeVideo');
    return [...keys].some(k => before[k] !== after[k]);
}

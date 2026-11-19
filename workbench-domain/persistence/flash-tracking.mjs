// UI-only commit knowledge, never encoded into DTO/journal or payment authority.
let owner = '';
const rows = new Map();
export function loadedFlash(cap, ids) { owner = cap; rows.clear(); for (const id of ids)
    rows.set(id, { generation: 0, saved: true }); }
export function addedFlash(cap, id, generation) { if (cap === owner && !rows.has(id))
    rows.set(id, { generation, saved: false }); }
export function savedFlash(cap, generation) { if (cap === owner)
    for (const row of rows.values())
        if (row.generation <= generation)
            row.saved = true; }
export function flashCommitState(cap, id) { const row = cap === owner ? rows.get(id) : undefined; return row ? (row.saved ? 'saved' : 'unsaved') : 'unknown'; }

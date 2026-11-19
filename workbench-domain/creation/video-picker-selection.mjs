const sameSource = (a, b) => (a.assetId || a.id) === (b.assetId || b.id) && a.src === b.src;
export function videoPickerIds(refs, entries) { return refs.map(r => entries.find(e => sameSource(e, r))?.id).filter((id) => !!id); }
export function videoPickerReferences(refs, chosen, entries, newId = () => 'ref-use-' + crypto.randomUUID()) {
    const missing = refs.filter(r => !entries.some(e => sameSource(e, r)));
    const sources = chosen.filter((r, n, a) => a.findIndex(x => sameSource(x, r)) === n);
    return [...missing, ...sources.flatMap(r => { const existing = refs.filter(x => sameSource(x, r)); return existing.length ? existing : [{ ...r, id: newId() }]; })];
}

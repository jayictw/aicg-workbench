const empty = () => ({ version: 1, drafts: [], requests: [], results: [] });
let data = empty(), media = new Map();
const listeners = new Set();
const update = (next) => { data = next; listeners.forEach(fn => fn()); };
export const generated = { get: () => data, subscribe: (fn) => { listeners.add(fn); return () => { listeners.delete(fn); }; },
    bind(value, items) { media = new Map(items.map(m => [m.id, { ...m }])); update(structuredClone(value)); },
    draft: (taskId) => data.drafts.find(x => x.taskId === taskId),
    putDraft(draft) { update({ ...data, drafts: [...data.drafts.filter(x => x.taskId !== draft.taskId), structuredClone(draft)] }); },
    join(bundle) { if (data.results.some(x => x.resultId === bundle.result.resultId))
        return; for (const m of bundle.media)
        media.set(m.id, { ...m }); update({ ...data, requests: data.requests.some(x => x.requestId === bundle.request.requestId) ? data.requests : [...data.requests, structuredClone(bundle.request)], results: [...data.results, structuredClone(bundle.result)] }); },
    favorite(id) { update({ ...data, results: data.results.map(x => x.resultId === id ? { ...x, favorite: !x.favorite } : x) }); },
    remove(id) { update({ ...data, results: data.results.filter(x => x.resultId !== id) }); },
    src(id) { const m = media.get(id); return m && ['image/png', 'video/mp4'].includes(m.mime) ? 'data:' + m.mime + ';base64,' + m.base64 : ''; },
    snapshot() { const used = new Set(); for (const r of data.results) {
        used.add(r.original.mediaId);
        used.add(r.current.mediaId);
        for (const d of r.derivation) {
            used.add(d.inputMediaId);
            used.add(d.outputMediaId);
        }
    } for (const r of data.requests)
        for (const input of r.effective.inputs)
            used.add('m-' + input.sha256); for (const d of data.drafts)
        for (const input of [...d.inputs, ...d.retained])
            used.add('m-' + input.sha256); return { generated: structuredClone(data), d1Media: [...used].map(id => { const m = media.get(id); if (!m)
            throw Error('C_D1_MEDIA_REFERENCE'); return { ...m }; }) }; }
};
export const sourceLabel = (kind) => ({ 'legacy-mock': '历史示例', 'offline-synthetic': '离线合成', 'user-imported': '用户导入', 'provider-returned': '平台返回', unknown: '未知来源' })[kind];

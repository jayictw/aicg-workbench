import { verifiedRecord } from '../stage3d/pose-library-state.mjs';
let state = { cap: '', libraryId: '', epoch: 0, revision: 0, phase: 'ready', error: '' }, pending = null;
const listeners = new Set();
let queue = Promise.resolve();
const emit = () => { listeners.forEach(f => f()); if (state.cap)
    window.workLibrary?.poseReport({ cap: state.cap, saving: state.phase === 'saving' || state.phase === 'unknown' }); };
const set = (patch) => { state = { ...state, ...patch }; emit(); };
const guard = (cap) => { if (!cap || cap !== state.cap)
    throw Error('CAPABILITY_EXPIRED：工作库已切换，旧姿势操作失效。'); };
export async function wire(row) { const v = verifiedRecord(row); if (v.thumbnail.status !== 'ready')
    return { ...v, thumbnail: v.thumbnail }; const bytes = new Uint8Array(await v.thumbnail.blob.arrayBuffer()), sha256 = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))).map(x => x.toString(16).padStart(2, '0')).join(''); let raw = ''; for (const b of bytes)
    raw += String.fromCharCode(b); return { ...v, thumbnail: { status: 'ready', media: { id: 'm-' + sha256, sha256, mime: 'image/png', size: bytes.length, base64: btoa(raw) } } }; }
export async function unWire(row) { if (row.thumbnail.status !== 'ready')
    return verifiedRecord(row); const m = row.thumbnail.media, bytes = Uint8Array.from(atob(m.base64), c => c.charCodeAt(0)); const sha = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))).map(x => x.toString(16).padStart(2, '0')).join(''); if (bytes.length !== m.size || sha !== m.sha256)
    throw Error('姿势缩图字节校验失败，未替换。'); const blob = new Blob([bytes], { type: 'image/png' }), bitmap = await createImageBitmap(blob); try {
    if (bitmap.width !== 256 || bitmap.height !== 192)
        throw Error('姿势缩图尺寸错误。');
}
finally {
    bitmap.close();
} return verifiedRecord({ ...row, thumbnail: { status: 'ready', blob } }); }
function serial(fn) { const next = queue.then(fn); queue = next.then(() => { }, () => { }); return next; }
async function resolvePending() { const request = pending; if (!request)
    return; const cap = request.cap; guard(cap); try {
    const receipt = await window.workLibrary.poseReceipt({ cap, id: request.operationId });
    guard(cap);
    if (receipt) {
        pending = null;
        set({ revision: receipt.revision, phase: 'ready', error: '' });
        window.dispatchEvent(new CustomEvent('acs-pose-library-changed', { detail: { resolved: true } }));
    }
    else {
        pending = null;
        set({ phase: 'failed', error: '查询未发现成功姿势收据；原记录和当前姿态保留，可重新确认。' });
    }
}
catch (e) {
    guard(cap);
    set({ phase: 'unknown', error: e.message });
    throw e;
} }
async function commit(cap, change) { guard(cap); if (pending)
    throw Error('姿势提交结果未确认，请先查询姿势操作结果。'); set({ phase: 'saving', error: '' }); try {
    const list = await window.workLibrary.poseList({ cap });
    guard(cap);
    const request = { cap, operationId: 'pose-' + crypto.randomUUID(), expectedPoseRevision: list.poseRevision, change };
    pending = request;
    const result = await window.workLibrary.poseCommit(request);
    guard(cap);
    pending = null;
    set({ revision: result.revision, phase: 'ready', error: '' });
}
catch (e) {
    guard(cap);
    const message = e.message;
    if (/ACK_UNKNOWN|channel closed|connection|worker-error/i.test(message) && pending) {
        set({ phase: 'unknown', error: '姿势结果未确认，正在查询原操作收据。' });
        await resolvePending();
        if (state.phase === 'ready')
            return;
    }
    else if (pending && !/INJECTED_|POSE_|CAPABILITY_|BUSY|名称|ID|姿势|关节|Rig|版本|角度/.test(message)) {
        set({ phase: 'unknown', error: message });
        throw e;
    }
    else {
        pending = null;
        set({ phase: 'failed', error: message });
    }
    throw new Error(message.includes('POSE_RECORD_CONFLICT') ? '另一处更新（POSE_RECORD_CONFLICT），请刷新后重新确认；未覆盖。' : message);
} }
export const desktopPoses = { get: () => state, subscribe: (f) => { listeners.add(f); return () => { listeners.delete(f); }; }, bind(cap, libraryId, revision = 0) { pending = null; queue = Promise.resolve(); set({ cap, libraryId, revision, epoch: state.epoch + 1, phase: 'ready', error: '' }); }, resolve: () => serial(resolvePending) };
export class DesktopPoseRepository {
    async list() { const cap = state.cap; guard(cap); const result = await window.workLibrary.poseList({ cap }); guard(cap); const rows = await Promise.all(result.records.map(unWire)); guard(cap); set({ revision: result.poseRevision }); return rows; }
    add(records) { const cap = state.cap, copies = records.map(verifiedRecord); return serial(async () => { guard(cap); const rows = await Promise.all(copies.map(wire)); guard(cap); await commit(cap, { kind: 'add', records: rows }); }); }
    replace(record, expectedRevision) { const cap = state.cap, copy = verifiedRecord(record); return serial(async () => { guard(cap); const row = await wire(copy); guard(cap); await commit(cap, { kind: 'replace', record: row, expectedRevision }); }); }
}

import { stageWork } from './work-state.mjs';
import { sceneDrafts } from './draft-state.mjs';
const files = new Map(), reservations = new Map(), tickets = new WeakMap();
const MAX = 256 * 1024 * 1024, ONE = 20 * 1024 * 1024;
const valid = (id) => /^m-[a-f0-9]{64}$/.test(id);
const hash = async (b) => 'm-' + Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', b))).map(v => v.toString(16).padStart(2, '0')).join('');
const size = () => [...files.values()].reduce((n, f) => n + f.size, 0) + [...reservations.values()].reduce((n, v) => n + v, 0);
async function prepare(file, source, id) {
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith('.glb') || file.size < 28 || file.size > ONE)
        throw Error('请选择非空 .glb 文件，最大20 MiB。');
    if (size() + file.size > MAX)
        throw Error('MODEL_MEMORY_LIMIT');
    const origin = { name: file.name, size: file.size, modified: file.lastModified }, ticket = Symbol();
    reservations.set(ticket, file.size);
    try {
        const bytes = await file.arrayBuffer();
        if (bytes.byteLength !== origin.size)
            throw Error('MODEL_CONTENT_CHANGED');
        const contentId = await hash(bytes);
        const snapshot = new File([bytes], contentId.slice(2) + '.glb', { type: 'application/octet-stream', lastModified: 0 });
        const p = Object.freeze({ ref: Object.freeze({ kind: 'glb', source, id, ...origin, contentId }), file: snapshot });
        tickets.set(p, ticket);
        return p;
    }
    catch (e) {
        reservations.delete(ticket);
        throw e;
    }
}
export function localSubject(file) { return prepare(file, 'local', crypto.randomUUID()); }
export function entitySubject(entity) { const f = entity.model?.file; if (!f)
    throw Error('此资料卡没有可用的 GLB 文件引用，请重新选择本机文件。'); return prepare(f, 'entity', entity.id); }
export function discardSubject(p) { const t = tickets.get(p); if (t) {
    reservations.delete(t);
    tickets.delete(p);
} }
export function publishSubject(p, loadedContentId) {
    const ticket = tickets.get(p);
    if (!ticket || !reservations.has(ticket) || p.ref.contentId !== loadedContentId)
        throw Error('MODEL_SELECTION_EXPIRED');
    const id = p.ref.contentId;
    if (!valid(id) || p.file.size !== p.ref.size)
        throw Error('MODEL_BINDING_INVALID');
    if (!files.has(id))
        files.set(id, p.file);
    discardSubject(p);
    return p.ref;
}
function registered(ref) {
    if (ref.kind !== 'glb' || !valid(ref.contentId || ''))
        throw Error('模型内容身份未知；请明确重新选择文件建立新绑定。');
    const f = files.get(ref.contentId);
    if (!f || f.size !== ref.size || f.name !== ref.contentId.slice(2) + '.glb' || f.lastModified !== 0)
        throw Error('已绑定模型内容不可用；未改读实体当前文件。');
    return f;
}
export async function subjectFile(ref, _entities) {
    const f = registered(ref);
    if (await hash(await f.arrayBuffer()) !== ref.contentId)
        throw Error('MODEL_CONTENT_HASH_MISMATCH');
    return f;
}
function used(stages) { return new Set(Object.values(stages).flatMap(s => s.subject.kind === 'glb' ? [s.subject.contentId || ''] : [])); }
export function pruneSubjects(stages) { const kept = used({ ...stages, ...sceneDrafts.scenes(), ...stageWork.scenes() }); for (const id of files.keys())
    if (!kept.has(id))
        files.delete(id); }
export function exportSubjectFiles(stages) { const out = {}; for (const s of Object.values(stages))
    if (s.subject.kind === 'glb') {
        const f = registered(s.subject);
        out[s.subject.contentId] = f;
    } return out; }
export function restoreSubjectFiles(entries) { const next = new Map(); let total = 0; for (const [id, f] of Object.entries(entries)) {
    if (!valid(id) || !(f instanceof File) || f.name !== id.slice(2) + '.glb' || f.lastModified !== 0 || f.type !== 'application/octet-stream' || f.size < 28 || f.size > ONE)
        throw Error('MODEL_BINDING_INVALID');
    total += f.size;
    if (total > MAX)
        throw Error('MODEL_MEMORY_LIMIT');
    next.set(id, f);
} files.clear(); for (const [id, f] of next)
    files.set(id, f); }

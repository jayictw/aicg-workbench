import { workspace } from '../management/store.mjs';
export const isDirectStudio = (r, taskId) => !!r.stageSource && r.stageSource.taskId === taskId && !r.assetId;
export async function referencePackets(taskId, kind = 'image') {
    const d = (kind === 'image' ? workspace.get().images[taskId] : workspace.get().videos[taskId])?.draft;
    if (!d || d.creationInput?.referenceUse === 'retained')
        return [];
    const refs = d.refs.filter(r => !isDirectStudio(r, taskId) && r.generationUse !== 'retained');
    if (refs.length > (kind === 'video' ? 30 : 10))
        throw Error('C_REFERENCE_COUNT');
    const packets = [];
    for (const r of refs) {
        if (r.assetId && !workspace.get().assets.some(a => a.id === r.assetId && a.media === 'image' && a.src === r.src))
            throw Error('C_REFERENCE_MISSING');
        if (!r.src.startsWith('data:image/') && !/^\/assets\/[a-zA-Z0-9_./-]+$/.test(r.src))
            throw Error('C_REFERENCE_MISSING');
        let blob;
        if (r.src.startsWith('data:')) {
            const m = r.src.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/s);
            if (!m)
                throw Error('C_REFERENCE_FORMAT');
            blob = new Blob([Uint8Array.from(atob(m[2]), x => x.charCodeAt(0))], { type: m[1] });
        }
        else {
            const response = await fetch(r.src);
            if (!response.ok)
                throw Error('C_REFERENCE_MISSING');
            blob = await response.blob();
        }
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(blob.type))
            throw Error('C_REFERENCE_FORMAT');
        if (!blob.size || blob.size > (kind === 'video' ? 8 : 10) * 1024 * 1024)
            throw Error('C_REFERENCE_SIZE');
        const bitmap = await createImageBitmap(blob);
        try {
            const { width: w, height: h } = bitmap;
            if (kind === 'video' ? (w < 300 || h < 300 || w > 6000 || h > 6000 || w / h < .4 || w / h > 2.5) : (w < 15 || h < 15 || w * h > 36000000 || w / h < 1 / 16 || w / h > 16))
                throw Error('C_REFERENCE_DIMENSIONS');
        }
        finally {
            bitmap.close();
        }
        const bytes = await blob.arrayBuffer(), sha256 = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))).map(x => x.toString(16).padStart(2, '0')).join('');
        let binary = '';
        const a = new Uint8Array(bytes);
        for (let i = 0; i < a.length; i += 32768)
            binary += String.fromCharCode(...a.subarray(i, i + 32768));
        packets.push({ referenceId: r.id, assetId: r.assetId || null, origin: r.origin === 'local' ? 'local-import' : 'library-reference', category: r.category, name: r.name, mime: blob.type, sha256, byteSize: blob.size, base64: btoa(binary) });
    }
    if (kind === 'image' && new Set(packets.map(p => p.sha256)).size !== packets.length)
        throw Error('C_REFERENCE_DUPLICATE');
    if (packets.reduce((n, p) => n + p.byteSize, 0) > 8 * 1024 * 1024)
        throw Error('C_REFERENCE_TOTAL_SIZE');
    return packets;
}

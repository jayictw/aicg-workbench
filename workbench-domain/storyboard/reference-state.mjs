export function completeStageSource(p) { return !!p && p.version === 1 && ['taskId', 'snapshotId', 'sceneSignature', 'outputId', 'ruleVersion'].every(k => typeof p[k] === 'string' && !!String(p[k]).trim()) && typeof p.createdAt === 'string' && typeof p.manual === 'boolean'; }
export function pngSize(src) { try {
    if (!src.startsWith('data:image/png;base64,') || src.length > 32 * 1024 * 1024)
        return null;
    const bytes = atob(src.slice(22, 70)), code = (i) => bytes.charCodeAt(i), u32 = (i) => code(i) * 16777216 + code(i + 1) * 65536 + code(i + 2) * 256 + code(i + 3);
    if ([137, 80, 78, 71, 13, 10, 26, 10].some((v, i) => code(i) !== v) || bytes.slice(12, 16) !== 'IHDR')
        return null;
    const width = u32(16), height = u32(20);
    return width > 0 && height > 0 && width * height <= 32000000 ? { width, height } : null;
}
catch {
    return null;
} }
export function fixedStageRef(ref) { const c = ref.stageSelection, size = pngSize(ref.src); return !!c && c.version === 1 && ['instanceId', 'projectId', 'holderTaskId', 'holderRefId'].every(k => typeof c[k] === 'string' && !!String(c[k]).trim()) && ['image', 'video'].includes(c.holderKind) && ['refs', 'first', 'last'].includes(c.holderSlot) && Number.isFinite(c.selectedAt) && /^[a-f0-9]{64}$/.test(c.pngSha256) && /^[a-f0-9]{64}$/.test(c.sourceVersion) && completeStageSource(ref.stageSource) && !!size && size.width === c.width && size.height === c.height; }
export function assertReference(s, ref) { if (ref.stageSelection) {
    if (!fixedStageRef(ref))
        throw new Error('摄影棚图片快照无效，请移除后重新选取。');
    return;
} const a = s.assets.find(a => a.id === (ref.assetId || ref.id)); if (!a || a.media !== 'image' || !a.src)
    throw new Error('素材已失效，请重新选择。'); }
export function assertPreparedReferences(s, refs, media) { if (media.length !== refs.length || media.some((m, i) => m.id !== refs[i].id || m.assetId !== refs[i].assetId || !/^data:image\/(png|jpeg|webp);base64,/.test(m.src) || !!refs[i].stageSelection && (m.src !== refs[i].src || JSON.stringify(m.stageSource) !== JSON.stringify(refs[i].stageSource) || JSON.stringify(m.stageSelection) !== JSON.stringify(refs[i].stageSelection))))
    throw new Error('素材快照与确认版本不匹配，未写入。'); for (const r of refs)
    assertReference(s, r); }
export function mergeAssetReferences(current, assets) { if (!current.some(r => r.stageSelection))
    return assets; const next = current.filter(r => r.stageSelection || assets.some(a => a.id === r.id)).map(r => r.stageSelection ? r : assets.find(a => a.id === r.id)); return [...next, ...assets.filter(a => !next.some(r => r.id === a.id))]; }

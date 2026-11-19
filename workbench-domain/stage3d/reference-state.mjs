export function referenceSize(ratio, longEdge) {
    if (![1024, 2048].includes(longEdge) || !['1:1', '4:3', '3:4', '16:9', '9:16'].includes(ratio))
        throw new Error('仅支持任务既有画幅和1024／2048长边。');
    const [w, h] = ratio.split(':').map(Number);
    return { width: Math.round(longEdge * w / Math.max(w, h)), height: Math.round(longEdge * h / Math.max(w, h)) };
}
export const referenceSignature = (scene) => JSON.stringify(scene);
export function referenceFilename(name, id, at) { const clean = (value) => value.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').replace(/[. ]+$/g, '').slice(0, 60) || '任务'; return `3D参考_${clean(name)}_${clean(id)}_${at.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')}.png`; }
/** Same angular footprint at every viewport, DPR and output resolution: 7px at 256px short edge. */
export const referenceBlurRadius = (width, height) => 7 * Math.min(width, height) / 256;

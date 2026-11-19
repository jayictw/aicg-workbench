import { spatialIssues } from './spatial-state.mjs';
import { dofIssues } from './dof-state.mjs';
import { legacyFocalLengthMm, validFocalLength } from './lens-state.mjs';
import { poseIssues } from './pose-state.mjs';
import { defaultBackdrop } from './background-state.mjs';
export const sceneLimits = { fileBytes: 20 * 1024 * 1024, jsonBytes: 2 * 1024 * 1024, nodes: 256, primitives: 128, vertices: 150000, triangles: 150000, accessorBytes: 32 * 1024 * 1024, images: 8, imageBytes: 4 * 1024 * 1024, imageEdge: 2048, imagePixels: 16 * 1024 * 1024, depth: 32 };
export const defaultStage = (ratio = '1:1') => ({ backdrop: defaultBackdrop(), version: 2, ratio, subject: { kind: 'builtin', id: 'box' }, normalize: true, scale: 1, target: [0, 1, 0], camera: { focalLengthMm: legacyFocalLengthMm, position: [4, 2.8, 5], rotation: [0, 0, 0], aim: 'target' }, light: { position: [3, 4.5, 4], rotation: [0, 0, 0], aim: 'target', power: 240 }, ambient: .35 });
export const distance = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));
export function stageIssues(s) {
    const issues = [...spatialIssues(s), ...poseIssues(s.pose, s.root), ...dofIssues(s.camera.depthOfField)];
    if (s.camera.focalLengthMm !== undefined && !validFocalLength(s.camera.focalLengthMm))
        issues.push('焦距需为 18–135mm 的有限数值；原投影保持，未截断。');
    if (![s.camera.position, s.camera.rotation, s.light.position, s.light.rotation, s.target].every(v => v.length === 3 && v.every(n => Number.isFinite(n) && Math.abs(n) <= 100000)))
        issues.push('坐标或角度需为有限数值，绝对值不超过 100000。');
    if (distance(s.camera.position, s.target) < .05)
        issues.push('摄影机距目标点至少 0.05 场景单位，请调整摄影机位置。');
    if (s.light.aim === 'target' && distance(s.light.position, s.target) < .05)
        issues.push('主灯不能与目标点重合，请调整主灯位置。');
    if (!(s.scale >= .1 && s.scale <= 10))
        issues.push('主体包装缩放需在 0.1–10 之间。');
    if (!(s.light.power >= 0 && s.light.power <= 2000 && s.ambient >= 0 && s.ambient <= 2))
        issues.push('主灯强度需在 0–2000，环境光需在 0–2。');
    if (!['1:1', '4:3', '3:4', '16:9', '9:16'].includes(s.ratio))
        issues.push('请选择受支持的画幅比例。');
    if (!/^#[0-9a-fA-F]{6}$/.test(s.backdrop.color) || !Number.isFinite(s.backdrop.rotation) || Math.abs(s.backdrop.rotation) > 360 || ![s.backdrop.backgroundIntensity, s.backdrop.environmentIntensity].every(v => Number.isFinite(v) && v >= 0 && v <= 5))
        issues.push('背景颜色、旋转或强度无效。');
    if (s.backdrop.show && s.backdrop.mode === 'image' && !s.backdrop.image)
        issues.push('请先导入图片背景，或切换纯色。');
    if ((s.backdrop.show && s.backdrop.mode === 'hdr' || s.backdrop.lighting) && !s.backdrop.hdr)
        issues.push('请先导入HDR，或关闭HDR背景/照明。');
    return issues;
}
export const presetLabels = { front: '正面', back: '背面', left: '左侧', right: '右侧', diagonal: '45 度', top: '俯视' };
export function presetPosition(key, target, radius) {
    const dirs = { front: [0, .12, 1], back: [0, .12, -1], left: [-1, .12, 0], right: [1, .12, 0], diagonal: [1, .35, 1], top: [0, 1, .0001] };
    const d = dirs[key], length = Math.hypot(...d);
    return target.map((v, i) => v + d[i] / length * radius);
}
// New selections invalidate earlier async work; no timers or global application state.
export class RevisionGate {
    revision = 0;
    next() { return ++this.revision; }
    ;
    current(token) { return token === this.revision; }
    ;
    cancel() { this.revision++; }
}

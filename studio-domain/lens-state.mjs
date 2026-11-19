/** Fixed virtual sensor height, independent of aspect and the preview container. */
export const sensorHeightMm = 24;
export const focalRange = { min: 18, max: 135 };
export const legacyVerticalFov = 45;
export const legacyFocalLengthMm = sensorHeightMm / (2 * Math.tan(legacyVerticalFov * Math.PI / 360));
export const validFocalLength = (n) => typeof n === 'number' && Number.isFinite(n) && n >= focalRange.min && n <= focalRange.max;
export function verticalFov(focalLengthMm) { return 2 * Math.atan(sensorHeightMm / (2 * focalLengthMm)) * 180 / Math.PI; }
export function focalLengthOf(camera) { return camera.focalLengthMm === undefined ? legacyFocalLengthMm : camera.focalLengthMm; }
export function withLens(scene) { const copy = structuredClone(scene); if (copy.camera.focalLengthMm === undefined)
    copy.camera.focalLengthMm = legacyFocalLengthMm; return copy; }
export function parseFocalInput(raw) { const text = raw.trim(); if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text))
    return null; const n = Number(text); return validFocalLength(n) ? n : null; }
export const formatFocal = (n) => String(Number(n.toFixed(4)));
export const lensPreset = (n) => n === 24 ? '广角' : n === 50 ? '标准' : n === 85 ? '长焦' : '自订';

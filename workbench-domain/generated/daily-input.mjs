export const modeNames = { C: '图片＋补充文字', B: '只用摄影棚图片', A: '只用补充文字', BASE: '不用摄影棚' };
export const referencePurpose = '参考图用于构图、静态姿势与空间关系；人物身份和材质由原始创意决定。';
/** The one text assembler used by editing preview, native confirmation and transport validation. */
export function dailyText(original, adopted, mode) { return [original, ...(['A', 'C'].includes(mode) ? [adopted] : []), ...(['B', 'C'].includes(mode) ? [referencePurpose] : [])].filter(x => x.trim()).join('\n\n'); }
export function adoptSnapshot(old, sourceJson, automaticText, outputId, referenceSha256, keep) { return { version: 1, mode: old?.chosen ? old.mode : 'B', chosen: old?.chosen || false, sourceJson, automaticText, adoptedText: keep && old ? old.adoptedText : automaticText, outputId, referenceSha256 }; }

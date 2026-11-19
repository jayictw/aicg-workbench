import { videoInputs } from '../video/state.mjs';
import { immutable } from '../studio/simulation.mjs';
import { stableJson, content, patchShot, putBoard } from './state.mjs';
import { completeStageSource, pngSize } from './reference-state.mjs';
export function stageCatalog(s, projectId) {
    const entries = [], excluded = [];
    if (!s.projects.some(p => p.id === projectId))
        return { entries, excluded };
    for (const task of s.tasks.filter(t => t.projectId === projectId)) {
        const d = task.kind === 'image' ? s.images[task.id]?.draft : s.videos[task.id]?.draft;
        if (!d)
            continue;
        const holders = d.refs.map(ref => ({ slot: 'refs', ref }));
        if (task.kind === 'video') {
            const v = s.videos[task.id];
            if (!v)
                continue;
            const e = videoInputs(v.draft).effective;
            if (v.draft.first)
                holders.push({ slot: 'first', ref: v.draft.first, retained: !e.first });
            if (v.draft.last)
                holders.push({ slot: 'last', ref: v.draft.last, retained: !e.last });
        }
        for (const { slot, ref, retained } of holders) {
            if (!ref.stageSource)
                continue;
            const size = pngSize(ref.src);
            if (typeof ref.id !== 'string' || !ref.id.trim() || !completeStageSource(ref.stageSource) || !size) {
                excluded.push({ taskId: task.id, refId: ref.id, reason: typeof ref.id !== 'string' || !ref.id.trim() ? '持有引用ID缺失' : !completeStageSource(ref.stageSource) ? '摄影棚来源字段不全' : '不是当前支持的有效任务PNG快照' });
                continue;
            }
            const key = JSON.stringify([task.id, slot, ref.id]), token = stableJson({ projectId, task: { id: task.id, name: task.name, kind: task.kind }, slot, retained: !!retained, ref });
            entries.push({ key, projectId, taskId: task.id, taskName: task.name, kind: task.kind, slot, retained: !!retained, ref: structuredClone(ref), ...size, token });
        }
    }
    return { entries, excluded };
}
export function stageBoardToken(s, id) { const b = s.storyboards?.[id]; if (!b)
    throw new Error('来源分镜已失效。'); return stableJson({ revision: b.revision, content: content(b) }); }
export function currentStagePick(s, r) { const b = s.storyboards?.[r.boardId], sh = b?.shots.find(x => x.id === r.shotId); if (!b || !sh || b.projectId !== r.projectId || !s.projects.some(p => p.id === r.projectId))
    throw new Error('项目或镜头已失效；没有选入图片。'); if (stageBoardToken(s, b.id) !== r.expectedBoard)
    throw new Error('分镜在选取期间已变化，请取消后重新选择。'); const c = stageCatalog(s, r.projectId).entries.find(c => c.key === r.candidateKey); if (!c || c.token !== r.expectedSource)
    throw new Error('持有任务、用途、引用或图片版本已变化，请取消后重新选择。'); if (r.target === 'replace' && (!r.replaceConfirmed || !r.replaceId || !sh.refs.some(x => x.id === r.replaceId)))
    throw new Error('请选择仍存在的分镜引用并明确确认替换。'); if (!['append', 'replace'].includes(r.target))
    throw new Error('未知选取操作。'); return { b, sh, c }; }
export function selectStageImage(s, r, image, now) {
    const digest = stableJson({ request: r, image }), prior = s.stagePickReceipts?.[r.id];
    if (prior) {
        if (prior.digest !== digest)
            throw new Error('同一选取ID不能提交不同内容。');
        return { state: s, receipt: prior };
    }
    const { b, sh, c } = currentStagePick(s, r);
    if (image.sourceToken !== c.token || image.src !== c.ref.src || image.width !== c.width || image.height !== c.height || !(/^[a-f0-9]{64}$/).test(image.pngSha256) || !(/^[a-f0-9]{64}$/).test(image.sourceVersion))
        throw new Error('图片快照与确认来源不匹配。');
    const resultRefId = r.target === 'replace' ? r.replaceId : 'sb-stage-' + r.id, ref = { id: resultRefId, src: image.src, name: '摄影棚参考图 · ' + c.taskName, category: 'scene', entityId: 'stage-selection:' + r.id, view: '3D构图参考', origin: 'local', stageSource: structuredClone(c.ref.stageSource), stageSelection: { version: 1, instanceId: r.id, projectId: r.projectId, holderTaskId: c.taskId, holderTaskName: c.taskName, holderKind: c.kind, holderSlot: c.slot, holderRetained: !!c.retained, holderRefId: c.ref.id, selectedAt: now, width: c.width, height: c.height, pngSha256: image.pngSha256, sourceVersion: image.sourceVersion, ...(c.ref.stageSelection ? { upstreamSelection: structuredClone(c.ref.stageSelection) } : {}) } };
    const refs = r.target === 'append' ? [...sh.refs, immutable(ref)] : sh.refs.map(old => old.id === r.replaceId ? immutable(ref) : old), receipt = immutable({ id: r.id, boardId: b.id, shotId: sh.id, resultRefId, digest, at: now }), next = putBoard(s, patchShot(b, sh.id, { refs }));
    return { state: { ...next, stagePickReceipts: { ...next.stagePickReceipts, [r.id]: receipt } }, receipt };
}
export function holderStillMatches(s, ref) { const selection = ref.stageSelection; if (!selection)
    return false; return stageCatalog(s, selection.projectId).entries.some(c => c.taskId === selection.holderTaskId && c.slot === selection.holderSlot && c.ref.id === selection.holderRefId && c.ref.src === ref.src && JSON.stringify(c.ref.stageSource) === JSON.stringify(ref.stageSource)); }

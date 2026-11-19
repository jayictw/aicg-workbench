import { assertPreparedReferences } from './reference-state.mjs';
import { addCreativeTask } from '../management/state.mjs';
import { immutable } from '../studio/simulation.mjs';
import { finalPrompt } from '../studio/stage-handoff-types.mjs';
import { videoInitial, videoInputs, videoIssues } from '../video/state.mjs';
import { videoMock } from '../video/mock.mjs';
import { sourceInput, confirmationToken, stableJson, durationError } from './state.mjs';
export function videoOf(sh) { return { action: '', camera: '', start: '', end: '', dialogue: '', subtitles: '', sound: '', ...sh.video, execution: { mode: 'text', model: 'veo', ratio: '16:9', duration: 4, resolution: '360p', count: 2, firstId: null, lastId: null, refIds: [], ...sh.video?.execution } }; }
export function videoSource(s, b, sh) { const v = videoOf(sh); return { ...sourceInput(s, b, sh), freeze: '', motion: { action: v.action, camera: v.camera, start: v.start, end: v.end } }; }
export function videoFingerprint(s, b, sh) { return JSON.stringify(videoSource(s, b, sh)); }
export function videoStale(s, b, sh) { return !!sh.video?.prompt && sh.video.prompt.fingerprint !== videoFingerprint(s, b, sh); }
export function organizeVideo(s, b, sh) { const input = videoSource(s, b, sh), v = videoOf(sh), pairs = [['subject', '主体', sh.subject], ['scene', '场景', sh.scene], ['frame', '景别／角度', [sh.size, sh.angle].filter(Boolean).join('，')], ['style', '风格', b.brief.style], ['action', '主体动作', v.action], ['camera', '镜头运动', v.camera], ['start', '起始状态', v.start], ['end', '结束状态', v.end]]; return { ruleVersion: 'storyboard.video.zh.v1', input: structuredClone(input), fingerprint: JSON.stringify(input), at: Date.now(), sections: pairs.map(([id, label, text]) => ({ id, label, generated: text, text, enabled: !!text, manual: false })) }; }
export function videoText(sh) { return sh.video?.prompt?.sections.filter(p => p.enabled && p.text.trim()).map(p => p.label + '：' + p.text).join('\n') || ''; }
export function videoConfirmationToken(s, b, sh) { return stableJson({ target: 'video', shared: confirmationToken(s, b, sh), video: videoOf(sh), source: videoSource(s, b, sh) }); }
export function currentVideoRequest(s, r) { const b = s.storyboards?.[r.boardId], sh = b?.shots.find(x => x.id === r.shotId); if (!b || !sh)
    throw new Error('来源分镜或镜头不可用。'); if (r.expected !== videoConfirmationToken(s, b, sh) || stableJson(r.execution) !== stableJson(videoOf(sh).execution))
    throw new Error('影片确认内容已变化，请取消并重新预览；未创建任务。'); return { b, sh }; }
export function videoDraftFor(sh, e, media, text = videoText(sh)) {
    const byId = new Map(media.map(m => [m.id, m]));
    const selected = [e.firstId, e.lastId, ...e.refIds].filter((id) => id !== null);
    if (selected.some(id => !byId.has(id)))
        throw new Error('用途图片已失效或不在当前选图中，请重新指定；未创建任务。');
    if (new Set(e.refIds).size !== e.refIds.length)
        throw new Error('一般参考图用途重复，请重新选择。');
    return { ...videoInitial(), mode: e.mode, model: e.model, ratio: e.ratio, duration: e.duration, resolution: e.resolution, count: e.count, prompt: sh.visual, first: e.firstId ? byId.get(e.firstId) : null, last: e.lastId ? byId.get(e.lastId) : null, refs: e.refIds.map(id => byId.get(id)), ...(text ? { storyboardSupplement: { text, enabled: true, manual: !!sh.video?.prompt?.sections.some(p => p.manual), source: { version: 1, projectId: 'preview', storyboardId: 'preview', shotId: sh.id, shotRevision: sh.revision, snapshotId: 'preview', handoffId: 'preview', createdAt: 0, ruleVersion: 'storyboard.video.zh.v1', manual: false } } } : {}) };
}
export function createVideoFromShot(s, r, media, taskId, now) {
    const digest = stableJson({ request: r, media }), prior = s.storyboardReceipts?.[r.id];
    if (prior) {
        if (prior.digest !== digest)
            throw new Error('同一交接 ID 的请求内容不同；拒绝重用，请重新确认。');
        return { state: s, receipt: prior };
    }
    const { b, sh } = currentVideoRequest(s, r), prompt = sh.video?.prompt;
    if (!sh.visual.trim() || !prompt)
        throw new Error('请填写画面原文并依来源整理影片补充。');
    const old = videoStale(s, b, sh);
    if (old && !r.allowStale)
        throw new Error('影片整理来源已过期，请重整或明确沿用旧补充。');
    if (durationError(sh.duration) || durationError(b.brief.duration))
        throw new Error('计划时长无效，请修正或留空。');
    if (!videoMock[r.execution.model] || !['text', 'first', 'frames'].includes(r.execution.mode))
        throw new Error('影片Mock模型或模式无效。');
    assertPreparedReferences(s, sh.refs, media);
    const source = { version: 1, projectId: b.projectId, storyboardId: b.id, shotId: sh.id, shotRevision: sh.revision, snapshotId: 'shot-' + r.id, handoffId: r.id, createdAt: now, ruleVersion: prompt.ruleVersion, manual: prompt.sections.some(p => p.manual) };
    const text = videoText(sh), prepared = videoDraftFor(sh, r.execution, structuredClone(media), text), draft = { ...prepared, storyboardSource: source, ...(prepared.storyboardSupplement ? { storyboardSupplement: { ...prepared.storyboardSupplement, source } } : {}) };
    const issues = videoIssues(draft);
    if (issues.length)
        throw new Error(issues.map(x => x.message).join(' ') + ' 仅为Mock规则，未创建任务；原选图与规划保留。');
    const inputs = videoInputs(draft), snapshot = immutable({ version: 1, taskKind: 'video', source, boardName: b.name, brief: structuredClone(b.brief), shot: structuredClone(sh), currentPromptInput: videoSource(s, b, sh), supplementInput: prompt.input, supplementFingerprint: prompt.fingerprint, currentFingerprint: videoFingerprint(s, b, sh), keptStale: old, plannedRatio: b.brief.ratio, executionRatio: r.execution.ratio, originalText: sh.visual, supplementText: text, finalPrompt: finalPrompt(draft), media: structuredClone(media), video: { execution: r.execution, ...inputs } });
    const receipt = immutable({ id: r.id, taskId, digest, snapshot });
    let next = addCreativeTask(s, taskId, 'video', r.name, b.projectId, now);
    next = { ...next, tasks: next.tasks.map(t => t.id === taskId ? { ...t, storyboardSource: structuredClone(source), storyboardSnapshot: snapshot } : t), videos: { ...next.videos, [taskId]: { ...next.videos[taskId], draft: immutable(draft) } }, storyboardReceipts: { ...next.storyboardReceipts, [r.id]: receipt } };
    return { state: next, receipt };
}

import { poseRepository } from '../stage3d/pose-library-storage.mjs';
import { desktopPoses } from './pose-repository.mjs';
// Compiled only in mode=s1b-test, never exported by ordinary application bridge.
import { workspace, captureBusiness } from '../management/store.mjs';
import { initialDraft } from '../studio/state.mjs';
import { prepareAsset } from '../management/media.mjs';
import { assetReference } from '../management/state.mjs';
import { newBoard, template, patchShot, organize, confirmationToken, sourceFingerprint, stale, stableJson } from '../storyboard/state.mjs';
import { videoOf, organizeVideo, videoConfirmationToken } from '../storyboard/video-state.mjs';
import { updateSourceToken, updateTargetToken, effectiveFieldOrigins } from '../storyboard/update-state.mjs';
import { stageCatalog, stageBoardToken } from '../storyboard/stage-images-state.mjs';
import { prepareStageImage } from '../storyboard/stage-image-media.mjs';
import { prepareMedia } from '../storyboard/media.mjs';
import { handoffToken } from '../management/handoff-state.mjs';
import { defaultStage } from '../stage3d/state.mjs';
import { posePreset } from '../stage3d/pose-state.mjs';
import { registerBackdrop } from '../stage3d/background-sources.mjs';
import { localSubject, publishSubject, discardSubject, subjectFile, pruneSubjects, restoreSubjectFiles } from '../stage3d/sources.mjs';
import { createImageStore } from '../studio/store.mjs';
import { createVideoStore } from '../video/store.mjs';
import { captureForDisk, encodeBusiness, decodeBusiness } from './codec.mjs';
import { stageWork } from '../stage3d/work-state.mjs';
import { promptSession } from '../stage3d/scene-prompt-session.mjs';
import { sceneDrafts, appliedSignature } from '../stage3d/draft-state.mjs';
import { persistence } from './session.mjs';
import { editorPositions } from './ui-state.mjs';
async function file(url, name, type) { const r = await fetch(url); return new File([await r.arrayBuffer()], name, { type, lastModified: 1760000000123 }); }
async function seed() {
    const p = workspace.createProject('S1B 合成项目 中文 空格', '不是用户资料'), a = workspace.createTask('image', '源A PNG', '' + p), asset = await prepareAsset(await file('/assets/m5a/flat-background.png', '合成 图片.png', 'image/png'));
    workspace.addAsset({ ...asset, usages: ['scene'] });
    const model = await file('/assets/m5a/asymmetric-demo.glb', '合成 模型.glb', 'model/gltf-binary');
    workspace.saveEntity({ id: 'synthetic-entity', kind: 'product', name: '合成产品', description: '程序测试素材', tags: [], favorite: false, coverId: asset.id, photos: [{ assetId: asset.id, view: '正面' }], model: { name: model.name, size: model.size, file: model }, createdAt: 1, updatedAt: 1 });
    const stage = defaultStage('16:9');
    stage.subject = { kind: 'builtin', id: 'person' };
    stage.pose = posePreset('sitting');
    stage.root = { position: [.4, 0, 0], rotation: [0, 15, 0] };
    stage.camera = { position: [4, 2.8, 5], rotation: [-8, 30, 0], aim: 'free', focalLengthMm: 85, depthOfField: { enabled: true, focusDistance: 5, strength: .3 } };
    stage.light.power = 321;
    stage.backdrop.image = registerBackdrop(await file('/assets/m5a/flat-background.png', '背景 中文.png', 'image/png'), 'image');
    stage.backdrop.hdr = registerBackdrop(await file('/assets/m5a/analytic-studio.hdr', '环境 中文.hdr', 'image/vnd.radiance'), 'hdr');
    stage.backdrop.mode = 'image';
    stage.backdrop.lighting = true;
    workspace.applyStage(a, stage);
    const product = workspace.createTask('image', '静态 GLB 测试', p), productStage = defaultStage('4:3');
    const preparedModel = await localSubject(model);
    productStage.subject = publishSubject(preparedModel, preparedModel.ref.contentId);
    workspace.applyStage(product, productStage);
    const stageRef = { ...assetReference(workspace.get(), asset), id: 'stage-png-synthetic', src: asset.src, origin: 'local', stageSource: { version: 1, taskId: a, snapshotId: 'synthetic-scene-A', sceneSignature: JSON.stringify(stage), outputId: 'synthetic-output-A', createdAt: '2026-10-22T00:00:00.000Z', ruleVersion: 'synthetic-test.v1', manual: true } };
    const canvas = document.createElement('canvas');
    canvas.width = 12;
    canvas.height = 12;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#b74831';
    ctx.fillRect(0, 0, 12, 12);
    const oldRef = { ...stageRef, id: 'undo-only-old-image', src: canvas.toDataURL('image/png'), assetId: undefined, stageSource: undefined };
    workspace.image(a, d => ({ ...d, draft: { ...d.draft, refs: [oldRef] } }));
    canvas.width = canvas.height = 1;
    workspace.handoff({ id: 'synthetic-m5-handoff', taskId: a, expected: handoffToken(workspace.get(), a), image: { target: 'replace', replaceId: oldRef.id, ref: stageRef }, supplement: { enabled: true, manual: true, text: '摄影棚手改文字 A', source: stageRef.stageSource } });
    let board = template(newBoard(p, '11111111-1111-4111-8111-111111111111'));
    board = { ...board, name: '合成多镜头', brief: { ...board.brief, style: '自然克制', original: '原创合成测试' } };
    const sh0 = board.shots[0].id;
    board = patchShot(board, sh0, { visual: '单张测试画面，原文不变', subject: '几何主体', refs: [assetReference(workspace.get(), asset)] });
    workspace.board(board);
    const c = stageCatalog(workspace.get(), p).entries[0], prepared = await prepareStageImage(c);
    workspace.selectStageImage({ id: 'synthetic-pick', boardId: board.id, shotId: sh0, projectId: p, candidateKey: c.key, expectedSource: c.token, expectedBoard: stageBoardToken(workspace.get(), board.id), target: 'append', replaceConfirmed: false }, prepared);
    board = workspace.get().storyboards[board.id];
    let sh = board.shots[0];
    const prompt = organize(workspace.get(), board, sh);
    prompt.sections[0] = { ...prompt.sections[0], text: '手改主体：明确写入', manual: true };
    board = patchShot(board, sh.id, { prompt });
    workspace.board(board);
    sh = board.shots[0];
    const media = await prepareMedia(workspace.get(), sh.refs), req = { id: 'synthetic-create-image', boardId: board.id, shotId: sh.id, expected: confirmationToken(workspace.get(), board, sh), name: '新建B', model: 'google', ratio: '1:1', allowStale: false };
    const receipt = workspace.createFromShot(req, media);
    createImageStore(receipt.taskId).edit({ scenario: 'success' });
    createImageStore(receipt.taskId).submit();
    const update = { kind: 'update', id: 'synthetic-update', boardId: board.id, shotId: sh.id, taskId: a, expectedSource: updateSourceToken(workspace.get(), board, sh, 'image'), expectedTarget: updateTargetToken(workspace.get(), a), prompt: false, supplement: true, media: [], allowStale: false };
    workspace.updateTaskInputs(update, []);
    const videoIds = [];
    for (const mode of ['text', 'first', 'frames']) {
        board = workspace.get().storyboards[board.id];
        sh = board.shots[0];
        const v = videoOf(sh);
        v.action = '明确的主体动作';
        v.camera = '固定机位';
        v.execution = { ...v.execution, mode, firstId: sh.refs[0].id, lastId: sh.refs[1].id, refIds: [], count: 1 };
        board = patchShot(board, sh.id, { video: v });
        sh = board.shots[0];
        board = patchShot(board, sh.id, { video: { ...v, prompt: organizeVideo(workspace.get(), board, sh) } });
        workspace.board(board);
        sh = board.shots[0];
        const vr = { kind: 'video', id: 'synthetic-video-' + mode, boardId: board.id, shotId: sh.id, expected: videoConfirmationToken(workspace.get(), board, sh), name: '影片 ' + mode, execution: videoOf(sh).execution, allowStale: false };
        const r = workspace.createVideoFromShot(vr, media);
        videoIds.push(r.taskId);
        createVideoStore(r.taskId).edit({ scenario: 'success' });
        createVideoStore(r.taskId).submit();
    }
    await new Promise(r => setTimeout(r, 3400));
    const pending = workspace.createTask('image', '待恢复中断批次', p);
    createImageStore(pending).edit({ prompt: '中断合成测试', count: 1, scenario: 'success' });
    createImageStore(pending).submit();
    editorPositions[board.id] = { selected: board.shots[0].id, target: 'video', checkpoint: { name: board.name, brief: structuredClone(board.brief), shots: structuredClone(board.shots) } };
    return { project: p, source: a, product, image: receipt.taskId, videos: videoIds, board: board.id, shot: sh0 };
}
async function checkRoundTrip() { const before = captureForDisk(), dto = await encodeBusiness(before), decoded = await decodeBusiness(dto), checks = {}; checks.businessEqual = stableJson(before) === stableJson(decoded.business); const board = Object.values(decoded.business.workspace.storyboards || {}).find(b => b.shots.some(sh => sh.prompt)); checks.sourceFingerprint = sourceFingerprint(before.workspace, board, board.shots[0]) === sourceFingerprint(decoded.business.workspace, board, board.shots[0]); checks.confirmationToken = confirmationToken(before.workspace, board, board.shots[0]) === confirmationToken(decoded.business.workspace, board, board.shots[0]); checks.maps = stableJson(before.maps) === stableJson(decoded.business.maps); checks.file = decoded.business.workspace.entities.find(e => e.id === 'synthetic-entity')?.model?.file instanceof File; return { checks, media: dto.media.map(({ base64, ...m }) => m), dtoBytes: JSON.stringify({ ...dto, media: [] }).length }; }
function replay() { const s = workspace.get(), r = s.storyboardReceipts['synthetic-create-image'], q = JSON.parse(r.digest); const n = s.tasks.length, again = workspace.createFromShot(q.request, q.media); let mismatch = false; try {
    workspace.createFromShot({ ...q.request, name: '不同内容' }, q.media);
}
catch {
    mismatch = true;
} const u = s.storyboardUpdates['synthetic-update'], qu = JSON.parse(u.digest), ur = workspace.updateTaskInputs(qu.request, qu.media); const raw = captureBusiness(), m5 = raw.maps.receipts[0], m5request = JSON.parse(raw.maps.handoffDigests.find(([id]) => id === m5[0])[1].slice(6)); const m5same = workspace.handoff(m5request).id === m5[0]; let m5mismatch = false; try {
    workspace.handoff({ ...m5request, expected: 'changed-confirmation' });
}
catch {
    m5mismatch = true;
} return { m5same, m5mismatch, same: again.taskId === r.taskId && workspace.get().tasks.length === n, mismatch, updateSame: ur.id === u.id, effectiveOrigins: effectiveFieldOrigins(workspace.get(), u.taskId), stale: Object.values(s.storyboards || {}).map(b => stale(s, b, b.shots[0])) }; }
function undo() { const s = workspace.get(), u = s.storyboardUpdates['synthetic-update']; workspace.image(u.taskId, d => ({ ...d, draft: { ...d.draft, prompt: '无关字段后改' } })); workspace.undoTaskUpdate(u.id); const kept = workspace.get().images[u.taskId].draft.prompt === '无关字段后改'; workspace.undoHandoff(u.taskId); return { unrelatedKept: kept, updateUndone: workspace.get().storyboardUpdates[u.id].undone, m5Undone: workspace.handoffReceipt(u.taskId)?.undone }; }
function conflict() { const s = workspace.get(), u = s.storyboardUpdates['synthetic-update']; workspace.image(u.taskId, d => ({ ...d, draft: { ...d.draft, storyboardSupplement: { ...d.draft.storyboardSupplement, text: '后改冲突' } } })); let rejected = false; try {
    workspace.undoTaskUpdate(u.id);
}
catch {
    rejected = true;
} return rejected; }
const api = { content: { localSubject, publishSubject, discardSubject, subjectFile, pruneSubjects, restoreSubjectFiles }, poseRepository, desktopPoses, stageWork, workSummary: async () => Promise.all(stageWork.list().map(async (d) => ({ ...d, result: d.result ? { ...d.result, blob: undefined, sha256: Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await d.result.blob.arrayBuffer()))).map(x => x.toString(16).padStart(2, '0')).join('') } : null }))), promptSession, sceneDrafts, appliedSignature, workspace, dto: () => encodeBusiness(captureForDisk()), edit: () => workspace.editProject(workspace.get().projects[0].id, '保存中继续编辑', 'dirty race'), seed, capture: captureForDisk, roundtrip: checkRoundTrip, replay, undo, conflict, raw: captureBusiness, persistence, initialDraft };
Object.assign(window, { __s1bFixture: api });

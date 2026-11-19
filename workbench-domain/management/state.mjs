import { immutable } from '../studio/simulation.mjs';
import { stageIssues } from '../stage3d/state.mjs';
import { sampleAssets } from '../studio/catalog.mjs';
import { createState, tick } from '../studio/state.mjs';
import { videoCreate, videoTick } from '../video/state.mjs';
import { taskGroupStatus } from '../studio/simulation.mjs';
export function workspaceInitial() {
    const assets = sampleAssets.map(r => ({ id: r.id, name: r.name, media: 'image', src: r.src, usages: [r.category], tags: ['示例'], description: '本地原创示例插画，不是真实照片或 AI 生成。', favorite: false, example: true, origin: 'sample', entityId: r.entityId, view: r.view, createdAt: 0, updatedAt: 0 }));
    const entities = ['sample-bottle', 'sample-lin', 'sample-he'].map(id => { const photos = sampleAssets.filter(r => r.entityId === id); return { id, kind: id === 'sample-bottle' ? 'product' : 'character', name: photos[0].name, description: '示例资料卡 · 多角度原创示意图，非真实人物或产品照片。', tags: ['示例'], favorite: false, coverId: photos[0].id, photos: photos.map(r => ({ assetId: r.id, view: r.view })), model: null, createdAt: 0, updatedAt: 0 }; });
    return { stages: {}, projects: [], tasks: [], images: {}, videos: {}, activeImage: null, activeVideo: null, assets, entities };
}
function validProject(s, id) { if (id && !s.projects.some(p => p.id === id))
    throw new Error('项目不存在，请重新选择。'); }
export function addProject(s, id, name, description, now) {
    if (!name.trim())
        throw new Error('请填写项目名称。');
    if (s.projects.some(p => p.id === id))
        throw new Error('项目 ID 已存在。');
    return { ...s, projects: [{ id, name: name.trim(), description, createdAt: now, updatedAt: now }, ...s.projects] };
}
export function editProject(s, id, name, description, now) { if (!name.trim())
    throw new Error('请填写项目名称。'); return { ...s, projects: s.projects.map(p => p.id === id ? { ...p, name: name.trim(), description, updatedAt: now } : p) }; }
export function addCreativeTask(s, id, kind, name, projectId, now) {
    validProject(s, projectId);
    if (!name.trim())
        throw new Error('请填写任务名称。');
    if (s.tasks.some(t => t.id === id))
        throw new Error('任务 ID 已存在。');
    const task = { id, kind, name: name.trim(), projectId, createdAt: now, updatedAt: now };
    return { ...s, tasks: [task, ...s.tasks], ...(kind === 'image' ? { images: { ...s.images, [id]: createState() }, activeImage: id } : { videos: { ...s.videos, [id]: videoCreate() }, activeVideo: id }), projects: s.projects.map(p => p.id === projectId ? { ...p, updatedAt: now } : p) };
}
export function activateTask(s, id) { const task = s.tasks.find(t => t.id === id); if (!task)
    throw new Error('任务不存在；刷新后临时任务不会保留。'); return { ...s, ...(task.kind === 'image' ? { activeImage: id } : { activeVideo: id }) }; }
export function editCreativeTask(s, id, name, projectId, now) {
    validProject(s, projectId);
    if (!name.trim())
        throw new Error('请填写任务名称。');
    const old = s.tasks.find(t => t.id === id);
    return { ...s, tasks: s.tasks.map(t => t.id === id ? { ...t, name: name.trim(), projectId, updatedAt: now } : t), projects: s.projects.map(p => p.id === projectId || p.id === old?.projectId ? { ...p, updatedAt: now } : p) };
}
function touched(s, id, now) { const task = s.tasks.find(t => t.id === id); return { tasks: s.tasks.map(t => t.id === id ? { ...t, updatedAt: now } : t), projects: s.projects.map(p => p.id === task?.projectId ? { ...p, updatedAt: now } : p) }; }
export function updateImage(s, id, fn, now) { const current = s.images[id]; if (!current)
    throw new Error('图片任务不存在。'); const next = fn(current); return next === current ? s : { ...s, images: { ...s.images, [id]: next }, ...touched(s, id, now) }; }
export function updateVideo(s, id, fn, now) { const current = s.videos[id]; if (!current)
    throw new Error('视频任务不存在。'); const next = fn(current); return next === current ? s : { ...s, videos: { ...s.videos, [id]: next }, ...touched(s, id, now) }; }
export function tickWorkspace(s, now) { let next = s; for (const id of Object.keys(s.images))
    next = updateImage(next, id, d => tick(d, now), now); for (const id of Object.keys(s.videos))
    next = updateVideo(next, id, d => videoTick(d, now), now); return next; }
export function taskStatus(s, t) { const batches = t.kind === 'image' ? s.images[t.id]?.batches : s.videos[t.id]?.batches; if (!batches)
    return '来源记录任务'; if (!batches.length)
    return '未生成'; return taskGroupStatus(batches.map(b => b.tasks).flat()); }
export const projectName = (s, id) => s.projects.find(p => p.id === id)?.name || '未归属';
export function submissionContext(s, id) { const task = s.tasks.find(t => t.id === id); return { taskId: id, taskName: task.name, projectId: task.projectId, projectName: projectName(s, task.projectId) }; }
export function addAsset(s, asset) { if (s.assets.some(a => a.id === asset.id || !!asset.source && a.source?.taskId === asset.source.taskId && a.source.resultId === asset.source.resultId))
    return s; return { ...s, assets: [asset, ...s.assets] }; }
export function editAsset(s, id, patch, now) { if (!patch.name.trim())
    throw new Error('请填写素材名称。'); return { ...s, assets: s.assets.map(a => a.id === id ? { ...a, ...patch, name: patch.name.trim(), updatedAt: now } : a) }; }
export function toggleAsset(s, id) { return { ...s, assets: s.assets.map(a => a.id === id ? { ...a, favorite: !a.favorite } : a) }; }
export function saveEntity(s, entity, staged = []) { if (!entity.name.trim())
    throw new Error('请填写资料卡名称。'); const assets = [...s.assets, ...staged.filter(a => !s.assets.some(old => old.id === a.id))]; if (entity.photos.some(p => !assets.some(a => a.id === p.assetId && a.media === 'image')))
    throw new Error('照片引用无效。'); if (entity.coverId && !entity.photos.some(p => p.assetId === entity.coverId))
    throw new Error('封面需属于当前照片。'); return { ...s, assets, entities: s.entities.some(e => e.id === entity.id) ? s.entities.map(e => e.id === entity.id ? { ...entity, name: entity.name.trim() } : e) : [{ ...entity, name: entity.name.trim() }, ...s.entities] }; }
export function duplicateAssets(s, file) { return s.assets.filter(a => (a.fileName || a.name) === file.name && a.size === file.size && a.lastModified === file.lastModified && a.mime === file.type); }
export function assetReference(s, a, entity) {
    const owner = entity || s.entities.find(e => e.id === a.entityId) || s.entities.find(e => e.photos.some(p => p.assetId === a.id));
    return { ...(a.stageSource ? { stageSource: structuredClone(a.stageSource) } : {}), id: owner && a.entityId !== owner.id ? `${a.id}::${owner.id}` : a.id, assetId: a.id, src: a.src, name: owner?.name || a.name, category: owner?.kind || a.usages[0] || 'scene', entityId: owner?.id || a.entityId || a.id, view: owner?.photos.find(p => p.assetId === a.id)?.view || a.view || '参考图', origin: a.origin === 'sample' ? 'sample' : 'library', example: a.example, sourceTaskId: a.source?.taskId, sourceResultId: a.source?.resultId, sourceTaskName: a.source?.taskName, sourceKind: a.source?.kind };
}
export function pickerReferences(s) { return s.assets.filter(a => a.media === 'image').map(a => assetReference(s, a)); }
export function assetFromReference(ref, now) { return { ...(ref.stageSource ? { stageSource: structuredClone(ref.stageSource) } : {}), id: ref.assetId || ref.id, name: ref.name, media: 'image', src: ref.src, usages: [ref.category], tags: ref.example || ref.origin === 'sample' ? ['示例'] : [], description: '从本次创作的临时引用明确加入素材库。', favorite: false, example: !!ref.example || ref.origin === 'sample', origin: ref.sourceTaskId && ref.sourceResultId ? 'result' : ref.origin === 'sample' ? 'sample' : 'local', ...(ref.sourceTaskId && ref.sourceResultId ? { source: { taskId: ref.sourceTaskId, taskName: ref.sourceTaskName || '来源任务', resultId: ref.sourceResultId, kind: ref.sourceKind || 'image' } } : {}), view: ref.view, entityId: ref.entityId, size: ref.size, fileName: ref.name, mime: ref.mime, lastModified: ref.lastModified, createdAt: now, updatedAt: now }; }
export function applyStageSettings(s, id, settings, now) { if (!s.tasks.some(t => t.id === id))
    throw new Error('任务已不可用。'); const issues = stageIssues(settings); if (issues.length)
    throw new Error(issues.join(' ')); return { ...s, stages: { ...s.stages, [id]: immutable(settings) }, ...touched(s, id, now) }; }

import { sceneDrafts } from '../stage3d/draft-state.mjs';
import { workspace } from '../management/store.mjs';
import { commandTarget } from '../management/commands.mjs';
import { generated } from '../generated/store.mjs';
import { stageWork } from '../stage3d/work-state.mjs';
import { persistence } from './session.mjs';
export function editableView() {
    const w = workspace.get();
    return {
        project: w.projects.map(p => ({ ...commandTarget(w, 'project', p.id), commandRevision: w.commandRevisions?.[p.id] || 0 })),
        task: w.tasks.map(t => { const target = commandTarget(w, 'task', t.id), g = generated.draft(t.id); return { ...target, commandRevision: w.commandRevisions?.[t.id] || 0, ...(Object.hasOwn(target, 'prompt') ? { generatedPrompt: g?.prompt ?? null, promptConflict: !!g && g.prompt !== ('prompt' in target ? target.prompt : '') } : {}) }; })
    };
}
function target(type, id) { return type === 'library' ? { generation: persistence.get().generation, revision: persistence.get().revision } : editableView()[type].find(t => t.id === id); }
function creationGuard(id) { const w = workspace.get(); return JSON.stringify({ task: w.tasks.find(t => t.id === id), image: w.images[id], video: w.videos[id], stage: w.stages[id], stageWork: stageWork.get(id), sceneDraft: sceneDrafts.get(id), generated: generated.get().drafts.filter(d => d.taskId === id), requests: generated.get().requests.filter(d => d.taskId === id), results: generated.get().results.filter(d => d.taskId === id), links: w.storyboardLinks?.filter(x => JSON.stringify(x).includes(id)) }); }
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
export function controlledChange(p) {
    const s = persistence.get(), w = workspace.get();
    if (!['ready', 'failed'].includes(s.phase) || s.selectionBusy || !s.cap || stageWork.library() !== p.libraryId)
        throw Error('MCP_SCOPE_EXPIRED');
    const prior = w.changeReceipts?.find(r => r.proposalId === p.proposalId);
    if (p.action === 'apply') {
        if (prior)
            return prior;
        if (!same(target(p.base.type, p.base.id || ''), p.base.target))
            throw Error('MCP_CONFLICT');
        const r = { id: crypto.randomUUID(), proposalId: p.proposalId, libraryId: p.libraryId, actor: p.actor, confirmedBy: 'native-user', at: Date.now(), command: p.command, before: p.before, after: {}, fields: Object.keys(p.command).filter(k => ['name', 'description', 'prompt'].includes(k)) };
        // Shared command validates before either real store is changed. No Repository save here.
        workspace.business(p.command, r);
        if (p.command.kind === 'task-create')
            r.creationGuard = creationGuard(p.command.id);
        r.after = target(p.command.kind.startsWith('project') ? 'project' : 'task', p.command.id);
        // Complete the receipt in the same synchronous turn; subscribers cannot act between commands.
        workspace.replaceControlled({ ...workspace.get(), changeReceipts: workspace.get().changeReceipts.map(x => x.proposalId === p.proposalId ? r : x) });
        return r;
    }
    if (!prior)
        throw Error('MCP_ID_NOT_IN_SCOPE');
    if (prior.undone)
        return prior;
    const c = prior.command, type = c.kind.startsWith('project') ? 'project' : 'task';
    if (!same(target(type, c.id), prior.after))
        throw Error('MCP_CONFLICT');
    let next = workspace.get();
    if (c.kind === 'project-create') {
        if (next.tasks.some(t => t.projectId === c.id))
            throw Error('MCP_CONFLICT');
        next = { ...next, projects: next.projects.filter(x => x.id !== c.id) };
    }
    else if (c.kind === 'task-create') {
        if (!prior.creationGuard || prior.creationGuard !== creationGuard(c.id) || sceneDrafts.get(c.id))
            throw Error('MCP_CONFLICT');
        const d = (c.taskKind === 'image' ? next.images : next.videos)[c.id];
        // Creating an undo must never remove later work, references, scenes, results or links.
        if (d?.batches.length || d?.draft.refs.length || next.stages[c.id] || generated.get().drafts.some(x => x.taskId === c.id) || generated.get().results.some(x => x.taskId === c.id) || next.storyboardLinks?.some(x => JSON.stringify(x).includes(c.id)) || !!stageWork.get(c.id))
            throw Error('MCP_CONFLICT');
        const images = { ...next.images }, videos = { ...next.videos };
        delete images[c.id];
        delete videos[c.id];
        next = { ...next, tasks: next.tasks.filter(t => t.id !== c.id), images, videos, activeImage: next.activeImage === c.id ? null : next.activeImage, activeVideo: next.activeVideo === c.id ? null : next.activeVideo };
    }
    else {
        const reverse = { kind: c.kind, id: c.id };
        for (const k of prior.fields)
            if (['name', 'description', 'prompt'].includes(k))
                reverse[k] = prior.before?.[k];
        workspace.business(reverse);
        next = workspace.get();
    }
    const undone = { ...prior, undone: true, undoneAt: Date.now() };
    workspace.replaceControlled({ ...next, commandRevisions: { ...next.commandRevisions, [c.id]: (next.commandRevisions?.[c.id] || 0) + 1 }, commandAudit: [...(next.commandAudit || []), { id: c.id, actor: 'native-user (undo ' + prior.proposalId + ')', fields: prior.fields, at: Date.now() }], changeReceipts: next.changeReceipts.map(r => r.proposalId === p.proposalId ? undone : r) });
    return undone;
}

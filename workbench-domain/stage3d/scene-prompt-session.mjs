import { stageWork } from './work-state.mjs';
let project = id => stageWork.get(id)?.projectId || null;
export const promptSession = { configure: (resolver) => { project = resolver; }, subscribe: stageWork.subscribe, get: (id) => stageWork.get(id)?.prompt || undefined, selected: (id) => stageWork.get(id)?.selectedSource,
    write(id, draft) { if (draft.source.task.id !== id)
        throw Error('文字来源任务不匹配。'); stageWork.update(id, project(id), { prompt: structuredClone(draft) }); },
    select(id, kind) { stageWork.update(id, project(id), { selectedSource: kind }); }, remove: stageWork.removePrompt,
    ack(id) { const d = this.get(id); if (d)
        this.write(id, { ...d, unacknowledged: false }); } };

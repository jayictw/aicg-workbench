export function immutable(value) {
    const copy = structuredClone(value);
    function freeze(v) { if (v && typeof v === 'object') {
        Object.freeze(v);
        Object.values(v).forEach(freeze);
    } }
    freeze(copy);
    return copy;
}
export function advance(task, now) {
    if (task.status === 'completed' || task.status === 'failed' || task.status === 'interrupted')
        return task;
    const elapsed = now - task.startedAt;
    const status = elapsed < 700 ? 'queued' : elapsed < 3000 ? 'running' : task.willFail ? 'failed' : 'completed';
    return status === task.status ? task : { ...task, status };
}
export function retry(task, now) {
    return task.status === 'failed' ? { ...task, status: 'queued', attempt: task.attempt + 1, startedAt: now, willFail: false } : task;
}
export function taskGroupStatus(tasks) {
    if (tasks.some(t => t.status === 'running'))
        return '生成中';
    if (tasks.some(t => t.status === 'queued'))
        return '排队中';
    if (tasks.some(t => t.status === 'interrupted'))
        return '已中断（未自动继续）';
    const failed = tasks.filter(t => t.status === 'failed').length;
    return failed === 0 ? '完成' : failed === tasks.length ? '失败' : '部分成功';
}

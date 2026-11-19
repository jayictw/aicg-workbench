// Shared deterministic M2/M3 simulation; no network or persistence.
export type SimTask = { status: 'queued' | 'running' | 'completed' | 'failed' | 'interrupted'; startedAt: number; willFail: boolean; attempt: number }
export function immutable<T>(value: T): T {
  const copy = structuredClone(value)
  function freeze(v: unknown) { if (v && typeof v === 'object') { Object.freeze(v); Object.values(v).forEach(freeze) } }
  freeze(copy); return copy
}
export function advance<T extends SimTask>(task: T, now: number): T {
  if (task.status === 'completed' || task.status === 'failed' || task.status === 'interrupted') return task
  const elapsed = now - task.startedAt
  const status = elapsed < 700 ? 'queued' : elapsed < 3000 ? 'running' : task.willFail ? 'failed' : 'completed'
  return status === task.status ? task : { ...task, status }
}
export function retry<T extends SimTask>(task: T, now: number): T {
  return task.status === 'failed' ? { ...task, status: 'queued', attempt: task.attempt + 1, startedAt: now, willFail: false } : task
}
export function taskGroupStatus(tasks: readonly SimTask[]): string {
  if (tasks.some(t => t.status === 'running')) return '生成中'
  if (tasks.some(t => t.status === 'queued')) return '排队中'
  if (tasks.some(t => t.status === 'interrupted')) return '已中断（未自动继续）'
  const failed = tasks.filter(t => t.status === 'failed').length
  return failed === 0 ? '完成' : failed === tasks.length ? '失败' : '部分成功'
}

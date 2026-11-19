import {McpTaskEditor} from '../persistence/McpTaskEditor'
import {SeedancePanel} from '../video/SeedancePanel'
import {BPanel} from '../generated/BPanel'
import { useEffect, useSyncExternalStore } from 'react'


import { workspace } from './store'
import type { TaskKind } from './state'
export function TaskWorkspace({kind,requested}:{kind:TaskKind;requested:string|null}) {
 const s=useSyncExternalStore(workspace.subscribe,workspace.get),id=requested||(kind==='image'?s.activeImage:s.activeVideo),task=s.tasks.find(t=>t.id===id&&t.kind===kind)
 useEffect(()=>{if(requested){workspace.activate(requested);return}if(!task && !(kind==='image'?workspace.get().activeImage:workspace.get().activeVideo)){workspace.createTask(kind,`未命名${kind==='image'?'图片':'视频'}任务`)}},[kind,requested,task])
 useEffect(()=>{if(task)document.querySelector<HTMLElement>('h1')?.focus({preventScroll:true})},[task?.id])
 if(requested&&!task)return <section className="placeholder-page"><h1 tabIndex={-1}>任务不可用</h1><p>此临时任务不存在，刷新或关闭后新增数据不会保留。</p><a className="primary-button" href={`#/${kind}`}>进入快速创作</a></section>
 if(!task)return <p role="status">正在建立本次创作任务…</p>
 if(kind==='video'&&window.seedancePipeline)return <SeedancePanel key={task.id+location.hash} taskId={task.id}/>;if(kind==='image'&&window.imagePipeline)return <BPanel key={task.id+location.hash} taskId={task.id}/>;if(window.mcpReadOnly)return <McpTaskEditor key={task.id} taskId={task.id} kind={kind}/>;return <section className="placeholder-page"><h1>请使用本版本桌面入口</h1><p>当前环境未连接火山创作工作台。历史任务资料保留；本版本不开放原型多平台或模拟模型选择。</p><a className="secondary-button" href="#/settings">查看配置与工作库</a></section>
}

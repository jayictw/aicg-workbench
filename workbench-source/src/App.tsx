import {McpProposals} from './persistence/McpProposals'
import {McpViewBridge} from './persistence/McpReadOnly'
import {currentVideoScope} from './creation/mode-display'
import {generated} from './generated/store'
import './ui-r5.css'
import './workbench-release.css'
import {LibraryStatus,LibrarySettings} from './persistence/LibraryUI'

import { allowWorkbenchRouteChange } from './stage3d/workbench-navigation'
import { TaskWorkspace } from './management/TaskWorkspace'
import Projects from './management/Projects'
import AssetLibrary from './management/AssetLibrary'
import { workspace, taskHref } from './management/store'
import { projectName, taskStatus } from './management/state'
import type { CreativeTask } from './management/state'
import './management/management.css'
import { syncThemeChrome } from './theme'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { KeyboardEvent } from 'react'
import { Aperture, ArrowLeft, ArrowRight, Check, ChevronRight, Clapperboard, Folder, FolderOpen, Image as ImageIcon, Layers3, Moon, Play, Settings2, Sun } from 'lucide-react'

const pages = { home: '首页', image: '图片创作', video: '视频创作', projects: '项目', assets: '素材库', settings: '设置', storyboard:'分镜助手' } as const
type Page = keyof typeof pages
type Theme = 'light' | 'dark'
type RecentTab = 'projects' | 'generations'
function readRoute() {
  const [path, query = ''] = (window.location.hash.slice(1) || '/').split('?')
  return { page: (path === '/' ? 'home' : path.slice(1)) as string, params: new URLSearchParams(query) }
}
function Home({ params, updateRecent }: { params: URLSearchParams, updateRecent: (tab: RecentTab, empty: boolean) => void }) {
  const tab: RecentTab = params.get('recent') === 'generations' ? 'generations' : 'projects'
  const state = useSyncExternalStore(workspace.subscribe, workspace.get)
  const previewEmpty = params.get('state') === 'empty'
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  function switchTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : 1 - index
    updateRecent(next ? 'generations' : 'projects', previewEmpty)
    tabRefs.current[next]?.focus()
  }
  function preview(task: CreativeTask | undefined) {
    if (!task) return { src: '', label: '暂无任务预览' }
    const data = task.kind === 'image' ? state.images[task.id] : state.videos[task.id]
    if(!data){const result=generated.get().results.find(r=>r.taskId===task.id);return {src:result?generated.src(result.current.mediaId):'',label:result?(result.source.kind==='provider-returned'?'平台返回':'本地合成'):'尚未加入结果'}}
    const batch=data.batches.find(b=>b.tasks.some(t=>t.status==='completed'))
    const done=batch?.tasks.find(t=>t.status==='completed')
    if (done) return { src: task.kind === 'image' ? done.src : '/assets/m3/local-demo.jpg', label: batch?.id.startsWith('flash-offline-')?'Flash · 离线模拟':'示例结果' }
    const input = task.kind === 'image' ? state.images[task.id].draft.refs[0] : state.videos[task.id].draft.first
    return { src: input?.src || '', label: input ? '输入参考' : '尚未生成' }
  }
  const sortedTasks = [...state.tasks].sort((a,b) => b.updatedAt - a.updatedAt)
  const samples = tab === 'projects' ? [...state.projects].sort((a,b)=>b.updatedAt-a.updatedAt).slice(0,4).map(p => {
    const task = sortedTasks.find(t=>t.projectId===p.id)
    return { id:p.id,title:p.name,subtitle:p.description||`${state.tasks.filter(t=>t.projectId===p.id).length} 个任务`,type:task?.kind||'image',href:`#/projects?id=${p.id}`,...preview(task) }
  }) : sortedTasks.slice(0,4).map(t=>({id:t.id,title:t.name,subtitle:`${projectName(state,t.projectId)} · ${taskStatus(state,t)}`,type:t.kind,href:taskHref(t.kind,t.id),...preview(t)}))
  const empty = previewEmpty || samples.length === 0

  return <>
    <section className="intro" aria-labelledby="welcome-title">
      <div><h1 id="welcome-title" tabIndex={-1}>让想象，有处落笔。</h1><p>从一张图片，或一段影像开始。</p></div>
      <span className="workspace-note"><span />你的个人创作空间</span>
    </section>
    <section className="creation-grid" aria-label="开始创作">
      <a href="#/image" className="creation-card image-card" aria-label="图片创作，进入图片工作台">
        <div className="creation-art"><img src="/assets/ribbon.svg" alt="" width="1000" height="600" fetchPriority="high" /><span className="art-caption">色彩，形状，无限可能。</span><span className="art-tool"><ImageIcon aria-hidden="true" size={22} /></span></div>
        <div className="creation-copy"><div><h2>图片创作</h2><p>把脑海中的画面，变成看得见的灵感。</p></div><span className="circle-arrow"><ArrowRight aria-hidden="true" size={20} /></span></div>
      </a>
      <a href="#/video" className="creation-card video-card" aria-label="视频创作，进入视频工作台">
        <div className="creation-art"><img src="/assets/landscape.svg" alt="" width="1000" height="600" /><span className="art-caption">让每一个瞬间，有了故事。</span><span className="art-tool"><Clapperboard aria-hidden="true" size={22} /></span><span className="video-play"><Play aria-hidden="true" size={23} fill="currentColor" /></span><span className="filmstrip"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></span></div>
        <div className="creation-copy"><div><h2>视频创作</h2><p>连接想法与镜头，探索流动的叙事。</p></div><span className="circle-arrow"><ArrowRight aria-hidden="true" size={20} /></span></div>
      </a>
    </section>
    <section className="recent-section" aria-label="最近创作">
      <div className="recent-heading">
        <div role="tablist" aria-label="最近内容" className="tabs">
          {(['projects', 'generations'] as const).map((item, index) => <button key={item} ref={el => { tabRefs.current[index] = el }} role="tab" id={`tab-${item}`} aria-controls="recent-content" aria-selected={tab === item} tabIndex={tab === item ? 0 : -1} onKeyDown={e => switchTab(e, index)} onClick={() => updateRecent(item, previewEmpty)}>{item === 'projects' ? '最近项目' : '最近任务'}</button>)}
        </div>
        <div className="recent-actions"><span className="sample-badge">本次会话</span><button className="text-button state-toggle" aria-pressed={previewEmpty} disabled={samples.length === 0} onClick={() => updateRecent(tab, !previewEmpty)}>{previewEmpty ? '查看当前记录' : '查看空白状态'}</button><a className="text-link" href={tab === 'projects' ? '#/projects' : '#/projects?view=tasks'}>查看全部<ChevronRight aria-hidden="true" size={15} /></a></div>
      </div>
      <div role="tabpanel" id="recent-content" aria-labelledby={`tab-${tab}`} tabIndex={0}>
        {empty ? <div className="empty-state" aria-live="polite"><span className="empty-icon">{tab === 'projects' ? <FolderOpen aria-hidden="true" size={27} /> : <Layers3 aria-hidden="true" size={27} />}</span><div><h3>{tab === 'projects' ? '还没有项目' : '还没有创作任务'}</h3><p>{tab === 'projects' ? '从上方选择一种创作方式，开始你的第一个想法。' : '本次创建的图片与视频任务将在这里汇集。'}</p></div><a className="secondary-button" href="#/image">开始图片创作<ArrowRight aria-hidden="true" size={16} /></a></div> : <><div className="recent-grid">{samples.map(item => <a className="project-card" href={item.href} key={item.id} aria-label={`${item.title}，${tab === 'projects' ? '项目' : '创作任务'}`}><div className="thumbnail">{item.src ? <img src={item.src} alt="" width="1000" height="600" loading="lazy" /> : <span className="m4-recent-placeholder">{tab==='projects'?<FolderOpen aria-hidden="true" size={32}/>:item.type==='video'?<Clapperboard aria-hidden="true" size={32}/>:<ImageIcon aria-hidden="true" size={32}/>}</span>}<span className="media-badge">{item.type === 'video' ? <Clapperboard aria-hidden="true" size={14} /> : <ImageIcon aria-hidden="true" size={14} />}{item.label}</span></div><div className="project-copy"><h3 title={item.title}>{item.title}</h3><p title={item.subtitle}>{item.subtitle}</p></div></a>)}</div><p className="sample-note">{window.workLibrary?'桌面手动保存才可重开恢复；未保存修改仍会遗失。':'仅显示本次会话记录；刷新或关闭后新增资料不保留。'}示例结果非真实 AI 生成。</p></>}
      </div>
    </section>
  </>
}
function Placeholder({ page, sample }: { page: 'projects' | 'assets' | 'settings', sample: boolean }) {
  const details = { projects: { icon: FolderOpen, heading: '为你的灵感，留一个位置', body: '项目列表与项目管理将在后续阶段实现。', items: ['项目列表', '项目详情'] }, assets: { icon: Layers3, heading: '让素材，成为创作的起点', body: '素材浏览与导入将在后续阶段实现。', items: ['素材浏览', '素材导入'] }, settings: { icon: Settings2, heading: '让工作台，更合你的习惯', body: '更多个人偏好将在后续阶段实现。', items: ['个人偏好', '工作区设置'] } }[page]
  const Icon = details.icon
  return <><div className="page-heading"><a href="#/" className="back-link"><ArrowLeft aria-hidden="true" size={17} />返回首页</a><div className="page-title-line"><h1 tabIndex={-1}>{pages[page]}</h1><span className="prototype-badge">M1 原型</span></div></div><section className="placeholder-page"><span className="large-icon"><Icon aria-hidden="true" size={35} strokeWidth={1.5} /></span><h2>{details.heading}</h2><p>{details.body}</p>{sample && <p className="sample-detail">你打开的是模拟项目入口，尚无真实项目文件。</p>}<div className="pending-features">{details.items.map(item => <span key={item}>{item}<span>待实现</span></span>)}</div>{page === 'settings' && <p className="appearance-hint"><Check aria-hidden="true" size={16} />外观切换已可使用，点击右上角太阳／月亮按钮。</p>}<a className="primary-button" href="#/"><ArrowLeft aria-hidden="true" size={16} />返回首页</a></section></>
}
export default function App() {
  const [route, setRoute] = useState(readRoute)
  const [theme, setTheme] = useState<Theme>(() => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')
  useEffect(() => {
    // Existing library hydration restores the document theme independently.
    const sync = () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')
    const observer = new MutationObserver(sync)
    observer.observe(document.documentElement, {attributes:true, attributeFilter:['data-theme']})
    sync()
    return () => observer.disconnect()
  }, [])
  const [storageFailed, setStorageFailed] = useState(false)
  useEffect(() => { syncThemeChrome() }, [theme])
  const page = (Object.hasOwn(pages, route.page) ? route.page : 'unknown') as Page | 'unknown'
  const previousPage = useRef(page)
  useEffect(() => { const listener = () => { if(allowWorkbenchRouteChange()) setRoute(readRoute()) }; window.addEventListener('hashchange', listener); return () => window.removeEventListener('hashchange', listener) }, [])
  useEffect(() => {
    document.title = `${page === 'unknown' ? '页面未找到' : pages[page]} · AI Creative Studio`
    if (previousPage.current !== page) { window.scrollTo(0, 0); document.querySelector<HTMLElement>('h1')?.focus({preventScroll:true}); previousPage.current = page }
  }, [page])
  function toggleTheme() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    document.documentElement.style.colorScheme = next
    setTheme(next);window.dispatchEvent(new Event('appearancechange'))
    try { localStorage.setItem('acs-appearance', next); setStorageFailed(false) } catch { setStorageFailed(true) }
  }
  function updateRecent(tab: RecentTab, empty: boolean) {
    const query = new URLSearchParams({ recent: tab })
    if (empty) query.set('state', 'empty')
    window.location.hash = `/?${query}`
  }
  return <div className={`app-shell ui-r5-shell${(page === 'image' || page === 'video') ? ' m2-shell' : ''}`}>
    <McpViewBridge/><a className="skip-link" href="#main" onClick={event => { event.preventDefault(); document.getElementById('main')?.focus() }}>跳到主要内容</a>
    <header className="site-header"><div className="header-inner"><a href="#/" className="brand" aria-label="AI Creative Studio 首页"><span className="brand-symbol"><Aperture aria-hidden="true" size={24} strokeWidth={1.6} /></span><span translate="no">AI Creative Studio</span></a><nav aria-label="主导航">{([{ key: 'home', icon: Aperture }, { key: 'projects', icon: Folder }, { key: 'assets', icon: Layers3 }, { key: 'settings', icon: Settings2 }] as const).map(({ key, icon: Icon }) => <a href={key === 'home' ? '#/' : `#/${key}`} key={key} aria-current={page === key ? 'page' : undefined}><Icon aria-hidden="true" size={17} /><span>{pages[key]}</span></a>)}</nav><div className="header-tools"><LibraryStatus/><span className="local-tag">个人工作台</span><button className="theme-toggle" onClick={toggleTheme} aria-label={`切换为${theme === 'light' ? '深' : '浅'}色外观`} title={`切换为${theme === 'light' ? '深' : '浅'}色外观`}>{theme === 'light' ? <Moon aria-hidden="true" size={19} /> : <Sun aria-hidden="true" size={20} />}</button></div></div></header>
    {storageFailed && <p className="storage-warning" role="status">当前浏览器无法记住外观选择，本次切换仍然有效。</p>}
    <McpProposals/><main id="main" tabIndex={-1} className={page==='storyboard'?'sb-main':(page === 'image' || page === 'video') ? 'm2-main' : 'ui-r5-page'} data-r5-page={page}>{page === 'storyboard' ? <section className="placeholder-page"><h1>分镜规划与多模式生成尚未开放</h1><p>历史分镜数据保留。{currentVideoScope}首尾帧、影片／音讯参考、剪辑、新平台尚未开放；MCP仅本轮QA只读及受控提案。</p><a className="primary-button" href="#/image">图片创作</a><a className="secondary-button" href="#/video">影片创作</a></section> : page === 'home' ? <Home params={route.params} updateRecent={updateRecent} /> : page === 'image' ? <TaskWorkspace kind="image" requested={route.params.get('task')} /> : page === 'video' ? <TaskWorkspace kind="video" requested={route.params.get('task')} /> : page === 'projects' ? <Projects key={route.params.get('id')||route.params.get('view')||'all'} id={route.params.get('id')} unassigned={route.params.get('view')==='unassigned'} allTasks={route.params.get('view')==='tasks'} /> : page === 'assets' ? <AssetLibrary assetId={route.params.get('id')} /> : page === 'unknown' ? <section className="placeholder-page"><h1 tabIndex={-1}>页面未找到</h1><p>这个地址暂时没有内容。</p><a className="primary-button" href="#/">返回首页</a></section> : (window.workLibrary?<LibrarySettings/>:<Placeholder page={page} sample={route.params.has('sample')} />)}</main>
    <footer className="site-footer"><span><span className="footer-dot" />灵感在此，自由生长。</span><span>火山中国 · 图片与影片工作台<span className="footer-divider" />合成测试结果会单独标示</span></footer>
  </div>
}

import {useEffect,useRef,useState} from 'react'
import {createPortal} from 'react-dom'
import {Modal} from '../studio/Modal'
import './diagnostic.css'
type Ref={where:string;via:string;taskId?:string;taskName?:string;projectId?:string;boardId?:string;shotId?:string;assetId?:string;entityId?:string;poseId?:string;poseName?:string;outputId?:string;deleted?:boolean;role?:string}
type Item={mediaId?:string;relative?:string;filename?:string;mime?:string;code:string;expectedSize:number;actualSize?:number;expectedHash:string;actualHash?:string;references:Ref[];attribution:string;operations:string[];isEvidence:boolean}
type Summary={handle:string;state:string;overall:string;consistency:string;location:string;identityVerified?:boolean;libraryId?:string;revision?:number;poseRevision?:number;checked:number;total:number|null;unchecked:number|null;omittedResultObjects?:number;pages:number;issues:{code:string;where?:string;mediaId?:string}[];unknown:string[];versions?:Record<string,number|null>;scope?:string;finishedAt?:string}
type Reply<T>={ok:true;value:T}|{ok:false;code:string}
type Bridge={choose:(r:Record<string,never>)=>Promise<Reply<Summary|null>>;status:(r:{handle:string})=>Promise<Reply<Summary>>;page:(r:{handle:string;page:number})=>Promise<Reply<{page:number;items:Item[]}>>;cancel:(r:{handle:string})=>Promise<Reply<unknown>>;release:(r:{handle:string})=>Promise<Reply<{released:boolean;consistency:string}>>}
declare global{interface Window{localDiagnostics?:Bridge}}
const labels:Record<string,string>={D_BYTES_MATCH:'登记字节相符（未检查解码）',D_MEDIA_NOT_FOUND:'媒体不存在',D_MEDIA_SIZE_MISMATCH:'媒体大小不符',D_MEDIA_HASH_MISMATCH:'媒体内容 hash 不符',D_REFERENCE_INVALID:'引用／元数据异常',D_DATABASE_CORRUPT:'数据库损坏',D_DATABASE_INVALID:'数据库结构不可验证',D_IDENTITY_MISMATCH:'身份不符',D_VERSION_UNSUPPORTED:'版本不支持',D_ACCESS_DENIED:'读取权限不足',D_BUSY:'目标已打开／写入状态未明／存在 sidecar',D_PATH_REJECTED:'路径被拒绝',D_TYPE_INVALID:'文件类型不符',D_RESOURCE_LIMIT:'资源上限，检查未完成',D_CANCELLED:'已取消检查',D_IO_ERROR:'读取失败，状态未确认',D_SNAPSHOT_CHANGED:'源内容变化，结果不稳定',D_HANDLE_EXPIRED:'诊断会话已失效，请重新选取',D_SCHEMA:'诊断请求无效',D_ORIGIN:'诊断来源被拒绝'}
const label=(code:string)=>labels[code]||'未确认的诊断状态'
const value=(n:number|null|undefined)=>n===null||n===undefined?'未知':String(n)
export function DiagnosticPanel({disabled=false}:{disabled?:boolean}){
 const [summary,setSummary]=useState<Summary|null>(null),[items,setItems]=useState<Item[]>([]),[page,setPage]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('')
 const returnFocus=useRef(false);const handle=useRef(''),alive=useRef(true),ticket=useRef(0),trigger=useRef<HTMLButtonElement>(null)
 useEffect(()=>{if(returnFocus.current&&!summary&&!busy){trigger.current?.focus();returnFocus.current=false}},[summary,busy])
 const api=window.localDiagnostics
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;ticket.current++;if(handle.current)void window.localDiagnostics?.release({handle:handle.current})}},[])
 async function release(){
  if(!api||!handle.current)return
  setBusy(true)
  const h=handle.current
  try{const r=await api.release({handle:h});if(!r.ok){if(r.code==='D_HANDLE_EXPIRED'){handle.current='';ticket.current++;returnFocus.current=true;setSummary(null);setItems([]);setPage(0);setNotice('会话已失效；没有新的退出复核，不作一致性结论。');return}throw Error(label(r.code))}handle.current='';ticket.current++;returnFocus.current=true;setSummary(null);setItems([]);setPage(0);setNotice(r.value.consistency==='observed-unchanged'?'会话已退出；受检固定文件与登记对象未观察到变化，非全目录／无外部写入证明。':'会话已退出；一致性无法确认，请保留原库并重新检查。')}
  catch(e){setError((e as Error).message)}
  finally{if(alive.current)setBusy(false)}
 }
 async function choose(){
  if(!api||busy)return
  setError('');setNotice('')
  if(handle.current){await release();if(handle.current)return}
  setBusy(true);const scope=++ticket.current
  try{const r=await api.choose({});if(!r.ok)throw Error(label(r.code));if(!alive.current||scope!==ticket.current){if(r.value)void api.release({handle:r.value.handle});return}if(r.value){handle.current=r.value.handle;setSummary(r.value);setItems([]);setPage(0)}else setNotice('已取消选择；当前工作区保持。')}
  catch(e){if(alive.current)setError((e as Error).message)}finally{if(alive.current)setBusy(false)}
 }
 useEffect(()=>{
  if(!summary||!api)return
  let disposed=false
  const h=summary.handle,scope=ticket.current
  async function refresh(){
   try{const r=await api!.status({handle:h});if(disposed||scope!==ticket.current)return
    if(!r.ok){setError(label(r.code));return}
    setSummary(r.value)
    if(r.value.state!=='running'){const list=await api!.page({handle:h,page});if(!disposed&&scope===ticket.current&&list.ok)setItems(list.value.items)}
   }catch{if(!disposed)setError('诊断连接不可用；未确认完成')}
  }
  void refresh()
  const timer=summary.state==='running'?window.setInterval(()=>void refresh(),300):undefined
  return()=>{disposed=true;if(timer)clearInterval(timer)}
 },[summary?.handle,summary?.state,page,api])
 if(!api)return null
 const running=summary?.state==='running'
 const counts=summary?.issues?.reduce<Record<string,number>>((a,i)=>(a[i.code]=(a[i.code]||0)+1,a),{})||{}
 return <div className="diagnostic-entry">
  <button ref={trigger} type="button" className="secondary-button" disabled={disabled||busy||!!summary} onClick={()=>void choose()}>只读诊断工作库</button>
  {error&&!summary&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
  {summary&&createPortal(<Modal title="只读诊断工作库" wide className="diagnostic-dialog" onClose={()=>{if(!busy)void release()}}>
   <div className="diagnostic-scroll" aria-busy={running||busy}>
    <p className="diagnostic-scope">隔离测试资料 · 仅诊断，不打开、不编辑当前工作区。只检查登记字节，未检查解码或来源防伪。</p>
    <dl className="diagnostic-meta"><dt>本次目标</dt><dd>{summary.location}</dd><dt>本次检查时间</dt><dd>{summary.finishedAt?new Date(summary.finishedAt).toLocaleString("zh-CN",{timeZone:"Asia/Shanghai",hour12:false}):"检查中／尚未完成"}</dd><dt>库身份</dt><dd>{summary.identityVerified?summary.libraryId:'尚未核验／无法确认'}</dd><dt>已读版本</dt><dd>核心 r{value(summary.revision)} · 姿势 p{value(summary.poseRevision)}{summary.versions&&' · '+Object.entries(summary.versions).map(([k,v])=>k+' '+value(v)).join(' / ')}</dd></dl>
    <p role="status">{busy?'正在结束只读会话并复核已观察文件…':running?'正在只读检查身份、数据库和登记媒体…':summary.state==='cancelled'?'检查已取消；以下仅为已观察范围。':summary.state==='stopped'?'检查未完成；请保留原库。':'登记对象检查已结束；库整体状态仍未确认。'}</p>
    <p>登记 {value(summary.total)} · 已检查 {value(summary.checked)} · 未检查 {value(summary.unchecked)} · 未展示对象 {value(summary.omittedResultObjects||0)} · 未知关联数量：未知（历史未穷尽）</p>
    <p>{summary.consistency==='observed-unchanged'?'已观察的固定文件与登记对象前后印记相同；只表示未观察到变化，不能证明期间没有外部 writer，也不是全目录零写入证明。':summary.consistency==='changed'?'检测到源变化：报告不稳定，未完成。':'一致性证据不足／检查未完成；不宣称完整通过。'}</p>
    {!!Object.keys(counts).length&&<ul aria-label="诊断分类汇总">{Object.entries(counts).map(([c,n])=><li key={c}>{label(c)} · {n}（记录数，非完整影响数）</li>)}</ul>}
    {summary.issues?.some(i=>i.where)&&<details><summary>结构／引用检查详情</summary><ul>{summary.issues.filter(i=>i.where).slice(0,100).map((i,n)=><li key={n}>{label(i.code)} · {i.where}{i.mediaId?" · "+i.mediaId:""}</li>)}</ul>{summary.issues.filter(i=>i.where).length>100&&<p>仅展示前100条结构记录，剩余记录未展示；影响数量仍未确认。</p>}</details>}
    {summary.unknown?.length>0&&<details><summary>未确认范围与原因</summary><ul>{summary.unknown.map((s,i)=><li key={i}>{s}</li>)}</ul></details>}
    <section aria-label="登记对象检查清单" className="diagnostic-list">
    {items.map((item,i)=><article key={item.mediaId||i} className="diagnostic-item" data-diagnostic-code={item.code}>
     <h3>{label(item.code)}{item.isEvidence?' · 证据对象':''}</h3>
     <p>{item.relative||'受管路径无法确认'}<br/>{item.mediaId||'媒体标识无效'}</p>
     <details><summary>字节信息与影响范围</summary>
      <p>原文件名：{item.filename||'未记录，不推测'} · 类型：{item.mime||'未知'}<br/>期望 {value(item.expectedSize)} 字节 · 实际 {value(item.actualSize)} 字节<br/>期望 SHA-256：{item.expectedHash}<br/>实际 SHA-256：{item.actualHash||'未取得'}</p>
      <p>{item.attribution==='current'?'以下为当前可确认字段引用；来源内容关系未独立验证。':'未找到当前引用；历史影响未穷尽，不等于无影响或可删除孤立文件。'}</p>
      <ul>{item.references.map((r,j)=><li key={j}><strong>{r.via==='registry'?'经 registry 推导':'直接字段引用'}</strong> · {r.where}<br/>{[['项目',r.projectId],['任务',r.taskId],['板',r.boardId],['镜头',r.shotId],['素材',r.assetId],['资料卡',r.entityId],['姿势',r.poseId],['输出',r.outputId]].filter(([,v])=>v).map(([k,v])=>k+' '+v).join(' · ')}{r.taskName&&' · '+r.taskName}{r.poseName&&' · '+r.poseName}{r.deleted?' · 软删姿势缩图':''}{r.role&&' · '+r.role}</li>)}</ul>
      <p>受影响操作：{item.operations.join('；')}。问题字节不可用时不得按当前场景重签旧来源。</p>
     </details>
    </article>)}
    {!running&&items.length===0&&<p>没有可展示的对象项；请结合分类与未检查数量判断，不能据此认为无问题。</p>}
    </section>
    {summary.pages>1&&<nav aria-label="诊断清单分页"><button className="secondary-button" disabled={page===0||busy} onClick={()=>setPage(p=>p-1)}>上一页</button><span>第 {page+1} / {summary.pages} 页</span><button className="secondary-button" disabled={page+1>=summary.pages||busy} onClick={()=>setPage(p=>p+1)}>下一页</button></nav>}
    <aside className="diagnostic-guide" aria-label="恢复指引"><h3>恢复指引</h3><p>有可信完整备份时，退出诊断，使用原“从已有备份还原”：选择 complete.json → 完整验证 → 还原到新空目录 → 另行明确打开。保留原异常库，不覆盖、不合并。</p><p>文件存在或 hash 相符不代表恢复成功。还须核对库身份、原来源关系，并在普通严格开库及冷重开后验证受影响媒体实际读取。没有可靠备份或原字节时，保持未恢复；同名不同内容不能替代旧引用。</p><p>数据库损坏、身份／版本不符不能按媒体缺失处理；保留原库，选择可信备份或相容版本。权限或占用错误先确认访问条件，不自动提权、改 ACL 或处理 sidecar。</p><p>本页不提供重新定位、修复或导出。凭证 vault 独立，不随业务恢复；同 E 槽备份无物理故障隔离，正式初始备份尚未演练还原。</p></aside>
    {error&&<p role="alert">{error}</p>}
   </div>
   <div className="m2-modal-footer">{running?<button className="secondary-button" disabled={busy} onClick={()=>{void api.cancel({handle:summary.handle})}}>取消检查</button>:<button className="secondary-button" disabled={busy} onClick={()=>void choose()}>重新诊断（重新选取）</button>}<button className="primary-button" disabled={busy} onClick={()=>void release()}>返回，保留当前工作</button></div>
  </Modal>,document.body)}
 </div>
}

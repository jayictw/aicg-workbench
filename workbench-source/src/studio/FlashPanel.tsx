import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { workspace } from '../management/store'
import { persistence } from '../persistence/session'
import { addedFlash, flashCommitState } from '../persistence/flash-tracking'
import { localObjectUrl } from './store'
import { Modal } from './Modal'
import { appendFlash, FLASH_MODEL, isFlash } from './flash-state'
import './flash.css'

type Scope={cap:string;taskId:string;viewId:string}
type Info={enabled:boolean;mode:string;reason:string;accountState:number;qa:boolean;credentialState:string;associationPending:boolean}
type Row={id:string;taskId:string;prompt:string;phase:string;code:string;cancelled:boolean;recovered:boolean;needsRetrieve:boolean;handed:boolean;save:null|{operationId:string;state:string};metadata:null|{width:number;height:number;size:number;sha256:string};events:string[]}
type Prepared={handle:string;snapshot:{prompt:string;taskId:string;viewId:string;provider:string;region:string;endpoint:string;parameters:unknown;images:number;listEstimateCNY:string;actualCost:string;offline:boolean;accountState:number}}
type Taken={bytes:Uint8Array;metadata:NonNullable<Row['metadata']>;proof:{id:string;taskId:string;libraryId:string;location:string;viewId:string;prompt:string}}
type FlashBridge={status:()=>Promise<Info>;bind:(r:Scope)=>Promise<Info>;prepare:(r:Scope&{prompt:string})=>Promise<Prepared>;confirm:(r:Scope&{prompt:string;handle:string})=>Promise<Row>;dismiss:(r:Scope&{handle:string})=>Promise<boolean>;list:(r:Scope)=>Promise<Row[]>;take:(r:Scope&{id:string})=>Promise<Taken>;cancel:(r:Scope&{id:string})=>Promise<Row>;joined:(r:Scope&{id:string})=>Promise<Row>}
declare global{interface Window{localFlash?:FlashBridge;localFlashQA?:{configure:(r:{cap:string})=>Promise<Info>;revoke:(r:{cap:string})=>Promise<Info>}}}
const labels:Record<string,string>={prepared:'预览已记录／尚未提交','confirmation-expired':'确认已失效／未自动提交','not-submitted':'尚未提交',sending:'提交中 · 离线transport',received:'收到结果',verifying:'字节验证中',verified:'结果已验证／待确认',joined:'已加入任务', 'submission-unknown':'提交结果未知 · 不重送'}
export default function FlashPanel({taskId,prompt,onPrompt}:{taskId:string;prompt:string;onPrompt:(s:string)=>void}){
 const saved=useSyncExternalStore(persistence.subscribe,persistence.get),ws=useSyncExternalStore(workspace.subscribe,workspace.get)
 const [info,setInfo]=useState<Info|null>(null),[rows,setRows]=useState<Row[]>([]),[preview,setPreview]=useState<Prepared|null>(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[saveConfirm,setSaveConfirm]=useState(false),[urls,setUrls]=useState<Record<string,string>>({}),[retrieved,setRetrieved]=useState<Record<string,boolean>>({})
 const loading=useRef(new Set<string>())
 const scope=useRef<Scope|null>(null),guard=useRef(false)
 const batches=(ws.images[taskId]?.batches||[]).filter(isFlash)
 useLayoutEffect(()=>{
  const current={cap:saved.cap,taskId,viewId:crypto.randomUUID()};scope.current=current;setPreview(null);setInfo(null);setRows([]);setUrls({});setRetrieved({})
  if(window.localFlash&&saved.cap)void window.localFlash.bind(current).then(result=>{if(scope.current===current)setInfo(result)}).catch(()=>{if(scope.current===current)setMessage('Flash接缝当前不可用；没有提交。')})
  return()=>{if(scope.current===current)scope.current=null}
 },[saved.cap,taskId,prompt])
 useEffect(()=>{const timer=setInterval(()=>{const current=scope.current;if(current&&info?.qa)void window.localFlash?.list(current).then(r=>{if(scope.current===current)setRows(r)}).catch(()=>{if(scope.current===current)setMessage('FLASH_JOURNAL_UNAVAILABLE：保留原件，相关操作停止。')})},250);return()=>clearInterval(timer)},[info?.qa])
 useEffect(()=>{const timer=setInterval(()=>{const current=scope.current;if(current&&info?.qa)void window.localFlash?.status().then(r=>{if(scope.current===current){if(r.accountState!==info.accountState)setPreview(null);setInfo(r)}}).catch(()=>{})},1200);return()=>clearInterval(timer)},[info?.qa,info?.accountState])
 useEffect(()=>{const current=scope.current;if(!current)return;for(const row of rows){const key=current.viewId+row.id;if(!['verified','joined'].includes(row.phase)||row.cancelled||row.needsRetrieve&&!retrieved[row.id]||urls[row.id]||loading.current.has(key))continue;loading.current.add(key);void window.localFlash!.take({...current,id:row.id}).then(async image=>{const src=await localObjectUrl(new File([new Uint8Array(image.bytes)],'offline-preview.png',{type:'image/png',lastModified:0}));if(scope.current===current)setUrls(old=>({...old,[row.id]:src}))}).catch(()=>{if(scope.current===current)setMessage('候选图片本地读取失败；未加入、未重生成。')}).finally(()=>loading.current.delete(key))}},[rows,urls,retrieved])
 async function credential(revoke=false){const current=scope.current;if(!current||guard.current||!window.localFlashQA)return;guard.current=true;setBusy(true);setPreview(null);try{const result=await (revoke?window.localFlashQA.revoke({cap:current.cap}):window.localFlashQA.configure({cap:current.cap}));if(scope.current===current){setInfo(result);setMessage(revoke?'本库程序假凭证已撤销；旧确认失效。':'程序假凭证已在可信端建立并绑定本库；没有Key输入。')}}catch{setMessage('假凭证操作未完成，仅安全状态可用；没有生成提交。')}finally{guard.current=false;setBusy(false)}}
 async function prepare(){const current=scope.current;if(!current||guard.current)return;guard.current=true;setBusy(true);try{const p=await window.localFlash!.prepare({...current,prompt});if(scope.current===current)setPreview(p)}catch{setMessage('预览未建立：请检查完整提示词、当前库及会话上限。')}finally{guard.current=false;setBusy(false)}}
 function dismiss(){const current=scope.current,p=preview;setPreview(null);if(current&&p)void window.localFlash!.dismiss({...current,handle:p.handle}).catch(()=>{})}
 async function confirm(){const current=scope.current,p=preview;if(!current||!p||guard.current)return;guard.current=true;setBusy(true);try{await window.localFlash!.confirm({...current,handle:p.handle,prompt});if(scope.current===current){setPreview(null);setMessage('已确认一次离线提交；结果未知时不重送。')}}catch{setPreview(null);setMessage('确认已失效或提交被拒绝；没有自动重试。')}finally{guard.current=false;setBusy(false)}}
 async function join(row:Row){const current=scope.current;if(!current||guard.current)return;guard.current=true;setBusy(true);try{
  const image=await window.localFlash!.take({...current,id:row.id})
  const bytes=new Uint8Array(image.bytes),file=new File([bytes],row.id+'.png',{type:'image/png',lastModified:0}),src=await localObjectUrl(file)
  // Revalidate after asynchronous FileReader, including main's current owner.
  await window.localFlash!.take({...current,id:row.id})
  const status=await window.workLibrary!.status(),s=persistence.get(),task=workspace.get().tasks.find(t=>t.id===taskId)
  if(scope.current!==current||s.selectionBusy||s.cap!==current.cap||status.cap!==current.cap||status.libraryId!==image.proof.libraryId||status.location!==image.proof.location||image.proof.viewId!==current.viewId||image.proof.taskId!==taskId||workspace.get().activeImage!==taskId||!task)throw Error('scope')
  workspace.image(taskId,state=>appendFlash(state,{id:row.id,prompt:image.proof.prompt,src,taskId,taskName:task.name,projectId:task.projectId,projectName:workspace.get().projects.find(p=>p.id===task.projectId)?.name||'未归属'},Date.now()))
  addedFlash(current.cap,row.id,persistence.get().generation)
  await window.localFlash!.joined({...current,id:row.id});setMessage('已加入此任务，核心尚未保存；原有图片保留。')
 }catch{setMessage('未确认加入：当前库／任务／视图或图片读取已变化。未重新生成。')}finally{guard.current=false;setBusy(false)}}
 async function save(){setSaveConfirm(false);await persistence.save({entry:'flash-confirm',origin:'ui'});setMessage(persistence.get().phase==='ready'?'核心保存已返回；请核对保存代次和后续未保存修改。':'核心保存尚未完成；保留图片，不重新生成。')}
 const pending=rows.some(r=>['sending','received','verifying','submission-unknown'].includes(r.phase))
 const promptTooLong=new TextEncoder().encode(prompt).byteLength>4096
 const enabled=!!info?.enabled&&!!saved.cap
 return <section className="flash-panel" aria-label="Flash单张文生图" data-flash-mode={info?.mode||'unconfigured'}>
  <div className="flash-heading"><div><h2>Seedream 5.0 Flash</h2><p className="flash-model">{FLASH_MODEL}</p></div><span className="m2-pill">{enabled?'离线模拟':'真实提交未配置'}</span></div>
  <p className="flash-notice">{info?.reason||'未配置可信执行接缝；真实生成已禁用。'} · 1024×1024 · 单张 PNG · 保留水印</p>
  {info?.qa&&window.localFlashQA&&<div className="flash-save-actions"><button className="secondary-button" disabled={busy} onClick={()=>void credential()}>配置／换绑程序假凭证</button><button className="secondary-button" disabled={busy||info.credentialState!=='configured'} onClick={()=>void credential(true)}>撤销本库假凭证</button><span>凭证状态：{info.credentialState} · 无Key输入</span></div>}
  {info?.associationPending&&<p role="alert">核心保存关联待核对；以原保存收据为准，不重新生成。</p>}
  <div className="flash-grid"><section className="flash-input"><label htmlFor="flash-prompt">完整提示词</label><textarea id="flash-prompt" value={prompt} onChange={e=>onPrompt(e.target.value)} placeholder="一次贴入完整提示词；仅发送这里的文字。"/>
   <p>不发送参考素材、分镜或摄影棚补充。已有内容保留，旧Mock示例身份不变。</p>
   <p>参考估算：0.12元／张；本轮离线无计费，真实账户／实际价格与账单未知。此前单次批准已消耗，不适用于此处。</p>
   {promptTooLong&&<p role="alert">原文完整保留；超出本接缝4096 UTF-8字节上限，请手动精简后再预览，不会截断发送。</p>}
   <button className="primary-button" disabled={!enabled||!prompt.trim()||promptTooLong||busy||pending} onClick={()=>void prepare()}>预览单张请求</button>
   <p role="status" className="flash-message">{message||'尚未提交。先预览，再确认一次离线模拟。'}</p>
   <p className="flash-warning">QA attempt持久保留；完整已验证候选可在重开后明确取回。可能已发送显示unknown，不重送。候选不随工作库备份保证迁移；不自动加入或保存。</p>
  </section><section aria-label="Flash结果与保存" className="flash-results">
   {!rows.length&&!batches.length&&<div className="flash-empty"><h3>等待你的第一张离线样图</h3><p>字节验证、加入任务、核心保存会分别显示。</p></div>}
   {rows.filter(r=>!batches.some(b=>b.id===r.id)).map(row=><article className="flash-attempt" key={row.id} data-flash-attempt={row.id} data-flash-phase={row.phase}><h3>{labels[row.phase]||row.phase}</h3><p>离线模拟 · {row.cancelled?'本地候选已撤回；不解除unknown防重，未承诺远端取消':'不会调用官方服务'}</p><details><summary>状态过程与提交原文</summary><p>{row.events.map(p=>labels[p]||p).join(' → ')}</p><pre>{row.prompt}</pre><p>安全状态码：{row.code}</p>{row.metadata&&<p>SHA256 {row.metadata.sha256}</p>}</details>{row.save&&<p>原保存操作：{row.save.operationId} · {row.save.state}</p>}{row.metadata&&<p>{row.metadata.width}×{row.metadata.height} · {row.metadata.size} 字节</p>}
    {['verified','joined'].includes(row.phase)&&!row.cancelled&&<>{row.needsRetrieve&&!retrieved[row.id]&&<button className="secondary-button" disabled={busy} onClick={()=>setRetrieved(old=>({...old,[row.id]:true}))}>明确取回本库原候选</button>}{row.handed&&<p>曾交接到任务；是否核心已提交以原保存收据和当前库为准。</p>}{urls[row.id]&&<img className="flash-candidate-image" src={urls[row.id]} alt="经验证的离线合成候选PNG，尚未加入任务" width="1024" height="1024"/>}<button className="primary-button" disabled={busy||!urls[row.id]} onClick={()=>void join(row)}>确认加入当前任务（尚不保存）</button></>}
    {!row.cancelled&&row.phase!=='joined'&&row.phase!=='prepared'&&row.phase!=='confirmation-expired'&&<button className="secondary-button" disabled={busy} onClick={()=>{const current=scope.current;if(current)void window.localFlash!.cancel({...current,id:row.id})}}>撤回本地候选</button>}
   </article>)}
   {batches.map(batch=>{const commit=flashCommitState(saved.cap,batch.id),persisted=commit==='saved';return <article className="flash-saved" key={batch.id} data-flash-batch={batch.id}><h3>Flash单图 · 离线模拟</h3><img src={batch.tasks[0].src} alt="Flash离线合成PNG，非本轮官方生成" width="1024" height="1024"/><p>{persisted?'核心保存完成／已提交版本':commit==='unsaved'?'已加入任务但未保存':'保存归属待核对；请查看当前已提交版本'}{saved.phase==='failed'?' · 核心保存失败，图片仍保留':saved.phase==='unknown'?' · 核心ACK未知，请查原收据':''}</p>{persisted&&saved.generation!==saved.savedGeneration&&<p>图片已在保存范围；工作库另有后续修改未保存。</p>}<details><summary>最终提示词与固定参数</summary><pre>{batch.finalPrompt}</pre><p>{FLASH_MODEL} · 北京 · 1024×1024 · PNG · 单张 · 保留水印 · 离线模拟</p></details></article>})}
   {batches.length>0&&<div className="flash-save-actions"><button className="primary-button" disabled={busy||saved.phase==='saving'||saved.phase==='unknown'} onClick={()=>setSaveConfirm(true)}>确认保存工作库</button>{saved.phase==='unknown'&&<button className="secondary-button" onClick={()=>void persistence.resolve()}>查询原保存收据</button>}<p>当前核心 r{saved.revision} · {saved.phase} · {saved.generation===saved.savedGeneration?'无待保存核心修改':'仍有未保存核心修改'}</p></div>}
  </section></div>
  {preview&&<Modal title="确认Flash单张请求 · 离线模拟" onClose={dismiss} className="flash-confirm"><p>火山方舟中国 · cn-beijing · {FLASH_MODEL}</p><pre>{preview.snapshot.prompt}</pre><p>1024×1024 · 1次 · 1张 PNG · b64_json · watermark=true</p><p>仅发送上述完整文字，无参考素材。参考0.12元／张，实际费用／账户价格未知；本次是离线模拟，无付款授权或官方POST。</p><button className="primary-button" disabled={busy||preview.snapshot.prompt!==prompt} onClick={()=>void confirm()}>确认一次离线模拟</button><button className="secondary-button" disabled={busy} onClick={dismiss}>取消，保留输入</button></Modal>}
  {saveConfirm&&<Modal title="确认保存整个工作库" onClose={()=>setSaveConfirm(false)}><p>将沿现有手动保存提交当前工作库全部未保存核心资料，包括其他任务修改、场景草稿、文字与已加入图片，不能只保存这一张。pose独立提交。不会自动套回、生成或导出。</p><button className="primary-button" onClick={()=>void save()}>确认保存全部核心修改</button><button className="secondary-button" onClick={()=>setSaveConfirm(false)}>取消保存</button></Modal>}
 </section>
}

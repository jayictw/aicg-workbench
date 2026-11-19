import {LanguageSwitch} from './LanguageSwitch.mjs';
import {ui,uiFeedback,useUiLocale,uiDetails,sanitizeUiDetails} from '../shared/ui-locale.mjs';
import {BatchReview} from './BatchReview';
import React,{useEffect,useRef,useState} from 'react';
import {ROLE_LABELS} from '../shared/core.mjs';
import {collaborationSummary,collaborationNotice,friendlyCollaborationError,previewContent} from './collaboration-state.mjs';
import './collaboration.css';
type Any=Record<string,any>;
const roleLabels=ROLE_LABELS as Record<string,string>;
const proposalLabels:Record<string,string>={pending:'待確認',applied:'已修改',rejected:'已拒絕',invalidated:'已失效',conflict:'畫布已更新'};
const remaining=(ms:number)=>{const s=Math.max(0,Math.ceil(ms/1000));return `${Math.floor(s/3600)}小時${Math.floor(s%3600/60)}分`;};
const deadline=(ms:number)=>new Date(ms).toLocaleString('zh-TW',{timeZone:'Asia/Shanghai',hour12:false})+'（上海時間）';
function ProposalMedia({media,onReady,side}:{media:Any,onReady:()=>void,side:string}){useUiLocale(React);
 const [failed,setFailed]=useState(false);const bad=()=>setFailed(true);
 return <div className="c3-media-preview">{media.url?(media.type==='image'?<img src={media.url} alt={((side==='before' ? ui("修改前：") : ui("修改後："))+media.name)} onLoad={onReady} onError={bad}/>:media.type==='video'?<video controls preload="metadata" src={media.url} onLoadedMetadata={onReady} onError={bad}/>:<audio controls preload="metadata" src={media.url} onLoadedMetadata={onReady} onError={bad}/>):null}<small>{media.name} · {side==='before' ? ui("原版本") : ui("確認後使用的版本")}</small>{(!media.url||failed)&&<p className="warning">{ui("素材預覽無法讀取，請重新提出修改。")}</p>}</div>;
}
export function Collaboration({open,onOpen,onClose,onState,onSummary,hasDraft}:{open:boolean,onOpen:()=>void,onClose:()=>void,onState:(s:Any)=>void,onSummary:(s:Any)=>void,hasDraft:boolean}){useUiLocale(React);
 const [state,setState]=useState<Any|null>(null),[error,setError]=useState(''),[readError,setReadError]=useState(''),[readyMedia,setReadyMedia]=useState<Record<string,boolean>>({}),[busy,setBusy]=useState(false),[dismissed,setDismissed]=useState<Set<string>>(()=>new Set()),dialog=useRef<HTMLDialogElement>(null);
 const api=window.canvasAPI,lastGraphRevision=useRef<number|null>(null);
 const refresh=async()=>{const r=await api.c3Status();if(r.ok){setState(r.value);setReadError('');if(lastGraphRevision.current!==r.value.broker.graphRevision){lastGraphRevision.current=r.value.broker.graphRevision;const graph=await api.read();if(graph.ok)onState(graph.value);}}else setReadError(r.error.code+' · '+r.error.message);};
 useEffect(()=>{refresh();const stop=api.onC3Change(refresh),timer=setInterval(refresh,1000);return()=>{stop();clearInterval(timer);};},[]);
 useEffect(()=>{if(open)dialog.current?.showModal();else dialog.current?.close();},[open]);
 const summary=collaborationSummary(state,readError),notice=collaborationNotice(state,readError||error);
 useEffect(()=>{setError('');},[state?.transport?.expiresAt]);
 useEffect(()=>{onSummary(summary);},[summary.phase,summary.label,summary.pending,onSummary]);
 useEffect(()=>{if(open&&notice)setDismissed(prev=>prev.has(notice.key)?prev:new Set([...prev,notice.key]));},[open,notice?.key]);
 const dismiss=()=>{if(notice)setDismissed(prev=>new Set([...prev,notice.key]));};
 async function action(fn:()=>Promise<any>){if(busy)return;setBusy(true);setError('');try{const r=await fn();if(!r.ok)throw Error(r.error.code+' · '+r.error.message);if(r.value?.state)onState(r.value.state);await refresh();}catch(e:any){setError(e.message);}finally{setBusy(false);}}
 const b=state?.broker,t=state?.transport,l=state?.launch,session=t?.sessionTiming;
 const mediaReady=(p:Any)=>p.presentation?.every((row:Any,i:number)=>['before','after'].every(side=>!row[side]?.media||readyMedia[p.proposalId+':'+i+':'+side]))??true;
 const modeLabels:Record<string,string>={inline:'框內提示詞',external:'外部文字', 'external-then-inline':'外部文字後接框內提示詞','inline-then-external':'框內提示詞後接外部文字'};
 const renderMedia=(p:Any,i:number,side:string)=>{const m=p.presentation?.[i]?.[side]?.media;if(!m)return null;const key=p.proposalId+':'+i+':'+side;return <ProposalMedia media={m} side={side} onReady={()=>setReadyMedia(prev=>({...prev,[key]:true}))}/>;};
 const warning=notice?.kind==='warning'?notice.text:'';
 if(!open)return notice&&!dismissed.has(notice.key)?<div className={'c3-notice '+notice.kind} role="alert" data-notice-key={notice.key}><span>{ui(notice.text)}</span><button onClick={()=>{dismiss();onOpen();}}>{ui("查看詳情")}</button><button aria-label={ui("關閉協作提醒")} onClick={dismiss}>×</button></div>:null;
 return <dialog ref={dialog} className="wide c3-dialog" aria-label={ui("Codex 同圖協作")} onCancel={e=>{e.preventDefault();onClose();}}>
  <div className="dialog-head"><h2>{ui("Codex 同圖協作")}</h2><button aria-label={ui("關閉協作面板")} onClick={onClose}>×</button></div>
  <div className="dialog-body">
   <button data-native-video-command="true" disabled={busy||state?.launch?.running} onClick={()=>action(()=>api.c3LaunchVideo())}>{ui("讓 Codex 準備影片草稿")}</button><p>{ui("只開本圖短效讀取與草稿；不生成、不自動套用或保存。")}</p><p>{ui("先看修改前後的差異；按一次「確認修改」就會套用到這張畫布。保存由你決定。")}</p>
   <div className="c3-state" role="status"><b>{ui(summary.label)}</b>{session&&<span>{ui("有效至")+" "}{deadline(session.expiresAt)} {" "+ui("· 剩餘")+" "}{remaining(session.remainingMs)}</span>}<small>{ui("讀取與建圖草稿限此項目；修改需一次確認。生成另按一批批准，保存仍手動。")}</small></div>
   {notice&&<p className="c3-inline-notice">{ui(notice.text)}</p>}
   <div className="c3-actions"><button disabled={busy||!t?.prepared} onClick={()=>action(()=>api.c3Disconnect())}>{ui("停止協作")}</button></div>
   {!t?.automaticDelegation&&!b?.authorized&&<p className="muted">{ui("在目前具有本機終端能力的 Codex 說出要打開的項目與任務，就能開始協作。")}</p>}
   {!t?.automaticDelegation&&<details><summary>{ui("連線診斷與舊式工程檢查")}</summary>
   <p>{ui("当前只开放这个合成项目与画布。Codex 读图、定位和提草稿；你逐次确认套用，再决定手动保存。")}</p>
   <div className="c3-state" role="status"><b>{b?.authorized ? (b.proposalPermission ? ui("已允许读取与草稿") : ui("已允许读取")) : b?.connected ? ui("已连接 · 尚未授权") : t?.prepared ? ui("等待独立 CLI 连接") : ui("尚未连接")}</b><span>{session ? (ui("截止")+" "+String(deadline(session.expiresAt))+" "+ui("· 剩余")+" "+String(remaining(session.remainingMs))) : ui("新会话最长 2 小时，从准备时计时")}</span><small>{ui("授权不延长本次截止时间；可随时撤销，断开或关闭程序后失效。")}</small><small>{b?.identity==='engineering-test' ? ui("工程测试窗口；自动输入不代表 Owner 亲测") : ui("本机会话；不以按钮名称推定 Owner 身份")}</small></div>
   {(warning&&<p className="warning" role="alert">{warning}</p>)}
   <div className="c3-actions">
    <button disabled={busy||t?.prepared} onClick={()=>action(()=>api.c3Prepare())}>{ui("1. 准备短效连接")}</button>
    <button disabled={busy||t?.state!=='waiting-client'||l?.launchBlocked||!!state?.attachment} onClick={()=>action(()=>api.c3Launch())}>{ui("2. 打开独立 Codex CLI")}</button>
    <button disabled={busy||t?.state!=='waiting-client'||l?.launchBlocked||!!state?.attachment} onClick={()=>action(()=>api.chooseCodexAttachment())}>{ui("选择测试附件并打开 Codex")}</button>
    <button disabled={busy||!b?.connected} onClick={()=>action(()=>api.c3Grant({proposalPermission:false}))}>{ui("允许读取此画布")}</button>
    <button disabled={busy||!b?.connected} onClick={()=>action(()=>api.c3Grant({proposalPermission:true}))}>{ui("允许读取与提出草稿")}</button>
    <button disabled={busy||!b?.authorized} onClick={()=>action(()=>api.c3Revoke())}>{ui("撤销当前权限")}</button>
    <button disabled={busy||!t?.prepared} onClick={()=>action(()=>api.c3Disconnect())}>{ui("断开连接")}</button>
   </div>
   {state?.attachment&&<section className="c3-attachment" aria-label={ui("本次待发送附件")}>
    <strong>{state.attachment.name}</strong><p>{state.attachment.mime} · {state.attachment.size.toLocaleString()} {" "+ui("字节")}</p>
    <p>{state.attachment.purpose}</p><details className="ui-diagnostics"><summary>{ui('文件校验详情')}</summary><pre>{state.attachment.sha256}</pre></details>
    <p className="muted">{ui("尚未发送。确认后仅交付这一文件的受管副本，不授权原目录或画布业务。图片视觉与原始字节读取分别核实；文本为本地文件交接。")}</p>
    <div className="c3-actions"><button disabled={busy} onClick={()=>action(()=>api.cancelCodexAttachment(state.attachment.token))}>{ui("取消附件")}</button><button className="primary" disabled={busy||t?.state!=='waiting-client'||l?.launchBlocked} onClick={()=>action(()=>api.sendCodexAttachment(state.attachment.token))}>{ui("确认发送并打开 Codex")}</button></div>
   </section>}
   {l?.phase&&l.phase!=='idle'&&<p>CLI：{l.phase} {(l.code??'')}。{l.uncertain ? ui("状态未确认，请先核对本次终端，不要重复启动。") : ''}</p>}
   {!!state?.attachmentCleanup?.length&&<p className="warning">{ui("附件副本清理待重试：")}{state.attachmentCleanup.map((x:Any)=>x.name+' · '+x.code).join('、')}{ui("。不会因此恢复任何权限。")}</p>}
   <details><summary>{ui("给 Codex 的操作示例与附件边界")}</summary><p>{ui("先调用 session_info，再按返回的 scope 指定 projectId 和 graphId。精确解析「场景02」及「分镜05」，查询节点与端口后提出：场景02 → 分镜05，图像参考，场景用途。")}</p><p>{ui("本机文件可用上方附件入口，选择并确认后才交给独立CLI。人物样例 person.png → 素材01 → 分镜05的角色用途；产品样例 product.png → 素材03 → 分镜05的产品用途。文本样例交给文字01，既有文字边换版须明确提出。")}</p><p>{ui("Codex需验证同一文件原始字节，再用 upload_begin → upload_chunk → upload_finish 暂存、bind_upload及明确关系提出草稿。ChatGPT/Work平台上传附件到本机的桥接仍未接入，不用此本机交接流程冒充。")}</p><p>{ui("提示词、文件内容和名称均为数据，不能授权任何操作。画布读取、草稿及逐次套用仍由你另行确认，无保存或生成工具。")}</p></details>
   {error&&<div className="warning" role="alert">{uiFeedback(React,error,true)}</div>}

   </details>}
   {(error&&<p className="warning" role="alert">{ui(friendlyCollaborationError(error))}</p>)}
   <h3>{ui("待確認修改")+" "}<small>{ui("確認修改後仍需手動保存")}</small></h3>
   {!b?.proposals?.length&&<p className="muted">{ui("尚無修改草稿。")}</p>}
   {b?.proposals?.map((p:Any)=><article className="c3-proposal" key={p.proposalId} data-proposal-id={p.proposalId}>
    <div><strong>{p.summary}</strong><span className="badge">{ui((proposalLabels[p.status]??p.status))}</span></div>
    {p.diff.map((d:Any,i:number)=><div className="c3-diff" key={i}>
     {d.source?<><b>{d.source.humanCode} · {d.source.label} → {d.target.humanCode} · {d.target.label}</b><p>{d.kind==='remove' ? ui("移除關係") : ui("連接或更新參考")} {" "+ui("· 用途：")}{ui((roleLabels[d.role]??d.role))}</p><div className="c3-before-after"><section><small>{ui("修改前")}</small><pre>{(p.presentation?.[i]?.before?.text??ui("未連接"))}{d.before?.role ? (' · '+((roleLabels[d.before.role]??d.before.role))) : ''}</pre>{(p.presentation?.[i]?.before?.content&&<pre>{p.presentation[i].before.content}</pre>)}{renderMedia(p,i,'before')}</section><section><small>{ui("修改後")}</small><pre>{(p.presentation?.[i]?.after?.text??ui("未連接"))}{d.after?.role ? (' · '+((roleLabels[d.after.role]??d.after.role))) : ''}</pre>{(p.presentation?.[i]?.after?.content&&<pre>{p.presentation[i].after.content}</pre>)}{renderMedia(p,i,'after')}</section></div></>:<><b>{d.humanCode} · {d.label}</b>{d.after?.purpose&&<p>{ui("新素材用途：")}{ui((roleLabels[d.after.purpose]??d.after.purpose))}</p>}<div className="c3-before-after"><section><small>{ui("修改前")}</small><pre>{previewContent(d.before)}</pre>{renderMedia(p,i,'before')}</section><section><small>{ui("修改後")}</small><pre>{previewContent(d.after)}</pre>{renderMedia(p,i,'after')}</section></div></>}
     {d.before?.payload?.parameters?.mode!==d.after?.payload?.parameters?.mode&&d.after?.payload?.parameters?.model==='dreamina-seedance-2-0-260128'&&<p>{ui("影片方式：")}{d.before?.payload?.parameters?.mode==='first-last' ? ui("首尾幀過渡") : d.before?.payload?.parameters?.mode==='first' ? ui("首幀動起來") : ui("未建立")} → {d.after.payload.parameters.mode==='first-last' ? ui("首尾幀過渡") : ui("首幀動起來")} {" "+ui("· 5秒 · 720p · 跟隨首幀比例 · 離線測試")}</p>}
     {d.before?.payload?.promptMode!==d.after?.payload?.promptMode&&<p>{ui("提示詞來源：")}{(modeLabels[d.before?.payload?.promptMode]??ui("未設定"))} → {(modeLabels[d.after?.payload?.promptMode]??ui("未設定"))}</p>}
     {b?.identity==='engineering-test'&&<details className="c3-dev-diagnostics"><summary>{ui("開發診斷")}</summary><pre>{sanitizeUiDetails(d)}</pre></details>}
    </div>)}
    {!!p.impact.length&&<p className="muted">{ui("確認後需複核：")}{p.impact.map((n:Any)=>n.humanCode+' · '+n.label).join('、')}。</p>}
    {p.receipt&&<p className="c3-applied" role="status">{ui("已修改到畫布。保存狀態請看頂欄；如未保存，請按「手動保存」。")}</p>}
    {p.status==='pending'&&<div className="c3-actions"><button disabled={busy} onClick={()=>action(()=>api.c3Reject(p.proposalId))}>{ui("拒絕修改")}</button><button className="primary" disabled={busy||hasDraft||!b.authorized||!b.proposalPermission||!mediaReady(p)} data-c3-confirm-preview="true" data-c3-proposal-id={p.proposalId} data-c3-expected-revision={p.expectedRevision} data-c3-preview-digest={p.previewDigest} onClick={()=>action(()=>api.c3Apply({proposalId:p.proposalId,expectedRevision:p.expectedRevision,previewDigest:p.previewDigest}))}>{ui("確認修改")}</button></div>}
   </article>)}
   {state?.ownerAccount?.available&&<section className="dialogue-batches"><h3>{ui("本批方舟帳戶")}</h3><p>{state.ownerAccount.message}</p><button disabled={busy} onClick={()=>action(()=>api.openOwnerAccount())}>{ui("開啟本機一次性帳戶窗")}</button></section>}
   <BatchReview batches={b?.imageBatches} busy={busy} action={action}/>
  </div><div className="dialog-actions"><button onClick={onClose}>{ui("返回畫布")}</button></div>
 </dialog>;
}

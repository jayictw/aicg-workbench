import {stageWork} from './work-state'
import type {SavedOutput} from './work-state'
import {workspace} from '../management/store'
import {WorkbenchSave} from '../persistence/LibraryUI'
import { TaskHandoff } from './TaskHandoff'
import { ScenePrompt } from './ScenePrompt'
import { promptSource } from './scene-prompt-state'
import type { PromptEvidence, PromptSource } from './scene-prompt-state'
import type {HTMLAttributes,SyntheticEvent} from 'react'
import { createPortal } from 'react-dom'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Download, ImagePlus } from 'lucide-react'
import { Modal } from '../studio/Modal'
import { referenceFilename, referenceSignature, referenceSize } from './reference-state'
import type { StageSettings } from './state'
import type { StageEngine } from './engine'
const zoomBoundary:HTMLAttributes<HTMLDivElement>&{onCancel:(e:SyntheticEvent)=>void}={onCancel:e=>e.stopPropagation(),onKeyDown:e=>e.stopPropagation()}
type Result=Omit<SavedOutput,'at'>&{url:string;at:Date}
export function ReferenceOutput({scene,taskName,taskId,taskKind,disabled,capture,describe,verify,onLock,onReturn}:{scene:StageSettings;taskName:string;taskId:string;taskKind:'image'|'video';describe:(snapshot:StageSettings)=>PromptEvidence;verify:(snapshot:StageSettings)=>()=>void;disabled:boolean;capture:(snapshot:StageSettings,size:number,signal:AbortSignal)=>ReturnType<StageEngine['captureReference']>;onLock:(locked:boolean)=>void;onReturn:()=>void}){
 const [open,setOpen]=useState(false),[size,setSize]=useState(()=>{const d=stageWork.get(taskId);return d?.attempt?.size||(d?.result?Math.max(d.result.width,d.result.height):1024)}),[busy,setBusy]=useState(false),[url,setUrl]=useState(''),[zoom,setZoom]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('')
 const work=useSyncExternalStore(stageWork.subscribe,()=>stageWork.get(taskId)),saved=work?.result,attempt=work?.attempt
 const result:Result|null=saved?{...saved,url,at:new Date(saved.at)}:null
 const projectId=workspace.get().tasks.find(t=>t.id===taskId)?.projectId||null
 useEffect(()=>{if(!saved){setUrl('');return}const next=URL.createObjectURL(saved.blob);setUrl(next);return()=>URL.revokeObjectURL(next)},[saved])
 const cancelButton=useRef<HTMLButtonElement>(null),generateButton=useRef<HTMLButtonElement>(null)
 useEffect(()=>{if(busy)cancelButton.current?.focus();else generateButton.current?.focus()},[busy])
 const sceneSignature=referenceSignature(scene),sceneRevision=useRef(0),seenScene=useRef(sceneSignature);if(seenScene.current!==sceneSignature){seenScene.current=sceneSignature;sceneRevision.current++}
 const running=useRef(false),alive=useRef(true),abort=useRef<AbortController|null>(null)
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;abort.current?.abort()}},[])
 const dimensions=referenceSize(scene.ratio,size),stale=!!result&&result.signature!==referenceSignature(scene)
 async function generate(source?:PromptSource,retryScene?:StageSettings,retrySize?:number){if(running.current||disabled)return;running.current=true;setBusy(true);setError('');setMessage('');onLock(true);const revision=sceneRevision.current;const outputSize=retrySize||size,snapshot=structuredClone(source?.scene||retryScene||scene),ticket=stageWork.ticket(),attemptId=crypto.randomUUID(),controller=new AbortController();abort.current=controller
  stageWork.update(taskId,projectId,{attempt:{id:attemptId,scene:snapshot,size:outputSize,startedAt:new Date().toISOString(),status:'running',error:''}},ticket)
  try{let evidence:PromptEvidence|undefined;try{evidence=describe(snapshot)}catch{/* Description is optional; no guessing. */}const validate=verify(snapshot);validate();const output=await capture(snapshot,outputSize,controller.signal);if(!alive.current||controller.signal.aborted||stageWork.ticket()!==ticket)return;if(sceneRevision.current!==revision||stageWork.get(taskId)?.attempt?.id!==attemptId)throw Error('MODEL_OUTPUT_EXPIRED');validate();const at=new Date(),effect={state:output.effect.state as 'off'|'active'|'fallback',reason:output.effect.reason},sourceRecord=evidence?promptSource('output',snapshot,{...evidence,effect},{id:taskId,name:taskName,kind:taskKind}):undefined,resultId=sourceRecord?.id||crypto.randomUUID();stageWork.update(taskId,projectId,{result:{blob:output.blob,width:output.width,height:output.height,effect,scene:snapshot,id:resultId,at:at.toISOString(),promptSnapshot:sourceRecord,signature:referenceSignature(snapshot),filename:referenceFilename(taskName,taskId,at)},selectedOutputId:resultId,attempt:null},ticket);setMessage('参考图已产生，请检查后下载；手动保存才落盘，未自动套用场景。')}
  catch(error){if(stageWork.ticket()===ticket){const message=error instanceof Error?error.message:'输出失败，草稿和上次结果保留，请重试。';const a=stageWork.get(taskId)?.attempt;if(a?.id===attemptId)stageWork.update(taskId,projectId,{attempt:{...a,status:controller.signal.aborted?'cancelled':'failed',error:message}},ticket);if(alive.current)setError(message)}}
  finally{if(stageWork.ticket()!==ticket)return;if(source||retryScene){try{describe(structuredClone(scene))}catch{/* Preserve original capture restoration. */}}running.current=false;abort.current=null;if(alive.current){setBusy(false);onLock(false)}}
 }
 function close(){if(busy){abort.current?.abort();return}setOpen(false)}
 return <><button type="button" className="m2-text-button m5-reference-entry" disabled={disabled} onClick={()=>setOpen(true)}><ImagePlus size={14} aria-hidden="true"/>输出参考图</button>{open&&createPortal(<Modal title="拍摄参考图" className="m5-reference-dialog ui-r4-stage-dialog ui-r4-scroll-dialog" onClose={close}><div className="r4-dialog-scroll">
 <p className="m2-info-copy">3D 构图参考图，非 AI 生成。使用当前草稿，不等于套用场景；不会自动加入素材库或替换任务参考图；套回需另行确认。</p>
 <div className="m5-reference-options"><label className="m2-field">输出长边<select name="reference-size" aria-label="参考图长边" value={size} disabled={busy} onChange={e=>setSize(Number(e.target.value))}><option value={1024}>1024 像素</option><option value={2048}>2048 像素</option></select></label><span>{dimensions.width} × {dimensions.height} px · {scene.ratio}</span><button ref={generateButton} type="button" className="primary-button" disabled={busy||disabled} onClick={()=>void generate()}>{busy?'正在渲染／编码…':result?'重新输出':'产生参考图'}</button>{busy&&<button ref={cancelButton} type="button" className="secondary-button" onClick={()=>abort.current?.abort()}>取消输出</button>}</div>
 <WorkbenchSave disabled={false}/><p className="m5-helper">保存包含当前成功图与文字；进行中的输出只记录尝试状态，不保证完成，重开不会自动续作。</p>{attempt&&attempt.status!=='running'&&<p role="status" className="m5-helper">上次输出{attempt.status==='interrupted'?'已中断':attempt.status==='cancelled'?'已取消':'失败'}：{attempt.error} “重新输出”使用当前草稿；重试使用上次 {attempt.scene.ratio}／长边{attempt.size} 快照。<button type="button" className="secondary-button" disabled={busy||disabled} onClick={()=>{setSize(attempt.size);void generate(undefined,attempt.scene,attempt.size)}}>重试上次场景快照</button></p>}<div className="m5-reference-result" aria-busy={busy}>{result&&url?<img src={result.url} width={result.width} height={result.height} alt="本次拍摄相机输出的3D构图参考图"/>:<p>尚未输出。图片将在这里独立预览。</p>}</div>
 {error&&<p role="alert" className="m5-errors">{error}</p>}<p role="status" className="m5-helper">{message}</p>
 {result&&<div className="m5-reference-meta"><button type="button" className="secondary-button" onClick={()=>setZoom(true)}>放大参考图</button><button type="button" className="secondary-button" disabled={busy} onClick={()=>{if(window.confirm('移除当前输出只影响本次会话，须保存才更新磁盘；任务和历史引用不删除。继续？'))stageWork.removeOutput(taskId)}}>移除当前输出</button><p>{result.width} × {result.height} px · PNG · {result.at.toLocaleString()}<br/>{result.effect.state==='active'?'景深已生效（场景深度近似）；照片／HDR背景保持清晰。':result.effect.state==='fallback'?`本图景深未生效，回退清晰：${result.effect.reason}`:'本图为清晰渲染，景深关闭。'}</p>{stale&&<p role="status">当前草稿已变化；此图保留原输出快照，需要新画面请重新输出。</p>}<button type="button" className="secondary-button" disabled={busy} onClick={()=>{const link=document.createElement('a');link.href=result.url;link.download=result.filename;link.click();setMessage('已发起PNG下载，由浏览器下载位置决定；请自行确认文件保存。')}}><Download size={15} aria-hidden="true"/>下载 PNG</button></div>}
 <ScenePrompt taskId={taskId} sceneSignature={referenceSignature(scene)} output={result?.promptSnapshot} hasOutput={!!result} disabled={busy||disabled} current={()=>{const snapshot=structuredClone(scene);return promptSource('draft',snapshot,describe(snapshot),{id:taskId,name:taskName,kind:taskKind})}}/>
 <TaskHandoff taskId={taskId} output={result} disabled={busy||disabled} onApplied={()=>{setOpen(false);window.setTimeout(onReturn,0)}} onNewOutput={source=>{void generate(source)}}/>
 <p className="m5-helper">每任务一个成功结果，新成功替换旧结果；手动保存后可重开恢复。下载位置由浏览器决定；不自动套用或套回。</p>
 </div></Modal>,document.body)}{zoom&&result&&createPortal(<div {...zoomBoundary}><Modal title="参考图原图预览" className="ui-r4-stage-dialog" wide onClose={()=>setZoom(false)}><img src={result.url} width={result.width} height={result.height} style={{maxWidth:'100%',maxHeight:'70vh',objectFit:'contain'}} alt="恢复的摄影棚参考图原图"/></Modal></div>,document.body)}</>
}

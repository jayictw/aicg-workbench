import {InfoButton} from '../ui/InfoButton'
import {useEffect,useRef,useState,useSyncExternalStore} from 'react'
import {workspace} from '../management/store'
import {sceneDrafts} from '../stage3d/draft-state'
import {stageWork} from '../stage3d/work-state'
import {modelDescription,modelInputNotes} from '../stage3d/model-description'
import {persistence} from '../persistence/session'
import {generated} from './store'
import {adoptSnapshot,dailyText,modeNames,referencePurpose} from './daily-input'
import type {StudioInput,StudioMode} from './daily-input'
export type StudioPacket={daily:true;group:StudioMode;sourceJson:string;manualText:string;referenceBase64?:string}
export function useStudioModelInputs(taskId:string,original:string,onChange:()=>void){
 const result=useSyncExternalStore(stageWork.subscribe,()=>stageWork.get(taskId)?.result)
 const pending=useSyncExternalStore(sceneDrafts.subscribe,()=>sceneDrafts.get(taskId))
 const w=useSyncExternalStore(workspace.subscribe,workspace.get),p=useSyncExternalStore(persistence.subscribe,persistence.get)
 const g=useSyncExternalStore(generated.subscribe,generated.get),draft=g.drafts.find(d=>d.taskId===taskId),saved=draft?.studioInput
 const mode=saved?.mode||'BASE',source=result?.promptSnapshot,scene=pending?.scene||w.stages[taskId]
 const [ref,setRef]=useState<{outputId:string;sha:string;url:string;base64:string}|null>(null),[overwrite,setOverwrite]=useState(false)
 const current=useRef('');current.current=[p.cap,taskId,result?.id].join('|')
 const put=(value:StudioInput)=>{onChange();const d=generated.draft(taskId);if(d)generated.putDraft({...d,studioInput:value})}
 useEffect(()=>{setOverwrite(false);setRef(null);if(!result||!source)return;let active=true;const stamp=current.current;void result.blob.arrayBuffer().then(async bytes=>{if(result.blob.type!=='image/png'||!bytes.byteLength||bytes.byteLength>8*1024*1024)return;const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(n=>n.toString(16).padStart(2,'0')).join('');let binary='';const a=new Uint8Array(bytes);for(let i=0;i<a.length;i+=32768)binary+=String.fromCharCode(...a.subarray(i,i+32768));if(active&&current.current===stamp)setRef({outputId:result.id,sha,url:'data:image/png;base64,'+btoa(binary),base64:btoa(binary)})});return()=>{active=false}},[p.cap,taskId,result,source])
 const currentSource=source?JSON.stringify(source):'',automatic=source?modelDescription(source):''
 const changedScene=!!source&&!!scene&&JSON.stringify(scene)!==source.sceneSignature
 const supported=!!source&&source.kind==='output'&&source.task.kind==='image'&&source.scene.subject.kind==='builtin'&&source.scene.backdrop.mode==='color'&&!source.scene.backdrop.image&&!source.scene.backdrop.hdr&&!source.scene.backdrop.lighting
 const fresh=supported&&!!source&&!!ref&&ref.outputId===source.id&&!changedScene
 const receipt=workspace.handoffReceipt(taskId),handed=!!receipt&&!receipt.undone&&(receipt.after.refs?.some(x=>x.stageSource?.outputId===source?.id)||receipt.after.supplement?.source.outputId===source?.id)
 function adopt(){if(!fresh)return;const d=adoptSnapshot(saved,currentSource,automatic,source!.id,ref!.sha,false),manual=receipt?.after.supplement;if(handed&&manual?.manual&&manual.source.outputId===source!.id)d.adoptedText=manual.text;put(d)}
 useEffect(()=>{if(handed&&fresh&&draft&&!saved?.sourceJson)adopt()},[handed,fresh,draft?.taskId,saved?.sourceJson,currentSource,automatic])
 const needsUpdate=!!saved?.sourceJson&&fresh&&(saved.sourceJson!==currentSource||saved.referenceSha256!==ref?.sha)
 const emptyText=['A','C'].includes(mode)&&!saved?.adoptedText.trim()
 const stale=!fresh||!saved?.sourceJson||needsUpdate||saved.sourceJson!==currentSource||saved.referenceSha256!==ref?.sha||emptyText
 const signature=JSON.stringify([p.cap,taskId,original,saved,ref?.sha,changedScene,currentSource])
 useEffect(()=>{onChange()},[signature])
 function changeMode(value:StudioMode){put({...saved||{version:1,sourceJson:null,automaticText:'',adoptedText:'',outputId:null,referenceSha256:null},mode:value,chosen:true})}
 function update(keep:boolean){if(!fresh)return;put(adoptSnapshot(saved,currentSource,automatic,source!.id,ref!.sha,keep))}
 async function packet():Promise<StudioPacket>{if(stale||!saved?.sourceJson||!ref)throw Error('C_STUDIO_STALE');return {daily:true,group:mode,sourceJson:saved.sourceJson,manualText:['A','C'].includes(mode)?saved.adoptedText:'',...(['B','C'].includes(mode)?{referenceBase64:ref.base64}:{})}}
 async function reviewInput(){return {studioInput:saved||null,referenceBase64:!stale?ref?.base64||null:null,valid:!stale,retainedReferences:(workspace.get().images[taskId]?.draft.refs||[]).filter(r=>(!!r.assetId||!r.stageSource||r.stageSource.taskId!==taskId)&&(workspace.get().images[taskId]?.draft.creationInput?.referenceUse==='retained'||r.generationUse==='retained')).map(r=>({name:r.name,category:r.category,origin:r.origin==='local'?'本机载入':'素材库'}))}}
 const element=(busy:boolean)=>!ref&&!source&&mode==='BASE'?null:<section className="daily-studio original-studio" data-studio-input>
 <fieldset disabled={busy}><div className={ref?'original-reference':'original-empty-reference'}>{ref&&<img src={ref.url} width="84" height="84" alt="摄影棚实际参考原图"/>}<div className="original-stage-copy">{ref&&<><h3>摄影棚参考图</h3><p>{saved?.sourceJson?'已套回本次输入':'参考图待采用'}</p></>}{ref&&<button type="button" className="original-recapture" onClick={()=>document.querySelector<HTMLButtonElement>('[data-stage-entry]')?.click()}>重新拍摄</button>}</div></div>
 <div className="original-studio-heading"><span>{ref?'本次使用方式':'辅助构图，可不使用'}</span><InfoButton title="摄影棚使用方式"><p>摄影棚：提供姿势、位置关系、构图和拍摄角度参考，与其他素材互相补充。</p><p>以上是使用指引，不保证模型完全遵循。</p><p>四种方式都保留主提示词。“只用”仅指摄影棚输入：图文、只用图片B、只用文字或不用摄影棚。首次有效套回默认B；已有选择和修改稿不会被切换覆盖。</p><p>影片工作台另行按其已开放模型合同使用摄影棚输入。</p></InfoButton></div>
 {ref&&<label className="original-mode"><span className="sr-only">本次使用方式</span><select aria-label="本次使用方式" value={mode} onChange={e=>changeMode(e.target.value as StudioMode)}>{Object.entries(modeNames).map(([value,name])=><option key={value} value={value}>{name}</option>)}</select></label>}
 {['A','C'].includes(mode)&&<label>摄影棚补充文字<textarea aria-label="摄影棚补充文字（采用稿）" value={saved?.adoptedText||''} onChange={e=>{if(saved)put({...saved,adoptedText:e.target.value})}} disabled={!saved?.sourceJson} rows={3}/></label>}
 {ref&&<p className="original-studio-mode-note">{mode==='B'?'本次只发送参考图；补充文字稿保留。':mode==='BASE'?'本次不用摄影棚；图文修改稿均保留。':mode==='A'?'本次只发送补充文字，不发送参考图。':'本次发送参考图与补充文字。'}</p>}
 {ref&&<div className="original-source-info"><span>本次输入详情</span><InfoButton title="本次输入与摄影棚来源"><pre data-studio-effective>{dailyText(original,saved?.adoptedText||'',mode)}</pre><p>实际摄影棚图片：{['B','C'].includes(mode)?'1张，须同快照验证通过':'无'}。</p><p>{['B','C'].includes(mode)?referencePurpose:''}</p><p>快照：{source?.id||'尚无'}；原图hash：{ref?.sha||'尚无'}</p><details><summary>自动原文与依据</summary><pre>{saved?.automaticText||'尚无有效快照'}</pre><p>{modelInputNotes}</p></details></InfoButton></div>}{['A','C'].includes(mode)&&<button type="button" className="m2-text-button" disabled={!saved?.sourceJson} onClick={()=>{if(saved!.adoptedText!==saved!.automaticText)setOverwrite(true)}}>恢复自动内容</button>}
 {overwrite&&<div role="group" aria-label="确认恢复自动内容"><p>恢复将覆盖当前采用稿。</p><button onClick={()=>{put({...saved!,adoptedText:saved!.automaticText});setOverwrite(false)}}>确认覆盖采用稿</button><button onClick={()=>setOverwrite(false)}>保留修改稿</button></div>}
 {needsUpdate&&<div role="alert"><p>已有新拍摄快照，当前修改稿保留。</p><button onClick={()=>update(true)}>更新快照，保留修改稿</button><button onClick={()=>{if(saved?.adoptedText!==saved?.automaticText&&!window.confirm('使用新快照自动内容替换当前修改稿？'))return;update(false)}}>更新快照，重新生成补充文字</button></div>}
 </fieldset>{fresh&&!saved?.sourceJson&&<button disabled={busy} onClick={adopt}>将此快照套回本次输入</button>}{source&&!supported&&<p role="alert">此快照超出图片路径范围：仅内置主体、纯色背景，无环境图；未自动采用。</p>}
 {emptyText&&<p role="alert">当前方式需要补充文字，请填写采用稿或选择其他方式。</p>}{mode!=='BASE'&&stale&&!emptyText&&<p role="alert">摄影棚快照未就绪或场景已改变，请更新快照；不会静默降级。</p>}
 </section>
 return {enabled:mode!=='BASE',stale,packet,reviewInput,element}
}

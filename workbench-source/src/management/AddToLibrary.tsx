import { useState, useSyncExternalStore } from 'react'
import { Layers3 } from 'lucide-react'
import { workspace } from './store'
import { assetFromReference } from './state'
import type { Asset, TaskKind } from './state'
import type { RefImage } from '../studio/state'
import { sampleVideo } from '../video/mock'
export function AddReferenceToLibrary({image}:{image:RefImage}){
 const s=useSyncExternalStore(workspace.subscribe,workspace.get),[added,setAdded]=useState(false),exists=s.assets.some(a=>a.id===(image.assetId||image.id)||!!image.sourceTaskId&&a.source?.taskId===image.sourceTaskId&&a.source?.resultId===image.sourceResultId)
 if(exists&&!added)return null
 return <button title="加入素材库（仅本次打开期间）" className="m2-text-button m4-add-reference" disabled={exists} aria-label={`${exists?'已入库':'加入素材库'} ${image.name} ${image.view}`} onClick={()=>{workspace.addAsset(assetFromReference(image,Date.now()));setAdded(true)}}><Layers3 aria-hidden="true" size={12}/>{exists?'已入库':'加入库'}</button>
}
export function AddResultToLibrary({ownerId,resultId,src,kind,label}:{ownerId:string;resultId:string;src:string;kind:TaskKind;label:string}){
 const s=useSyncExternalStore(workspace.subscribe,workspace.get),[message,setMessage]=useState(''),exists=s.assets.find(a=>a.source?.taskId===ownerId&&a.source.resultId===resultId)
 function add(){const task=workspace.get().tasks.find(t=>t.id===ownerId)!;const now=Date.now(),asset:Asset={id:crypto.randomUUID(),name:`${task.name} · ${label}（示例）`,media:kind,src,usages:[],tags:['示例','任务结果'],description:'明确加入的模拟任务结果；非真实 AI 生成。只在本次打开期间保留。',favorite:false,example:true,origin:'result',source:{taskId:ownerId,taskName:task.name,resultId,kind},...(kind==='video'?{duration:sampleVideo.duration,width:sampleVideo.width,height:sampleVideo.height,mime:'video/mp4'}:{}),createdAt:now,updatedAt:now};workspace.addAsset(asset);setMessage('示例结果已入库，来源任务与结果 ID 已保留。')}
 return <div className="m4-result-library"><button className="m2-text-button" disabled={!!exists} aria-label={`${exists?'示例已入库':'结果加入素材库'} ${resultId}`} onClick={add}><Layers3 aria-hidden="true" size={13}/>{exists?'示例已入库':'加入素材库'}</button>{message&&<span className="m4-sr-only" role="status">{message}</span>}</div>
}

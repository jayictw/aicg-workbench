import type { FieldOrigins } from './update-types'
import { useState, useSyncExternalStore } from 'react'
import { workspace } from '../management/store'
import { effectiveFieldOrigins } from './update-state'
export const updateFieldLabel=(key:string)=>key.startsWith('refs:')?'参考图 · '+key.slice(5).slice(-8):({prompt:'原提示词',storyboardSupplement:'分镜补充',first:'首帧',last:'尾帧'} as Record<string,string>)[key]||key
export function TaskUpdateHistory({taskId}:{taskId:string}){
 const s=useSyncExternalStore(workspace.subscribe,workspace.get),[error,setError]=useState(''),[message,setMessage]=useState(''),rows=Object.values(s.storyboardUpdates||{}).filter(r=>r.taskId===taskId).reverse().sort((a,b)=>b.at-a.at),latest=rows[0]
 if(!latest)return null
 const effective=effectiveFieldOrigins(s,taskId)
 return <section className="sb-update-history" aria-label="分镜更新历史"><h3>分镜字段更新</h3><p className="m2-helper">创建来源保留；下方仅记录确认更新的字段，未更新内容不归于新镜头。</p><p data-testid="task-field-origins">当前匹配来源：{Object.keys(effective).map(updateFieldLabel).join('、')||'无（字段已编辑或更新已撤销）'}</p><button type="button" className="secondary-button" disabled={!!latest.undone} onClick={()=>{setError('');setMessage('');try{workspace.undoTaskUpdate(latest.id);setMessage('已撤销最近一次更新；批次、其他字段及关联保留。')}catch(e){setError((e as Error).message)}}}>{latest.undone?'最近更新已撤销':'撤销最近一次分镜更新'}</button><details><summary>更新收据与字段来源（{rows.length}）</summary>{rows.slice(0,20).map(r=><div className="sb-update-record" key={r.id} data-update-id={r.id}><strong>{r.undone?'已撤销':'已确认'} · {r.id.slice(-8)}</strong><p>{r.changes.map(c=>updateFieldLabel(c.field)).join('、')} ← 镜头 {r.source.source.shotId.slice(-8)} · r{r.source.source.shotRevision}</p><small>快照 {r.source.source.snapshotId} · {new Intl.DateTimeFormat('zh-CN',{dateStyle:'short',timeStyle:'short'}).format(r.at)}</small></div>)}</details>{error&&<p role="alert" className="m2-errors">{error}</p>}{message&&<p role="status" className="m2-helper">{message}</p>}</section>
}

export function BatchFieldOrigins({origins}:{origins?:FieldOrigins}){if(!origins||!Object.keys(origins).length)return null;return <section data-testid="batch-field-origins"><h3>当时的字段更新来源</h3>{Object.entries(origins).map(([key,o])=><p key={key}>{updateFieldLabel(key)} ← 镜头 {o.source.shotId.slice(-8)} · r{o.source.shotRevision} · 收据 {o.receiptId.slice(-8)}</p>)}</section>}

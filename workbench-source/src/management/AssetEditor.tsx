import { useState } from 'react'
import { Modal } from '../studio/Modal'
import { categories } from '../studio/state'
import type { Asset } from './state'
import { workspace } from './store'
export function AssetEditor({asset,onClose}:{asset:Asset;onClose:()=>void}){
 const [name,setName]=useState(asset.name),[description,setDescription]=useState(asset.description),[tags,setTags]=useState(asset.tags.join('，')),[usages,setUsages]=useState(asset.usages)
 return <Modal className="ui-r5-dialog" title="编辑素材资料" onClose={onClose}><form onSubmit={e=>{e.preventDefault();if(!name.trim())return;workspace.editAsset(asset.id,{name,description,tags:tags.split(/[,，]/).map(s=>s.trim()).filter(Boolean),usages});onClose()}}><div className="m4-form"><label className="m2-field">素材名称<input name="asset-name" autoFocus autoComplete="off" required value={name} onChange={e=>setName(e.target.value)}/></label><label className="m2-field">素材简介<textarea name="asset-description" value={description} onChange={e=>setDescription(e.target.value)} rows={4}/></label><label className="m2-field">标签（逗号分隔）<input name="asset-tags" autoComplete="off" value={tags} onChange={e=>setTags(e.target.value)}/></label><fieldset className="m4-usage"><legend>用途标签（不改变媒体类型）</legend>{categories.map(c=><label className="m2-checkbox" key={c.id}><input type="checkbox" checked={usages.includes(c.id)} onChange={e=>setUsages(e.target.checked?[...usages,c.id]:usages.filter(u=>u!==c.id))}/>{c.label}</label>)}</fieldset><p className="m2-helper">原始媒体类型、文件与示例来源标记不变，不回写已提交快照。</p></div><div className="m2-modal-footer"><button type="button" className="secondary-button" onClick={onClose}>取消</button><button type="submit" className="primary-button">保存素材资料</button></div></form></Modal>
}

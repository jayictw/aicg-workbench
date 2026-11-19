import {ui,useUiLocale} from '../shared/ui-locale.mjs';
import React,{useState,useEffect} from 'react';
import {bindingVersion} from '../shared/relations.mjs';
type Any=Record<string,any>;
export function RelationEditor({n,g,action,disabled}:Any){useUiLocale(React);
 const [source,setSource]=useState('');useEffect(()=>setSource(''),[n.id]);
 const assets=n.kind.startsWith('asset.'),promptEdges=g.edges.filter((e:Any)=>e.target.nodeId===n.id&&e.role==='prompt');
 const options=g.nodes.filter((x:Any)=>{if(x.id===n.id)return false;try{const v=bindingVersion(g,x.id);return assets?g.mediaVersions[v]?.type===n.kind.slice(6):['text','prompt'].includes(x.kind);}catch{return false;}});
 if(!assets&&!n.kind.startsWith('generate.'))return null;
 return <details className="origin-details" data-r3-relations="true"><summary>{assets ? ui("換用畫布內素材") : ui("提示詞引用關係")}</summary><p className="muted">{assets ? ui("保留此節點名稱與身份、舊版本及原檔；仍引用此素材框的任務輸入會同步更新，已生成結果不變，不會自動重新生成。") : ui("固定使用所選文字版本；影片首尾幀與圖片參考用途在各自設定中。")}</p>
 <label className="field">{assets ? ui("替換來源") : ui("文字來源")}<select aria-label={assets ? ui("替換素材來源") : ui("提示詞引用來源")} disabled={disabled} value={source} onChange={e=>setSource(e.target.value)}><option value="">{ui("請選擇")}</option>{options.map((x:Any)=><option key={x.id} value={x.id}>{x.humanCode}｜{x.label}</option>)}</select></label>
 <button disabled={!source||disabled} onClick={()=>action(assets?{type:'asset.use',nodeId:n.id,sourceNodeId:source,mediaVersionId:bindingVersion(g,source)}:{type:'relation.set',edgeId:promptEdges[0]?.id??null,targetNodeId:n.id,targetPortKey:'prompt',sourceNodeId:source,versionId:bindingVersion(g,source),role:'prompt',inputOrder:0})}>{assets ? ui("換用此素材") : ui("設定提示詞引用")}</button>
 {!assets&&promptEdges.map((e:Any)=><div key={e.id}><small>{g.nodes.find((x:Any)=>x.id===e.source.nodeId)?.label} {" "+ui("· 固定文字版本")}</small><button disabled={disabled} onClick={()=>action({type:'relation.remove',edgeId:e.id,targetNodeId:n.id})}>{ui("移除此提示詞引用")}</button></div>)}
 </details>;
}

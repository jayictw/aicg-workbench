import {ui,uiFeedback,useUiLocale} from '../shared/ui-locale.mjs';
import React from 'react';
import {effectiveInput} from '../shared/core.mjs';
type Any=Record<string,any>;
const modes:Record<string,string>={inline:'只用框內提示詞',external:'只用外部文字','external-then-inline':'外部文字 → 框內提示詞','inline-then-external':'框內提示詞 → 外部文字'};
export function PromptSources({n,g,action,disabled=false}:Any){useUiLocale(React);
 let input:Any;try{input=effectiveInput(g,n);}catch(e:any){input={prompt:'',texts:[],errors:[e.message]};}
 const sources=[...(input.texts??[])].sort((a:Any,b:Any)=>n.payload.promptMode==='external-then-inline'?(a.origin==='external'?-1:1):(a.origin==='inline'?-1:1));
 const text=g.textVersions[n.payload.inlineTextVersionId]?.text??'';
 return <section className="prompt-sources" aria-label={ui("提示词来源与顺序")}><label className="field">{ui("提示詞來源")}<select aria-label={ui("提示詞來源策略")} value={n.payload.promptMode} disabled={disabled} onChange={e=>action({type:'generation.configure',nodeId:n.id,text,promptMode:e.target.value})}>{Object.entries(modes).map(([key,label])=><option key={key} value={key}>{ui(label)}</option>)}</select></label><ol aria-label={ui("固定文字來源")}>{sources.map((t:Any)=>{const source=g.nodes.find((x:Any)=>x.id===t.sourceNodeId);const file=g.mediaVersions[source?.payload?.mediaVersionId]?.name;return <li key={t.origin+'|'+t.textVersionId}><b>{t.origin==='inline' ? ui("框內") : ui("外部")} · {(source?.label??ui("來源缺失"))}</b>{file&&<small>{file}</small>}<details><summary>{ui("来源诊断")}</summary><small>{ui("· 節點")+" "}{t.sourceNodeId}<br/>{ui("固定版本")+" "}{t.textVersionId} · SHA256 {t.utf8Sha256}</small></details></li>;})}</ol>{input.errors?.map((message:string)=><div className="warning" key={message}>{uiFeedback(React,message,true)}</div>)}</section>;
}

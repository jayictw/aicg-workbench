import {ui,useUiLocale} from '../shared/ui-locale.mjs';
import React,{useEffect,useState,useRef} from 'react';
import './canvas-collaboration-status.css';
import {connectionState} from '../shared/connection-state.mjs';
type Any=Record<string,any>;const api=window.canvasAPI;
export function CanvasCollaborationStatus({projectName,scopeKey,onDetails}:{projectName:string;scopeKey:string;onDetails:()=>void}){useUiLocale(React);
 const revision=useRef(0),mounted=useRef(true);
 const [status,setStatus]=useState<Any|null>(null),[action,setAction]=useState(false),[issue,setIssue]=useState(''),[readIssue,setReadIssue]=useState('');
 const refresh=async()=>{const v=++revision.current;try{const r=await api.agentStatus();if(!mounted.current||v!==revision.current)return;if(!r?.ok)throw Error('STATUS_READ_FAILED');setStatus(r.value);setReadIssue('');}catch{if(mounted.current&&v===revision.current){setStatus(null);setReadIssue('狀態讀取失敗，已斷線');}}};
 useEffect(()=>{mounted.current=true;setStatus(null);setReadIssue('');let timer:ReturnType<typeof setTimeout>|null=null;const schedule=()=>{if(!timer)timer=setTimeout(()=>{timer=null;void refresh();},0);};void refresh();const stop=api.onAgentChange(schedule);return()=>{mounted.current=false;revision.current++;if(timer)clearTimeout(timer);stop?.();};},[scopeKey]);
 const shown=status?.target&&status.target.projectId+'|'+status.target.graphId!==scopeKey?null:status,c=shown?.connection??{},p=shown?.preparation??{},view=connectionState(shown),verified=view.kind==='connected',active=view.active,label=view.label;
 const run=async(open:boolean)=>{setAction(true);setIssue('');try{const r=await(open?api.agentOpen():api.agentClose());if(!r.ok)throw Error(r.error.message);}catch(e:any){setIssue(e.message);}finally{await refresh();setAction(false);}};
 return <div className={'canvas-collaboration-status is-'+view.kind+(readIssue||issue||p.error?' has-issue':'')} aria-label={ui("目前畫布 Agent 連線")}><div className="collaboration-controls"><button className="collaboration-state" onClick={onDetails} title={((ui("固定項目：")+projectName)+ui("；本機工作階段，關閉、停止或切換項目即撤銷原連線。"))}><span aria-hidden="true" className="collaboration-light"/><span role="status">{ui(label)}</span></button>{active?<button className="collaboration-stop" disabled={action} onClick={()=>void run(false)}>{ui("停止協作")}</button>:<button disabled={action||!status||view.kind==='unconfigured'} onClick={()=>void run(true)}>{p.stopped ? ui("恢復協作") : ui("重新連線")}</button>}</div><span className="collaboration-message" role="status" title={ui(readIssue)||ui(issue)||ui(view.reason)}>{((ui(readIssue)||ui(issue))||(verified ? ui("僅目前畫布 · 本次軟體工作階段") : view.kind==='connecting' ? ui("正在等待已登記的 Agent；權限和範圍以本機登記為準") : ui(view.reason)))}</span></div>;
}

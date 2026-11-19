import {LanguageSwitch} from './LanguageSwitch.mjs';
import {ui,useUiLocale} from '../shared/ui-locale.mjs';
import React,{useEffect,useRef,useState} from 'react';
import {ACTIONS,defaults,chordFromEvent,validateChord,changeBinding,displayBinding} from '../shared/shortcuts.mjs';
type Any=Record<string,any>;
export function ShortcutSettings({snapshot,onChange,onClose}:{snapshot:Any;onChange:(v:Any)=>void;onClose:()=>void}){useUiLocale(React);
 const ref=useRef<HTMLDialogElement>(null),recordRef=useRef<HTMLDivElement>(null),previous=useRef<HTMLElement|null>(null),[editing,setEditing]=useState<string|null>(null),[candidate,setCandidate]=useState<string|null>(null),[recording,setRecording]=useState(false),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 useEffect(()=>{previous.current=document.activeElement as HTMLElement;ref.current?.showModal();return()=>{ref.current?.close();previous.current?.focus();};},[]);
 useEffect(()=>{if(recording)recordRef.current?.focus();},[recording,editing]);
 let conflict:any=null;if(editing&&candidate)try{changeBinding(snapshot.bindings,editing,candidate);}catch(e:any){conflict=e;}
 const run=async(operation:Any,keepCandidate=false)=>{if(busy)return;setBusy(true);try{const r=await window.canvasAPI.shortcutsChange({expectedRevision:snapshot.revision,expectedToken:snapshot.token,operation});if(!r.ok){const fresh=await window.canvasAPI.shortcutsRead();if(fresh.ok)onChange(fresh.value);throw new Error(r.error.message);}onChange(r.value);setNotice('快捷鍵已保存於本機；工程保存狀態不變');if(!keepCandidate){setCandidate(null);setEditing(null);}setRecording(false);return true;}catch(e:any){setNotice(e.message);return false;}finally{setBusy(false);}};
 const begin=(id:string)=>{setEditing(id);setCandidate(null);setRecording(true);setNotice('按想用的組合鍵；Esc取消錄入，Tab移到按鈕');};
 const cancel=()=>{setRecording(false);setCandidate(null);setEditing(null);setNotice('已取消錄入，原綁定不變');};
 const capture=(e:React.KeyboardEvent)=>{if(!recording)return;if(e.key==='Tab'){setRecording(false);return;}e.preventDefault();e.stopPropagation();if(e.key==='Escape'){cancel();return;}if(e.repeat){setNotice('請先放開按鍵，再錄入一次');return;}try{const chord=chordFromEvent(e.nativeEvent);if(!chord){setNotice('請再按一個非修飾鍵');return;}const valid=validateChord(chord,snapshot.platform);setCandidate(valid);setNotice('已錄入 '+valid+'；按「套用鍵位」才會修改');}catch(e:any){setCandidate(null);setNotice(e.message);}};
 return <dialog ref={ref} className="wide shortcut-dialog" aria-label={ui("畫布快捷鍵設定")} onCancel={e=>{e.preventDefault();if(recording)cancel();else if(!busy)onClose();}}>
  <div className="dialog-head"><h2>{ui("畫布快捷鍵")}</h2><button aria-label={ui("關閉快捷鍵設定")} disabled={busy} onClick={onClose}>×</button></div>
  <div className="dialog-body"><p>{ui("只在畫布有焦點時使用；輸入、播放器、對話框與選單優先。點畫布空白或框後即可使用。停用只關閉該按鍵，原操作仍可點按鈕／右鍵完成。此候選為Windows，使用Ctrl；不提供Mac／Cmd、Alt／Win組合或全系統快捷鍵。")}</p>
   <p className="shortcut-save-note">{ui("偏好自動保存於此候選的本機個人設定，與工程「手动保存」分開；不跟工程備份或跨裝置同步。")}</p>
   {(snapshot.warning&&<p className="warning" role="alert">{ui(snapshot.warning)}</p>)}
   <div className="shortcut-list">{ACTIONS.map(a=><section className={'shortcut-row '+(editing===a.id?'editing':'')} key={a.id} aria-label={(ui("快捷操作")+" "+a.label)}>
    <div><b>{ui(a.label)}</b>{(a.help&&<small>{ui(a.help)}</small>)}<small>{ui("預設：")}{defaults()[a.id]}</small></div><kbd aria-label={(a.label+" "+ui("目前綁定"))}>{ui(displayBinding(snapshot.bindings?.[a.id]))}</kbd>
    <div className="shortcut-row-actions"><button disabled={busy||snapshot.status!=='ready'} onClick={()=>begin(a.id)}>{ui("修改")}</button><button disabled={busy||snapshot.status!=='ready'||snapshot.bindings?.[a.id]===null} onClick={()=>run({type:'set',actionId:a.id,binding:null})}>{ui("停用鍵位")}</button><button disabled={busy||snapshot.status!=='ready'} onClick={()=>run({type:'reset',actionId:a.id})}>{ui("恢復預設")}</button></div>
   </section>)}</div>
   {editing&&<section className="shortcut-recorder" aria-label={ui("錄入快捷鍵")}><b>{ui("修改：")}{ui(ACTIONS.find(a=>a.id===editing)?.label)}</b><div ref={recordRef} tabIndex={0} className={recording?'recording':''} onKeyDown={capture} aria-label={ui("按下新的組合鍵")}>{recording ? ui("請按組合鍵…") : (candidate??ui("尚未錄入"))}{(candidate&&recording&&<kbd>{candidate}</kbd>)}</div>
    {(conflict&&<p className="warning" role="alert">{ui(conflict.message)}</p>)}
    <div className="shortcut-recorder-actions"><button disabled={busy} onClick={()=>{setRecording(true);recordRef.current?.focus();}}>{ui("重新錄入")}</button><button disabled={busy||!candidate||!!conflict} onClick={()=>run({type:'set',actionId:editing,binding:candidate})}>{ui("套用鍵位")}</button><button disabled={busy} onClick={cancel}>{ui("取消錄入")}</button>{conflict?.otherActionId&&<button disabled={busy} onClick={()=>run({type:'set',actionId:conflict.otherActionId,binding:null},true)}>{ui("停用「")}{ui(ACTIONS.find(a=>a.id===conflict.otherActionId)?.label)}{ui("」的鍵位")}</button>}</div>
   </section>}
   <details><summary>{ui("哪些鍵不提供綁定？")}</summary><p>{ui("Alt／Win、Ctrl+Alt（含AltGr）、文字與焦點導覽鍵、視窗關閉／重新載入／開發工具／剪貼簿等保留組合不提供。只接受本版可安全處理的字母、數字、Delete、=、-、/、F2/F4/F7/F8/F9及允許的Ctrl／Shift組合。系統未傳入的鍵無法錄入，並非所有按鍵都能攔截。")}</p></details>
  </div><div className="dialog-actions"><span className="shortcut-feedback" role="status" aria-live="polite">{ui(conflict?.message??notice)}</span><button disabled={busy} onClick={()=>run({type:'resetAll'})}>{ui("全部恢復預設")}</button><button disabled={busy} className="primary" onClick={onClose}>{ui("完成")}</button></div>
 </dialog>;
}

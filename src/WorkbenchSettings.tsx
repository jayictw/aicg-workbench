import {McpClientSettings} from './McpClientSettings';
import React,{useEffect,useRef} from 'react';
import {ui,useUiLocale} from '../shared/ui-locale.mjs';
import {LanguageSwitch} from './LanguageSwitch.mjs';
type Props={open:boolean;theme:string;onClose:()=>void;onTheme:(theme:string)=>void;onModels:()=>void;onShortcuts:()=>void;onDiagnostics:()=>void};
export function WorkbenchSettings({open,theme,onClose,onTheme,onModels,onShortcuts,onDiagnostics}:Props){useUiLocale(React);const dialog=useRef<HTMLDialogElement>(null),returnTo=useRef<HTMLElement|null>(null);
 useEffect(()=>{const d=dialog.current;if(!d)return;if(open&&!d.open){returnTo.current=document.activeElement as HTMLElement;d.showModal();}else if(!open&&d.open){d.close();returnTo.current?.focus();}},[open]);
 return <dialog ref={dialog} className="workbench-settings" aria-labelledby="workbench-settings-title" onCancel={e=>{e.preventDefault();onClose();}}><header><h2 id="workbench-settings-title">{ui('工作台設定')}</h2><button type="button" aria-label={ui('關閉設定')} onClick={onClose}>×</button></header><div className="workbench-settings-body"><LanguageSwitch/><McpClientSettings open={open}/><label>{ui('外觀')}<select aria-label={ui('外觀')} value={theme} onChange={e=>onTheme(e.target.value)}><option value="dark">{ui('深色')}</option><option value="light">{ui('淺色')}</option></select></label><div className="settings-actions"><button type="button" onClick={onModels}>{ui('模型與連接')}</button><button type="button" onClick={onShortcuts}>{ui('快捷鍵設定')}</button><button type="button" onClick={onDiagnostics}>{ui('Diagnostics')}</button></div><p>{ui('設定只影響此工作台；不會改寫項目、提示詞或既有結果。')}</p></div></dialog>;
}

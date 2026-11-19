import {ui,useUiLocale} from '../shared/ui-locale.mjs';
import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {Image,FileText,FolderOpen,Film} from 'lucide-react';
import {focusMenu} from '../shared/menu-focus.mjs';
export type CanvasPoint={x:number;y:number};
export type CanvasAction='image'|'video'|'text'|'import';
export type MenuAction={id:string;label:string;hint?:string;danger?:boolean;disabled?:boolean;icon?:React.ReactNode;shortcut?:string};
export function QuickMenu({point,title,actions,onAction,onClose}:{point:CanvasPoint;title:string;actions:MenuAction[];onAction:(action:string)=>void;onClose:(restoreFocus?:boolean)=>void}){const uiLanguage=useUiLocale(React);
 const ref=useRef<HTMLDivElement>(null),[position,setPosition]=useState(point);
 useLayoutEffect(()=>{const place=()=>{const rect=ref.current!.getBoundingClientRect();setPosition({x:Math.max(8,Math.min(point.x,window.innerWidth-rect.width-8)),y:Math.max(8,Math.min(point.y,window.innerHeight-rect.height-8))});};place();focusMenu(ref.current);window.addEventListener('resize',place);return()=>window.removeEventListener('resize',place);},[point.x,point.y,actions.map(a=>a.shortcut??'').join('|'),uiLanguage]);
 useEffect(()=>{const outside=(e:PointerEvent)=>{if(!ref.current?.contains(e.target as Node))onClose(false);};const blur=()=>onClose(false);document.addEventListener('pointerdown',outside,true);window.addEventListener('blur',blur);return()=>{document.removeEventListener('pointerdown',outside,true);window.removeEventListener('blur',blur);};},[onClose]);
 return createPortal(<div ref={ref} role="menu" tabIndex={-1} aria-label={title} className="canvas-context-menu nodrag nopan nowheel" style={{left:position.x,top:position.y}} onContextMenu={e=>e.preventDefault()} onKeyDown={e=>{e.stopPropagation();const items=Array.from(ref.current!.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')),index=items.indexOf(document.activeElement as HTMLButtonElement);if(e.key==='Escape'){e.preventDefault();e.stopPropagation();onClose();}else if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)&&items.length){e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?items.length-1:(index+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;items[next].focus();}else if(e.key==='Tab'){e.preventDefault();onClose();}}}>
  <strong className="quick-menu-title">{title}</strong>
  {actions.map(a=><button key={a.id} role="menuitem" aria-label={ui(a.label)} tabIndex={-1} disabled={a.disabled} className={a.danger?'quick-menu-danger':''} title={ui(a.hint)} onClick={()=>onAction(a.id)}>{a.icon}<span className="quick-menu-label">{ui(a.label)}</span>{(a.shortcut&&<kbd className="menu-shortcut" aria-hidden="true">{a.shortcut}</kbd>)}</button>)}
  <small>{ui("Esc 關閉 · ↑↓ 選擇 · Enter 執行；鍵位提示只在畫布選取時使用")}</small>
 </div>,document.body);
}
export function CanvasMenu({point,onAction,onClose,shortcuts={}}:{shortcuts?:Record<string,string|null>;point:CanvasPoint;onAction:(action:CanvasAction)=>void;onClose:(restoreFocus?:boolean)=>void}){useUiLocale(React);
 return <QuickMenu point={point} title={ui("新增畫布內容")} onClose={onClose} onAction={a=>onAction(a as CanvasAction)} actions={[
  {id:'image',shortcut:shortcuts.newImage??undefined,label:'新增圖片任務框',icon:<Image size={17}/>},
  {id:'video',shortcut:shortcuts.newVideo??undefined,label:'新增影片任務框 · 離線測試',icon:<Film size={17}/>},
  {id:'text',shortcut:shortcuts.newText??undefined,label:'新增文字框',icon:<FileText size={17}/>},
  {id:'import',label:'導入素材…',icon:<FolderOpen size={17}/>},
 ]}/>;
}

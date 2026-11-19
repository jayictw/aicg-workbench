import { useLayoutEffect, useRef } from 'react'
import type { ReactNode } from 'react'

// Own top-layer surface: fills application content, not browser fullscreen.
// Shared Modal/AssetPicker geometry and the document scrollbar lane stay untouched.
export function WorkbenchFrame({children,onExit}:{children:ReactNode;onExit:()=>void}) {
 const ref=useRef<HTMLDialogElement>(null)
 useLayoutEffect(()=>{
  const dialog=ref.current!,previous=document.activeElement
  const header=document.querySelector<HTMLElement>('.site-header')
  const resize=()=>dialog.style.setProperty('--workbench-top',`${Math.max(0,header?.getBoundingClientRect().bottom||0)}px`)
  resize();const observer=new ResizeObserver(resize);if(header)observer.observe(header)
  window.addEventListener('resize',resize);dialog.showModal()
  // A cancelled native file picker must not cancel the whole workbench.
  const fileCancel=(event:Event)=>{if(event.target instanceof HTMLInputElement&&event.target.type==='file')event.stopPropagation()}
  dialog.addEventListener('cancel',fileCancel,true)
  return()=>{observer.disconnect();window.removeEventListener('resize',resize);dialog.removeEventListener('cancel',fileCancel,true);dialog.close();if(previous instanceof HTMLElement&&previous.isConnected)previous.focus()}
 },[])
 return <dialog ref={ref} className="m5-workbench ui-r4-workbench" aria-labelledby="m5-workbench-title" onCancel={event=>{if(event.target!==event.currentTarget)return;event.preventDefault();onExit()}} onKeyDown={event=>{
  if(event.key!=='Tab'||(event.target as HTMLElement).closest('dialog')!==event.currentTarget)return
  const items=Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled):not([type="hidden"]),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])')).filter(el=>el.getClientRects().length>0)
  const first=items[0],last=items.at(-1)
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
 }}>{children}</dialog>
}

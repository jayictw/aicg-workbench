import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import {useExitGuard} from '../persistence/exit-editors'
import {useState} from 'react'
import { X } from 'lucide-react'
export function Modal({ title, children, onClose, wide = false, className = '' }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const [edited,setEdited]=useState(false)
  useExitGuard(title+'：未确认的表单输入',edited)
  useEffect(() => {
    const previous = document.activeElement
    const dialog = ref.current!
    dialog.showModal()
    return () => { dialog.close(); if (previous instanceof HTMLElement && previous.isConnected) previous.focus() }
  }, [])
  return <dialog onChangeCapture={e=>{if((e.target as HTMLElement).closest('form')||(e.target instanceof HTMLInputElement&&e.target.type!=='search')||e.target instanceof HTMLTextAreaElement)setEdited(true)}} ref={ref} className={`m2-dialog${wide ? ' m2-dialog-wide' : ''}${className ? ` ${className}` : ''}`} aria-labelledby={titleId} onKeyDown={event => {
    if (event.key !== 'Tab') return
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('summary, button:not(:disabled), a[href], input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')).filter(el => el.getClientRects().length > 0)
    event.preventDefault()
    event.stopPropagation()
    const index = items.indexOf(document.activeElement as HTMLElement)
    const next = event.shiftKey ? (index <= 0 ? items.length - 1 : index - 1) : (index + 1) % items.length
    items[next]?.focus()
  }} onCancel={event => { event.preventDefault(); event.stopPropagation(); onClose() }} onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    <div className="m2-modal-heading"><h2 id={titleId}>{title}</h2><button className="m2-icon-button" onClick={onClose} aria-label="关闭弹窗"><X aria-hidden="true" size={19} /></button></div>
    {children}
  </dialog>
}

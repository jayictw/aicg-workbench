import {Info} from 'lucide-react'
import {useState} from 'react'
import type {ReactNode} from 'react'
import {Modal} from '../studio/Modal'
export function InfoButton({title,children}:{title:string;children:ReactNode}){const [open,setOpen]=useState(false);return <><button type="button" className="acs-info-button" aria-label={'说明：'+title} aria-haspopup="dialog" onClick={()=>setOpen(true)}><Info size={20} strokeWidth={1.8} aria-hidden="true"/></button>{open&&<Modal title={title} onClose={()=>setOpen(false)} className="acs-info-dialog"><div className="acs-info-body">{children}</div><div className="m2-modal-footer"><button type="button" className="secondary-button" onClick={()=>setOpen(false)}>知道了</button></div></Modal>}</>}

import {useEffect,useState} from 'react'
import type {ImgHTMLAttributes} from 'react'
import {ImageOff} from 'lucide-react'
/** Display-only feedback; never edits asset records or dereferences a different source. */
export function ManagedImage(props:ImgHTMLAttributes<HTMLImageElement>){
 const [state,setState]=useState<'loading'|'ready'|'failed'>('loading')
 useEffect(()=>setState('loading'),[props.src])
 return <span className={('r5-media '+(props.className||''))} data-media-state={state}>
  <img {...props} className={undefined} onLoad={()=>setState('ready')} onError={()=>setState('failed')}/>
  {state!=='ready'&&<span className="r5-media-feedback" role="status">{state==='failed'?<><ImageOff size={20} aria-hidden="true"/>图片暂不可用</>:'正在载入图片…'}</span>}
 </span>
}

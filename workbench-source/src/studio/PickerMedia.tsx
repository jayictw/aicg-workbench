import {useEffect,useState} from 'react'
import {ImageOff,Image as ImageIcon} from 'lucide-react'
/** Display state only; never changes selection, references or media ownership. */
export function PickerMedia({src,alt}:{src:string;alt:string}){
 const [state,setState]=useState<'loading'|'ready'|'error'>('loading')
 useEffect(()=>setState('loading'),[src])
 return <span className="ui-r1-picker-media" data-media-state={state} aria-busy={state==='loading'}>
 <img src={src} alt={alt} width="400" height="320" onLoad={()=>setState('ready')} onError={()=>setState('error')}/>
 {state==='loading'&&<span className="ui-r1-media-message"><ImageIcon aria-hidden="true" size={22}/>正在载入图片…</span>}
 {state==='error'&&<span className="ui-r1-media-message" role="status"><ImageOff aria-hidden="true" size={22}/><strong>图片载入失败</strong><small>请重新选择或检查原素材</small></span>}
 </span>
}

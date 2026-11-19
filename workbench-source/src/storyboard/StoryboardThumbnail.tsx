import {useState} from 'react'
import {ImageOff} from 'lucide-react'
/** Presentation only. Caller keys by src so replacing media resets decode status. */
export function StoryboardThumbnail({src,alt}:{src:string;alt:string}){
 const [state,setState]=useState<'loading'|'ready'|'error'>(src?'loading':'error')
 return <div className="r3-thumbnail" data-media-state={state}>{state!=='error'&&<img src={src} alt={alt} width="90" height="72" onLoad={()=>setState('ready')} onError={()=>setState('error')}/>} {state!=='ready'&&<span role="status">{state==='error'?<><ImageOff size={18} aria-hidden="true"/>图片不可用</>:'载入中…'}</span>}</div>
}

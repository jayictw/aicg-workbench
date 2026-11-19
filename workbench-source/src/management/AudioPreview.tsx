import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
export function pauseAllMedia(){document.querySelectorAll<HTMLMediaElement>('video[data-studio-video],audio[data-studio-audio]').forEach(m=>m.pause())}
export function AudioPreview({src,label}:{src:string;label:string}){
 const ref=useRef<HTMLAudioElement>(null),[playing,setPlaying]=useState(false),[error,setError]=useState('')
 useEffect(()=>{const audio=ref.current;return()=>{audio?.pause()}},[])
 return <div className="m4-audio"><audio ref={ref} data-studio-audio src={src} preload="metadata" onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onEnded={()=>setPlaying(false)} onError={()=>setError('音频无法播放；未执行生成或转换。')}/><p>{label}</p><button className="secondary-button" onClick={async()=>{const a=ref.current!;if(!a.paused){a.pause();return}pauseAllMedia();try{await a.play()}catch{setError('此浏览器无法播放该音频。')}}}>{playing?<Pause aria-hidden="true" size={18}/>:<Play aria-hidden="true" size={18}/>} {playing?'暂停音频':'播放音频'}</button>{error&&<p role="alert">{error}</p>}</div>
}

import {ui,useUiLocale} from '../shared/ui-locale.mjs';
import React,{useRef,useState,useEffect} from 'react';
export function CardVideo({src,name,onError}:{src:string;name:string;onError:()=>void}){useUiLocale(React);
 const ref=useRef<HTMLVideoElement>(null),[interactive,setInteractive]=useState(false);
 useEffect(()=>{setInteractive(false);},[src]);
 const preview=()=>{ref.current?.pause();setInteractive(false);};
 const play=()=>{setInteractive(true);ref.current?.play().catch(()=>{});};
 return <div className="card-video nowheel">
  <video ref={ref} className={interactive?'nodrag':''} controls={interactive} data-canvas-preview={interactive?undefined:'true'} preload="metadata" src={src} aria-label={name} onError={onError} onEnded={preview}/>
  <button className="video-preview-action" onKeyDown={e=>{if(['Enter',' '].includes(e.key))e.stopPropagation();}} aria-label={(name+(interactive ? " "+ui("返回預覽") : " "+ui("播放影片")))} title={interactive ? ui("返回可右鍵操作的預覽；不改選取") : ui("在框內播放；預覽中央可右鍵操作")} onClick={e=>{e.stopPropagation();if(interactive)preview();else play();}}>{interactive ? ui("返回預覽") : ui("▶ 播放影片")}</button>
 </div>;
}

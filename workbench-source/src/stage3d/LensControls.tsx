import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { Ref } from 'react'
import { focalRange, formatFocal, lensPreset, parseFocalInput, verticalFov } from './lens-state'
export type LensHandle = { commit:()=>boolean }
export function LensControls({value,original,onChange,onPendingChange,onValidityChange,ref}:{value:number;original:number;onChange:(n:number)=>void;onPendingChange:(pending:boolean)=>void;onValidityChange:()=>void;ref:Ref<LensHandle>}) {
 const [raw,setRaw]=useState(formatFocal(value)),[error,setError]=useState(''),input=useRef<HTMLInputElement>(null),edited=useRef(false)
 function clearError(){setError('');input.current?.setCustomValidity('')}
 function choose(n:number){edited.current=false;clearError();setRaw(formatFocal(n));onPendingChange(false);onChange(n);onValidityChange()}
 function commit(){if(!edited.current)return true;const n=parseFocalInput(raw);if(n===null){const message='请输入 18–135mm 的有效焦距；预览保留最后有效设置。';setError(message);input.current?.setCustomValidity(message);onPendingChange(true);onValidityChange();return false}choose(n);return true}
 useImperativeHandle(ref,()=>({commit}))
 useEffect(()=>{edited.current=false;setRaw(formatFocal(value));clearError();onPendingChange(false)},[value,onPendingChange])
 useEffect(()=>{const frame=requestAnimationFrame(onValidityChange);return()=>cancelAnimationFrame(frame)},[raw,error,onValidityChange])
 return <section className="m5-property-group m5-lens" aria-labelledby="m5-lens-title"><div className="m5-tool-heading"><h4 id="m5-lens-title">镜头焦距</h4><span className="m5-helper" data-testid="lens-preset-state">{lensPreset(value)}</span></div>
 <div className="m5-lens-presets" aria-label="镜头焦距预设">{([['广角',24],['标准',50],['长焦',85]] as const).map(([label,n])=><button type="button" className="secondary-button" key={n} aria-pressed={value===n} onClick={()=>choose(n)}>{label} {n}mm</button>)}</div>
 <div className="m5-lens-value"><label className="m5-number"><span>焦距（mm）</span><input ref={input} type="text" inputMode="decimal" name="focal-length-mm" autoComplete="off" spellCheck={false} aria-label="焦距（mm）" aria-invalid={!!error} aria-describedby="m5-lens-help m5-lens-error" value={raw} onChange={e=>{edited.current=true;clearError();setRaw(e.target.value);const n=parseFocalInput(e.target.value);onPendingChange(n===null);if(n!==null)onChange(n)}} onBlur={()=>commit()} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();commit()}}}/></label><label className="m5-lens-range"><span className="m5-helper">18–135mm</span><input type="range" name="focal-length-slider" aria-label="焦距滑杆（mm）" min={focalRange.min} max={focalRange.max} step="any" value={value} onChange={e=>choose(e.target.valueAsNumber)} aria-valuetext={`${formatFocal(value)}mm`}/></label></div>
 <p id="m5-lens-error" className="m5-lens-error" role="status">{error}</p><p className="m5-helper" id="m5-lens-help">虚拟感光面高度 24mm · 垂直 FOV {verticalFov(value).toFixed(2)}°。只改取景范围，不移动机位；景深在下方另行开启。</p>
 <button type="button" className="m2-text-button" onClick={()=>choose(original)}>还原本次打开时焦距（{formatFocal(original)}mm）</button><p className="m5-helper">仅还原焦距；机位、人物姿势和灯光保持。</p></section>
}

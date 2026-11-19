import * as T from 'three'
import type { PromptSource } from './scene-prompt-state.ts'
import {matchingBuiltin} from './builtin-pose-presets.ts'
import { rootOf, isPerson, poseOf } from './pose-state.ts'
import { focalLengthOf, formatFocal } from './lens-state.ts'
import { dofOf } from './dof-state.ts'

/** Uses the existing engine's camera-space evidence, never world X as screen X. */
export function modelDescription(source:PromptSource):string {
 const {scene:s,evidence:e}=source,parts:string[]=[`${s.ratio}画幅，${formatFocal(focalLengthOf(s.camera))}mm焦距，静态取景。`]
 const b=e.composition.bounds
 if(e.composition.state==='intersects'){
  if(b){const x=(b[0]+b[2])/2,y=(b[1]+b[3])/2;parts.push(`主体位于画面${x < -1/3?'左侧':x > 1/3?'右侧':'中央'}，${y>1/3?'偏上':y < -1/3?'偏下':'垂直居中'}。`);if(e.composition.clipped)parts.push('主体部分超出画面。')}
  if(e.composition.pitch)parts.push(e.composition.pitch==='down'?'俯视拍摄。':e.composition.pitch==='up'?'仰视拍摄。':'近水平视角拍摄。')
 }
 const root=rootOf(s)
 if(isPerson(s)){
  const p=poseOf(s),upright=root.rotation[0]%360===0&&root.rotation[2]%360===0,known=matchingBuiltin(p)
  // Exact existing preset match only; no inferred action intent from arbitrary angles.
  if(known&&upright)parts.push(known.description)
  else parts.push('人物保持静态姿势。')
  // The built-in mannequin's modeled front is +Z. GLB front axes are unknown.
  const forward=new T.Vector3(0,0,1).applyEuler(new T.Euler(...root.rotation.map(x=>x*Math.PI/180) as [number,number,number],'YXZ'))
  const toCamera=new T.Vector3(...s.camera.position).sub(new T.Vector3(...root.position))
  const horizontal=new T.Vector2(forward.x,forward.z),toward=new T.Vector2(toCamera.x,toCamera.z)
  if(upright&&horizontal.length()>=.001&&toward.length()>=.001&&p.joints.torso.every(n=>n===0)){const dot=horizontal.normalize().dot(toward.normalize());parts.push(`人物身体${dot>.707?'正面朝向镜头':dot<-.707?'背面朝向镜头':'侧面对着镜头'}。`)}
 }
 parts.push(`单盏聚光灯，灯光颜色${e.light.color}。`)
 if(e.composition.state!=='unavailable')parts.push(`主灯在拍摄视角的${e.light.side==='left'?'左侧':e.light.side==='right'?'右侧':'近中轴'}${e.light.vertical==='above'?'上方':e.light.vertical==='below'?'下方':''}。`)
 if(s.light.power===0)parts.push('主灯未照明。')
 parts.push(s.ambient>0?'有基本环境光。':'无基本环境光。')
 if(!s.backdrop.show)parts.push('中性背景。')
 else parts.push(s.backdrop.mode==='color'?`${s.backdrop.color}纯色背景。`:s.backdrop.mode==='image'?'图片背景。':'全景背景。')
 if(s.backdrop.lighting)parts.push('有环境照明和反射。')
 if(s.backdrop.ground)parts.push('地面承接阴影。')
 const d=dofOf(s.camera)
 if(!d.enabled||e.effect.state==='fallback'||e.effect.state==='active'&&d.strength===0)parts.push('画面保持清晰。')
 else if(e.effect.state==='active')parts.push('焦平面附近清晰，离焦部分虚化。')
 return parts.join('\n')
}

export const modelInputNotes='自动文字依据拍摄快照与已有几何证据；包围范围不代表遮挡检测。内置姿势只按现有预设精确匹配；自定义关节不推断挥手、拿物等动作意图。身体朝向与头部视线分开，导入模型的正面轴未知。缺少证据的内容不送入模型，实际遵循情况需观察生成结果。'
export const referencePurpose='参考图用于构图、静态姿势与空间关系；人物身份和材质由原始创意决定。'
export type ComparisonGroup='BASE'|'A'|'B'|'C'
export function effectiveText(original:string,automatic:string,manual:string,group:ComparisonGroup):string {
 return [original,...(group==='A'||group==='C'?[automatic]:[]),...(group!=='BASE'&&manual.trim()?[manual]:[]),...(group==='B'||group==='C'?[referencePurpose]:[])].filter(s=>s.trim()).join('\n\n')
}

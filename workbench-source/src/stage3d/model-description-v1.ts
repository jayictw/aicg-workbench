import * as T from 'three'
import type { PromptSource } from './scene-prompt-state.ts'
import { mergedPrompt, organizePrompt } from './scene-prompt-state.ts'
import { rootOf, isPerson } from './pose-state.ts'
import { dofOf } from './dof-state.ts'

/** Uses the existing engine's camera-space evidence, never world X as screen X. */
export function modelDescription(source:PromptSource):string {
 const {scene:s,evidence:e}=source,parts=[mergedPrompt(organizePrompt(source))]
 if(e.composition.state==='unavailable')parts.push('主体画面位置与拍摄角度未解读；缺少有效可见几何。')
 else if(e.composition.pitch==='level')parts.push('平视角：拍摄光轴接近水平；未推定与人物眼睛等高。')
 if(e.composition.bounds){const b=e.composition.bounds,y=(b[1]+b[3])/2;parts.push(`主体投影包围范围中心${y>.33?'偏画面上方':y<-.33?'偏画面下方':'接近画面垂直中部'}；包围范围不表示遮挡检测。`)}
 const root=rootOf(s)
 if(isPerson(s)){
  // The built-in mannequin's modeled front is +Z. GLB front axes are unknown.
  const forward=new T.Vector3(0,0,1).applyEuler(new T.Euler(...root.rotation.map(x=>x*Math.PI/180) as [number,number,number],'YXZ'))
  const toCamera=new T.Vector3(...s.camera.position).sub(new T.Vector3(...root.position))
  const horizontal=new T.Vector2(forward.x,forward.z),toward=new T.Vector2(toCamera.x,toCamera.z)
  if(horizontal.length()<.001||toward.length()<.001)parts.push('人物正面相对机位朝向未解读。')
  else {const dot=horizontal.normalize().dot(toward.normalize());parts.push(`按内置人偶本体正面轴，主体${dot>.707?'大致面向机位':dot<-.707?'大致背向机位':'侧对机位'}；这不表示头部视线。`)}
 }else parts.push('主体自身正面语义未解读；不猜测导入模型或构图替身的正面。')
 const d=dofOf(s.camera)
 if(d.enabled)parts.push(`设置的焦平面距离为${d.focusDistance}场景单位，虚化强度${d.strength}；场景单位不代表米，也不承诺模型精确服从。`)
 parts.push('人物动作意图请在用户手改补充中明确填写；程序不会把局部关节角度猜成挥手或拿杯子。')
 return parts.join('\n\n')
}

export const referencePurpose='参考图仅用于构图、静态姿势与空间关系。白模不是人物身份或材质目标；不能保证模型不带入白模外观。'
export type ComparisonGroup='BASE'|'A'|'B'|'C'
export function effectiveText(original:string,automatic:string,manual:string,group:ComparisonGroup):string {
 return [original,...(group==='A'||group==='C'?['摄影棚自动补充：\n'+automatic]:[]),...(group!=='BASE'&&manual.trim()?['用户手改补充：\n'+manual]:[]),...(group==='B'||group==='C'?[referencePurpose]:[])].filter(s=>s.trim()).join('\n\n')
}

import type { StageSettings } from './state.ts'
import { focalLengthOf, formatFocal } from './lens-state.ts'
import {matchingBuiltin} from './builtin-pose-presets.ts'
import { isPerson, jointDefinitions, jointIds, poseOf } from './pose-state.ts'
import { dofOf } from './dof-state.ts'
export const promptRuleVersion='scene-prompt.zh.v1' as const
export type PromptEvidence={composition:{state:'outside'|'intersects'|'unavailable';centerX?:number;clipped?:boolean;pitch?:'down'|'up'|'level';bounds?:number[]};light:{type:'SpotLight';color:string;side:'left'|'right'|'near-axis';vertical:'above'|'below'|'near-height'};effect:{state:'off'|'active'|'fallback'|'unknown';reason:string}}
export type PromptSource={version:1;id:string;kind:'draft'|'output';task:{id:string;name:string;kind:'image'|'video'};at:string;scene:StageSettings;evidence:PromptEvidence;sceneSignature:string}
export type PromptSection={id:'camera'|'pose'|'light'|'background'|'dof';label:string;text:string;enabled:boolean}
export type PromptDraft={version:1;ruleVersion:typeof promptRuleVersion;source:PromptSource;at:string;sections:PromptSection[];originalSections:PromptSection[];manualText:string|null;unacknowledged:boolean}
export function promptSource(kind:PromptSource['kind'],scene:StageSettings,evidence:PromptEvidence,task:PromptSource['task'],id=crypto.randomUUID()):PromptSource{return{version:1,id:kind+'-'+id,kind,scene:structuredClone(scene),evidence:structuredClone(evidence),task:{...task},at:new Date().toISOString(),sceneSignature:JSON.stringify(scene)}}
export function organizePrompt(source:PromptSource):PromptDraft {
 const s=source.scene,e=source.evidence,composition=e.composition,frame=s.ratio==='1:1'?'方形':Number(s.ratio.split(':')[0])>Number(s.ratio.split(':')[1])?'横向':'竖向'
 let camera=`采用${formatFocal(focalLengthOf(s.camera))}mm焦距、${s.ratio}${frame}画幅，固定机位静态取景。`
 if(composition.state==='outside')camera+='主体几何包围范围在拍摄视锥外，不描述为画面中的居中主体。'
 else if(composition.state==='intersects'&&composition.centerX!==undefined){camera+=`主体投影中心${composition.centerX<-.33?'偏向画面左侧':composition.centerX>.33?'偏向画面右侧':'在画面中央附近'}。`;if(composition.clipped)camera+='主体包围范围部分超出画幅。';if(composition.pitch==='down')camera+='拍摄机朝向向下俯视。';if(composition.pitch==='up')camera+='拍摄机朝向向上仰视。'}
 let pose='';if(isPerson(s)){const current=poseOf(s),match=matchingBuiltin(current);if(match)pose=`内置人偶采用${({standing:'站姿',t:'T字姿势',sitting:'坐姿'} as Record<string,string>)[match.id]||match.name}预设的关节配置，静态呈现。`+match.description;else{const changed=jointIds.filter(id=>current.joints[id].some(n=>Math.abs(n)>.001));pose='内置人偶使用调整后的静态关节姿态，不再标为完整的内置预设。';if(changed.length)pose+=`${changed.slice(0,4).map(id=>jointDefinitions[id].label).join('、')}局部角度已调整。`}}
 const light=`使用单盏${e.light.type==='SpotLight'?'聚光灯':'主灯'}，颜色${e.light.color}。${composition.state!=='unavailable'?`主灯相对主体中心位于拍摄视角的${e.light.side==='left'?'左侧':e.light.side==='right'?'右侧':'近中轴'}${e.light.vertical==='above'?'、上方':e.light.vertical==='below'?'、下方':''}方向。`:''}${s.light.power===0?'主灯强度为0，未发出主灯照明。':''}${s.ambient>0?'另启用基本环境光。':'基本环境光强度为0。'}`
 let background=!s.backdrop.show?'背景显示关闭，使用中性底。':s.backdrop.mode==='color'?`使用${s.backdrop.color}纯色背景。`:s.backdrop.mode==='image'?'使用普通图片作为平面背景；具体画面内容待手动补充。':'使用全景HDR作为背景；具体画面内容待手动补充。'
 background+=s.backdrop.lighting?'另启用HDR环境照明与反射。':'未启用HDR环境照明。';background+=s.backdrop.ground?'保留实际承影地面。':'未显示实际承影地面。'
 const dof=dofOf(s.camera),depth=!dof.enabled?'景深关闭，采用清晰渲染。':e.effect.state==='active'&&dof.strength===0?'景深处理已启用，但虚化强度为0，画面保持清晰；照片／HDR背景保持清晰。':e.effect.state==='active'?'启用基于场景几何深度的近似景深，焦平面附近较清晰，离焦几何按虚化强度处理；照片／HDR背景保持清晰。':e.effect.state==='fallback'?'景深设置已开启，但实际回退清晰渲染，未产生景深虚化。':'景深设置已开启，实际效果尚未确认，不描述为已产生虚化。'
 const sections:PromptSection[]=[{id:'camera',label:'构图／镜头',text:camera,enabled:true},{id:'pose',label:'人物姿态',text:pose,enabled:!!pose},{id:'light',label:'灯光',text:light,enabled:true},{id:'background',label:'背景／环境',text:background,enabled:true},{id:'dof',label:'景深',text:depth,enabled:true}]
 return{version:1,ruleVersion:promptRuleVersion,source:structuredClone(source),at:new Date().toISOString(),sections,originalSections:structuredClone(sections),manualText:null,unacknowledged:true}
}
export const mergedPrompt=(d:PromptDraft)=>d.manualText??d.sections.filter(s=>s.enabled&&s.text).map(s=>s.text).join('\n\n')
export const hasPromptEdits=(d:PromptDraft)=>d.manualText!==null||d.sections.some((s,i)=>s.enabled!==d.originalSections[i].enabled)
export const restorePrompt=(d:PromptDraft):PromptDraft=>({...d,sections:structuredClone(d.originalSections),manualText:null,unacknowledged:true})
export function togglePrompt(d:PromptDraft,id:PromptSection['id'],enabled:boolean):PromptDraft {if(d.manualText!==null)return d;return{...d,sections:d.sections.map(s=>s.id===id?{...s,enabled}:s),unacknowledged:true}}

import {StageEngine} from '../stage3d/engine'
import {applyBuiltin,builtinPosePresets,groundPose} from '../stage3d/builtin-pose-presets'
import type {BuiltinPoseId} from '../stage3d/builtin-pose-presets'
import {defaultStage} from '../stage3d/state'
import {rootOf} from '../stage3d/pose-state'
import {beforePoses} from './kneeling-before'
const host=document.getElementById('host')!,left=document.getElementById('left')!,right=document.getElementById('right')!
const engine=new StageEngine(left,right,host,()=>{},m=>{throw Error(m)})
const base=defaultStage();base.subject={kind:'builtin',id:'person'};base.camera.focalLengthMm=50
engine.update(base,'camera','translate');const ready=engine.load(undefined,'person')
const data=(b:Blob)=>new Promise<string>((yes,no)=>{const r=new FileReader();r.onerror=no;r.onload=()=>yes(String(r.result).split(',')[1]);r.readAsDataURL(b)})
async function render(id:BuiltinPoseId,view:'front'|'side'|'shoot',variant:'before'|'after'='after'){
 await ready
 let s=variant==='before'?{...structuredClone(base),pose:beforePoses[id],root:groundPose(base,beforePoses[id])}:applyBuiltin(structuredClone(base),id)
 const cameraPosition=view==='front'?[0,1.2,4.8]:view==='side'?[4.8,1.2,0]:[3.1,2.05,3.9]
 s={...s,target:[0,.76,0],camera:{...s.camera,position:cameraPosition as [number,number,number]}}
 engine.update(s,'camera','translate')
 const evidence=engine.describePrompt(s),out=await engine.captureReference(s,1024,new AbortController().signal)
 return {id,view,variant,png:await data(out.blob),root:rootOf(s),pose:s.pose,camera:s.camera,target:s.target,width:out.width,height:out.height,evidence,metrics:JSON.parse(host.dataset.metrics||'{}')}
}
Object.assign(window,{__poseAudit:{definitions:builtinPosePresets.filter(d=>['one-knee','both-knees'].includes(d.id)),render,dispose:()=>engine.dispose()}})

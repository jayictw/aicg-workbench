import type { Vec3, StageSettings } from './state.ts'
export type Axis = 'X'|'Y'|'Z'
export const jointIds = ['torso','neck','head','leftShoulder','leftElbow','leftWrist','rightShoulder','rightElbow','rightWrist','leftHip','leftKnee','leftAnkle','rightHip','rightKnee','rightAnkle'] as const
export type JointId = typeof jointIds[number]
export type Pose = {version:1;joints:Record<JointId,Vec3>}
export type RootTransform = {position:Vec3;rotation:Vec3}
type JointDefinition = {label:string;group:'中轴'|'左侧'|'右侧';axes:Partial<Record<Axis,readonly [number,number]>>}
export const jointDefinitions:Record<JointId,JointDefinition> = {
 torso:{label:'躯干',group:'中轴',axes:{X:[-30,35],Y:[-45,45],Z:[-25,25]}},
 neck:{label:'颈部',group:'中轴',axes:{X:[-35,35],Y:[-60,60],Z:[-25,25]}},
 head:{label:'头部',group:'中轴',axes:{X:[-20,20],Y:[-30,30],Z:[-15,15]}},
 leftShoulder:{label:'左肩',group:'左侧',axes:{X:[-150,80],Y:[-90,90],Z:[-30,160]}},
 rightShoulder:{label:'右肩',group:'右侧',axes:{X:[-150,80],Y:[-90,90],Z:[-160,30]}},
 leftElbow:{label:'左肘',group:'左侧',axes:{X:[-145,0]}},rightElbow:{label:'右肘',group:'右侧',axes:{X:[-145,0]}},
 leftWrist:{label:'左腕',group:'左侧',axes:{X:[-60,60],Z:[-30,30]}},rightWrist:{label:'右腕',group:'右侧',axes:{X:[-60,60],Z:[-30,30]}},
 leftHip:{label:'左髋',group:'左侧',axes:{X:[-120,45],Y:[-40,40],Z:[-45,45]}},rightHip:{label:'右髋',group:'右侧',axes:{X:[-120,45],Y:[-40,40],Z:[-45,45]}},
 leftKnee:{label:'左膝',group:'左侧',axes:{X:[0,145]}},rightKnee:{label:'右膝',group:'右侧',axes:{X:[0,145]}},
 leftAnkle:{label:'左踝',group:'左侧',axes:{X:[-35,45],Z:[-20,20]}},rightAnkle:{label:'右踝',group:'右侧',axes:{X:[-35,45],Z:[-20,20]}},
}
export const defaultPose=():Pose=>({version:1,joints:Object.fromEntries(jointIds.map(id=>[id,[0,0,0]])) as Record<JointId,Vec3>})
export const rootOf=(s:Pick<StageSettings,'root'>):RootTransform=>structuredClone(s.root||{position:[0,0,0],rotation:[0,0,0]})
export const poseOf=(s:Pick<StageSettings,'pose'>):Pose=>structuredClone(s.pose||defaultPose())
export const isPerson=(s:Pick<StageSettings,'subject'>)=>s.subject.kind==='builtin'&&s.subject.id==='person'
export function limitRotation(id:JointId,rotation:Vec3):Vec3{return rotation.map((n,i)=>{const range=jointDefinitions[id].axes[(['X','Y','Z'] as const)[i]];return range?Math.max(range[0],Math.min(range[1],Number.isFinite(n)?n:0)):0}) as Vec3}
export function setJoint(pose:Pose,id:JointId,rotation:Vec3):Pose{return{version:1,joints:{...structuredClone(pose.joints),[id]:limitRotation(id,rotation)}}}
export function posePreset(kind:'standing'|'t'|'sitting'):Pose{const p=defaultPose();if(kind==='t'){p.joints.leftShoulder[2]=90;p.joints.rightShoulder[2]=-90}if(kind==='sitting'){for(const side of ['left','right'] as const){p.joints[`${side}Hip`][0]=-90;p.joints[`${side}Knee`][0]=90;p.joints[`${side}Shoulder`][0]=-12;p.joints[`${side}Elbow`][0]=-70}}return p}
export function poseIssues(pose:Pose|undefined,root:RootTransform|undefined):string[]{const issues:string[]=[];if(root&&![root.position,root.rotation].every(v=>Array.isArray(v)&&v.length===3&&v.every(n=>Number.isFinite(n)&&Math.abs(n)<=100000)))issues.push('主体整体坐标或旋转无效。');if(pose&&(pose.version!==1||!pose.joints||Object.keys(pose.joints).some(id=>!jointIds.includes(id as JointId))||jointIds.some(id=>{const r=pose.joints[id];return !Array.isArray(r)||r.length!==3||r.some(n=>!Number.isFinite(n))||r.some((n,i)=>n!==limitRotation(id,r)[i])})))issues.push('人物姿势数据无效或超出关节活动范围。');return issues}

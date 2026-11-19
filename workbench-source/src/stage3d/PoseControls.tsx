import {InfoButton} from '../ui/InfoButton'
import type {BuiltinPoseId} from './builtin-pose-presets'
import { PoseLibrary } from './PoseLibrary'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { jointDefinitions, jointIds } from './pose-state'
import type { Axis, JointId, Pose } from './pose-state'
export function PoseControls({pose,joint,onSelect,onAngle,onResetJoint,onPreset,onResetPose,canUndo,onUndo,canRedo,onRedo,number,onApplyPose,capturePose}:{pose:Pose;onApplyPose:(pose:Pose)=>boolean;capturePose:()=>Pose|null;joint:JointId;onSelect:(id:JointId)=>void;onAngle:(axis:number,value:number)=>void;onResetJoint:()=>void;onPreset:(id:BuiltinPoseId)=>void;onResetPose:()=>void;canUndo:boolean;onUndo:()=>void;canRedo:boolean;onRedo:()=>void;number:(label:string,value:number,onChange:(n:number)=>void,min:number,max:number)=>ReactNode}){
 const [search,setSearch]=useState(''),definition=jointDefinitions[joint]
 return <div className="m5-pose-controls"><div className="m5-pose-header"><strong>人物姿势</strong><InfoButton title="人物姿势操作"><p>原创分段人偶，使用现有关节，无IK、蒙皮、手指或动画。左右按人偶自身区分。预设只改选中人偶关节及必要接地高度，不改相机、灯光或背景。</p><p>标记和旋转环仅显示在编辑视口，不进入拍摄图。</p></InfoButton></div>
 <PoseLibrary pose={pose} onBuiltin={onPreset} onApply={onApplyPose} capturePose={capturePose}/>
 <p className="m5-helper">静态姿势，不自动添加道具。</p>
 <div className="m5-pose-undo"><button type="button" className="m2-text-button" disabled={!canUndo} onClick={onUndo}>撤销姿势操作</button><button type="button" className="m2-text-button" disabled={!canRedo} onClick={onRedo}>重做姿势操作</button></div>
 <details className="m5-joint-details"><summary>微调关节</summary><label className="m2-field">查找关节<input type="search" name="joint-search" autoComplete="off" aria-label="搜索关节" placeholder="左肩、膝、头部…" value={search} onChange={e=>setSearch(e.target.value)}/></label>
 <label className="m2-field">关节清单<select aria-label="人物关节清单" name="pose-joint" size={5} value={joint} onChange={e=>onSelect(e.target.value as JointId)}>{(['中轴','左侧','右侧'] as const).map(group=><optgroup key={group} label={group}>{jointIds.filter(id=>jointDefinitions[id].group===group&&jointDefinitions[id].label.includes(search.trim())).map(id=><option key={id} value={id}>{jointDefinitions[id].label}</option>)}</optgroup>)}</select></label>
 {!jointIds.some(id=>jointDefinitions[id].label.includes(search.trim()))&&<p role="status" className="m5-helper">没有匹配的关节，调整搜索词；当前选中关节保持。</p>}
 <div className="m5-joint-heading"><h4>{definition.label} · 局部旋转</h4><span>{definition.group}</span></div>
 <p className="m5-helper">拖动编辑视口的彩色旋转环，或输入角度。仅显示有效轴；肘和膝只允许单轴弯曲。</p>
 {(['X','Y','Z'] as Axis[]).map((axis,i)=>{const range=definition.axes[axis];return range?<div className="m5-joint-axis" key={`${joint}-${axis}`}>{number(`${definition.label} ${axis} 角度°`,pose.joints[joint][i],n=>onAngle(i,n),range[0],range[1])}<input type="range" name={`${joint}-${axis}-slider`} aria-label={`${definition.label} ${axis} 滑杆`} min={range[0]} max={range[1]} step="any" value={pose.joints[joint][i]} onChange={e=>onAngle(i,e.target.valueAsNumber)}/><span className="m5-helper">{range[0]}° ～ {range[1]}°</span></div>:null})}
 <div className="m5-pose-resets"><button type="button" className="secondary-button" onClick={onResetJoint}>重置当前关节</button><button type="button" className="secondary-button" onClick={onResetPose}>重置整体姿势</button></div></details></div>
}

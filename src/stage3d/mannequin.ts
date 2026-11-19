// Original procedural rigid-segment mannequin. No skinning, IK, collision or external assets.
import * as T from 'three'
import { defaultPose, jointIds } from './pose-state.ts'
import type { JointId, Pose } from './pose-state.ts'
export type Mannequin={object:T.Group;joints:Record<JointId,T.Group>;markers:Record<JointId,T.Mesh<T.SphereGeometry,T.MeshBasicMaterial>>;restBounds:T.Box3}
export function createMannequin():Mannequin{
 const object=new T.Group();object.name='original-articulated-mannequin'
 const joints={} as Record<JointId,T.Group>,markers={} as Mannequin['markers']
 const body=new T.MeshStandardMaterial({color:0xc3b6a2,roughness:.64,metalness:.08}),limb=new T.MeshStandardMaterial({color:0x6b8981,roughness:.6,metalness:.12}),jointMaterial=new T.MeshStandardMaterial({color:0x394b49,roughness:.5,metalness:.18})
 const mesh=(parent:T.Object3D,geometry:T.BufferGeometry,material:T.Material,position:number[],scale?:number[])=>{const m=new T.Mesh(geometry,material);m.position.fromArray(position);if(scale)m.scale.fromArray(scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
 const pivot=(id:JointId,parent:T.Object3D,position:number[])=>{const g=new T.Group();g.name=id;g.rotation.order='XYZ';g.position.fromArray(position);parent.add(g);joints[id]=g;mesh(g,new T.SphereGeometry(.065,16,12),jointMaterial,[0,0,0]);return g}
 const segment=(parent:T.Object3D,length:number,radius:number)=>mesh(parent,new T.CapsuleGeometry(radius,length-2*radius,6,14),limb,[0,-length/2,0])
 mesh(object,new T.BoxGeometry(.34,.18,.23),limb,[0,1.02,0])
 const torso=pivot('torso',object,[0,1.07,0]);mesh(torso,new T.CapsuleGeometry(.16,.2,8,20),body,[0,.22,0],[1.34,1,.8])
 const clavicle=mesh(torso,new T.CylinderGeometry(.065,.065,.58,16),body,[0,.47,0]);clavicle.rotation.z=Math.PI/2;mesh(torso,new T.CylinderGeometry(.06,.07,.12,16),body,[0,.51,0]);
 const neck=pivot('neck',torso,[0,.56,0]);mesh(neck,new T.CylinderGeometry(.06,.07,.12,16),body,[0,.06,0]);const head=pivot('head',neck,[0,.12,0]);mesh(head,new T.SphereGeometry(1,24,18),body,[0,.12,0],[.15,.20,.14])
 for(const [side,sign]of [['left',1],['right',-1]] as const){
  const shoulder=pivot(`${side}Shoulder`,torso,[sign*.29,.47,0]);segment(shoulder,.30,.065)
  const elbow=pivot(`${side}Elbow`,shoulder,[0,-.30,0]);segment(elbow,.28,.055)
  const wrist=pivot(`${side}Wrist`,elbow,[0,-.28,0]);mesh(wrist,new T.CapsuleGeometry(.052,.065,6,14),body,[0,-.075,.01],[1,.95,.68])
  const hip=pivot(`${side}Hip`,object,[sign*.14,1.02,0]);segment(hip,.46,.083)
  const knee=pivot(`${side}Knee`,hip,[0,-.46,0]);segment(knee,.44,.067)
  const ankle=pivot(`${side}Ankle`,knee,[0,-.44,0]);mesh(ankle,new T.BoxGeometry(.135,.12,.26),limb,[0,-.06,.07])
 }
 object.updateMatrixWorld(true);const restBounds=new T.Box3().setFromObject(object)
 for(const id of jointIds){const marker=new T.Mesh(new T.SphereGeometry(.039,14,10),new T.MeshBasicMaterial({color:id.startsWith('right')?0xeebf7a:0x76dfc4,depthTest:false,transparent:true,opacity:.95}));marker.name=`marker:${id}`;marker.layers.set(1);marker.renderOrder=100;joints[id].add(marker);markers[id]=marker}
 applyPose({object,joints,markers,restBounds},defaultPose())
 return{object,joints,markers,restBounds}
}
export function applyPose(rig:Mannequin,pose:Pose){for(const id of jointIds){rig.joints[id].rotation.set(...pose.joints[id].map(n=>T.MathUtils.degToRad(n)) as [number,number,number],'XYZ')}}

import type {StageSettings,Vec3} from './state.ts'
import {defaultPose,poseIssues,rootOf,poseOf} from './pose-state.ts'
import type {Pose,RootTransform} from './pose-state.ts'
export type PersonSource={kind:'builtin';id:'person';version:1;sha256:string}
export type PersonMaterial={assetNodeId:string;mediaVersionId:string;sha256:string}
export type StudioPerson={id:string;sceneId:string;name:string;identity:string;root:RootTransform;pose:Pose;source:PersonSource;materialRef:PersonMaterial|null;color:string}
export type StudioPeople={version:1;sceneId:string;persons:StudioPerson[]}
export const builtinPersonSource:PersonSource=Object.freeze({kind:'builtin',id:'person',version:1,sha256:'c1e8d0a5072adeb3f70dbcdac3ef37e5665ae1856394cab2f1bf855dd4922a81'})
export const spatialContract={id:'studio-spatial/1',units:'scene-units',axes:'right-handed:X-right/Y-up/Z-basis',rootEuler:'YXZ-degrees',jointEuler:'XYZ-degrees',maximumPersons:4,capacity:'owner-max4; historical scenes remain readable without truncation',jsonBytes:2*1024*1024} as const
export function assertPersonCapacity(scene:StageSettings|null){if(scene?.version===3&&(scene.people?.persons.length??0)>spatialContract.maximumPersons)throw Object.assign(Error('每個攝影棚場景最多4人；原始資料保留，請在本地草稿減至4人後再套用。'),{code:'STUDIO_PERSON_LIMIT'})}
const identifier=(v:unknown):v is string=>typeof v==='string'&&/^[-a-zA-Z0-9]{1,90}$/.test(v)
const exact=(v:unknown,allowed:string[])=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).every(k=>allowed.includes(k))
const text=(v:unknown)=>typeof v==='string'&&v.trim().length>0&&v.length<=160
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b)
export function spatialIssues(scene:StageSettings):string[]{
 const cast=scene.people,issues:string[]=[]
 if(scene.version!==3){if(cast!==undefined)issues.push('舊場景不可暗帶多人偶資料；請明確轉換版本。');return issues}
 if(!exact(cast,['version','sceneId','persons'])||cast?.version!==1||!identifier(cast.sceneId)||!Array.isArray(cast.persons))return ['多人偶場景版本或身份無效。']
 if(new TextEncoder().encode(JSON.stringify(cast)).length>spatialContract.jsonBytes)issues.push('場景 JSON 超過既有2MiB邊界，未截斷人物。')
 const ids=new Set<string>()
 for(const p of cast.persons){
  if(!exact(p,['id','sceneId','name','identity','root','pose','source','materialRef','color'])||!identifier(p.id)||p.sceneId!==cast.sceneId||ids.has(p.id)||!text(p.name)||!text(p.identity)||!/^#[0-9a-fA-F]{6}$/.test(p.color||'')){issues.push('人物身份／場景／名稱／顏色無效或 ID 重複。');continue}
  ids.add(p.id)
  if(!exact(p.root,['position','rotation'])||!exact(p.pose,['version','joints'])||poseIssues(p.pose,p.root).length)issues.push('人物世界坐標／朝向／靜態姿勢無效，未自動截斷。')
  if(!exact(p.source,['kind','id','version','sha256'])||!(p.source?.kind===builtinPersonSource.kind&&p.source.id===builtinPersonSource.id&&p.source.version===builtinPersonSource.version&&p.source.sha256===builtinPersonSource.sha256))issues.push('人偶來源版本或摘要不支援，原資料保留。')
  const m=p.materialRef;if(m!==null&&(!exact(m,['assetNodeId','mediaVersionId','sha256'])||!identifier(m.assetNodeId)||!identifier(m.mediaVersionId)||!/^[a-f0-9]{64}$/.test(m.sha256||'')))issues.push('人物素材引用需固定節點、版本及摘要。')
 }
 return issues
}
export function newPerson(sceneId:string,name:string,id:string,position:Vec3=[0,0,0]):StudioPerson{return {id,sceneId,name,identity:name,root:{position:[...position],rotation:[0,0,0]},pose:defaultPose(),source:{...builtinPersonSource},materialRef:null,color:'#cf705c'}}
export function enablePeople(scene:StageSettings,sceneId:string,legacyPersonId?:string):StageSettings{
 if(scene.version===3){if(scene.people?.sceneId!==sceneId)throw Error('STUDIO_SCENE_SCOPE');return structuredClone(scene)}
 if(scene.subject.kind!=='builtin'||scene.subject.id!=='person')throw Error('STUDIO_PEOPLE_REQUIRES_EXPLICIT_PERSON_SCENE')
 const persons=legacyPersonId?[{...newPerson(sceneId,'人物01',legacyPersonId),root:rootOf(scene),pose:poseOf(scene)}]:[]
 return {...structuredClone(scene),version:3,people:{version:1,sceneId,persons}}
}
export function personCanonical(scene:StageSettings){return JSON.stringify((scene.people?.persons??[]).map(p=>structuredClone(p)).sort((a,b)=>a.id.localeCompare(b.id)))}
export type SpatialOperation={type:'cast.initialize'}|{type:'person.create';person:StudioPerson}|{type:'person.update';personId:string;patch:Partial<Pick<StudioPerson,'name'|'identity'|'root'|'pose'|'materialRef'|'color'>>}|{type:'person.duplicate';personId:string;newId:string;name:string}|{type:'person.remove';personId:string}|{type:'cast.order';personIds:string[]}|{type:'camera.set';patch:Partial<StageSettings['camera']>}
export function spatialOperations(scene:StageSettings,sceneId:string,operations:SpatialOperation[]):StageSettings{
 if(!Array.isArray(operations)||operations.length<1||operations.length>16)throw Error('STUDIO_OPERATIONS_SCHEMA')
 let next=structuredClone(scene)
 for(const op of operations){
  if(op.type==='cast.initialize'){if(!exact(op,['type'])||next.version===3)throw Error('STUDIO_INITIALIZE_CONFLICT');next=enablePeople(next,sceneId);continue}
  if(next.version!==3||next.people?.sceneId!==sceneId)throw Error('STUDIO_PEOPLE_REQUIRED')
  const people=next.people.persons,person='personId'in op?people.find(p=>p.id===op.personId):undefined
  if('personId'in op&&!person)throw Error('STUDIO_PERSON_MISSING')
  if(op.type==='person.create'){if(people.length>=spatialContract.maximumPersons)throw Object.assign(Error('每個攝影棚場景最多4人，未新增或部分提交。'),{code:'STUDIO_PERSON_LIMIT'});if(!exact(op,['type','person'])||people.some(p=>p.id===op.person.id))throw Error('STUDIO_PERSON_DUPLICATE');people.push(structuredClone(op.person))}
  else if(op.type==='person.update'){if(!exact(op,['type','personId','patch'])||!exact(op.patch,['name','identity','root','pose','materialRef','color'])||!Object.keys(op.patch).length)throw Error('STUDIO_PERSON_PATCH');Object.assign(person!,structuredClone(op.patch))}
  else if(op.type==='person.duplicate'){if(people.length>=spatialContract.maximumPersons)throw Object.assign(Error('每個攝影棚場景最多4人，未複製或部分提交。'),{code:'STUDIO_PERSON_LIMIT'});if(!exact(op,['type','personId','newId','name'])||!identifier(op.newId)||people.some(p=>p.id===op.newId))throw Error('STUDIO_PERSON_DUPLICATE');people.push({...structuredClone(person!),id:op.newId,name:op.name})}
  else if(op.type==='person.remove'){if(!exact(op,['type','personId']))throw Error('STUDIO_PERSON_PATCH');next.people.persons=people.filter(p=>p.id!==op.personId)}
  else if(op.type==='cast.order'){if(!exact(op,['type','personIds'])||!Array.isArray(op.personIds)||op.personIds.length!==people.length||new Set(op.personIds).size!==people.length||op.personIds.some(id=>!people.some(p=>p.id===id)))throw Error('STUDIO_PERSON_ORDER');next.people.persons=op.personIds.map(id=>people.find(p=>p.id===id)!)}
  else if(op.type==='camera.set'){if(!exact(op,['type','patch'])||!exact(op.patch,['position','rotation','aim','focalLengthMm'])||!Object.keys(op.patch).length)throw Error('STUDIO_CAMERA_PATCH');Object.assign(next.camera,structuredClone(op.patch))}
  else throw Error('STUDIO_OPERATION_UNSUPPORTED')
 }
 assertPersonCapacity(next);const issues=spatialIssues(next);if(issues.length)throw Error('STUDIO_SPATIAL_INVALID: '+issues.join('；'));return next
}
// Revert only fields changed by the original action. Later unrelated edits remain.
export function revertSpatial(current:StageSettings,before:StageSettings,after:StageSettings):StageSettings{
 if(current.version!==3||before?.version!==3||after?.version!==3){if(!same(current,after))throw Error('STUDIO_UNDO_CONFLICT');return structuredClone(before)}
 const out=structuredClone(current);if(current.people!.sceneId!==after.people!.sceneId||before.people!.sceneId!==after.people!.sceneId)throw Error('STUDIO_UNDO_CONFLICT')
 const restore=(target:Record<string,any>,a:Record<string,any>,b:Record<string,any>)=>{for(const key of new Set([...Object.keys(a),...Object.keys(b)])){if(same(a[key],b[key]))continue;if(a[key]&&b[key]&&typeof a[key]==='object'&&typeof b[key]==='object'&&!Array.isArray(a[key])&&!Array.isArray(b[key])){if(!target[key]||typeof target[key]!=='object')throw Error('STUDIO_UNDO_CONFLICT');restore(target[key],a[key],b[key])}else{if(!same(target[key],b[key]))throw Error('STUDIO_UNDO_CONFLICT');if(a[key]===undefined)delete target[key];else target[key]=structuredClone(a[key])}}}
 const a=Object.fromEntries(before.people!.persons.map(p=>[p.id,p])),b=Object.fromEntries(after.people!.persons.map(p=>[p.id,p]))
 for(const id of new Set([...Object.keys(a),...Object.keys(b)])){if(same(a[id],b[id]))continue;const at=out.people!.persons.findIndex(p=>p.id===id)
  if(!a[id]||!b[id]){if(!same(at<0?undefined:out.people!.persons[at],b[id]))throw Error('STUDIO_UNDO_CONFLICT');if(at>=0)out.people!.persons.splice(at,1);if(a[id])out.people!.persons.splice(Math.min(before.people!.persons.findIndex(p=>p.id===id),out.people!.persons.length),0,structuredClone(a[id]))}
  else {if(at<0)throw Error('STUDIO_UNDO_CONFLICT');restore(out.people!.persons[at],a[id],b[id])}
 }
 const ids=(v:StageSettings)=>v.people!.persons.map(p=>p.id)
 if(same(Object.keys(a).sort(),Object.keys(b).sort())&&!same(ids(before),ids(after))){if(!same(ids(current),ids(after)))throw Error('STUDIO_UNDO_CONFLICT');out.people!.persons=ids(before).map(id=>out.people!.persons.find(p=>p.id===id)!)}
 const withoutPeople=(v:StageSettings)=>Object.fromEntries(Object.entries(v).filter(([k])=>k!=='people'));restore(out as any,withoutPeople(before),withoutPeople(after));return out
}

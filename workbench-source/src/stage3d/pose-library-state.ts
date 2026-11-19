import { jointIds, limitRotation } from './pose-state.ts'
import type { Pose } from './pose-state.ts'
export const poseRig = { id:'acs-rigid-mannequin', version:1 } as const
export const libraryLimits = { fileBytes:1024*1024, records:200, nameLength:60, thumbnailBytes:96*1024 } as const
export type PoseThumbnail = {status:'pending'}|{status:'ready';blob:Blob}|{status:'error';message:string}
export type PoseRecord = {id:string;name:string;formatVersion:1;rig:typeof poseRig;pose:Pose;createdAt:string;updatedAt:string;deletedAt:string|null;revision:number;thumbnail:PoseThumbnail}
export type TransferPose = Omit<PoseRecord,'thumbnail'> & {thumbnail:{status:'rebuild'}}
const object=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype
function keys(x:unknown,allowed:string[],label:string):asserts x is Record<string,unknown>{if(!object(x)||Object.keys(x).length!==allowed.length||Object.keys(x).some(k=>!allowed.includes(k)))throw new Error(`${label}字段不完整或包含不允许的数据。`)}
function iso(x:unknown):x is string {if(typeof x!=='string'||!Number.isFinite(Date.parse(x)))return false;return new Date(x).toISOString()===x}
export function poseName(value:string):string {const name=value.trim().normalize('NFC');if(!name||name.length>libraryLimits.nameLength||/[\u0000-\u001f\u007f]/u.test(name))throw new Error('名称需为1–60个字符，不能包含控制字符。');return name}
export const nameKey=(name:string)=>name.normalize('NFKC').toLocaleLowerCase('en-US')
export function verifiedPose(value:unknown):Pose {
 keys(value,['version','joints'],'姿势');if(value.version!==1)throw new Error('不支持的姿势版本。');keys(value.joints,[...jointIds],'关节')
 for(const id of jointIds){const r=value.joints[id];if(!Array.isArray(r)||r.length!==3||!r.every(n=>typeof n==='number'&&Number.isFinite(n))||r.some((n,i)=>n!==limitRotation(id,r as [number,number,number])[i]))throw new Error(`${id} 的角度非有限数值、轴无效或超出活动范围；未修剪姿势。`)}
 return structuredClone(value) as Pose
}
function verifiedRig(value:unknown){keys(value,['id','version'],'Rig');if(value.id!==poseRig.id||value.version!==poseRig.version)throw new Error('Rig不兼容：仅支持内置分段人偶 v1，不支持普通GLB。')}
const recordKeys=['id','name','formatVersion','rig','pose','createdAt','updatedAt','deletedAt','revision','thumbnail']
function core(value:unknown):Omit<PoseRecord,'thumbnail'> {
 keys(value,recordKeys,'姿势记录');if(typeof value.id!=='string'||!/^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/.test(value.id))throw new Error('姿势ID无效。');if(value.formatVersion!==1)throw new Error('不支持的资料格式版本。');verifiedRig(value.rig)
 if(typeof value.name!=='string'||poseName(value.name)!==value.name)throw new Error('姿势名称格式无效。')
 if(!iso(value.createdAt)||!iso(value.updatedAt)||value.updatedAt<value.createdAt||!(value.deletedAt===null||iso(value.deletedAt)&&value.deletedAt>=value.createdAt&&value.deletedAt<=value.updatedAt))throw new Error('建立、更新时间或回收标记无效。')
 if(!Number.isSafeInteger(value.revision)||(value.revision as number)<1||(value.revision as number)>1e9)throw new Error('记录修订版本无效。')
 return {id:value.id,name:value.name,formatVersion:1,rig:{...poseRig},pose:verifiedPose(value.pose),createdAt:value.createdAt,updatedAt:value.updatedAt,deletedAt:value.deletedAt as string|null,revision:value.revision as number}
}
export function verifiedRecord(value:unknown):PoseRecord {
 const c=core(value),t=(value as PoseRecord).thumbnail;if(!object(t))throw new Error('缩图记录无效。')
 if(t.status==='pending'){keys(t,['status'],'缩图');return{...c,thumbnail:{status:'pending'}}}
 if(t.status==='error'){keys(t,['status','message'],'缩图');if(typeof t.message!=='string'||t.message.length>500)throw new Error('缩图错误记录无效。');return{...c,thumbnail:{status:'error',message:t.message}}}
 if(t.status==='ready'){keys(t,['status','blob'],'缩图');if(!(t.blob instanceof Blob)||t.blob.type!=='image/png'||!t.blob.size||t.blob.size>libraryLimits.thumbnailBytes)throw new Error('缩图必须为受限大小的本地PNG。');return{...c,thumbnail:{status:'ready',blob:t.blob}}}
 throw new Error('未知缩图状态。')
}
export function makePoseRecord(name:string,pose:Pose,id=crypto.randomUUID(),now=new Date().toISOString()):PoseRecord {return verifiedRecord({id,name:poseName(name),formatVersion:1,rig:{...poseRig},pose:verifiedPose(pose),createdAt:now,updatedAt:now,deletedAt:null,revision:1,thumbnail:{status:'pending'}})}
export function changedRecord(record:PoseRecord,changes:Partial<Pick<PoseRecord,'name'|'pose'|'thumbnail'|'deletedAt'>>):PoseRecord {const next=new Date(Math.max(Date.now(),Date.parse(record.updatedAt)+1)).toISOString();return verifiedRecord({...structuredClone(record),...changes,updatedAt:next,revision:record.revision+1})}
export function uniqueName(wanted:string,records:Pick<PoseRecord,'name'>[]):string {const base=poseName(wanted),used=new Set(records.map(r=>nameKey(r.name)));let next=base,index=2;while(used.has(nameKey(next))){const suffix=`（${index++}）`;next=base.slice(0,libraryLimits.nameLength-suffix.length)+suffix}return next}
export function validateAdditions(existing:PoseRecord[],newRecords:PoseRecord[]){if(existing.length+newRecords.length>libraryLimits.records)throw new Error('姿势库上限200条（含回收区）；本轮不提供永久清空。');const ids=new Set(existing.map(r=>r.id)),names=new Set(existing.map(r=>nameKey(r.name)));for(const row of newRecords){verifiedRecord(row);if(ids.has(row.id))throw new Error('ID已存在，未覆盖。');if(names.has(nameKey(row.name)))throw new Error('名称已存在（含回收区），请改名；未覆盖。');ids.add(row.id);names.add(nameKey(row.name))}}
export function encodePoses(records:PoseRecord[]):string {if(!records.length)throw new Error('姿势库为空，没有可导出的记录。');const poses=records.map(r=>{const {thumbnail:_,...data}=verifiedRecord(r);return{...data,thumbnail:{status:'rebuild'}}});return JSON.stringify({kind:'ai-creative-studio-pose-library',formatVersion:1,rig:poseRig,exportedAt:new Date().toISOString(),poses},null,2)}
export function decodePoses(text:string,bytes=new TextEncoder().encode(text).length):TransferPose[] {
 if(bytes>libraryLimits.fileBytes)throw new Error('文件超过1MiB，未读取导入。');let value:unknown;try{value=JSON.parse(text)}catch{throw new Error('JSON损坏或含NaN等非法JSON数值。')}
 keys(value,['kind','formatVersion','rig','exportedAt','poses'],'备份');if(value.kind!=='ai-creative-studio-pose-library'||value.formatVersion!==1)throw new Error('不支持的备份格式或版本。');verifiedRig(value.rig);if(!iso(value.exportedAt))throw new Error('备份时间格式无效。');if(!Array.isArray(value.poses)||!value.poses.length||value.poses.length>libraryLimits.records)throw new Error('每个文件需包含1–200条姿势。')
 const ids=new Set<string>();return value.poses.map((row:unknown,index:number)=>{try{const c=core(row);keys((row as TransferPose).thumbnail,['status'],'外部缩图');if((row as TransferPose).thumbnail.status!=='rebuild')throw new Error('不接受外部缩图、HTML、SVG或URL；只可本地重建。');if(ids.has(c.id))throw new Error('文件内ID重复。');ids.add(c.id);return{...c,thumbnail:{status:'rebuild' as const}}}catch(e){throw new Error(`第${index+1}条：${e instanceof Error?e.message:'资料无效'}`)}})
}
export function planPoseImport(incoming:TransferPose[],existing:PoseRecord[]):PoseRecord[]{const occupied=[...existing];return incoming.map(row=>{const record=verifiedRecord({...row,id:crypto.randomUUID(),name:uniqueName(row.name,occupied),revision:1,thumbnail:{status:'pending'}});occupied.push(record);return record})}
export function libraryError(error:unknown):string {const name=error instanceof Error?error.name:'',message=error instanceof Error?error.message:'未知错误';if(name==='QuotaExceededError')return '储存配额不足，未完成本次写入；当前姿势保留，可重试或导出当前姿势JSON。';if(name==='SecurityError'||name==='InvalidStateError')return '浏览器储存不可用，未完成写入；可检查浏览器设置后重试或导出当前姿势JSON。';return message}

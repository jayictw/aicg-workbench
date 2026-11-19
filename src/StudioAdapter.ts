import type { StageSettings } from './stage3d/state'
import {makeStudioSource,studioSha256} from '../shared/studio-provenance.mjs'
export type StudioOwner={libraryId:string;copyId:string;projectId:string;graphId:string}
export type StudioRecord={owner:StudioOwner;studioId:string;sceneRevision:number;scene:StageSettings|null;graphRevision:number;assetRevision?:number;dirty:boolean;peopleStatus?:{personId:string;available:boolean;message?:string}[];personMaterials?:{assetNodeId:string;mediaVersionId:string;sha256:string;name:string;available:boolean}[];receipt?:{requestId:string}}
export type StudioRead={owner:StudioOwner;studioId:string}
export type StudioApply=StudioRead&{requestId:string;expectedSceneRevision:number;scene:StageSettings}
export type StudioPublish=StudioRead&{requestId:string;expectedSceneRevision:number;expectedGraphRevision:number;expectedAssetRevision?:number;pngBytes:Uint8Array;pngSha256:string;sourceJson:string;sourceSha256:string;name:string;usage:'studio'}
export type StudioPublication={assetId:string;versionId:string;nodeId?:string;receiptId?:string;message?:string}
export type StudioAdapter={poseReceipt?:(q:{owner:StudioOwner;requestId:string})=>Promise<any>;listPoses?:(q:{owner:StudioOwner})=>Promise<any>;savePoses?:(q:{owner:StudioOwner;requestId:string;expectedRevision:number;records?:any[];record?:any;expectedRecordRevision?:number})=>Promise<any>;failStudioRender?:(q:{requestId:string;code:string})=>Promise<any>;onChange?:(callback:()=>void)=>(()=>void);readStudio:(q:StudioRead)=>Promise<StudioRecord>;applyStudio:(q:StudioApply)=>Promise<StudioRecord>;undoStudio?:(q:StudioRead&{requestId:string;expectedSceneRevision:number;targetRequestId:string})=>Promise<StudioRecord>;publishStudioPng:(q:StudioPublish)=>Promise<StudioPublication>}
export const sameOwner=(a:StudioOwner,b:StudioOwner)=>['libraryId','copyId','projectId','graphId'].every(k=>a[k as keyof StudioOwner]===b[k as keyof StudioOwner])
export function assertRecord(r:StudioRecord,owner:StudioOwner,studioId:string){if(!r||!sameOwner(r.owner,owner)||r.studioId!==studioId||!Number.isSafeInteger(r.sceneRevision)||r.sceneRevision<0||!Number.isSafeInteger(r.graphRevision)||r.graphRevision<0)throw Error('攝影棚回覆的項目或版本不符，未套用其他項目的資料。');return r}
export async function sha256(bytes:Uint8Array){return studioSha256(bytes)}
export async function studioSource(record:StudioRecord,pngSha256:string,width:number,height:number){
 if(!record.scene||record.sceneRevision<1)throw Error('STUDIO_APPLY_REQUIRED')
 return makeStudioSource(record,pngSha256,width,height)
}

// An applied echo of the exact local draft is safe to adopt; a different incoming scene is not.
export function studioRefreshConflict(local:StageSettings,before:StageSettings|null,incoming:StageSettings|null){return JSON.stringify(local)!==JSON.stringify(before)&&JSON.stringify(local)!==JSON.stringify(incoming)}

// Pure contract: no store, filesystem, API or historical native-stage authority.
export const sameStudioOwner=(a,b)=>!!a&&!!b&&['libraryId','copyId','projectId','graphId'].every(k=>typeof a[k]==='string'&&a[k]===b[k]);
export async function studioSha256(bytes){const digest=await crypto.subtle.digest('SHA-256',new Uint8Array(bytes));return Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');}
export async function makeStudioSource(record,pngSha256,width,height,at=new Date().toISOString()){
 if(!record.scene||!Number.isSafeInteger(record.sceneRevision)||record.sceneRevision<1||!sameStudioOwner(record.owner,record.owner)||!record.studioId||!/^([a-f0-9]{64})$/.test(pngSha256)||![width,height].every(n=>Number.isSafeInteger(n)&&n>0&&n<=2048))throw Error('STUDIO_SOURCE_SCHEMA');
 const sourceJson=JSON.stringify({kind:'local-studio-export',schemaVersion:1,owner:structuredClone(record.owner),studioId:record.studioId,sceneRevision:record.sceneRevision,scene:structuredClone(record.scene),png:{sha256:pngSha256,width,height},at,limitations:['static-pose','single-image-does-not-guarantee-video-direction']});
 return {sourceJson,sourceSha256:await studioSha256(new TextEncoder().encode(sourceJson))};
}
export async function validateStudioSource(q){
 if(typeof q.sourceJson!=='string'||new TextEncoder().encode(q.sourceJson).length>256*1024)throw Error('STUDIO_SOURCE_SIZE');
 if(await studioSha256(new TextEncoder().encode(q.sourceJson))!==q.sourceSha256)throw Error('STUDIO_SOURCE_HASH');
 let s;try{s=JSON.parse(q.sourceJson);}catch{throw Error('STUDIO_SOURCE_JSON');}
 const allowed=['kind','schemaVersion','owner','studioId','sceneRevision','scene','png','at','limitations'];
 if(!s||Object.keys(s).some(k=>!allowed.includes(k))||s.kind!=='local-studio-export'||s.schemaVersion!==1||!sameStudioOwner(s.owner,q.owner)||s.studioId!==q.studioId||s.sceneRevision!==q.sceneRevision||!Number.isSafeInteger(s.sceneRevision)||s.sceneRevision<1)throw Error('STUDIO_SOURCE_SCOPE');
 if(!s.png||s.png.sha256!==q.pngSha256||s.png.width!==q.width||s.png.height!==q.height||![s.png.width,s.png.height].every(n=>Number.isSafeInteger(n)&&n>0&&n<=2048))throw Error('STUDIO_SOURCE_PNG');
 if(JSON.stringify(s.scene)!==JSON.stringify(q.scene))throw Error('STUDIO_SOURCE_SCENE_CHANGED');
 return structuredClone(s);
}

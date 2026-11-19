import {exact,id,str,fail,mediaRecord,validateGraph} from './core.mjs';
export const FPS=24;
export const emptyEdit=()=>({version:1,clips:[],audio:[],width:640,height:640,fps:FPS});
export const frames=c=>Math.round(c.outMs*FPS/1000)-Math.round(c.inMs*FPS/1000);
export const snapMs=n=>Math.round(Math.round(n*FPS/1000)*1000/FPS);
export const durationMs=e=>e.clips.reduce((n,c)=>n+frames(c)*1000/FPS,0);
export function sourceFor(g,nodeId){
 const n=g.nodes.find(n=>n.id===nodeId);if(!n)fail('EDIT_SOURCE','來源節點已不存在');
 if(n.kind==='compose.video'){const v=n.payload.versions.find(v=>v.id===n.payload.currentVersionId);if(!v)fail('EDIT_SOURCE','成片尚未完成');return {kind:'asset',assetId:n.payload.assetId,mediaVersionId:v.mediaVersionId};}
 if(n.kind.startsWith('asset.'))return {kind:'asset',assetId:n.payload.assetId,mediaVersionId:n.payload.mediaVersionId};
 const r=g.results[n.payload.selectedResultId??n.payload.previewResultId??n.payload.resultId];
 if(!r||!r.viewedAt)fail('EDIT_SOURCE','請先查看這個明確影片版本');
 return {kind:'result',resultId:r.id,mediaVersionId:r.mediaVersionId};
}
export function validateEdit(g,e,{history=false}={}){
 if(e===undefined)return;exact(e,['version','clips','audio','width','height','fps']);
 if(e.version!==1||!Number.isInteger(e.width)||!Number.isInteger(e.height)||e.width<300||e.height<300||e.width>1200||e.height>1200||e.width%2!==0||e.height%2!==0||e.width*e.height>480000||e.fps!==FPS||!Array.isArray(e.clips)||!Array.isArray(e.audio)||e.clips.length>30||e.audio.length>8)fail('EDIT_SCHEMA','合併需同尺寸24fps影片；本地480p保護：每邊300–1200、偶數且最多480000像素；最多30片段、8音軌');
 const seen=new Set();for(const [kind,items]of [['video',e.clips],['audio',e.audio]])for(const c of items){
  exact(c,['id','nodeId','mediaRef','label','inMs','outMs','volume','muted',...(kind==='audio'?['atMs']:[])]);id(c.id);id(c.nodeId);str(c.label,160);
  if(seen.has(c.id))fail('EDIT_ID','片段身份重複');seen.add(c.id);const m=mediaRecord(g,c.mediaRef);
  if(m.type!==kind)fail('EDIT_TYPE','片段媒體類型不符');
  if(kind==='video'&&(e.width!==640||e.height!==640)&&(m.width!==e.width||m.height!==e.height||Math.abs(m.fps-24)>.01))fail('EDIT_DIMENSIONS','新成片需所有影片同尺寸及24fps，不能暗中裁切或縮放');
  if(!history){const n=g.nodes.find(n=>n.id===c.nodeId);if(!n)fail('EDIT_SOURCE','片段來源節點已不存在');if(c.mediaRef.kind==='asset'?n.payload.assetId!==c.mediaRef.assetId:g.results[c.mediaRef.resultId]?.producerNodeId!==n.id&&n.payload.resultId!==c.mediaRef.resultId)fail('EDIT_SOURCE','片段引用不屬於來源節點');}
  if(!Number.isInteger(c.inMs)||!Number.isInteger(c.outMs)||c.inMs<0||c.outMs>m.durationMs||c.outMs<=c.inMs||snapMs(c.inMs)!==c.inMs||snapMs(c.outMs)!==c.outMs||frames(c)<1)fail('EDIT_TRIM','裁切對齊24fps最近影格，須在原片範圍內且至少保留一格');
  if(typeof c.muted!=='boolean'||!Number.isFinite(c.volume)||c.volume<0||c.volume>2)fail('EDIT_VOLUME','音量須為 0–200%，靜音須為布林值');
  if(kind==='audio'&&(!Number.isInteger(c.atMs)||c.atMs<0||c.atMs>120000))fail('EDIT_OFFSET','音軌開始須為 0–120 秒');
 }
 if(durationMs(e)>120000)fail('EDIT_DURATION','C5 成片限120秒');
}
export function editMutation(input,o,{uid}){
 const g=structuredClone(input);g.sequence.edit??=emptyEdit();const e=g.sequence.edit;let created=[];
 switch(o.type){
 case 'edit.add':{exact(o,['type','nodeId']);const mediaRef=sourceFor(g,o.nodeId),m=mediaRecord(g,mediaRef);if(!['video','audio'].includes(m.type))fail('EDIT_TYPE','只可加入影片或聲音');const c={id:uid('clip'),nodeId:o.nodeId,mediaRef,label:g.nodes.find(n=>n.id===o.nodeId).label,inMs:0,outMs:Math.round(Math.floor(m.durationMs*FPS/1000+.001)*1000/FPS),volume:1,muted:false,...(m.type==='audio'?{atMs:0}:{})};(m.type==='audio'?e.audio:e.clips).push(c);created=[c.id];break;}
 case 'edit.update':{exact(o,['type','clipId','patch']);exact(o.patch,['label','inMs','outMs','volume','muted','atMs']);const c=[...e.clips,...e.audio].find(c=>c.id===o.clipId);if(!c)fail('EDIT_MISSING','片段已不存在');const patch=structuredClone(o.patch),m=mediaRecord(g,c.mediaRef);for(const k of ['inMs','outMs'])if(k in patch){if(!Number.isInteger(patch[k])||patch[k]<0||patch[k]>m.durationMs)fail('EDIT_TRIM','裁切須在原片範圍內');patch[k]=snapMs(patch[k]);}Object.assign(c,patch);break;}
 case 'edit.order':{exact(o,['type','clipIds']);if(!Array.isArray(o.clipIds)||o.clipIds.length!==e.clips.length||new Set(o.clipIds).size!==e.clips.length||o.clipIds.some(id=>!e.clips.some(c=>c.id===id)))fail('EDIT_ORDER','排序須恰好包含全部原片段身份');const old=e.clips;e.clips=o.clipIds.map(id=>old.find(c=>c.id===id));break;}
 case 'edit.remove':{exact(o,['type','clipId']);if(![...e.clips,...e.audio].some(c=>c.id===o.clipId))fail('EDIT_MISSING','片段已不存在');e.clips=e.clips.filter(c=>c.id!==o.clipId);e.audio=e.audio.filter(c=>c.id!==o.clipId);break;}
 default:fail('OPERATION','不支援的編排命令');
 }
 e.version=1;g.sequence.revision++;g.revision++;validateGraph(g);return {graph:g,created};
}

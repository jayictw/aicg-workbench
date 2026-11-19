import {isGroupMaterial} from './group-actions.mjs';
export const NATIVE_CONTEXT_SELECTOR='input,textarea,select,[contenteditable]:not([contenteditable="false"]),video:not([data-canvas-preview="true"]),audio';
export function quickTarget(graph,kind,id,selection=[]){
 const ids=kind==='node'&&selection.includes(id)&&selection.length>1?[...selection]:[id];
 return {kind,id,nodeIds:kind==='node'?ids:[],graphId:graph.graphId,revision:graph.revision};
}
export function quickActions(graph,target){
 if(target.kind==='edge'){
  const edge=graph.edges.find(e=>e.id===target.id);if(!edge)return [];
  return edge.relation==='composition'?[{id:'inspect',label:'查看用途與固定版本'},{id:'composition',label:'編輯成片編排'}]:[{id:'inspect',label:'查看用途與固定版本'},{id:'disconnect',label:'移除這條連線（可撤銷）',danger:true}];
 }
 const n=graph.nodes.find(n=>n.id===target.id);if(!n)return [];
 if(target.nodeIds?.length>1){
  const nodes=target.nodeIds.map(id=>graph.nodes.find(n=>n.id===id));if(nodes.some(n=>!n))return [];
  const count=nodes.length,actions=[];if(nodes.every(isGroupMaterial))actions.push({id:'connectTo',label:'連接到任務框（追加）'},{id:'disconnectTo',label:'解除與任務的引用（選擇任務）'});
  if(nodes.every(n=>n.kind!=='compose.video'))actions.push({id:'clone',label:`複製 ${count} 個框`,hint:'新身份；複製集合內連線，不複製框外輸入'});
  const active=nodes.some(n=>['running','submissionUnknown'].includes(graph.runs?.[n.payload?.latestRunId]?.state));
  actions.push({id:'remove',label:`移除 ${count} 個框（可撤銷）`,danger:true,disabled:active,hint:active?'先處理執行中或未知任務，再移除整組':'原檔保留；整組一起撤銷'});return actions;
 }
 if(n.kind.startsWith('generate.'))return [{id:'prompt',label:'編輯提示詞'},{id:'inputs',label:n.kind==='generate.video'?'查看首尾幀素材':'查看參考素材與用途'},{id:'clone',label:'複製任務框',hint:'新身份；不複製框外輸入連線'},{id:'remove',label:'移除這個任務（可撤銷）',danger:true}];
 if(n.kind.startsWith('asset.'))return [{id:'connectTo',label:'連接到任務框（追加）'},{id:'disconnectTo',label:'解除與任務的引用（選擇任務）'},{id:'remove',label:'刪除所選素材（先查看影響）',danger:true},{id:'replace',label:'更換畫布內素材'},{id:'rename',label:'重新命名'},{id:'uses',label:'查看用途與來源'}];
 if(n.kind==='compose.video')return [{id:'composition',label:'排序、裁切與音量'}];
 if(['text','prompt'].includes(n.kind))return [{id:'text',label:'編輯文字'},{id:'rename',label:'重新命名'},{id:'clone',label:'複製文字框'},{id:'remove',label:'移除這個文字框（可撤銷）',danger:true}];
 return [{id:'inspect',label:'查看節點屬性'},{id:'rename',label:'重新命名'}];
}
export function resolveQuickTarget(graph,target,action,{inspector=false}={}){
 if(!graph||target.graphId!==graph.graphId||target.revision!==graph.revision)throw Object.assign(new Error('畫布已變更，請重新開啟此對象的快速操作'),{code:'QUICK_MENU_STALE'});
 const item=(target.kind==='edge'?graph.edges:graph.nodes).find(x=>x.id===target.id);
 const ids=target.nodeIds??[target.id];
 if(target.kind==='node'&&(!ids.length||new Set(ids).size!==ids.length||!ids.includes(target.id)||ids.some(id=>!graph.nodes.some(n=>n.id===id))))throw Object.assign(new Error('右鍵集合已變更，請重新開啟選單'),{code:'QUICK_ACTION_UNAVAILABLE'});
 const visibleNodeEdit=inspector&&target.kind==='node'&&ids.length===1&&(action==='remove'||action==='clone'&&item?.kind!=='compose.video');
 if(!item||!visibleNodeEdit&&!quickActions(graph,target).some(a=>a.id===action&&!a.disabled))throw Object.assign(new Error('此對象已不存在或不支援這個操作'),{code:'QUICK_ACTION_UNAVAILABLE'});
 return item;
}

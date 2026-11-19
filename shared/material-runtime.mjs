import {exact,str,fail,newNode,assignCodes,validateGraph} from './core.mjs';
import {PURPOSES} from './image-plan.mjs';
export function materialMutation(input,o,{uid,hash}){
 exact(o,['type','items']);if(o.type!=='material.create'||!Array.isArray(o.items)||!o.items.length||o.items.length>5)fail('MATERIAL_LIMIT','一次可提議1至5張圖片素材');
 const g=structuredClone(input),created=[],keys=new Set();
 o.items.forEach((item,i)=>{exact(item,['key','label','purpose','prompt']);if(typeof item.key!=='string'||!/^[-a-zA-Z0-9]{1,40}$/.test(item.key)||keys.has(item.key))fail('MATERIAL_KEY','素材草稿代號重複或無效');keys.add(item.key);str(item.label,160);str(item.prompt,8000);if(!item.prompt.trim()||!Object.hasOwn(PURPOSES,item.purpose))fail('MATERIAL_PURPOSE','每張素材需要清楚用途與需求');const n=newNode('generate.image',item.label,{x:(i%3)*350,y:Math.floor(i/3)*370},uid),tid=uid('text');n.payload.intentPurpose=item.purpose;n.payload.inlineTextVersionId=tid;g.textVersions[tid]={sourceNodeId:n.id,sourceContentRevision:1,encoding:'utf-8',text:item.prompt,utf8Sha256:hash(item.prompt),byteLength:new TextEncoder().encode(item.prompt).length};g.nodes.push(n);created.push(n.id);});
 g.revision++;assignCodes(g);validateGraph(g);return {graph:g,created};
}

'use strict';
const {error}=require('./media.cjs'),ID=/^[-a-zA-Z0-9]{1,90}$/;
function codeAlias(value){if(typeof value!=='string')return null;const m=value.normalize('NFKC').trim().match(/^(素材|商品|分[鏡镜]|[場场]景|成片|[圖图]片[任][務务]|文字)([0-9]{1,6})$/u);if(!m||Number(m[2])<1)return null;return m[1].replace('鏡','镜').replace('場','场').replace('圖','图').replace('務','务')+':'+Number(m[2]);}
function resolveTarget(nodes,target,scope){
 if(!target||typeof target!=='object'||Array.isArray(target))throw error('CONTEXT_TARGET_SCHEMA','請明確指定名稱或固定目標');const keys=Object.keys(target);let mode,selector;
 if(keys.length===1&&typeof target.selector==='string'&&target.selector.trim()&&target.selector.length<=160){mode='name';selector=target.selector;}
 else if(keys.length===1&&ID.test(target.nodeId??'')){mode='fixed-id';selector=target.nodeId;}
 else if(keys.length===1&&target.binding&&typeof target.binding==='object'&&!Array.isArray(target.binding)){const b=target.binding;if(Object.keys(b).length!==4||!['libraryId','projectId','graphId','nodeId'].every(k=>ID.test(b[k]??'')))throw error('CONTEXT_TARGET_SCHEMA','固定目標綁定不完整');if(['libraryId','projectId','graphId'].some(k=>b[k]!==scope[k]))throw error('CONTEXT_TARGET_SCOPE','固定目標不屬於本次授權項目／畫布');mode='fixed-binding';selector=b.nodeId;}
 else throw error('CONTEXT_TARGET_SCHEMA','名稱、固定ID或綁定須擇一，不接受額外字段');
 const alias=mode==='name'?codeAlias(selector):null,matches=nodes.filter(n=>n.id===selector||mode==='name'&&((n.name??n.label)===selector||n.humanCode===selector||alias!==null&&(codeAlias(n.humanCode)===alias||codeAlias(n.name??n.label)===alias)));
 if(!matches.length)throw error('CONTEXT_TARGET_MISSING','此授權畫布找不到指定目標；可能已移除或改名，不會換成其他框');
 if(matches.length>1)return {ambiguous:true,mode,selector,candidateCount:matches.length,candidates:matches.slice(0,8).map(n=>({nodeId:n.id,humanCode:n.humanCode,name:n.name??n.label,kind:n.kind})),omittedCandidates:Math.max(0,matches.length-8)};
 const n=matches[0];return {mode,node:n,binding:{...scope,nodeId:n.id},selector:mode==='name'?selector:null};
}
module.exports={resolveTarget,codeAlias};

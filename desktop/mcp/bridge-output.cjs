'use strict';
const {isDeepStrictEqual}=require('node:util');
// Remove only a provably identical representation, never additional warnings/media/error content.
function formatResult(value){
 if(!value||value.isError||!Object.hasOwn(value,'structuredContent')||!Array.isArray(value.content)||value.content.length!==1||value.content[0]?.type!=='text'||Object.keys(value.content[0]).sort().join(',')!=='text,type')return value;
 try{if(!isDeepStrictEqual(JSON.parse(value.content[0].text),value.structuredContent))return value;}catch{return value;}
 const result={...value};delete result.content;return result;
}
function formatReady(value){return {...value,tools:value.tools.map(({name,description})=>({name,description})),catalogue:'Use {id,op:"catalogue",name:"exact tool name"} to read one original inputSchema on demand; RPC schemas and permissions are unchanged'};}
const validId=v=>typeof v==='string'&&v.length>=1&&v.length<=90&&/^[-a-zA-Z0-9]+$/.test(v);
function validateReadBack(message){
 if(message.readBack===undefined)return;
 const r=message.readBack;
 if(message.op!=='call'||message.name!=='canvas_context_execute'||!r||typeof r!=='object'||Array.isArray(r)||Object.keys(r).length!==1)throw Error('MCP_READBACK_SCHEMA');
 if(r.created===true)return;
 if(!validId(r.nodeId))throw Error('MCP_READBACK_SCHEMA');
 const targets=(message.arguments?.changes??[]).flatMap(c=>[c.nodeId,c.operation?.nodeId,c.operation?.targetNodeId]).filter(Boolean);
 if(!targets.includes(r.nodeId))throw Error('MCP_READBACK_TARGET');
}
async function callWithReadBack(message,call){
 validateReadBack(message);const original=await call(message.name,message.arguments??{}),response={value:formatResult(original)};
 if(message.readBack===undefined||original.isError)return response;
 const receipt=original.structuredContent;
 if(receipt?.status!=='applied'||receipt.receipt?.status!=='applied')return {...response,readBack:{status:'not-applied',results:[]}};
 const allIds=message.readBack.created===true?(receipt.receipt.createdIds??[]):[message.readBack.nodeId],ids=allIds.slice(0,3),results=[];
 for(const nodeId of ids){try{const read=await call('canvas_context_read',{target:{nodeId},limit:10});results.push({nodeId,result:formatResult(read)});}catch(e){results.push({nodeId,error:e.message});}}
 const failed=results.some(r=>r.error||r.result?.isError),omittedNodeIds=allIds.slice(3);
 return {...response,readBack:{status:failed?'failed':omittedNodeIds.length?'partial':'read',results,omittedNodeIds,policy:'Original applied receipt remains authoritative; a read-back failure never resends, rolls back or relabels the write. Read snapshots are latest and may include concurrent human edits.'}};
}
module.exports={formatResult,formatReady,validateReadBack,callWithReadBack};

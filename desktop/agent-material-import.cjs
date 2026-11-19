'use strict';
const {error}=require('./media.cjs');
const UPLOAD_TOOLS=['upload_begin','upload_chunk','upload_finish','upload_cancel'];
function compileUploads(b,items,offset=0){
 if(!Array.isArray(items)||items.length<1||items.length>require('./mcp/contracts.cjs').MAX_IMPORT_ITEMS||new Set(items.map(i=>i.uploadId)).size!==items.length)throw error('MCP_UPLOAD_LIMIT','一次最多导入32份不同素材');
 return items.map((i,index)=>{b.s.core.exact(i,['uploadId','classification','label']);const u=b.upload(i.uploadId);if(u.status!=='ready'||u.stage?.meta.type!=='image')throw error('MCP_UPLOAD_NOT_READY','圖片未完成受控校驗');return {type:'asset.import',metadata:structuredClone(u.stage.meta),classification:i.classification,label:i.label??'',source:{kind:'agent-image',sourceId:u.id,name:u.name,sha256:u.sha256},position:{x:((b.s.graph.nodes.length+offset+index)%3)*440,y:Math.floor((b.s.graph.nodes.length+offset+index)/3)*520}};});
}
async function consumeUploads(b,ids){
 // Canonical import receipts are owned by the shared command path. This only
 // consumes scoped staging metadata; cleanup failure never authorizes a replay.
 for(const id of ids)await b.uploadConsume(id);
}
async function queryUpload(b,session,name,args){
 require('./mcp/contracts.cjs').validate(name,args);b.assert(session,args,true);
 if(name==='upload_begin'&&!['image/png','image/jpeg','image/webp'].includes(args.mime))throw error('MCP_UPLOAD_FORMAT','此入口只接受圖片素材');
 let value;
 if(name==='upload_begin')value=await b.uploadBegin(args);
 else if(name==='upload_chunk')value=await b.uploadChunk(args);
 else if(name==='upload_finish')value=await b.uploadFinish(args);
 else value=await b.uploadCancel(args);
 b.assert(session,args,true);b.event('tool-result',{tool:name});return require('./mcp/broker.cjs').safe(value);
}
module.exports={UPLOAD_TOOLS,compileUploads,consumeUploads,queryUpload};

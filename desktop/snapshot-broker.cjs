'use strict';
const {Broker}=require('./mcp/broker.cjs'),{validate}=require('./mcp/contracts.cjs'),{error,hash}=require('./media.cjs');
const SNAPSHOT_TOOLS=['session_info','scope_select','canvas_context_read','canvas_context_expand','canvas_context_field','canvas_context_propose','operation_receipt','proposal_get','proposal_wait'];
class SnapshotBroker extends Broker{
 constructor(service,context,options={}){super(service,options);this.context=context;this.lastSnapshot=null;this.snapshotRequests=new Map();}
 invalidate(reason){super.invalidate(reason);this.context?.clear();this.lastSnapshot=null;this.snapshotRequests?.clear();}
 localProposal(p){return {...super.localProposal(p),context:p.context??null};}
 checkProposal(p){if(p?.context)try{this.context.assertFresh(this.context.row(p.session,p.context.snapshotId));}catch(e){if(e.code==='SNAPSHOT_STALE')p.status='conflict';throw e;}return super.checkProposal(p);}
 async query(session,name,args){if(!SNAPSHOT_TOOLS.includes(name))throw error('MCP_TOOL_NOT_AVAILABLE','本期只開放快照、限定修改草稿及原回執查詢');validate(name,args);if(!name.startsWith('canvas_context_')&&name!=='operation_receipt')return super.query(session,name,args);const scope=this.assert(session,args,name==='canvas_context_propose');let value;
  if(name==='canvas_context_read'){value=this.context.read(session,scope.authority??scope.expiresAt,{limit:args.limit??4,target:args.target,format:args.format});if(value.snapshotId)this.lastSnapshot={snapshotId:value.snapshotId,projectionDigest:value.projectionDigest,targetNames:value.target.targetNames,targetSource:value.target.source,targetBinding:value.target.binding,actualSelectionNames:value.selection.targetNames,selectionTime:value.selection.selectionTime,contextRevision:value.selection.contextRevision,businessRevision:value.businessRevision,graphRevision:value.graphRevision,dirty:value.dirty,at:value.selection.capturedAt};this.notify();}
  else if(name==='canvas_context_expand')value=this.context.expand(session,args);
  else if(name==='canvas_context_field')value=this.context.field(session,args);
  else if(name==='operation_receipt'){const receipt=await this.s.queryCommand(args.commandId);value={commandId:args.commandId,receipt,graphRevision:this.s.graph.revision};}
  else {const key=session+'|'+args.requestId,digest=hash(this.s.core.canonical({snapshotId:args.snapshotId,summary:args.summary,changes:args.changes})),old=this.snapshotRequests.get(key);if(old){if(old.digest!==digest)throw error('MCP_IDEMPOTENCY_CONFLICT','同一requestId已綁定不同快照或內容');return this.publicProposal(this.proposals.get(old.id));}const row=this.context.validateProposal(session,args.snapshotId,args.changes),created=this.create({requestId:args.requestId,expectedRevision:row.projection.graphRevision,summary:args.summary,changes:args.changes});const p=this.proposals.get(created.proposalId);p.context={snapshotId:row.id,projectionDigest:row.digest,contextRevision:row.projection.selection.contextRevision,targetNames:row.projection.selection.targetNames,selectionTime:row.projection.selection.selectionTime};this.snapshotRequests.set(key,{digest,id:p.id});value=this.publicProposal(p);}
  if(Buffer.byteLength(JSON.stringify({jsonrpc:'2.0',id:'bounded-response',result:{content:[{type:'text',text:JSON.stringify(value)}],structuredContent:value,isError:false}}))>59000)throw error('MCP_RESPONSE_LIMIT','完整協定回覆超限，未發送不完整內容');
  this.event('snapshot-tool-result',{tool:name,snapshotId:value.snapshotId??args.snapshotId??null,businessRevision:value.businessRevision??null});return value;
 }
}
module.exports={SnapshotBroker,SNAPSHOT_TOOLS};

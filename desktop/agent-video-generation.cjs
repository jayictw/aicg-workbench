 'use strict';
// Formal generation is requested through the same native confirmation as the UI.
// A broker scope can prepare that UI; it never grants a generation approval.
const path=require('node:path'),{hash,error}=require('./media.cjs');
const VIDEO_TOOLS=['canvas_video_capabilities','canvas_video_prepare','canvas_video_status'];
const safeCode=e=>/^[A-Z][A-Z0-9_]{1,79}$/.test(e?.code??'')?e.code:'VIDEO_NATIVE_OUTCOME_UNKNOWN';
class AgentVideoGeneration{
 constructor(b){this.b=b;this.pending=new Map();this.inflight=new Set();}
 port(){const p=this.b.s.host.options.videoGeneration;if(!p)throw error('VIDEO_NATIVE_UNAVAILABLE','Formal video generation is unavailable in this host');return p;}
 copy(){return hash(path.resolve(this.b.s.host.root));}
 check(session,args,ids=[],write=false){const b=this.b;b.assert(session,args,write);if(write){b.s.requireWritable();if(b.context.draftStatus?.())throw error('R3_DRAFT_UNAPPLIED','Apply or cancel drafts first');}const row=b.context.row(session,args.snapshotId);b.context.assertFresh(row);b.context.assertRead(row,ids);return row;}
 clear(){for(const p of this.pending.values())this.port().cancel(p.previewId);this.pending.clear();}
 observe(row,patch,p){Object.assign(row,patch);try{this.b.journal.bind(row);}catch{p.observationFailed=true;try{this.b.event('formal-video-receipt-write-failed',{requestId:row.requestId,code:'R3_JOURNAL_DURABILITY'});}catch{}}this.b.onChanged();}
 async receipt(row){const b=this.b,s=b.s;if(row.projectId!==s.graph.projectId||row.graphId!==s.graph.graphId||row.libraryId!==s.host.repo.identity.libraryId||row.copyId!==this.copy())throw error('MCP_SCOPE_MISMATCH','Original generation belongs to another project or copy');
  const base={requestId:row.requestId,nodeId:row.nodeId,mode:row.mode??null,operationId:row.operationId??null,nativeConfirmationRequired:true,noAutomaticReplay:true};
  const p=this.pending.get(row.requestId);if(p?.observationFailed)return {...base,status:'outcome-unknown',reasonCode:'R3_JOURNAL_DURABILITY'};
  if(row.operationId)return {...base,...await this.port().status(row.operationId,row.nodeId)};
  if(row.nativeStatus==='rejected-before-confirmation')return {...base,status:row.nativeStatus,reasonCode:row.reasonCode};
  if(row.nativeStatus==='cancelled-before-submit')return {...base,status:row.nativeStatus};
  if(row.nativeStatus==='confirmation-failed')return {...base,status:'outcome-unknown',reasonCode:row.reasonCode};
  if(!p)return {...base,status:this.inflight.has(row.requestId)&&row.nativeStatus==='preparing'?'preparing':'outcome-unknown'};
  if(Date.now()>=p.expiresAt)return {...base,status:'expired-before-submit'};
  return {...base,status:row.nativeStatus??'preparing',...(p.summary?{summary:p.summary}:{})};
 }
 async query(session,name,args){const b=this.b,s=b.s;if(name==='canvas_video_status'){const row=b.journal.rows.get(args.requestId);if(!row)return {requestId:args.requestId,status:'not-found',noAutomaticReplay:true};if(row.kind!=='formal-video')throw error('MCP_SCOPE_MISMATCH','Original request is not a formal video operation');if(row.type==='rejected')return b.requestReceipt(args.requestId);return this.receipt(row);}
  if(name==='canvas_video_capabilities'){this.check(session,args,[args.nodeId]);const out=await this.port().capabilities(args);this.check(session,args,[args.nodeId]);return out;}
  const digest=hash(s.core.canonical({name,args})),old=b.journal.rows.get(args.requestId);if(old){if(old.kind!=='formal-video'||old.digest!==digest)throw error('MCP_IDEMPOTENCY_CONFLICT','Request already binds a different intent');return old.type==='rejected'?b.requestReceipt(args.requestId):this.receipt(old);}
  if(this.inflight.has(args.requestId))throw error('MCP_REQUEST_PENDING','Original request is already being prepared');
  this.inflight.add(args.requestId);let row,p;
  try{const snapshot=this.check(session,args,[args.nodeId],true),selection=s.graph.nodes.find(n=>n.id===args.nodeId)?.payload.videoInputSelection;
   const refs=selection?.selections??(await import('../shared/video-selection.mjs')).videoSelectionFromGraph(s.graph,args.nodeId).selections;
   this.check(session,args,[args.nodeId,...refs.map(r=>r.assetNodeId)],true);
   row={requestId:args.requestId,commandId:b.commandId(args.requestId),digest,kind:'formal-video',projectId:s.graph.projectId,graphId:s.graph.graphId,libraryId:s.host.repo.identity.libraryId,copyId:this.copy(),nodeId:args.nodeId,summary:'Formal video native confirmation',nativeStatus:'preparing'};
   b.journal.bind(row);const preview=await this.port().prepare({...args,expectedRevision:snapshot.projection.graphRevision});p={session,epoch:b.epoch,previewId:preview.previewId,expiresAt:preview.expiresAt,summary:preview.summary,observationFailed:false};this.check(session,args,[args.nodeId,...refs.map(r=>r.assetNodeId)],true);
   this.pending.set(row.requestId,p);Object.assign(row,{previewId:preview.previewId,mode:preview.summary.mode,nativeStatus:'awaiting-native-confirmation'});b.journal.bind(row);
   const observer={assert:()=>{if(this.pending.get(row.requestId)!==p||p.session!==session||p.epoch!==b.epoch||Date.now()>=p.expiresAt)throw error('PAID_PREVIEW_EXPIRED','Native request no longer belongs to this session');this.check(session,args,[args.nodeId,...refs.map(r=>r.assetNodeId)],true);},submitted:v=>{if(typeof v?.operationId!=='string'||!/^generation-[a-f0-9-]{36}$/.test(v.operationId)){this.observe(row,{nativeStatus:'confirmation-failed',reasonCode:'VIDEO_NATIVE_OUTCOME_UNKNOWN'},p);return;}this.observe(row,{nativeStatus:'submitted',operationId:v.operationId},p);},failed:e=>this.observe(row,{nativeStatus:'confirmation-failed',reasonCode:safeCode(e)},p),openFailed:e=>this.observe(row,{nativeStatus:'rejected-before-confirmation',reasonCode:safeCode(e)},p),closed:()=>{if(row.nativeStatus==='awaiting-native-confirmation')this.observe(row,{nativeStatus:'cancelled-before-submit'},p);if(!p.observationFailed)this.pending.delete(row.requestId);}};
   await this.port().open(preview.previewId,observer);b.onChanged();return this.receipt(row);
  }catch(e){if(p)this.port().cancel(p.previewId);if(row&&b.journal.rows.has(row.requestId)&&!row.operationId&&['preparing','awaiting-native-confirmation'].includes(row.nativeStatus))b.journal.reject(row,error(safeCode(e),'Formal video request was not prepared; inspect original receipt'));throw e;}finally{this.inflight.delete(args.requestId);}
 }
}
module.exports={AgentVideoGeneration,VIDEO_TOOLS};

'use strict';
const fs=require('node:fs'),fsp=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const {validate,MAX_RESPONSE}=require('./contracts.cjs'),{hash,inspect,FORMATS,error}=require('../media.cjs'),{uid}=require('../service.cjs');
const authority=require('./authority-policy.cjs');
const proposalUid=seed=>{let i=0;return prefix=>prefix+'-'+hash(seed+':'+(++i)).slice(0,32);};
const responseBytes=data=>Buffer.byteLength(JSON.stringify({jsonrpc:'2.0',id:'bounded-response',result:{content:[{type:'text',text:JSON.stringify(data)}],structuredContent:data,isError:false}}));
const fail=code=>{throw error(code,code)};
// Redact secrets/absolute paths in business strings; never return transport metadata or repository roots.
function safe(value){value=require('../secret-policy.cjs').sanitize(value);if(typeof value==='string')return value.replace(/(?:[A-Za-z]:[\\/]|\/(?:Users|home|mnt|tmp)\/)[^\s"'<>]*/g,'[REDACTED_PATH]').replace(/\b(?:sk-[A-Za-z0-9_-]{12,}|(?:api[_-]?key|password|secret|access[_-]?token)\s*[:=]\s*\S+)/gi,'[REDACTED_SECRET]');if(Array.isArray(value))return value.map(safe);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,safe(v)]));return value;}
class Broker{
 constructor(service,{clock=Date.now,notify=()=>{},engineering=false}={}){this.s=service;this.clock=clock;this.notify=notify;this.engineering=engineering;this.epoch=0;this.scope=null;this.session=null;this.proposals=new Map();this.requests=new Map();this.uploads=new Map();this.events=[];this.imageBatches=new (require('../dialogue-batch.cjs').DialogueBatch)(this);}
 event(type,extra={}){extra=require('../secret-policy.cjs').sanitize(extra);const row={at:this.clock(),type,...extra};this.events.push(row);this.events=this.events.slice(-100);fs.appendFileSync(path.join(this.s.repo.root,'c3-security.jsonl'),JSON.stringify(row)+'\n');this.notify();}
 connect(session,expiresAt,policy=null){this.authority=authority.normalize(policy??{expiresAt});this.invalidate('new-connection');this.session=session;this.invitationExpires=expiresAt;this.event('connected-ungranted');}
 invalidate(reason='revoked'){this.imageBatches?.invalidate();this.epoch++;this.scope=null;for(const p of this.proposals.values())if(p.status==='pending')p.status='invalidated';for(const u of this.uploads.values()){if(u.status!=='consumed'||u.cleanupPending){const ownership=this.uploadOwnership(u);if(u.status!=='consumed')u.status='cancelled';u.cleanupWork=(u.cleanupWork??Promise.resolve()).catch(()=>{}).then(()=>this.uploadClean(u,ownership.stageToken,ownership)).catch(()=>{u.cleanupPending=true;});}}this.event('scope-invalidated',{reason});}
 disconnect(){try{this.invalidate('disconnected')}finally{this.session=null;}}
 grant({proposalPermission=false,workbenchPermission=false,workspacePermission=false},origin='native'){if(!this.session||authority.expired(this.authority,this.clock()))fail('MCP_NOT_CONNECTED');this.invalidate('regrant');this.delegationOrigin=origin;this.scope={handle:uid('scope'),projectId:this.s.graph.projectId,graphId:this.s.graph.graphId,epoch:this.epoch,session:this.session,expiresAt:this.invitationExpires,authority:this.authority,proposalPermission,workbenchPermission,workspacePermission};this.event(origin==='verified-codex-open'?'automatic-channel-delegation':'native-grant',{identity:origin==='verified-codex-open'?'verified-initiating-exec-channel':this.engineering?'engineering-test':'native-session-unverified',proposalPermission});return this.status();}
 assert(session,args,draft=false){require('../secret-policy.cjs').assertSafe(args);const s=this.scope;if(s&&authority.expired(s.authority??{expiresAt:s.expiresAt},this.clock()))this.invalidate('expired');if(!this.scope||session!==s.session||session!==this.session||s.epoch!==this.epoch||args.scope!==s.handle)fail('MCP_SCOPE_EXPIRED');if(args.projectId!==s.projectId||args.graphId!==s.graphId||this.s.graph.projectId!==s.projectId||this.s.graph.graphId!==s.graphId)fail('MCP_SCOPE_MISMATCH');if(draft&&!s.proposalPermission)fail('MCP_PROPOSAL_FORBIDDEN');return s;}
 status(){if(this.scope&&authority.expired(this.scope.authority??{expiresAt:this.scope.expiresAt},this.clock()))this.invalidate('expired');return {graphRevision:this.s.graph.revision,connected:!!this.session,authorized:!!this.scope,proposalPermission:!!this.scope?.proposalPermission,expiresAt:this.scope?.expiresAt??this.invitationExpires??null,identity:this.engineering?'engineering-test':'native-session-unverified',delegationOrigin:this.scope?this.delegationOrigin:null,scope:this.scope?{projectId:this.scope.projectId,graphId:this.scope.graphId}:null,videoBatches:this.s.videoBatches?.list()??[],imageBatches:this.imageBatches.list(),proposals:[...this.proposals.values()].slice(-30).map(p=>this.localProposal(p)),events:this.events.slice(-12)};}
 localProposal(p){return {presentation:require('../proposal-presentation.cjs').nativePresentation(this,p),proposalId:p.id,previewDigest:require('../preview-confirm.cjs').previewDigest(this,p),requestId:p.requestId,status:p.status,summary:p.summary,expectedRevision:p.expectedRevision,expiresAt:p.expiresAt,diff:p.diff,impact:p.impact,receipt:p.receipt??null};}
 publicProposal(p){const {presentation,...data}=this.localProposal(p);return safe(data);}
 node(id){const n=this.s.graph.nodes.find(n=>n.id===id);if(!n)fail('MCP_NODE_NOT_FOUND');return n;}
 brief(n){return {nodeId:n.id,humanCode:n.humanCode,label:n.label,kind:n.kind,contentRevision:n.contentRevision,ports:n.ports};}
 async query(session,name,args){validate(name,args);if(this.s.offlineC5&&/batch_|upload_|attachment_/.test(name))fail('MCP_C5_OFFLINE_ONLY');let data;
  if(name==='session_info'){if(session!==this.session)fail('MCP_SCOPE_EXPIRED');const status=this.status();data={connected:status.connected,authorized:status.authorized,proposalPermission:status.proposalPermission,authorityPolicy:this.authority?.authorityPolicy,expiresAt:status.expiresAt,scope:this.scope?{...status.scope,handle:this.scope.handle}:null,applyAvailable:false,saveAvailable:false,runAvailable:false,batchExecutionAvailable:!this.s.offlineC5,batchExecutionPermission:'separate-explicit-batch-only',liveAvailable:this.imageBatches.live.configured};}
  else if(name==='attachment_read'){if(session!==this.session||!this.attachmentReader)fail('MCP_ATTACHMENT_UNAVAILABLE');data=await this.attachmentReader(session,args);}
  else if(name==='scope_select'){if(!this.scope)fail('MCP_SCOPE_EXPIRED');this.assert(session,{...args,scope:this.scope.handle});data={scope:this.scope.handle,projectId:this.scope.projectId,graphId:this.scope.graphId,observedRevision:this.s.graph.revision};}
  else{this.assert(session,args,name.startsWith('upload_')||name==='proposal_create'||name==='image_batch_preview'||name==='video_batch_preview');const g=this.s.graph;
   switch(name){
    case 'proposal_wait':{const p=[...this.proposals.values()].find(p=>p.requestId===args.requestId&&p.session===session);if(!p)fail('MCP_PROPOSAL_NOT_FOUND');this.event('proposal-waiting',{proposalId:p.id});while(p.status==='pending'&&this.scope&&!authority.expired(p.authority??{expiresAt:p.expiresAt},this.clock()))await new Promise(resolve=>setTimeout(resolve,250));data={requestId:p.requestId,proposalId:p.id,status:p.status==='pending'?'expired':p.status};break;}
    case 'video_batch_preview':if(!this.s.videoBatches)fail('MCP_VIDEO_UNAVAILABLE');data=this.s.videoBatches.preview(args);break;
    case 'video_batch_execute':if(!this.s.videoBatches)fail('MCP_VIDEO_UNAVAILABLE');data=this.s.videoBatches.execute(args.batchId);break;
    case 'video_batch_status':if(!this.s.videoBatches)fail('MCP_VIDEO_UNAVAILABLE');data=this.s.videoBatches.summary(args.batchId);break;
    case 'composition_read':data={observedRevision:g.revision,nodes:g.nodes.filter(n=>n.kind==='compose.video').map(n=>({node:this.brief(n),edit:n.payload.edit,versions:n.payload.versions.map(v=>({id:v.id,mediaVersionId:v.mediaVersionId,snapshotHash:v.snapshotHash})),state:this.s.compositionInputState?this.s.compositionInputState(n):this.s.composition.compositionState(g,n)})),sources:g.nodes.filter(n=>n.kind==='asset.video'||n.kind==='asset.audio'||n.kind==='generate.video').map(n=>this.brief(n)),untrustedData:true};break;
    case 'sequence_read':data={observedRevision:g.revision,sequence:g.sequence,sources:g.nodes.filter(n=>n.kind.startsWith('asset.')||n.kind==='generate.video').map(n=>this.brief(n)),media:g.mediaVersions,untrustedData:true};break;
    case 'graph_read':{if(args.expectedRevision!==g.revision)fail('MCP_REVISION_CONFLICT');const nodes=g.nodes.slice(args.offset,args.offset+(args.limit??10));data={projectId:g.projectId,graphId:g.graphId,name:g.name,observedRevision:g.revision,total:g.nodes.length,offset:args.offset,nextOffset:args.offset+nodes.length<g.nodes.length?args.offset+nodes.length:null,nodes:nodes.map(n=>this.brief(n)),edges:g.edges.filter(e=>nodes.some(n=>n.id===e.target.nodeId)),coverage:'1-10 nodes per page (limit); edges included by target node; immutable revision'};break;}
    case 'node_resolve':{const found=g.nodes.filter(n=>n.id===args.selector||n.humanCode===args.selector||n.label===args.selector);if(found.length!==1)fail(found.length?'MCP_NODE_AMBIGUOUS':'MCP_NODE_NOT_FOUND');data={observedRevision:g.revision,node:this.brief(found[0])};break;}
    case 'node_get':{const n=this.node(args.nodeId),incoming=g.edges.filter(e=>e.target.nodeId===n.id),outgoing=g.edges.filter(e=>e.source.nodeId===n.id);data={observedRevision:g.revision,node:this.brief(n),payload:n.payload,incoming,outgoing,media:n.payload.mediaVersionId?g.mediaVersions[n.payload.mediaVersionId]:null,effective:n.kind.startsWith('generate.')?this.s.core.effectiveInput(g,n):null,text:['text','prompt'].includes(n.kind)?g.textVersions[n.payload.currentTextVersionId]:null,untrustedData:true};break;}
    case 'changes_read':{const rows=g.audit.filter(a=>a.committedRevision>args.afterRevision);data={observedRevision:g.revision,total:rows.length,coverage:'last 20 matching records',changes:rows.slice(-20).map(a=>({type:a.type,baseRevision:a.baseRevision,committedRevision:a.committedRevision,origin:a.origin,proposalId:a.proposalId,impact:a.impact}))};break;}
    case 'proposal_create':data=this.create(args);break;
    case 'image_batch_preview':data=await this.imageBatches.preview(args);break;
    case 'image_batch_execute':data=this.imageBatches.execute(args);break;
    case 'image_batch_status':data=this.imageBatches.status(args);break;
    case 'proposal_get':{const p=this.requests.get(this.key(args.requestId));data=p?this.publicProposal(p):{status:'not-found',requestId:args.requestId};break;}
    case 'upload_begin':data=await this.uploadBegin(args);break;
    case 'upload_chunk':data=await this.uploadChunk(args);break;
    case 'upload_finish':data=await this.uploadFinish(args);break;
    case 'upload_cancel':data=await this.uploadCancel(args);break;
   }
  }
  this.assertIfScoped(session,args,name);const exactBinary=name==='attachment_read'?data.base64:undefined;data=safe(data);if(exactBinary!==undefined)data.base64=exactBinary;if(responseBytes(data)>MAX_RESPONSE-1000)fail('MCP_RESPONSE_LIMIT');this.event('tool-result',{tool:name});return data;
 }
 assertIfScoped(session,args,name){if(!['session_info','scope_select','attachment_read'].includes(name))this.assert(session,args,name.startsWith('upload_')||name==='proposal_create'||name==='image_batch_preview');}
 key(id){return this.epoch+':'+id;}
 create(a){this.s.host?.refresh();if(this.s.canvasOnly&&a.changes.some(c=>c.type!=='composition_change'))fail('MCP_C5_CANVAS_OPERATION');const digest=hash(this.s.core.canonical(a)),key=this.key(a.requestId),old=this.requests.get(key);if(old){if(old.digest!==digest)fail('MCP_IDEMPOTENCY_CONFLICT');return this.publicProposal(old);}if(a.expectedRevision!==this.s.graph.revision)fail('MCP_REVISION_CONFLICT');if(a.changes.filter(c=>c.type==='material_images').reduce((sum,c)=>sum+c.items.length,0)>5)fail('MCP_MATERIAL_LIMIT');if([...this.proposals.values()].filter(p=>p.status==='pending').length>=100)fail('MCP_PROPOSAL_LIMIT');
  const p={id:uid('proposal'),requestId:a.requestId,summary:a.summary,digest,epoch:this.epoch,session:this.session,expectedRevision:a.expectedRevision,expiresAt:this.scope.expiresAt,authority:this.scope.authority,status:'pending',uploadIds:[],changes:structuredClone(a.changes),workspaceRevision:this.s.host?.data.editRevision};
  const operations=this.compile(p);const preview=this.s.core.mutate(this.s.graph,{type:'transaction.batch',operations},{uid:proposalUid(p.id),hash}).graph;this.s.verifyGraph(preview);
  const patches=this.s.core.diffGraph(this.s.graph,preview);p.diff=patches.filter(x=>x.key!=='nodes'||this.s.core.canonical(x.before?.payload)!==this.s.core.canonical(x.after?.payload)||x.before?.label!==x.after?.label).map(x=>{if(x.key==='edges'){const e=x.after??x.before;return {kind:x.after?'connect/rebind':'remove',source:this.brief(preview.nodes.find(n=>n.id===e.source.nodeId)??this.node(e.source.nodeId)),target:this.brief(preview.nodes.find(n=>n.id===e.target.nodeId)??this.node(e.target.nodeId)),role:e.role,fixedVersion:{...e.binding,sha256:(preview.mediaVersions[e.binding.mediaRef?.mediaVersionId]??preview.textVersions[e.binding.textVersionId])?.sha256??preview.textVersions[e.binding.textVersionId]?.utf8Sha256??null},before:x.before,after:x.after};}if(x.key==='nodes'){const n=x.after??x.before,oldText=this.s.graph.textVersions[x.before?.payload.inlineTextVersionId??x.before?.payload.currentTextVersionId]?.text??'',newText=preview.textVersions[x.after?.payload.inlineTextVersionId??x.after?.payload.currentTextVersionId]?.text??'';return {kind:'node',nodeId:n.id,humanCode:n.humanCode,label:n.label,before:{payload:x.before?.payload,text:oldText,media:this.s.graph.mediaVersions[x.before?.payload.mediaVersionId]??null},after:{payload:x.after?.payload,text:newText,purpose:x.after?.payload?.intentPurpose??null,media:preview.mediaVersions[x.after?.payload.mediaVersionId]??null}};}return x;});
  p.impact=Object.entries(preview.reviews).filter(([id,v])=>v.length>(this.s.graph.reviews[id]?.length??0)).map(([id])=>this.brief(this.node(id)));p.operations=operations;
  p.presentation=require('../proposal-presentation.cjs').buildPresentation(this,p,this.s.graph,preview);if(responseBytes(this.publicProposal(p))>MAX_RESPONSE-1000)fail('MCP_RESPONSE_LIMIT');this.proposals.set(p.id,p);this.requests.set(key,p);this.event('proposal-created',{proposalId:p.id});return this.publicProposal(p);
 }
 compile(p){const ops=[];p.uploadIds=[];for(const c of p.changes){switch(c.type){case 'relation_change':ops.push(structuredClone(c.operation));break;case 'composition_change':ops.push(structuredClone(c.operation));break;case 'edit_change':ops.push(structuredClone(c.operation));break;
  case 'create_video':ops.push({type:'video.create',label:c.label,position:c.position,mode:c.mode??'first',text:c.text??'',inputs:c.inputs??[]});break;
  case 'video_mode':this.node(c.nodeId);ops.push({type:'video.configure',nodeId:c.nodeId,mode:c.mode,...(c.ratio!==undefined?{ratio:c.ratio}:{}),...(c.generate_audio!==undefined?{generate_audio:c.generate_audio}:{})});break;
  case 'video_frames':this.node(c.nodeId);ops.push({type:'video.inputs',nodeId:c.nodeId,inputs:structuredClone(c.inputs)});break;
  case 'material_images':ops.push({type:'material.create',items:structuredClone(c.items)});break;
  case 'prompt':this.node(c.nodeId);ops.push({type:'generation.configure',nodeId:c.nodeId,text:c.text,promptMode:c.promptMode});break;
  case 'text':this.node(c.nodeId);ops.push({type:'node.text',nodeId:c.nodeId,text:c.text});break;
  case 'connect':{const {type,...v}=c;this.node(v.sourceNodeId);this.node(v.targetNodeId);ops.push({type:'edge.connect',...v});break;}
  case 'remove_edge':if(!this.s.graph.edges.some(e=>e.id===c.edgeId))fail('MCP_EDGE_NOT_FOUND');ops.push({type:'node.delete',nodeIds:[],edgeIds:[c.edgeId],confirmed:true});break;
  case 'rebind_edge':ops.push({type:'edge.rebind',edgeId:c.edgeId});break;
  case 'bind_upload':{const u=this.upload(c.uploadId);if(u.status!=='ready')fail('MCP_UPLOAD_NOT_READY');const n=this.node(c.nodeId);p.uploadIds.push(u.id);if(u.stage.meta.type==='text')ops.push({type:'node.text',nodeId:n.id,text:u.stage.meta.text});else ops.push({type:'asset.replace',nodeId:n.id,mediaVersionId:uid('media'),metadata:{...u.stage.meta,name:u.name}});break;}
  default:fail('MCP_SCHEMA');
 }}return ops;}
 checkProposal(p){this.s.host?.refresh();if(p?.workspaceRevision!==undefined&&p.workspaceRevision!==this.s.host?.data.editRevision){p.status='conflict';fail('MCP_WORKSPACE_REVISION_CONFLICT');}if(!p)fail('MCP_PROPOSAL_NOT_FOUND');if(p.status!=='pending')fail('MCP_PROPOSAL_INVALID');this.assert(p.session,{scope:this.scope?.handle,projectId:this.s.graph.projectId,graphId:this.s.graph.graphId},true);if(p.epoch!==this.epoch||authority.expired(p.authority??{expiresAt:p.expiresAt},this.clock()))fail('MCP_PROPOSAL_INVALID');if(p.expectedRevision!==this.s.graph.revision){p.status='conflict';fail('MCP_REVISION_CONFLICT');}for(const id of p.uploadIds)if(this.upload(id).status!=='ready')fail('MCP_UPLOAD_NOT_READY');}
 async apply(id){const p=this.proposals.get(id);if(p?.status==='applied'){this.assert(p.session,{scope:this.scope?.handle,projectId:this.s.graph.projectId,graphId:this.s.graph.graphId},true);if(p.epoch!==this.epoch)fail('MCP_PROPOSAL_INVALID');return {receipt:p.receipt,state:this.s.read(),duplicate:true};}this.checkProposal(p);if(p.applying)fail('MCP_BUSY');p.applying=true;
  try{const stages=[...p.uploadIds.map(id=>this.upload(id).stage),...(p.inboxStages??[])],imports=p.uploadIds.map(id=>{const u=this.upload(id);return {uploadId:id,name:u.name,sha256:u.sha256,size:u.size,source:'codex-attachment-declaration',verifiedPlatformAttachment:false};});
   const r=await this.s.applyProposal({commandVersion:1,commandId:'cmd-'+p.id,projectId:this.s.graph.projectId,graphId:this.s.graph.graphId,expectedRevision:p.expectedRevision,operation:{type:'transaction.batch',operations:p.operations}},stages,{actor:'native-session-unverified',proposer:'verified-mcp-client',confirmer:this.engineering?'engineering-test':'native-session-unverified',origin:'mcp-proposal-native-confirm',proposalId:p.id,imports,makeUid:()=>proposalUid(p.id)},()=>this.checkProposal(p));
   p.status='applied';if(p.sourceIds?.length)await this.s.providedImages.consume(p.sourceIds);p.receipt={commandId:r.commandId,baseRevision:r.baseRevision,committedRevision:r.committedRevision,auditId:r.auditId};for(const id of p.uploadIds)await this.uploadConsume(id);this.event('proposal-applied',{proposalId:p.id,identity:this.engineering?'engineering-test':'native-session-unverified'});return {receipt:p.receipt,state:this.s.read()};
  }finally{p.applying=false;}
 }
 reject(id){const p=this.proposals.get(id);this.checkProposal(p);p.status='rejected';this.event('proposal-rejected',{proposalId:id});return this.status();}
 upload(id){const u=this.uploads.get(id);if(!u||u.epoch!==this.epoch||u.session!==this.session||u.scopeHandle!==this.scope?.handle)fail('MCP_UPLOAD_NOT_FOUND');return u;}
 uploadContext(a){const scope=this.assert(this.session,a,true);return Object.freeze({session:this.session,epoch:this.epoch,scopeHandle:scope.handle,projectId:scope.projectId,graphId:scope.graphId});}
 uploadCheck(context,u){this.assert(context.session,{scope:context.scopeHandle,projectId:context.projectId,graphId:context.graphId},true);if(context.epoch!==this.epoch||context.session!==this.session||u&&(u.epoch!==context.epoch||u.session!==context.session||u.scopeHandle!==context.scopeHandle))fail('MCP_SCOPE_EXPIRED');}
 uploadSerial(u,context,work){const pending=(u.tail??Promise.resolve()).catch(()=>{}).then(()=>{this.uploadCheck(context,u);return work();});u.tail=pending.then(()=>undefined,()=>undefined);return pending;}
 uploadView(u){return {uploadId:u.id,status:u.status,name:u.name,metadata:structuredClone(u.stage.meta),source:'codex-attachment-declaration',verifiedPlatformAttachment:false};}
 uploadOwnership(u,stageToken=u.stage?.token){const stage=stageToken&&u.stage?.token===stageToken?u.stage:null;return {file:u.file,fileIdentity:u.fileIdentity?{...u.fileIdentity}:null,stageToken,stage,stageFile:stage?.temp??null,stageIdentity:stage&&u.stageIdentity?{...u.stageIdentity}:null};}
 async uploadUnlinkOwned(file,identity){if(!identity)return true;try{const st=await fsp.lstat(file);if(!st.isFile()||st.isSymbolicLink()||st.nlink!==1||st.dev!==identity.dev||st.ino!==identity.ino)return false;await fsp.unlink(file);return true;}catch(e){return e.code==='ENOENT';}}
 async uploadClean(u,stageToken=u.stage?.token,ownership=this.uploadOwnership(u,stageToken)){
  // Capture ownership BEFORE awaiting. Revocation must never re-read a later
  // upload's path/identity or cancel a replacement stage with the same token.
  const {file,fileIdentity,stage,stageFile,stageIdentity}=ownership;let pending=false;
  if(stageToken){
   const current=this.s.stages?.get(stageToken);
   if(current&&current!==stage)pending=true;
   else if(stage&&stageIdentity){
    try{const st=await fsp.lstat(stageFile),latest=this.s.stages?.get(stageToken),same=st.isFile()&&!st.isSymbolicLink()&&st.nlink===1&&st.dev===stageIdentity.dev&&st.ino===stageIdentity.ino;
     if(latest&&latest!==stage)pending=true;
     else if(!same||stage.temp!==stageFile){pending=true;if(latest===stage)this.s.stages.delete(stageToken);}
     else{if(latest===stage)await this.s.cancel(stageToken);if(!await this.uploadUnlinkOwned(stageFile,stageIdentity))pending=true;}
    }catch(e){if(e.code==='ENOENT'){if(this.s.stages?.get(stageToken)===stage)this.s.stages.delete(stageToken);}else pending=true;}
   }else if(current)pending=true;
  }
  if(!await this.uploadUnlinkOwned(file,fileIdentity))pending=true;
  u.cleanupPending=pending;return !pending;
 }
 async uploadBegin(a){
  const context=this.uploadContext(a),key=this.key('upload-'+a.requestId),digest=hash(this.s.core.canonical(a)),old=[...this.uploads.values()].find(u=>u.key===key);
  if(old){if(old.digest!==digest)fail('MCP_IDEMPOTENCY_CONFLICT');if(old.begin)try{await old.begin;}catch(e){if(old.status!=='cancelled')throw e;}this.uploadCheck(context,old);return {uploadId:old.id,status:old.status,nextIndex:old.chunks.length};}
  const liveUploads=[...this.uploads.values()].filter(u=>u.epoch===context.epoch&&['creating','receiving','finishing','ready','cancelling'].includes(u.status));
   if(liveUploads.length>=require('./contracts.cjs').MAX_IMPORT_ITEMS||liveUploads.filter(u=>u.status!=='ready').length>=require('../import-limits.cjs').MAX_INFLIGHT_UPLOADS)fail('MCP_UPLOAD_LIMIT');
  const ext=path.extname(a.name).toLowerCase(),fmt=FORMATS[ext];if(!fmt||fmt[1]!==a.mime||!Number.isSafeInteger(a.size)||a.size<1||a.size>fmt[2]*1024*1024)fail('MCP_UPLOAD_FORMAT');
  const id=uid('upload'),u={...a,id,file:path.join(this.s.repo.staging,id+ext),key,digest,epoch:context.epoch,session:context.session,scopeHandle:context.scopeHandle,context,status:'creating',received:0,chunks:[]};
  // Reserve request identity and the capacity slot synchronously, before any I/O.
  this.uploads.set(id,u);
  u.begin=(async()=>{let handle;try{handle=await fsp.open(u.file,'wx');const st=await handle.stat();u.fileIdentity={dev:st.dev,ino:st.ino};this.uploadCheck(context,u);if(u.status!=='creating')fail('MCP_UPLOAD_CANCELLED');await handle.writeFile(Buffer.alloc(0));await handle.sync();await handle.close();handle=null;this.uploadCheck(context,u);if(u.status!=='creating')fail('MCP_UPLOAD_CANCELLED');u.status='receiving';return {uploadId:id,status:'receiving',nextIndex:0};}catch(e){await handle?.close().catch(()=>{});if(!['cancelling','cancelled'].includes(u.status))u.status=/MCP_SCOPE/.test(e.code??'')?'cancelled':'failed';await this.uploadClean(u);fail(/^MCP_[A-Z_]+$/.test(e.code??'')?e.code:'MCP_UPLOAD_IO');}})();
  u.tail=u.begin.then(()=>undefined,()=>undefined);return u.begin;
 }
 async uploadChunk(a){
  const context=this.uploadContext(a),u=this.upload(a.uploadId),bytes=Buffer.from(a.base64,'base64'),digest=hash(bytes);if(bytes.toString('base64')!==a.base64||bytes.length<1||bytes.length>6144||!Number.isSafeInteger(a.index)||a.index<0)fail('MCP_UPLOAD_CHUNK');
  return this.uploadSerial(u,context,async()=>{
   if(['receiving','ready','consumed'].includes(u.status)&&a.index<u.chunks.length){if(u.chunks[a.index]!==digest)fail('MCP_IDEMPOTENCY_CONFLICT');return {uploadId:u.id,nextIndex:u.chunks.length,received:u.received};}
   if(u.status!=='receiving'||a.index!==u.chunks.length||u.received+bytes.length>u.size)fail('MCP_UPLOAD_ORDER');
   let handle;try{handle=await fsp.open(u.file,'r+');const st=await handle.stat();this.uploadCheck(context,u);if(u.status!=='receiving')fail('MCP_UPLOAD_CANCELLED');if(!st.isFile()||st.nlink!==1||st.dev!==u.fileIdentity.dev||st.ino!==u.fileIdentity.ino||st.size!==u.received)fail('MCP_UPLOAD_FILE_CHANGED');const result=await handle.write(bytes,0,bytes.length,u.received);if(result.bytesWritten!==bytes.length)fail('MCP_UPLOAD_IO');await handle.sync();await handle.close();handle=null;this.uploadCheck(context,u);if(u.status!=='receiving')fail('MCP_UPLOAD_CANCELLED');u.received+=bytes.length;u.chunks.push(digest);return {uploadId:u.id,nextIndex:u.chunks.length,received:u.received};}catch(e){await handle?.close().catch(()=>{});if(!['cancelling','cancelled'].includes(u.status))u.status=/MCP_SCOPE/.test(e.code??'')?'cancelled':'failed';await this.uploadClean(u);fail(/^MCP_[A-Z_]+$/.test(e.code??'')?e.code:'MCP_UPLOAD_IO');}
  });
 }
 async uploadFinish(a){
  const context=this.uploadContext(a),u=this.upload(a.uploadId);return this.uploadSerial(u,context,async()=>{
   if(u.status==='ready')return this.uploadView(u);if(u.status!=='receiving'||u.received!==u.size)fail('MCP_UPLOAD_SIZE');u.status='finishing';let staged,ownership;
   try{staged=await this.s.prepare(u.file);const meta=staged.metadata,stage=this.s.stages.get(staged.token);ownership={...this.uploadOwnership(u,staged.token),stage,stageFile:stage?.temp,stageIdentity:null};if(stage&&stage.meta.sha256===meta.sha256){const st=await fsp.lstat(stage.temp);if(st.isFile()&&!st.isSymbolicLink()&&st.nlink===1)ownership.stageIdentity={dev:st.dev,ino:st.ino};}this.uploadCheck(context,u);if(u.status!=='finishing')fail('MCP_UPLOAD_CANCELLED');if(!stage||!ownership.stageIdentity||this.s.stages.get(staged.token)!==stage||meta.sha256!==u.sha256||meta.size!==u.size||meta.mime!==u.mime)fail('MCP_UPLOAD_HASH');u.stage=stage;u.stageIdentity=ownership.stageIdentity;u.stage.token=staged.token;u.stage.name=u.name;u.status='ready';return this.uploadView(u);}catch(e){if(!['cancelling','cancelled'].includes(u.status))u.status=/MCP_SCOPE/.test(e.code??'')?'cancelled':'failed';await this.uploadClean(u,staged?.token,ownership??this.uploadOwnership(u,staged?.token));fail(/^MCP_[A-Z_]+$/.test(e.code??'')?e.code:'MCP_UPLOAD_DECODE');}
  });
 }
 async uploadCancel(a){
  const context=this.uploadContext(a),u=this.upload(a.uploadId);if(u.status==='consumed')fail('MCP_UPLOAD_CONSUMED');if(u.status!=='cancelled')u.status='cancelling';
  return this.uploadSerial(u,context,async()=>{if(u.status==='consumed')fail('MCP_UPLOAD_CONSUMED');u.status='cancelled';await this.uploadClean(u);for(const p of this.proposals.values())if(p.uploadIds.includes(u.id)&&p.status==='pending')p.status='invalidated';return {status:'cancelled',uploadId:u.id,...(u.cleanupPending?{cleanupPending:true}:{})};});
 }
 async uploadConsume(id){
  const context=this.uploadContext({scope:this.scope?.handle,projectId:this.s.graph.projectId,graphId:this.s.graph.graphId}),u=this.upload(id);
  return this.uploadSerial(u,context,async()=>{if(u.status==='consumed'){if(u.cleanupPending)await this.uploadClean(u);return {status:'consumed',uploadId:id,...(u.cleanupPending?{cleanupPending:true}:{})};}if(u.status!=='ready')fail('MCP_UPLOAD_NOT_READY');u.status='consumed';await this.uploadClean(u);return {status:'consumed',uploadId:id,...(u.cleanupPending?{cleanupPending:true}:{})};});
 }

}
module.exports={Broker,safe,proposalUid};

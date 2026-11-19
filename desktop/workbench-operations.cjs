 'use strict';
// Public application operations reuse the same main-process handlers as the UI.
const {error,hash}=require('./media.cjs'),safe=require('./secret-policy.cjs');
const ACTIONS={
 'config.read':{channel:'agent:config-read',write:false,workspace:true,input:'{section?:providers|connections|models|routings|defaults|platforms,offset?,limit?}; safe pages 1-10, no Key'},
 'config.template':{channel:'api-ui:template',write:false,workspace:true,input:'Existing platform template request; see config.read.platforms'},
 'config.save':{channel:'api-ui:save',write:true,workspace:true,input:'{expectedRevision,change?,defaults?,localDrafts?}; existing validated UI configuration, never Key'},
 'credential.status':{channel:'api-ui:credential-status',write:false,workspace:true,input:'{}; status only, no credential value'},
 'credential.open':{channel:'api-ui:credential-open',write:true,workspace:true,input:'{connectionId}; opens native local credential form; Agent cannot enter/read Key'},
 'appearance.language':{channel:'agent:language',write:true,workspace:true,input:'{language:"zh-CN"|"en"}; same persisted setting as UI'},
 'shortcuts.read':{channel:'shortcuts:read',write:false,workspace:true,input:'{}'},
 'shortcuts.change':{channel:'shortcuts:change',write:true,workspace:true,input:'Existing shortcuts change request from shortcuts.read'},
 'workspace.change':{channel:'workspace:change',write:true,workspace:true,input:'Existing workspace command; commandId is assigned from MCP requestId. No direct file write'},
 'media.read':{channel:'agent:media-read',write:false,input:'{mediaVersionId,offset?,length?}; verified original project media bytes in base64 pages of at most 16000 bytes; no arbitrary file path or URL'},
 'media.preview':{channel:'agent:media-preview',write:false,input:'{mediaVersionId}; derived bounded PNG image content, original media unchanged; no network'},
 'pose.list':{channel:'studio:pose-list',write:false,input:'{} or {offset,limit}; records omit thumbnail bytes; library/copy/project inferred'},
 'pose.capture':{channel:'agent:pose-capture',write:true,input:'{studioId,personId,expectedSceneRevision,name}; save the exact current person pose to the library independently of scene save/cancel, without altering root/camera/lights'},
 'pose.save':{channel:'studio:pose-add',write:true,input:'{expectedRevision,records} or {expectedRevision,record,expectedRecordRevision}; same pose record format as UI, owner/requestId inferred'},
 'pose.receipt':{channel:'studio:pose-receipt',write:false,input:'{requestId}; query original pose commandId returned by canvas_request_receipt'},
 'video.source-open':{channel:'byteplus:source-open',write:true,input:'{nodeId,routingId,reference,sourceKind?:tos-upload|asset-download}; opens existing human source-sharing setup. Library/project/graph/revision inferred; user chooses destination/region/cost. No Agent approval or actual URL'},
 'video.source-status':{channel:'byteplus:source-status',write:false,input:'{requestId}; original native source-sharing setup receipt only'},
 'video.connection-status':{channel:'byteplus:status',write:false,input:'{}; no credential values'},
 'video.connection-open':{channel:'byteplus:connect',write:true,input:'{}; user operates existing native connection window'},
 'generation.preview':{channel:'agent:generation-preview',write:true,input:'{nodeId,carriers?}; exact APPLIED image/video model, prompt, parameters and material versions; no network or approval'},
 'generation.submit':{channel:'agent:generation-submit',write:true,input:'{nodeId,previewId}; opens existing native human confirmation; NEVER accepts approved/Key/URL'},
 'generation.history':{channel:'agent:generation-history',write:false,input:'{nodeId,offset?,limit?}; original tasks and safe diagnostics'},
 'generation.recover':{channel:'agent:generation-recover',write:true,input:'{nodeId,operationId}; original task GET/download only, never regenerate'},
 'generation.stop':{channel:'agent:generation-stop',write:true,input:'{nodeId,operationId}; stop local waiting, not a claim of cloud cancellation'},
 'result.reveal':{channel:'agent:result-reveal',write:false,input:'{nodeId,resultId,mediaVersionId}; exact verified local historical result; opens Explorer, no accept or generation'},
 'composition.start':{channel:'composition:start',write:true,input:'Existing composition request (nodeId and current revision); preserves old post-production behavior'},
 'composition.recover':{channel:'composition:recover',write:true,input:'{id}; original local composition only'},
 'composition.export':{channel:'agent:composition-export',write:true,input:'{nodeId,versionId}; existing native save chooser, no path supplied by Agent'},
 'composition.reveal':{channel:'agent:composition-reveal',write:false,input:'{nodeId,versionId}; existing verified file resolver'},
 'merge.cancel':{channel:'canvas:strict-merge-cancel',write:true,input:'{id}; cancel original concat'},
 'merge.reveal':{channel:'canvas:strict-merge-reveal',write:false,input:'{id}; only completed verified output'},
 'backups.list':{channel:'canvas:list-backups',write:false,workspace:true,input:'{}; saved backups in controlled library home'},
 'materials.batch-status':{channel:'canvas:batch-import-status',write:false,input:'{jobId}; current project identity inferred'},
 'materials.batch-cancel':{channel:'canvas:batch-import-cancel',write:true,input:'{jobId}; current project identity inferred; keep successes'},
};
class WorkbenchOperations{
 constructor(broker){this.b=broker;}
 catalog({offset=0,limit=10}={}){const names=Object.keys(ACTIONS),items=names.slice(offset,offset+limit).map(action=>({action,...ACTIONS[action],channel:undefined,available:this.b.s.host.options.applicationOperations?.has?.(action)??!!this.b.s.host.options.applicationOperations,permission:ACTIONS[action].write?'operate':'read',nativeConfirmation:action==='generation.submit'?'required':action==='credential.open'||action==='composition.export'?'native UI':'none'}));return {contract:'aicg-workbench-operations/1',items,nextOffset:offset+items.length<names.length?offset+items.length:null,total:names.length,permissions:{fullWorkbench:!!this.b.scope?.workbenchPermission,wholeLibrary:!!this.b.scope?.workspacePermission},existingTools:['canvas_context_execute','canvas_context_undo','canvas_library_prepare','canvas_library_execute','canvas_studio_execute','canvas_studio_render','canvas_video_prepare','canvas_strict_merge_start','canvas_strict_merge_export'],humanOnly:['authorize or revoke Agent connections','enter/read credentials locally','approve actual paid generation','native file chooser'],transports:{stdio:true,publicRemote:false}};}
 async call(session,args){const b=this.b;b.assert(session,args);const action=ACTIONS[args.action];if(!action)throw error('MCP_ACTION_UNAVAILABLE','Choose an action from canvas_workbench_catalog');if(action.write&&!b.scope?.workbenchPermission)throw error('MCP_WORKBENCH_FORBIDDEN','Choose full workbench permission in local Agent settings');if(action.workspace&&!b.scope.workspacePermission)throw error('MCP_WORKSPACE_PERMISSION_REQUIRED','This operation affects the entire library or application settings');if(action.write){b.assert(session,args,true);b.s.requireWritable();if(b.context.draftStatus?.())throw error('DRAFT_UNCOMMITTED','Apply or cancel drafts first');}
 const row=b.context.row(session,args.snapshotId);b.context.assertFresh(row);const guard=b.captureClientGuard?.(session,'canvas_workbench_call',args)??(()=>b.assert(session,args,action.write));guard();const port=b.s.host.options.applicationOperations;if(!port)throw error('MCP_ACTION_UNAVAILABLE','Application host is not available');
 const digest=hash(b.s.core?.canonical?b.s.core.canonical({action:args.action,input:args.input}):JSON.stringify({action:args.action,input:args.input})),old=b.journal.rows.get(args.requestId);if(old){if(old.kind!=='workbench'||old.digest!==digest)throw error('MCP_IDEMPOTENCY_CONFLICT','Original requestId binds another intent');return this.receipt(old);}
 const binding={requestId:args.requestId,commandId:b.commandId(args.requestId),kind:'workbench',owner:{libraryId:b.s.host.repo.identity.libraryId,projectId:b.s.graph.projectId,graphId:b.s.graph.graphId,copyId:require('./copy-identity.cjs').copyIdForHost(b.s.host)},digest,action:args.action,summary:args.action,status:'outcome-unknown'};if(action.write)b.journal.bind(binding);
 // A lost response keeps its original unknown receipt. No implicit replay or approval.
 let value;try{value=safe.sanitize(await port.invoke(args.action,args.input,{commandId:binding.commandId,guard,expectedRevision:row.projection.graphRevision}));}catch(e){
 // Only errors proven to precede a change are terminal rejections. Unknown dispatch errors stay unknown.
 const beforeChange={'appearance.language':['UI_LOCALE'],'pose.save':['POSE_REQUEST','POSE_VALIDATION','POSE_REVISION_CONFLICT','STUDIO_SCOPE','MCP_CLIENT_REVOKED','MCP_CLIENT_EXPIRED'],'pose.capture':['POSE_REQUEST','POSE_VALIDATION','POSE_REVISION_CONFLICT','STUDIO_PERSON_MISSING','STUDIO_REVISION_CONFLICT'],'config.save':['CONFIG_REVISION_CONFLICT','UI_STORE_INVALID','UI_FIELD_UNSUPPORTED','CONFIG_REFERENCE_MISSING']};
 if(action.write&&(args.action==='generation.preview'||(beforeChange[args.action]??[]).includes(e.code)))b.journal.reject(binding,e);throw e;}

 if(args.action==='generation.preview'){const summary=value.summary??{},prompt=summary.prompt??summary.request?.input?.prompt;value={ok:value.ok!==false,previewId:value.previewId??null,expiresAt:value.expiresAt??null,code:value.code??null,nativeConfirmationRequired:true,summary:{mode:summary.mode??null,operation:summary.operation??null,model:typeof summary.model==='string'?summary.model:null,route:summary.route?Object.fromEntries(['routingId','canonicalModelId','region'].filter(k=>typeof summary.route[k]==='string').map(k=>[k,summary.route[k]])):null,prompt:typeof prompt==='string'?{utf16Units:prompt.length,sha256:hash(prompt),readFrom:'canvas_context_field'}:prompt&&typeof prompt==='object'?{utf16Units:prompt.utf16Units,sha256:prompt.sha256}:null,cost:typeof summary.cost==='string'?summary.cost:'Native summary required'},next:'generation.submit requests native human approval; no submission by this preview'};}
 if(args.action==='config.save')value={configRevision:value.revision,models:value.config?.models?.length??0,connections:value.config?.connections?.length??0,routings:value.config?.routings?.length??0};
 const result={requestId:args.requestId,commandId:binding.commandId,kind:'workbench',owner:binding.owner,action:args.action,status:'completed',value,noAutomaticReplay:true};if(action.write){binding.result=result;binding.status='completed';b.journal.bind(binding);b.onApplied();}return result;
 }
 receipt(row){if(row.type==='rejected')return {requestId:row.requestId,commandId:row.commandId,action:row.action,status:'rejected',error:row.error,noAutomaticReplay:true};return row.result??{requestId:row.requestId,commandId:row.commandId,action:row.action,status:'outcome-unknown',noAutomaticReplay:true};}
}
module.exports={WorkbenchOperations,ACTIONS};

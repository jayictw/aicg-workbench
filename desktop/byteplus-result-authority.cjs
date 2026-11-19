'use strict';
// In-process capability, never a JSON flag. All public events still enter the
// common receive/verifyGraph chain; persisted authority is rederived from facts.
const {hash,error}=require('./media.cjs'),path=require('node:path');
const {canonical}=require('./live-policy.cjs');
const prepared=new WeakMap(),events=new WeakMap();
const fail=()=>{throw error('BP_RESULT_AUTHORITY','结果归属或验证能力不符；原成果保留');};
const stamp=v=>hash(canonical(v));
function journal(s){return s.byteplusController?.journal??new(require('./byteplus-journal.cjs').BytePlusJournal)(s.repo.root,{libraryId:s.host.repo.identity.libraryId,copyId:hash(path.resolve(s.host.root)),projectId:s.graph.projectId,graphId:s.graph.graphId},{reopen:false});}
function attempt(s,g,r,{historical=false}={}){
 const c=r?.snapshot?.capability,j=journal(s),a=c&&j.query(c.operationId);
 if(([3,4].includes(a?.recordVersion)?c?.id!=='byteplus-workbench/generation/'+a.recordVersion||!require('./byteplus-contract-policy.cjs').compatible(a,c.environment):c?.id!=='byteplus-workbench/generation/2'||a?.recordVersion!==2||a.environment!=='engineering-fake'||c.environment!=='engineering-fake')||a?.b7Version!==1||a.snapshotSha256!==stamp(a.taskSnapshot)||a.digest!==a.snapshotSha256||stamp(c.contractSnapshot)!==a.digest||c.operationId!==a.operationId||a.runId!==r.id||a.submissionId!==r.submissionId||a.owner.libraryId!==s.host.repo.identity.libraryId||(a.owner.copyId!==hash(path.resolve(s.host.root))&&!(historical&&j.historicalOwner(a)))||a.owner.projectId!==g.projectId||a.owner.graphId!==g.graphId||a.owner.nodeId!==r.nodeId||a.owner.contentRevision!==r.nodeContentRevision||a.taskSnapshot.route.canonicalModelId!==c.plan.model||c.plan.provider!=='byteplus-modelark'||c.plan.region!=='ap-southeast-1')fail();
 return a;
}
function validSet(set){
 if(set?.version!==1||!Array.isArray(set.members)||set.members.length<1||set.members.length>17||set.digest!==stamp({...set,digest:undefined}))fail();
 const ids=new Set();for(let i=0;i<set.members.length;i++){const m=set.members[i];if(m.index!==i||ids.has(m.resultId)||!m.metadata||m.proof?.fullyDecoded!==true||m.proof.contentSha256!==m.metadata.sha256||m.proof.byteSize!==m.metadata.size)fail();ids.add(m.resultId);}
 return set;
}
function digestSet(v){return stamp({...v,digest:undefined});}
function markPrepared(s,operationId,set){validSet(set);const token=Object.freeze({});prepared.set(token,{s,operationId,set:structuredClone(set)});return token;}
function eventFor(s,operationId,token){
 const p=prepared.get(token);if(!p||p.s!==s||p.operationId!==operationId)fail();
 const j=journal(s),a=j.query(operationId),r=s.graph.runs[a.runId];attempt(s,s.graph,r);
 if(a.submissions!==1||stamp(a.resultSet)!==stamp(p.set))fail();
 const event={projectId:a.owner.projectId,graphId:a.owner.graphId,nodeId:a.owner.nodeId,runId:a.runId,submissionId:a.submissionId,eventId:'event-b7-'+hash(operationId+'|'+p.set.digest).slice(0,40),state:'succeeded',resultSet:structuredClone(p.set),liveSource:{platform:require('./byteplus-contract-policy.cjs').execution(a)==='provider'?'byteplus-modelark':'local-synthetic',model:a.plan.model,generationMode:a.plan.mediaKind==='image'?'image-generation':'video-generation',generatedAt:a.remoteFacts?.remoteCreatedAtMs?new Date(a.remoteFacts.remoteCreatedAtMs).toISOString():a.createdAt,timeBasis:a.remoteFacts?.remoteCreatedAtMs?'provider-created':'local-observed',accountScope:[3,4].includes(a.recordVersion)?a.taskSnapshot.connection.connectionId:'offline-mock',executionEnvironment:require('./byteplus-contract-policy.cjs').execution(a),accountBindingVersion:1,providerRequestId:a.taskId,portraitAuthorization:'unknown',videoAdmission:'not-evaluated'},reason:'B7 complete original result set; no automatic acceptance or project save'};
 events.set(event,{s,digest:stamp(event)});return event;
}
function checkEvent(s,event){
 const p=events.get(event);if(!p||p.s!==s||p.digest!==stamp(event))fail();
 const a=attempt(s,s.graph,s.graph.runs[event.runId]);validSet(event.resultSet);
 if(a.submissions!==1||a.resultSet?.digest!==event.resultSet.digest||stamp(a.resultSet)!==stamp(event.resultSet)||event.state!=='succeeded')fail();
 for(const m of event.resultSet.members)s.checkMediaBytes(m.metadata);
 return event.resultSet;
}
function trustedMedia(s,g,key,m){
 try{const res=g.results[m.resultId],r=g.runs[res?.runId],a=attempt(s,g,r,{historical:true}),set=validSet(a.resultSet),member=set.members.find(x=>x.resultId===m.resultId&&x.mediaVersionId===key);if(!member||m.provenance?.originalBatchId!==set.digest)return false;
 const expected={...member.metadata,resultId:m.resultId,provenance:m.provenance,name:m.name};if(stamp(m)!==stamp(expected))return false;
 const p=member.proof;
 return p.fullyDecoded===true&&p.mimeType==='video/quicktime'&&m.ext==='.mov'&&m.mime==='video/quicktime'&&m.type==='video'&&['h264','hevc'].includes(m.codec)&&(m.codec==='h264'?['yuv420p','yuvj420p','yuv444p','yuvj444p']:['yuv420p','yuv420p10le']).includes(m.pixelFormat)&&[null,'aac','pcm_s16le','pcm_s24le'].includes(m.audioCodec)&&p.codec===m.codec&&p.pixelFormat===m.pixelFormat&&p.audioCodec===m.audioCodec;
 }catch{return false;}
}
function verifyRun(s,g,r){const a=attempt(s,g,r,{historical:true});if(r.resultIds.length){const set=validSet(a.resultSet);if(r.resultIds.length!==set.members.length||r.resultIds.some((id,i)=>id!==set.members[i].resultId))fail();for(const member of set.members){const m=g.mediaVersions[member.mediaVersionId],res=g.results[member.resultId];if(!m||!res||res.runId!==r.id||res.mediaVersionId!==member.mediaVersionId||m.provenance?.originalBatchId!==set.digest||m.sha256!==member.metadata.sha256||m.size!==member.metadata.size)fail();const {resultId,provenance,name,...meta}=m;if(stamp(meta)!==stamp(member.metadata))fail();}}return a;}
module.exports={attempt,verifyRun,trustedMedia,markPrepared,eventFor,checkEvent,validSet,digestSet};

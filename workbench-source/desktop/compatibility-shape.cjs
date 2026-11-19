'use strict';
// Fixed ACS DTO1/2/3/4 field catalogue. No normalization, defaults, migration, I/O or extension loading.
const fail=c=>{throw Error(c)};
const obj=v=>!!v&&typeof v==='object'&&!Array.isArray(v)&&(Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null);
function keys(v,required,optional=[]){if(!obj(v))fail('C_STRUCTURE_INVALID');if(Object.keys(v).some(k=>![...required,...optional].includes(k)))fail('C_UNKNOWN_FIELD');if(required.some(k=>!Object.hasOwn(v,k)))fail('C_STRUCTURE_INVALID')}
function ver(v,allowed,axis){if(v===undefined)fail('C_VERSION_MISSING_'+axis);if(typeof v!=='number'||!Number.isSafeInteger(v))fail('C_VERSION_TYPE_'+axis);if(!allowed.includes(v))fail('C_VERSION_UNSUPPORTED_'+axis)}
const str=v=>typeof v==='string',num=v=>typeof v==='number'&&Number.isFinite(v),bool=v=>typeof v==='boolean';
const S={};const nullable=t=>v=>v===null||ok(t,v);
function ok(t,v){
 if(typeof t==='function')return t(v);
 if(typeof t==='string')return ['s','n','b','e'].includes(t)?({s:x=>str(x)||obj(x)&&Object.keys(x).length===1&&str(x.$evidence),n:num,b:bool,e:x=>str(x)||obj(x)&&Object.keys(x).length===1&&str(x.$evidence)})[t](v):check(t,v);
 if(Array.isArray(t))return Array.isArray(v)&&v.every(x=>ok(t[0],x));
 const optional=Object.keys(t).filter(k=>k.endsWith('?')),required=Object.keys(t).filter(k=>!k.endsWith('?'));if(required.includes('version'))ver(v?.version,t===sceneFields?[1,2]:[1],t===sceneFields?'SCENE':'EMBEDDED');keys(v,required,optional.map(k=>k.slice(0,-1)));
 for(const [k,type]of Object.entries(t)){const key=k.replace(/\?$/,'');if(Object.hasOwn(v,key)&&v[key]!==undefined&&!ok(type,v[key]))fail('C_STRUCTURE_INVALID');if(Object.hasOwn(v,key)&&v[key]===undefined&&!k.endsWith('?'))fail('C_STRUCTURE_INVALID')}return true;
}
function check(t,v){if(!Object.hasOwn(S,t))fail('C_CATALOGUE_ERROR');return ok(S[t],v)}
const dict=t=>v=>{if(!obj(v))return false;for(const [k,x]of Object.entries(v)){if(!k||['__proto__','constructor','prototype'].includes(k)||!ok(t,x))return false}return true};
const enumeration=(...xs)=>v=>xs.includes(v);
const vector=v=>Array.isArray(v)&&v.length===3&&v.every(num);
const pairMap=t=>v=>{if(!Array.isArray(v))return false;const ids=new Set();for(const p of v){if(!Array.isArray(p)||p.length!==2||!str(p[0])||ids.has(p[0])||!ok(t,p[1]))return false;ids.add(p[0])}return true};
S.media={id:'s',sha256:'s',size:'n',mime:'s','base64?':'s'};
S.file={$file:'s',name:'s',type:'s',modified:'n',size:'n'};
S.src=v=>{if(str(v))return v==='';if(!obj(v))return false;if(v.kind==='static')keys(v,['$src','kind','value']);else if(v.kind==='data')keys(v,['$src','kind','prefix']);else return false;return str(v.$src)&&str(v.value??v.prefix)};
S.provenance={version:enumeration(1),taskId:'s',snapshotId:'s',sceneSignature:'e','outputId?':'s',createdAt:'s',ruleVersion:'s',manual:'b','promptSourceJson?':'s'};
S.selection={version:enumeration(1),instanceId:'s',projectId:'s',holderTaskId:'s',holderTaskName:'s',holderKind:enumeration('image','video'),holderSlot:enumeration('refs','first','last'),'holderRetained?':'b',holderRefId:'s',selectedAt:'n',width:'n',height:'n',pngSha256:'s',sourceVersion:'s','upstreamSelection?':'selection'};
S.ref={'generationUse?':enumeration('selected','retained'),id:'s',category:enumeration('product','character','scene','style'),src:'src',name:'s',entityId:'s',view:'s',origin:enumeration('sample','local','library'),'stageSelection?':'selection','stageSource?':'provenance','assetId?':'s','example?':'b','sourceTaskId?':'s','sourceResultId?':'s','sourceTaskName?':'s','sourceKind?':enumeration('image','video'),'size?':'n','mime?':'s','lastModified?':'n'};
S.boardSource={version:enumeration(1),projectId:'s',storyboardId:'s',shotId:'s',shotRevision:'n',snapshotId:'s',handoffId:'s',createdAt:'n',ruleVersion:enumeration('storyboard.zh.v1','storyboard.video.zh.v1'),manual:'b'};
S.supplement={text:'s',enabled:'b',manual:'b',source:'provenance'};
S.boardSupplement={text:'s',enabled:'b',manual:'b',source:'boardSource'};
S.creationInput={version:enumeration(1),referenceUse:enumeration('selected','retained'),'studioMode?':enumeration('BASE','A','B','C'),'studioReferenceId?':'s','videoOrder?':['s'],'observedHandoffId?':'s','configurationId?':'s',retainedPrompts:['s']};
const draftCommon={'creationInput?':'creationInput',prompt:'s',refs:['ref'],model:enumeration('google','gpt','seedream'),compare:'b',compareModels:[enumeration('google','gpt','seedream')],ratio:'s',resolution:'s',count:'n',scenario:enumeration('success','partial','failure'),'supplement?':'supplement','storyboardSource?':'boardSource','storyboardSupplement?':'boardSupplement'};
S.imageDraft=draftCommon;
S.videoDraft={...draftCommon,model:enumeration('veo','seedance'),compareModels:[enumeration('veo','seedance')],mode:enumeration('text','first','frames'),first:nullable('ref'),last:nullable('ref'),duration:'n'};
S.patch=Object.fromEntries(Object.entries({...S.videoDraft,model:enumeration('google','gpt','seedream','veo','seedance'),compareModels:[enumeration('google','gpt','seedream','veo','seedance')]}).map(([k,t])=>[k.replace(/\?$/,'')+'?',t]));
S.recovery={originalStatus:enumeration('queued','running'),at:'n',reason:'s'};
S.simTask={id:'s',model:'s',index:'n',status:enumeration('queued','running','completed','failed','interrupted'),attempt:'n',startedAt:'n',willFail:'b',favorite:'b',src:'src','recovery?':'recovery'};
S.context={taskId:'s',taskName:'s',projectId:nullable('s'),projectName:'s'};
S.videoSnapshot={input:'videoDraft',effective:{first:nullable('ref'),last:nullable('ref'),refs:['ref']},retained:{first:nullable('ref'),last:nullable('ref')}};
const batchCommon={id:'s',createdAt:'n','context?':'context',tasks:['simTask'],'finalPrompt?':'s','storyboardFieldOrigins?':dict('fieldOrigin'),'storyboardOrigin?':'shotSnapshot'};
S.imageState={draft:'imageDraft',baseline:'e',batches:[{...batchCommon,snapshot:'imageDraft'}]};
S.videoState={draft:'videoDraft',baseline:'e',batches:[{...batchCommon,snapshot:'videoSnapshot'}]};
S.fieldOrigin={receiptId:'s',source:'boardSource',field:'s','sourceRefId?':'s',valueSignature:'e'};
S.project={id:'s',name:'s',description:'s',createdAt:'n',updatedAt:'n'};
S.task={id:'s',kind:enumeration('image','video'),name:'s',projectId:nullable('s'),createdAt:'n',updatedAt:'n','storyboardFields?':dict('fieldOrigin'),'storyboardSource?':'boardSource','storyboardSnapshot?':'shotSnapshot'};
S.asset={id:'s',name:'s',media:enumeration('image','video','audio'),src:'src',usages:[enumeration('product','character','scene','style')],tags:['s'],description:'s',favorite:'b',example:'b',origin:enumeration('sample','local','result'),createdAt:'n',updatedAt:'n','stageSource?':'provenance','entityId?':'s','view?':'s','mime?':'s','fileName?':'s','size?':'n','lastModified?':'n','duration?':'n','width?':'n','height?':'n','source?':{taskId:'s',taskName:'s',resultId:'s',kind:enumeration('image','video')}};
S.photo={assetId:'s',view:'s'};
S.entity={id:'s',kind:enumeration('character','product'),name:'s',description:'s',tags:['s'],favorite:'b',coverId:nullable('s'),photos:['photo'],model:nullable({name:'s',size:'n','file?':'file'}),createdAt:'n',updatedAt:'n'};
S.brief={purpose:'s',original:'s',style:'s',ratio:'s',duration:'s'};
S.resource={link:{id:'s','assetId?':'s',entityId:'s',category:'s',view:'s'},asset:nullable({id:'s',name:'s',description:'s',updatedAt:'n',src:'src','stageSource?':'provenance'}),entity:nullable({id:'s',name:'s',description:'s',updatedAt:'n',photos:['photo']}),'frozen?':{src:'src','stageSource?':'provenance',stageSelection:'selection'}};
S.promptInput={brief:{purpose:'s',original:'s',style:'s'},visual:'s',freeze:'s',subject:'s',scene:'s',size:'s',angle:'s',resources:['resource'],'motion?':{action:'s',camera:'s',start:'s',end:'s'}};
S.boardPrompt={ruleVersion:enumeration('storyboard.zh.v1','storyboard.video.zh.v1'),fingerprint:'e',input:'promptInput',sections:[{id:'s',label:'s',generated:'s',text:'s',enabled:'b',manual:'b'}],at:'n'};
S.execution={mode:enumeration('text','first','frames'),model:enumeration('veo','seedance'),ratio:'s',duration:'n',resolution:'s',count:'n',firstId:nullable('s'),lastId:nullable('s'),refIds:['s']};
S.videoPlan={action:'s',camera:'s',start:'s',end:'s',dialogue:'s',subtitles:'s',sound:'s',execution:'execution','prompt?':'boardPrompt'};
S.shot={id:'s',revision:'n',title:'s',visual:'s',freeze:'s',subject:'s',scene:'s',size:'s',angle:'s',duration:'s',refs:['ref'],'prompt?':'boardPrompt','video?':'videoPlan'};
S.boardContent={name:'s',brief:'brief',shots:['shot']};
S.board={...S.boardContent,version:enumeration(1),id:'s',projectId:'s',revision:'n',createdAt:'n',updatedAt:'n','undo?':{shot:'shot',index:'n'},'templateUndo?':'boardContent'};
S.shotSnapshot={version:enumeration(1),source:'boardSource',boardName:'s',brief:'brief',shot:'shot',currentPromptInput:'promptInput',supplementInput:'promptInput',supplementFingerprint:'e',currentFingerprint:'e',keptStale:'b',plannedRatio:'s',executionRatio:'s',originalText:'s',supplementText:'s',finalPrompt:'s',media:['ref'],'taskKind?':enumeration('image','video'),'video?':{execution:'execution',effective:S.videoSnapshot.effective,retained:S.videoSnapshot.retained}};
S.handoffReceipt={id:'s',taskId:'s',at:'n',before:'patch',after:'patch',fields:['s'],'undone?':'b'};
S.updateSource={source:'boardSource',shot:'shot',currentInput:'promptInput','supplementInput?':'promptInput',currentFingerprint:'e','supplementFingerprint?':'e',keptStale:'b'};
S.fieldChange=v=>{keys(v,['field','after','afterOrigin'],['before','beforeOrigin']);if(!check('fieldOrigin',v.afterOrigin)||v.beforeOrigin&&!check('fieldOrigin',v.beforeOrigin))return false;let t=v.field==='prompt'?'s':v.field==='storyboardSupplement'?'boardSupplement':v.field==='first'||v.field==='last'?nullable('ref'):str(v.field)&&v.field.startsWith('refs:')?'ref':null;if(!t)return false;return ok(t,v.after)&&(!Object.hasOwn(v,'before')||v.before===undefined||ok(t,v.before))};
S.updateReceipt={id:'s',taskId:'s',at:'n',digest:'e',source:'updateSource',changes:['fieldChange'],unchanged:['s'],'undone?':'b','undoneAt?':'n'};
S.pose={version:enumeration(1),joints:Object.fromEntries(['torso','neck','head','leftShoulder','leftElbow','leftWrist','rightShoulder','rightElbow','rightWrist','leftHip','leftKnee','leftAnkle','rightHip','rightKnee','rightAnkle'].map(k=>[k,vector]))};
S.scene={version:enumeration(1,2),ratio:'s',subject:v=>obj(v)&&ok(v.kind==='builtin'?{kind:enumeration('builtin'),id:'s'}:{kind:enumeration('glb'),source:enumeration('local','entity'),id:'s',name:'s',size:'n',modified:'n','contentId?':'s'},v),normalize:'b',scale:'n',target:vector,camera:{position:vector,rotation:vector,aim:'s','focalLengthMm?':'n','depthOfField?':{enabled:'b',focusDistance:'n',strength:'n'}},light:{position:vector,rotation:vector,aim:'s',power:'n'},ambient:'n','root?':{position:vector,rotation:vector},'pose?':'pose',backdrop:{mode:'s',show:'b',color:'s',image:nullable('backdropRef'),fit:'s',hdr:nullable('backdropRef'),rotation:'n',backgroundIntensity:'n',lighting:'b',environmentIntensity:'n',ground:'b'}};
S.backdropRef={id:'s',name:'s',size:'n',modified:'n',kind:'s'};
S.draft={version:enumeration(1),libraryId:'s',projectId:nullable('s'),taskId:'s',draftId:'s',revision:'n',baseAppliedSignature:'e',createdAt:'n',updatedAt:'n',scene:'scene'};
S.evidence={composition:{state:enumeration('outside','intersects','unavailable'),'centerX?':'n','clipped?':'b','pitch?':enumeration('down','up','level'),'bounds?':['n']},light:{type:enumeration('SpotLight'),color:'s',side:enumeration('left','right','near-axis'),vertical:enumeration('above','below','near-height')},effect:{state:enumeration('off','active','fallback','unknown'),reason:'s'}};
S.promptSource={version:enumeration(1),id:'s',kind:'s',task:{id:'s',name:'s',kind:'s'},at:'s',scene:'scene',evidence:'evidence',sceneSignature:'e'};
S.prompt={version:enumeration(1),ruleVersion:enumeration('scene-prompt.zh.v1'),source:'promptSource',at:'s',sections:['section'],originalSections:['section'],manualText:nullable('s'),unacknowledged:'b'};
S.section={id:enumeration('camera','pose','light','background','dof'),label:'s',text:'s',enabled:'b'};
S.work={version:enumeration(1),libraryId:'s',projectId:nullable('s'),taskId:'s',prompt:nullable('prompt'),selectedSource:'s',result:nullable({id:'s',blob:{$png:'s'},width:'n',height:'n',effect:{state:'s',reason:'s'},signature:'s',at:'s',filename:'s',scene:'scene','promptSnapshot?':'promptSource'}),selectedOutputId:nullable('s'),attempt:nullable({id:'s',scene:'scene',size:'n',startedAt:'s',status:'s',error:'s'})};

// Optional R2 audit/receipt metadata. Closed shapes, never an executable permission or pending proposal.
S.controlCommand=v=>{const project=v?.kind==='project-create'||v?.kind==='project-edit',create=v?.kind==='project-create'||v?.kind==='task-create';if(!['project-create','project-edit','task-create','task-edit'].includes(v?.kind))return false;const shape={kind:'s',id:'s',...(create?{name:'s'}:{'name?':'s'}),...(project?{'description?':'s'}:create?{taskKind:enumeration('image','video'),projectId:nullable('s')}:{'prompt?':'s'})};return ok(shape,v)};
S.controlTarget={id:'s',name:'s',updatedAt:'n',commandRevision:'n','description?':'s','kind?':enumeration('image','video'),'projectId?':nullable('s'),'prompt?':'s','generatedPrompt?':nullable('s'),'promptConflict?':'b'};
S.controlReceipt={id:'s',proposalId:'s',libraryId:'s',actor:'s',confirmedBy:enumeration('native-user'),at:'n',command:'controlCommand',before:nullable('controlTarget'),after:'controlTarget',fields:[enumeration('name','description','prompt')],'creationGuard?':'s','undone?':'b','undoneAt?':'n'};
S.controlAudit={id:'s',actor:'s',fields:[enumeration('name','description','prompt','projectId')],at:'n'};
S.workspace={'controlledChangesVersion?':enumeration(1),'commandRevisions?':dict(v=>Number.isSafeInteger(v)&&v>=0),'changeReceipts?':['controlReceipt'],'commandAudit?':['controlAudit'],stages:dict('scene'),projects:['project'],tasks:['task'],images:dict('imageState'),videos:dict('videoState'),activeImage:nullable('s'),activeVideo:nullable('s'),assets:['asset'],entities:['entity'],'storyboards?':dict('board'),'storyboardReceipts?':dict({id:'s',taskId:'s',digest:'e',snapshot:'shotSnapshot'}),'storyboardLinks?':[{id:'s',boardId:'s',shotId:'s',taskId:'s',at:'n'}],'storyboardUpdates?':dict('updateReceipt'),'stagePickReceipts?':dict({id:'s',boardId:'s',shotId:'s',resultRefId:'s',digest:'e',at:'n'})};
S.maps={receipts:pairMap('handoffReceipt'),latest:pairMap('handoffReceipt'),handoffDigests:pairMap('e'),storyboardAttempts:pairMap('e'),updateAttempts:pairMap('e')};
S.ui={route:'s',theme:enumeration('light','dark'),editors:dict({selected:'s',target:enumeration('image','video'),checkpoint:'boardContent'})};
const sceneFields=S.scene;S.scene=v=>{if(!ok(sceneFields,v))return false;require('./draft-schema.cjs').validScene(v);return true};
function validateDTO(dto,{writable=false,transport=false}={}){
 require('./save-validation.cjs').validateTree(dto);
 ver(dto?.schemaVersion,[1,2,3,4,5],'DTO');if(!obj(dto.business))fail('C_STRUCTURE_INVALID');keys(dto,['schemaVersion','business','registries','media'],['sourceEvidence']);
 if(dto.schemaVersion===1&&('stageDrafts'in dto.business||'stageWork'in dto.business)||dto.schemaVersion===2&&'stageWork'in dto.business)fail('C_MIXED_DTO');
 if(!Array.isArray(dto.media)||dto.media.some(m=>!Number.isSafeInteger(m.size)||m.size<0)||dto.media.reduce((n,m)=>n+m.size,0)>256*1024*1024)throw Error('C_MEDIA_TOTAL_LIMIT');
 const b={workspace:'workspace',maps:'maps',ui:'ui',...(dto.schemaVersion>=2?{stageDrafts:['draft']}:{ }),...(dto.schemaVersion>=3?{stageWork:['work']}:{}),...(dto.schemaVersion===5?{generated:v=>{require('./d1-schema.cjs').generated(v,{tasks:dto.business.workspace?.tasks,media:dto.media,product:true});return true}}:{})};
 if(!ok(b,dto.business)||!ok({subjects:dict('file'),backdrops:dict('file')},dto.registries)||!ok(['media'],dto.media))fail('C_STRUCTURE_INVALID');
 for(const m of dto.media){if(!transport&&Object.hasOwn(m,'base64'))fail('C_MIXED_MEDIA');if(transport&&!str(m.base64))fail('C_STRUCTURE_INVALID')}
 if(dto.sourceEvidence!==undefined&&!str(dto.sourceEvidence))fail('C_STRUCTURE_INVALID');
 const mediaById=new Map(dto.media.map(m=>[m.id,m]));
 function files(v){if(!v||typeof v!=='object')return;if(Array.isArray(v)){v.forEach(files);return}if(Object.hasOwn(v,'$file')){if(mediaById.get(v.$file)?.size!==v.size)fail('C_REFERENCE_INVALID');return}for(const x of Object.values(v))files(x)}
 files(dto.business);files(dto.registries);
 const w=dto.business.workspace;if(dto.schemaVersion===5){const used=new Set([...dto.business.generated.drafts.map(x=>x.taskId),...dto.business.generated.requests.map(x=>x.taskId),...dto.business.generated.results.map(x=>x.taskId)]);for(const t of w.tasks)if(!(t.kind==='image'?w.images[t.id]:w.videos[t.id])&&!used.has(t.id))throw Error('C_D1_TASK_INDEX')}const ids=new Set(w.tasks.map(t=>t.id));if(ids.size!==w.tasks.length)fail('C_STRUCTURE_INVALID');
 for(const [map,kind]of [[w.images,'image'],[w.videos,'video']])for(const id of Object.keys(map))if(!w.tasks.some(t=>t.id===id&&t.kind===kind))fail('C_STRUCTURE_INVALID');
 for(const id of Object.keys(w.stages))if(!ids.has(id))fail('C_STRUCTURE_INVALID');
 const maps=dto.business.maps,receipts=new Map(maps.receipts);
 if(maps.handoffDigests.some(([id])=>!receipts.has(id))||maps.receipts.some(([id,r])=>r.id!==id||!maps.handoffDigests.some(([key])=>key===id))||maps.latest.some(([id,r])=>id!==r.taskId)||maps.storyboardAttempts.some(([id])=>!Object.hasOwn(w.storyboardReceipts||{},id))||maps.updateAttempts.some(([id])=>!Object.hasOwn(w.storyboardUpdates||{},id)))fail('C_REFERENCE_INVALID');
 const scenes=[...Object.values(w.stages),...(dto.business.stageDrafts||[]).map(x=>x.scene),...(dto.business.stageWork||[]).flatMap(x=>[x.prompt?.source.scene,x.result?.scene,x.result?.promptSnapshot?.scene,x.attempt?.scene].filter(Boolean))],subjects=new Set(),backs=new Set();
 for(const x of scenes){
  if(x.version!==([4,5].includes(dto.schemaVersion)?2:1))fail('C_MIXED_SCENE');
  if(x.subject.kind==='glb'){
   const r=x.subject;if(r.source==='entity'&&!w.entities.some(e=>e.id===r.id))fail('C_REFERENCE_INVALID');
   if([4,5].includes(dto.schemaVersion)){
    const id=r.contentId,file=dto.registries.subjects[id],m=mediaById.get(id);
    if(!/^m-[a-f0-9]{64}$/.test(id||'')||!file||file.$file!==id||file.size!==r.size||file.name!==id.slice(2)+'.glb'||file.modified!==0||file.type!=='application/octet-stream'||!m||m.mime!=='application/octet-stream'||m.size!==r.size||m.size>20*1024*1024)fail('C_REFERENCE_INVALID');subjects.add(id)
   }else{
    const file=r.source==='local'?dto.registries.subjects[r.id]:w.entities.find(e=>e.id===r.id)?.model?.file;
    if(!file||file.name!==r.name||file.size!==r.size||file.modified!==r.modified)fail('C_REFERENCE_INVALID');if(r.source==='local')subjects.add(r.id)
   }
  }
  for(const b of [x.backdrop.image,x.backdrop.hdr])if(b){const file=dto.registries.backdrops[b.id];if(!file||file.name!==b.name||file.size!==b.size||file.modified!==b.modified)fail('C_REFERENCE_INVALID');backs.add(b.id)}
 }
 for(const [registry,used]of [[dto.registries.subjects,subjects],[dto.registries.backdrops,backs]])if(Object.keys(registry).some(k=>!used.has(k))||[...used].some(k=>!Object.hasOwn(registry,k)))fail('C_REFERENCE_INVALID');
 if(writable&&dto.schemaVersion!==5)fail('C_LEGACY_REVIEW_REQUIRED');
 return dto;
}
function poseRecord(v,transport=false){ver(v?.formatVersion,[1],'POSE_RECORD');const t=v?.thumbnail;keys(v,['id','name','formatVersion','rig','pose','createdAt','updatedAt','deletedAt','revision','thumbnail']);if(!ok({id:enumeration('acs-rigid-mannequin'),version:enumeration(1)},v.rig)||!ok('pose',v.pose))fail('C_STRUCTURE_INVALID');
 if(!obj(t))fail('C_STRUCTURE_INVALID');if(t.status==='ready'){keys(t,['status','media']);if(!ok('media',t.media))fail('C_STRUCTURE_INVALID');if(!transport&&Object.hasOwn(t.media,'base64'))fail('C_MIXED_MEDIA')}else if(t.status==='pending')keys(t,['status']);else if(t.status==='error'){keys(t,['status','message']);if(!str(t.message))fail('C_STRUCTURE_INVALID')}else fail('C_STRUCTURE_INVALID');return v}
module.exports={validateDTO,poseRecord,keys,ver,catalogue:Object.fromEntries(Object.entries(S).map(([name,type])=>[name,(name==='scene'||type&&typeof type==='object'&&!Array.isArray(type))?Object.keys(name==='scene'?sceneFields:type):['explicit-validator']]))};





'use strict';
const {validateDto}=require('./diagnostic-schema.cjs');
const {validateTree}=require('./save-validation.cjs');
const {verifiedRecord}=require('./pose-schema.cjs');
const idOK=id=>typeof id==='string'&&/^m-[a-f0-9]{64}$/.test(id);
const text=v=>typeof v==='string'?v.slice(0,160):undefined;
function impact(dto,poses,objects,libraryId){
 const refs=new Map(),descriptors=new Map(),issues=[],unknown=[];
 let count=0,omitted=0;
 const objectMap=new Map(objects.map(o=>[o.id,o]));
 const add=(id,where,ctx={},via='direct',name)=>{
  if(!idOK(id)){issues.push({code:'D_REFERENCE_INVALID',where:text(where)});return}
  let row=refs.get(id);if(!row)refs.set(id,row=[]);
  const r={where:where.slice(0,1200),via,...ctx};const key=JSON.stringify(r);
  if(row.some(x=>JSON.stringify(x)===key))return;
  if(count>=16384||row.length>=64){omitted++;return}row.push(r);count++;
  if(name)descriptors.set(id,text(name));
 };
 let valid=false,w;
 try{
  if(!dto)throw Error('EMPTY_REVISION');
  validateDto(dto);if([4,5].includes(dto.schemaVersion))require('./compatibility-shape.cjs').validateDTO(dto);
  const allowed=['workspace','maps','ui','stageDrafts','stageWork'];
  const wk=['stages','projects','tasks','images','videos','activeImage','activeVideo','assets','entities','storyboards','storyboardLinks','storyboardReceipts','storyboardUpdates','stagePickReceipts'];
  if(Object.keys(dto.business).some(k=>!allowed.includes(k))||Object.keys(dto.business.workspace).some(k=>!wk.includes(k))||Object.keys(dto.registries).some(k=>!['subjects','backdrops'].includes(k))||Object.keys(dto.business.maps).some(k=>!['receipts','latest','handoffDigests','storyboardAttempts','updateAttempts'].includes(k)))unknown.push('未识别的元数据字段；关联覆盖未确认');
  w=dto.business.workspace;
  if((dto.business.stageDrafts||[]).some(x=>x.libraryId!==libraryId)||(dto.business.stageWork||[]).some(x=>x.libraryId!==libraryId))throw Error('SCOPE');
  valid=true;
 }catch{issues.push({code:'D_REFERENCE_INVALID',where:'current DTO'});unknown.push('当前核心元数据无效，当前核心关联数量未知')}
 const taskMap=new Map((valid?w.tasks:[]).map(t=>[t.id,t]));
 function context(v,p,parent){
  const c={...parent};
  if(v&&typeof v==='object'&&!Array.isArray(v)){
   if(typeof v.taskId==='string'&&taskMap.has(v.taskId))c.taskId=v.taskId;
   const tm=/workspace\.(?:images|videos|stages)\.([^.]+)/.exec(p);
   if(tm&&taskMap.has(tm[1]))c.taskId=tm[1];
   if(/^root\.business\.workspace\.tasks\.\d+$/.test(p)&&taskMap.has(v.id))c.taskId=v.id;
   if(/^root\.business\.workspace\.assets\.\d+$/.test(p))c.assetId=text(v.id);
   if(/^root\.business\.workspace\.entities\.\d+$/.test(p))c.entityId=text(v.id);
   if(/^root\.business\.workspace\.storyboards\.[^.]+$/.test(p))c.boardId=text(v.id)||p.split('.').at(-1);
   if(/\.shots\.\d+$/.test(p))c.shotId=text(v.id);
   if(/^root\.business\.stageWork\.\d+\.result$/.test(p))c.outputId=text(v.id);
   if(v.stageSource||v.storyboardOrigin||/source|snapshot|receipt|before|after|digest|fingerprint|signature/i.test(p))c.role='来源／快照／收据／撤销（按字段）';
   if(c.taskId){const t=taskMap.get(c.taskId);c.projectId=text(t.projectId);c.taskName=text(t.name)}
   if(v.subject?.kind==='glb'){
    const r=v.subject;
    const descriptor=v.version===2?dto.registries.subjects[r.contentId]:r.source==='local'?dto.registries.subjects[r.id]:null;
    if(v.version===1&&r.source==='entity'){unknown.push('旧场景模型内容身份未知：'+p.slice(0,120));return c}
    if(descriptor?.$file)add(descriptor.$file,p+'.subject',{...c,role:'GLB模型'},'registry',v.version===2?r.name:descriptor.name);
    else{unknown.push('GLB registry关联无效：'+p.slice(0,120));issues.push({code:'D_REFERENCE_INVALID',where:p.slice(0,1200)})}
   }
   if(v.backdrop)for(const k of ['image','hdr'])if(v.backdrop[k]){
    const d=dto.registries.backdrops[v.backdrop[k].id];
    if(d?.$file)add(d.$file,p+'.backdrop.'+k,{...c,role:k==='hdr'?'HDR环境':'背景图片'},'registry',d.name);
    else{unknown.push('背景registry关联无效：'+p.slice(0,120));issues.push({code:'D_REFERENCE_INVALID',where:p.slice(0,1200)})}
   }
  }
  return c;
 }
 function walk(v,p,c={}){
  if(!v||typeof v!=='object')return;
  c=context(v,p,c);
  for(const marker of ['$src','$file','$png','$evidence'])if(marker in v){if(marker==='$file'&&v.size!==objectMap.get(v.$file)?.bytes)issues.push({code:'D_REFERENCE_INVALID',mediaId:v.$file,where:p});add(v[marker],p,{...c,...(marker==='$evidence'?{role:'证据内容／来源关系待验证'}:{})},'direct',marker==='$file'?v.name:undefined);return}
  for(const [k,x]of Object.entries(v))walk(x,p+'.'+k,c);
 }
 if(valid){
  walk(dto.business,'root.business');walk(dto.registries,'root.registries');
  if(idOK(dto.sourceEvidence))add(dto.sourceEvidence,'sourceEvidence',{role:'应用来源证据'});
  else{issues.push({code:'D_REFERENCE_INVALID',where:'sourceEvidence'});unknown.push('应用来源证据未识别')}
  for(const m of dto.media){
   const o=objectMap.get(m.id);
   if(!o||o.sha!==m.sha256||o.bytes!==m.size||o.mime!==m.mime)issues.push({code:'D_REFERENCE_INVALID',mediaId:m.id,where:'DTO.media'});
  }
  const assets=new Map(w.assets.map(a=>[a.id,a]));
  for(const e of w.entities)for(const p of e.photos||[]){
   const a=assets.get(p.assetId);
   if(a?.src?.$src)add(a.src.$src,'entity.photos.'+e.id+'.'+p.assetId,{entityId:text(e.id),assetId:text(a.id)},'registry');
   else unknown.push('资料卡照片引用无法确认');
  }
 }
 if(poses.length>200){unknown.push('姿势数量超过既有限制');issues.push({code:'D_RESOURCE_LIMIT',where:'pose_records'})}
 else for(const row of poses){
  try{
   const p=JSON.parse(row.payload);validateTree(p);if(p.formatVersion!==1){issues.push({code:'D_VERSION_UNSUPPORTED',where:'pose_records'});unknown.push('姿势记录版本不支持，关联未确认');continue}if(row.id!==p.id)throw Error('POSE_ID');
   verifiedRecord({...p,thumbnail:{status:'pending'}});
   const t=p.thumbnail;
   if(t?.status==='ready'){
    const m=t.media;
    if(!m||Object.keys(t).length!==2||Object.keys(m).some(k=>!['id','sha256','size','mime'].includes(k))||!idOK(m.id)||m.id!=='m-'+m.sha256||m.mime!=='image/png'||!Number.isSafeInteger(m.size)||m.size<24||m.size>96*1024)throw Error('THUMBNAIL');
    add(m.id,'pose_records.'+p.id+'.thumbnail',{poseId:p.id,poseName:text(p.name),deleted:!!p.deletedAt,role:'姿势缩图'},'direct');
    const o=objectMap.get(m.id);if(!o||o.sha!==m.sha256||o.bytes!==m.size||o.mime!==m.mime)issues.push({code:'D_REFERENCE_INVALID',mediaId:m.id,where:'pose thumbnail'});
   }else verifiedRecord(p);
  }catch{unknown.push('姿势元数据无效，影响数量未知');issues.push({code:'D_REFERENCE_INVALID',where:'pose_records'})}
 }
 for(const [id]of refs)if(!objectMap.has(id))issues.push({code:'D_REFERENCE_INVALID',mediaId:id,where:'引用无登记对象'});
 if(omitted)unknown.push('引用展示预算已满；省略'+omitted+'处已遇引用，后续关联未穷尽');
 return {refs,descriptors,issues:issues.slice(0,4096),unknown:[...new Set(unknown)].slice(0,32),omitted,coreValid:valid};
}
module.exports={impact};


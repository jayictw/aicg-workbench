import {stageIssues,type StageSettings} from './state.ts'
function keys(v:unknown,allowed:string[]){if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!allowed.includes(k)))throw Error('SCENE_DRAFT_SCHEMA')}
export function validScene(v:StageSettings){
 keys(v,['version','ratio','subject','normalize','scale','target','root','pose','camera','light','ambient','backdrop','people'])
 if(![1,2,3].includes(v.version)||typeof v.normalize!=='boolean'||!Number.isFinite(v.scale)||!Number.isFinite(v.ambient))throw Error('SCENE_DRAFT_SCHEMA')
 keys(v.subject,v.subject.kind==='builtin'?['kind','id']:['kind','source','id','name','size','modified',...(v.version===2?['contentId']:[])])
 if(v.subject.kind==='builtin'){if(!['person','box','cylinder'].includes(v.subject.id))throw Error('SCENE_DRAFT_SUBJECT')}else if(v.subject.kind!=='glb'||!['local','entity'].includes(v.subject.source)||!v.subject.id||typeof v.subject.name!=='string'||!Number.isSafeInteger(v.subject.size)||v.subject.size<0||!Number.isFinite(v.subject.modified))throw Error('SCENE_DRAFT_SUBJECT')
 if(v.subject.kind==='glb'&&v.version===2&&(!/^m-[a-f0-9]{64}$/.test(v.subject.contentId||'')||v.subject.size<28||v.subject.size>20*1024*1024))throw Error('MODEL_BINDING_SCHEMA')
 keys(v.camera,['position','rotation','aim','focalLengthMm','depthOfField']);keys(v.light,['position','rotation','aim','power']);if(!['free','target'].includes(v.camera.aim)||!['free','target'].includes(v.light.aim))throw Error('SCENE_DRAFT_AIM')
 if(v.root)keys(v.root,['position','rotation']);if(v.pose){keys(v.pose,['version','joints']);if(v.pose.version!==1)throw Error('SCENE_DRAFT_POSE')}
 if(v.camera.depthOfField)keys(v.camera.depthOfField,['enabled','focusDistance','strength'])
 keys(v.backdrop,['mode','show','color','image','fit','hdr','rotation','backgroundIntensity','lighting','environmentIntensity','ground'])
 if(!['color','image','hdr'].includes(v.backdrop.mode)||!['cover','contain'].includes(v.backdrop.fit)||['show','lighting','ground'].some(k=>typeof v.backdrop[k as 'show']!=='boolean'))throw Error('SCENE_DRAFT_BACKDROP')
 for(const kind of ['image','hdr'] as const){const ref=v.backdrop[kind];if(ref){keys(ref,['kind','id','name','size','modified']);if(ref.kind!==kind||!ref.id||typeof ref.name!=='string'||!Number.isSafeInteger(ref.size)||!Number.isFinite(ref.modified))throw Error('SCENE_DRAFT_FILE')}}
 const issues=stageIssues(v);if(issues.length)throw Error('SCENE_DRAFT_INVALID: '+issues.join('；'))
}

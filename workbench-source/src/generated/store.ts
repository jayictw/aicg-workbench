import type {Draft1,GeneratedWorkspace1,Request1,Result1} from './types'
import type {Media} from '../persistence/codec'
const empty=():GeneratedWorkspace1=>({version:1,drafts:[],requests:[],results:[]})
let data=empty(),media=new Map<string,Media>();const listeners=new Set<()=>void>();
const update=(next:GeneratedWorkspace1)=>{data=next;listeners.forEach(fn=>fn())}
export const generated={get:()=>data,subscribe:(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn)}},
 bind(value:GeneratedWorkspace1,items:Media[]){media=new Map(items.map(m=>[m.id,{...m}]));update(structuredClone(value))},
 draft:(taskId:string)=>data.drafts.find(x=>x.taskId===taskId),
 putDraft(draft:Draft1){update({...data,drafts:[...data.drafts.filter(x=>x.taskId!==draft.taskId),structuredClone(draft)]})},
 join(bundle:{request:Request1;result:Result1;media:Media[]}){if(data.results.some(x=>x.resultId===bundle.result.resultId))return;for(const m of bundle.media)media.set(m.id,{...m});update({...data,requests:data.requests.some(x=>x.requestId===bundle.request.requestId)?data.requests:[...data.requests,structuredClone(bundle.request)],results:[...data.results,structuredClone(bundle.result)]})},
 favorite(id:string){update({...data,results:data.results.map(x=>x.resultId===id?{...x,favorite:!x.favorite}:x)})},
 remove(id:string){update({...data,results:data.results.filter(x=>x.resultId!==id)})},
 src(id:string){const m=media.get(id);return m&&['image/png','video/mp4'].includes(m.mime)?'data:'+m.mime+';base64,'+m.base64:''},
 snapshot(){const used=new Set<string>();for(const r of data.results){used.add(r.original.mediaId);used.add(r.current.mediaId);for(const d of r.derivation){used.add(d.inputMediaId);used.add(d.outputMediaId)}}for(const r of data.requests)for(const input of r.effective.inputs)used.add('m-'+input.sha256);for(const d of data.drafts)for(const input of [...d.inputs,...d.retained])used.add('m-'+input.sha256);return {generated:structuredClone(data),d1Media:[...used].map(id=>{const m=media.get(id);if(!m)throw Error('C_D1_MEDIA_REFERENCE');return {...m}})}}
}
export const sourceLabel=(kind:Result1['source']['kind'])=>({'legacy-mock':'历史示例','offline-synthetic':'离线合成','user-imported':'用户导入','provider-returned':'平台返回',unknown:'未知来源'})[kind]

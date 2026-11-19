import {addProject,editProject,addCreativeTask,editCreativeTask,updateImage,updateVideo} from './state.ts'
import type {Workspace,TaskKind} from './state.ts'

// Closed business commands shared by native editors and MCP-confirmed proposals.
export type BusinessCommand={kind:'project-create'|'project-edit'|'task-create'|'task-edit';id:string;name?:string;description?:string;prompt?:string;taskKind?:TaskKind;projectId?:string|null}
export const commandLimits={name:200,description:2000,prompt:4000}
function text(v:unknown,max:number,required=false){if(typeof v!=='string'||v.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v)||required&&!v.trim())throw Error('MCP_ARGUMENTS')}
export function commandTarget(w:Workspace,kind:'project'|'task',id:string){
 if(kind==='project'){const p=w.projects.find(p=>p.id===id);if(!p)throw Error('MCP_ID_NOT_IN_SCOPE');return {id:p.id,name:p.name,description:p.description,updatedAt:p.updatedAt}}
 const t=w.tasks.find(t=>t.id===id);if(!t)throw Error('MCP_ID_NOT_IN_SCOPE');const d=(t.kind==='image'?w.images:w.videos)[id]?.draft
 return {id:t.id,name:t.name,kind:t.kind,projectId:t.projectId,updatedAt:t.updatedAt,...(d?{prompt:d.prompt}:{})}
}
export function validateCommand(w:Workspace,c:BusinessCommand){
 if(!c||!['project-create','project-edit','task-create','task-edit'].includes(c.kind)||typeof c.id!=='string'||!c.id||c.id.length>200)throw Error('MCP_ARGUMENTS')
 const allowed=c.kind==='project-create'||c.kind==='project-edit'?['kind','id','name','description']:c.kind==='task-create'?['kind','id','name','taskKind','projectId']:['kind','id','name','prompt']
 if(Object.keys(c).some(k=>!allowed.includes(k)))throw Error('MCP_ARGUMENTS')
 if(c.name!==undefined)text(c.name,commandLimits.name,true)
 if(c.description!==undefined)text(c.description,commandLimits.description)
 if(c.prompt!==undefined)text(c.prompt,commandLimits.prompt)
 if(c.kind.endsWith('create')&&c.name===undefined)throw Error('MCP_ARGUMENTS')
 if(c.kind==='task-create'&&(!['image','video'].includes(c.taskKind!)||c.projectId!==null&&!w.projects.some(p=>p.id===c.projectId)))throw Error('MCP_ID_NOT_IN_SCOPE')
 if(c.kind.endsWith('edit')){const t=commandTarget(w,c.kind==='project-edit'?'project':'task',c.id);if(c.name===undefined&&c.description===undefined&&c.prompt===undefined)throw Error('MCP_ARGUMENTS');if(c.prompt!==undefined&&!Object.hasOwn(t,'prompt'))throw Error('MCP_FIELD_UNAVAILABLE')}
 return c
}
export function executeCommand(w:Workspace,c:BusinessCommand,now:number):Workspace{
 validateCommand(w,c)
 if(c.kind==='project-create')return addProject(w,c.id,c.name!,c.description||'',now)
 if(c.kind==='task-create')return addCreativeTask(w,c.id,c.taskKind!,c.name!,c.projectId!,now)
 if(c.kind==='project-edit'){const p=w.projects.find(p=>p.id===c.id)!;return editProject(w,c.id,c.name??p.name,c.description??p.description,now)}
 const t=w.tasks.find(t=>t.id===c.id)!;let next=c.name===undefined?w:editCreativeTask(w,c.id,c.name,t.projectId,now)
 if(c.prompt!==undefined)next=t.kind==='image'?updateImage(next,t.id,d=>({...d,draft:{...d.draft,prompt:c.prompt!}}),now):updateVideo(next,t.id,d=>({...d,draft:{...d.draft,prompt:c.prompt!}}),now)
 return next
}
export type ChangeReceipt={id:string;proposalId:string;libraryId:string;actor:string;confirmedBy:'native-user';at:number;command:BusinessCommand;before:Record<string,unknown>|null;after:Record<string,unknown>;fields:string[];creationGuard?:string;undone?:boolean;undoneAt?:number}

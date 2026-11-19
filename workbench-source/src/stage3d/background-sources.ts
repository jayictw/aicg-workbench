import {stageWork} from './work-state'
import {sceneDrafts} from './draft-state'
import type { BackdropRef } from './background-state'
import type { StageSettings } from './state'
const files=new Map<string,File>()
export function registerBackdrop(file:File,kind:'image'|'hdr'):BackdropRef{const id=crypto.randomUUID();files.set(id,file);return{id,name:file.name,size:file.size,modified:file.lastModified,kind}}
export function backdropFile(ref:BackdropRef){const file=files.get(ref.id);if(!file||file.name!==ref.name||file.size!==ref.size||file.lastModified!==ref.modified)throw new Error('原背景文件引用已不可用，请重新选择本机文件。');return file}
export function pruneBackdrops(stages:Record<string,StageSettings>){stages={...stages,...sceneDrafts.scenes(),...stageWork.scenes()};const keep=new Set(Object.values(stages).flatMap(s=>[s.backdrop.image?.id,s.backdrop.hdr?.id].filter(Boolean)));for(const id of files.keys())if(!keep.has(id))files.delete(id)}

export function exportBackdropFiles(stages:Record<string,StageSettings>){return Object.fromEntries(Object.values(stages).flatMap(s=>[s.backdrop.image,s.backdrop.hdr].flatMap(r=>r?[[r.id,backdropFile(r)]]:[])))}
export function restoreBackdropFiles(entries:Record<string,File>){files.clear();for(const [id,f] of Object.entries(entries))files.set(id,f)}

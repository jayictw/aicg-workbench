import type {BoardContent} from '../storyboard/types'
export type EditorPosition={selected:string;target:'image'|'video';checkpoint:BoardContent}
export const editorPositions:Record<string,EditorPosition>={}
export const uiListeners=new Set<(kind:'selection'|'checkpoint')=>void>()
export function rememberEditor(id:string,value:EditorPosition){if(JSON.stringify(editorPositions[id])!==JSON.stringify(value)){const kind=JSON.stringify(editorPositions[id]?.checkpoint)!==JSON.stringify(value.checkpoint)?'checkpoint':'selection';editorPositions[id]=structuredClone(value);uiListeners.forEach(f=>f(kind))}}

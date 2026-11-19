import type {Workspace} from '../management/state'
// Active task pointers are restored with the next explicit save, not business edits.
export function workspaceBusinessChanged(before:Workspace,after:Workspace){
 const keys=new Set([...Object.keys(before),...Object.keys(after)])
 keys.delete('activeImage');keys.delete('activeVideo')
 return [...keys].some(k=>before[k as keyof Workspace]!==after[k as keyof Workspace])
}

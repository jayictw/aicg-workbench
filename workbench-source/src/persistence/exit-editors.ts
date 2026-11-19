import {useLayoutEffect,useRef} from 'react'
type Guard={pending:boolean;busy:boolean;label:string}
const editors=new Map<object,Guard>()
export function useExitGuard(label:string,pending:boolean,busy=false){
 const key=useRef({})
 useLayoutEffect(()=>{editors.set(key.current,{label,pending,busy});return()=>{editors.delete(key.current)}},[label,pending,busy])
}
export const exitEditors=()=>Array.from(editors.values()).filter(x=>x.pending||x.busy)

let inputRevision=0
if(typeof document!=='undefined')document.addEventListener('input',()=>{inputRevision++},true)
export const exitInputRevision=()=>inputRevision

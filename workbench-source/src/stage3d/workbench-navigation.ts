// Router-level boundary: a component-level hash listener runs too late to stop App unmounting.
let guard:((destination:string)=>void)|null=null
export function holdWorkbenchNavigation(next:(destination:string)=>void){
 guard=next
 return()=>{if(guard===next)guard=null}
}
export function allowWorkbenchRouteChange(){
 if(!guard)return true
 guard(window.location.href)
 return false
}

export type DepthOfField = { enabled:boolean; focusDistance:number; strength:number }
export const dofLimits = { focusMin:.05, focusMax:100000, strengthMin:0, strengthMax:1, maxRadiusCssPx:7 } as const
export const defaultDof = ():DepthOfField => ({enabled:false,focusDistance:5,strength:.4})
export function dofOf(camera:{depthOfField?:DepthOfField}):DepthOfField { return camera.depthOfField?structuredClone(camera.depthOfField):defaultDof() }
export function dofIssues(value:DepthOfField|undefined):string[] {
 if(value===undefined)return []
 if(!value||typeof value.enabled!=='boolean'||!Number.isFinite(value.focusDistance)||value.focusDistance<dofLimits.focusMin||value.focusDistance>dofLimits.focusMax||!Number.isFinite(value.strength)||value.strength<0||value.strength>1)return ['景深需为有效开关、0.05–100000场景单位的对焦距离及0–1虚化强度。']
 return []
}
export function parseDofInput(raw:string,kind:'focusDistance'|'strength'):number|null {const text=raw.trim();if(!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text))return null;const n=Number(text),min=kind==='focusDistance'?dofLimits.focusMin:0,max=kind==='focusDistance'?dofLimits.focusMax:1;return Number.isFinite(n)&&n>=min&&n<=max?n:null}
export const formatDof=(n:number)=>String(Number(n.toFixed(6)))
/** CSS pixels; same rectangle drives render letterboxing and click mapping. */
export function shootingFrame(width:number,height:number,aspect:number){const w=Math.min(width,height*aspect),h=w/aspect;return{x:(width-w)/2,y:(height-h)/2,width:w,height:h}}
export function shootingPoint(x:number,y:number,width:number,height:number,aspect:number){const frame=shootingFrame(width,height,aspect);if(x<frame.x||x>frame.x+frame.width||y<frame.y||y>frame.y+frame.height)return null;return{x:(x-frame.x)/frame.width*2-1,y:1-(y-frame.y)/frame.height*2}}

/** Map CSS pointer coordinates to the actual integer framebuffer viewport, including DPR and canvas CSS scaling. */
export function shootingViewportPoint(x:number,y:number,cssWidth:number,cssHeight:number,bufferWidth:number,bufferHeight:number,viewport:readonly number[]){const px=x/cssWidth*bufferWidth,py=(1-y/cssHeight)*bufferHeight,[vx,vy,w,h]=viewport;if(!(w>0&&h>0)||px<vx||px>vx+w||py<vy||py>vy+h)return null;return{x:(px-vx)/w*2-1,y:(py-vy)/h*2-1}}

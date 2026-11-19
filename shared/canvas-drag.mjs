// Pointer previews are local. Only finishCanvasDrag creates one shared node.move.
export const CANVAS_DRAG_EXCLUSIONS='button,input,textarea,select,option,video[controls],audio,summary,a[href],[contenteditable]:not([contenteditable="false"]),[role="slider"],[data-canvas-no-drag],.nodrag,.react-flow__handle,.node-port';
const position=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Math.abs(p.x)<=100000&&Math.abs(p.y)<=100000;
const copy=p=>({x:p.x,y:p.y});
export function isCanvasDragTarget(target){const element=typeof target?.closest==='function'?target:target?.parentElement;return !!element&&typeof element.closest==='function'&&!element.closest(CANVAS_DRAG_EXCLUSIONS);}
export function canvasDragContext(state){const g=state?.graph;if(!g||typeof state.libraryId!=='string'||!state.libraryId||typeof state.rootLabel!=='string'||!g.projectId||!g.graphId||!Number.isInteger(g.revision))return null;return {libraryId:state.libraryId,rootLabel:state.rootLabel,copyId:state.copyId??state.studioOwner?.copyId??null,projectId:g.projectId,graphId:g.graphId,revision:g.revision};}
export function sameCanvasDragContext(context,state){const next=canvasDragContext(state);return !!context&&!!next&&Object.keys(context).every(k=>context[k]===next[k]);}
export function beginCanvasDrag(state,flowNodes,gesture=null){const pointerStart=gesture?canvasDragPointer(gesture):null;if(gesture&&!pointerStart)return null;const context=canvasDragContext(state);if(!context||!Array.isArray(flowNodes)||!flowNodes.length)return null;const before={},positions={};for(const {id}of flowNodes){const n=state.graph.nodes.find(n=>n.id===id);if(!n||!position(n.position)||before[id])return null;before[id]=copy(n.position);positions[id]=copy(n.position);}return {context,before,positions,phase:'dragging',...(gesture?{pointerStart}: {})};}
export function updateCanvasDrag(session,flowNodes){if(!session)return null;const positions={...session.positions};for(const n of flowNodes)if(Object.hasOwn(session.before,n.id)&&n.position)positions[n.id]=copy(n.position);return {...session,positions};}
export function canvasDragConflict(session,state){if(!sameCanvasDragContext(session?.context,state))return 'CONTEXT_CHANGED';for(const [id,p]of Object.entries(session.before)){const current=state.graph.nodes.find(n=>n.id===id);if(!current)return 'NODE_MISSING';if(current.position.x!==p.x||current.position.y!==p.y)return 'SOURCE_MOVED';if(!position(session.positions[id]))return 'POSITION_LIMIT';}return null;}
export function projectCanvasDrag(session,state){return session&&!canvasDragConflict(session,state)?Object.fromEntries(Object.entries(session.positions).map(([id,p])=>[id,copy(p)])):null;}
export function finishCanvasDrag(session,state,flowNodes=[],gesture=null){const final=updateCanvasDrag(session,flowNodes);if(!final)return {status:'cancelled',operation:null};const conflict=canvasDragConflict(final,state);if(conflict)return {status:'conflict',reason:conflict,operation:null};if(final.pointerStart&&!hasCanvasDragIntent(final.pointerStart,canvasDragPointer(gesture)))return {status:'unchanged',operation:null};const moves=Object.entries(final.positions).filter(([id,p])=>p.x!==final.before[id].x||p.y!==final.before[id].y).map(([nodeId,p])=>({nodeId,position:copy(p)}));return {status:moves.length?'ready':'unchanged',context:final.context,session:{...final,phase:'committing'},operation:moves.length?{type:'node.move',moves}:null};}
// No debounce: a save/action waits for the exact pending move's receipt. A new
// gesture cannot silently replace an in-flight one or inherit its revision.
export function createCanvasMoveBarrier(){let pending=null;return {busy:()=>!!pending,settle:()=>pending??Promise.resolve(true),run(work){if(pending)return Promise.reject(Object.assign(new Error('上一次位置仍在確認，請稍後移動'),{code:'CANVAS_MOVE_BUSY'}));let result;try{result=work();}catch(e){result=Promise.reject(e);}const tracked=Promise.resolve(result).finally(()=>{if(pending===tracked)pending=null;});pending=tracked;return tracked;}};}

// Capture only an unfinished pointer gesture. Committed receipts and native editor
// Escape handling remain outside this cancellation guard.
export function shouldCancelCanvasDrag(event,session){return session?.phase==='dragging'&&event?.key==='Escape'&&!event.isComposing&&event.keyCode!==229;}

// Selection membership is unordered. Preserve the previous array and focus order
// when the store reports the same set in its own iteration order. Explicit causal
// ordering is maintained independently by contextOrder.
export function reconcileCanvasSelection(previous,ids){const next=[...new Set(ids)];return previous.length===next.length&&next.every(id=>previous.includes(id))?previous:next;}

// React Flow select-change batches are authoritative. Store selection callbacks
// can observe an intermediate controlled frame and must not write selection back.
export function applyCanvasSelectionChanges(previous,changes){const next=new Set(previous);for(const c of changes)if(c.type==='select'){if(c.selected)next.add(c.id);else next.delete(c.id);}return reconcileCanvasSelection(previous,[...next]);}

// XYFlow may coalesce a fast drag to a single mousemove. Track from down,
// but retain its original strict >1 CSS-pixel commit threshold in screen space.
export function canvasDragPointer(event){const p=event?.touches?.[0]??event?.changedTouches?.[0]??event;return p&&Number.isFinite(p.clientX)&&Number.isFinite(p.clientY)?{x:p.clientX,y:p.clientY}:null;}
export function hasCanvasDragIntent(start,end){return !!start&&!!end&&[start.x,start.y,end.x,end.y].every(Number.isFinite)&&Math.hypot(end.x-start.x,end.y-start.y)>1;}

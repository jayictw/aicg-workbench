// GUI automatic placement only. Explicit user points and existing nodes are untouched.
const LIMIT=100000,CLEARANCE=24,MAX_CANDIDATES=120;
export function cardFootprint(kind,payload={}){
 if(kind==='compose.video')return {width:360,height:650+Math.ceil((payload.edit?.clips?.length??0)/3)*30};
 if(kind==='generate.video')return {width:350,height:430};
 if(kind==='asset.video')return {width:350,height:350};
 if(kind==='asset.audio')return {width:300,height:220};
 if(['text','prompt','asset.text'].includes(kind))return {width:280,height:300};
 return {width:300,height:330};
}
const point=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Math.abs(p.x)<=LIMIT&&Math.abs(p.y)<=LIMIT;
const dimensions=v=>v&&Number.isFinite(v.width)&&Number.isFinite(v.height)&&v.width>0&&v.height>0&&v.width<=20000&&v.height<=20000;
const collides=(a,b)=>a.x<b.x+b.width+CLEARANCE&&a.x+a.width+CLEARANCE>b.x&&a.y<b.y+b.height+CLEARANCE&&a.y+a.height+CLEARANCE>b.y;
export function findFreePosition(anchor,nodes,measurements,kind='generate.image',payload={}){
 if(!point(anchor)||!Array.isArray(nodes))return null;
 const size=cardFootprint(kind,payload),occupied=[];
 for(const node of nodes){if(!point(node.position))return null;const fallback=cardFootprint(node.kind,node.payload),observed=measurements?.[node.id];occupied.push({...node.position,width:Math.max(fallback.width,dimensions(observed)?observed.width:0),height:Math.max(fallback.height,dimensions(observed)?observed.height:0)});}
 for(let i=0;i<MAX_CANDIDATES;i++){
  const candidate={x:anchor.x+(i%4)*(size.width+40),y:anchor.y+Math.floor(i/4)*(size.height+60)};
  if(point(candidate)&&!occupied.some(old=>collides({...candidate,...size},old)))return candidate;
 }
 return null; // Never silently return an occupied fallback after exhausting the search.
}
export function chooseImportPosition({relocateId,explicitPosition,nodes},automatic){
 // Relocation restores fixed bytes; it never creates or moves a card.
 if(relocateId){const node=nodes.find(n=>n.payload?.mediaVersionId===relocateId);return node&&point(node.position)?{x:node.position.x,y:node.position.y}:{x:0,y:0};}
 return explicitPosition??automatic();
}
export function chooseCatalogPosition({catalog,projectId,nodes,mediaVersions},automatic){
 // Match the service's existing-reference lookup before searching for a new card position.
 if(!catalog)return null;
 let existing=catalog.projectId===projectId?nodes.find(n=>n.id===catalog.nodeId):null;
 if(!existing&&catalog.kind==='asset')existing=nodes.find(n=>n.payload?.assetId===catalog.id&&mediaVersions[n.payload?.mediaVersionId]?.sha256===catalog.metadata.sha256);
 if(existing)return point(existing.position)?{x:existing.position.x,y:existing.position.y}:null;
 return automatic('asset.'+catalog.metadata.type);
}

// Explicit existing-node arrangement. Positions are committed only by node.move;
// unselected boxes, stable IDs, edge bindings and prompt text remain untouched.
/** @param {any} graph @param {string[]} nodeIds @param {{measurements?:any}} options */
export function arrangeNodes(graph,nodeIds,{measurements=null}={}){
 const fail=()=>{throw Object.assign(Error('請選取目前畫布中不重複的節點；未修改任何位置。'),{code:'LAYOUT_SELECTION'});};
 if(!Array.isArray(nodeIds)||!nodeIds.length||nodeIds.length>graph.nodes.length||new Set(nodeIds).size!==nodeIds.length)fail();
 const selected=new Set(nodeIds),nodes=graph.nodes.filter(n=>selected.has(n.id));if(nodes.length!==selected.size)fail();
 const measured=measurements?.projectId===graph.projectId&&measurements?.graphId===graph.graphId&&measurements?.graphRevision===graph.revision?measurements.byId:null;
 const size=n=>{const base=cardFootprint(n.kind,n.payload),observed=measured?.[n.id];return {width:Math.max(base.width,dimensions(observed)?observed.width:0),height:Math.max(base.height,dimensions(observed)?observed.height:0)};};
 const occupied=graph.nodes.filter(n=>!selected.has(n.id)).map(n=>({...n.position,...size(n)}));
 const columns=Math.ceil(Math.sqrt(nodes.length)),width=Math.max(...nodes.map(n=>size(n).width)),height=Math.max(...nodes.map(n=>size(n).height));
 const anchor={x:Math.min(...nodes.map(n=>n.position.x)),y:Math.min(...nodes.map(n=>n.position.y))},moves=[];
 for(const [i,n]of nodes.entries()){
  const box={x:anchor.x+(i%columns)*(width+160),y:anchor.y+Math.floor(i/columns)*(height+70),...size(n)};
  for(let step=0;;step++){
   if(!point(box)||step>occupied.length+1)throw Object.assign(Error('座標範圍內沒有安全排列空間；全部位置保持不變。'),{code:'LAYOUT_SPACE'});
   const hits=occupied.filter(other=>collides(box,other));if(!hits.length)break;box.y=Math.max(...hits.map(other=>other.y+other.height))+70;
  }
  occupied.push(box);if(box.x!==n.position.x||box.y!==n.position.y)moves.push({nodeId:n.id,position:{x:box.x,y:box.y}});
 }
 return moves;
}

/** Reserve only new import boxes; fixed existing nodes are immutable obstacles.
 * @param {any} graph @param {number} count @param {{x:number,y:number}} anchor @param {{measurements?:any}} options */
export function batchImportPositions(graph,count,anchor,{measurements=null}={}){
 if(!Number.isInteger(count)||count<1||count>50||!point(anchor))throw Object.assign(Error('本批導入數量或起點無效。'),{code:'BATCH_SPACE'});
 const observed=measurements?.projectId===graph.projectId&&measurements?.graphId===graph.graphId&&measurements?.graphRevision===graph.revision?measurements.byId:null;
 const occupied=graph.nodes.map(n=>{const base=cardFootprint(n.kind,n.payload),m=observed?.[n.id];return {...n.position,width:Math.max(base.width,dimensions(m)?m.width:0),height:Math.max(base.height,dimensions(m)?m.height:0)};}),positions=[];
 for(let i=0;i<count;i++){const box={x:anchor.x+i%5*410,y:anchor.y+Math.floor(i/5)*420,width:350,height:350};for(let tries=0;;tries++){if(!point(box)||tries>occupied.length+1)throw Object.assign(Error('附近沒有安全的導入空間；舊框未變。'),{code:'BATCH_SPACE'});const hits=occupied.filter(other=>collides(box,other));if(!hits.length)break;box.y=Math.max(...hits.map(other=>other.y+other.height))+70;}occupied.push(box);positions.push({x:box.x,y:box.y});}return positions;
}

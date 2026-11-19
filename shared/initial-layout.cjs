'use strict';
// Initial positions only. Existing graph positions are immutable inputs.
// Semantic lanes grow from the real occupied graph; no UUID/coordinate sorting
// is interpreted as playback order, and no layout is saved outside commands.
const H_GAP=160,V_GAP=70,CLEARANCE=24,MAX=100000;
function lane(kind){if(['text','prompt'].includes(kind))return -1;if(kind.startsWith('asset.'))return 0;if(kind==='generate.image')return 1;if(kind==='generate.video')return 2;if(kind==='compose.video')return 3;return 4;}
function bounds(node,measured){
 if(measured&&[measured.width,measured.height].every(n=>Number.isFinite(n)&&n>0&&n<=20000))return {width:measured.width,height:measured.height};
 const kind=node.kind??'',clips=node.payload?.edit?.clips?.length??0;
 if(kind==='compose.video')return {width:360,height:650+Math.ceil(clips/3)*30+((node.payload?.versions?.length??0)>1?node.payload.versions.length*48:0)};
 if(['text','prompt'].includes(kind))return {width:280,height:300};
 if(kind==='generate.video')return {width:350,height:430};
 if(kind.endsWith('.video'))return {width:350,height:350};
 if(kind.endsWith('.audio'))return {width:300,height:220};
 return {width:300,height:330};
}
function descriptor(op){
 if(op.type==='node.create')return {kind:op.kind,payload:{}};
 if(op.type==='asset.import')return {kind:'asset.'+op.metadata?.type,payload:{}};
 if(op.type==='video.create')return {kind:'generate.video',payload:{}};
 if(op.type==='composition.create')return {kind:'compose.video',payload:{edit:op.edit??{clips:(op.nodeIds??[]).map(nodeId=>({nodeId}))}}};
 return null;
}
// Bounded local placement scoring, not edge routing or a graph reflow. Existing
// node positions/ports/edge types remain untouched. Bezier samples only choose
// between safe new-card rows, at most 2520 graph units below its original row.
const ROUTE_SHIFT=2520,ROUTE_STEP=140,ROUTE_SAMPLES=32;
function portFraction(node,portId,role){
 const port=node.ports?.find(p=>p.id===portId),key=port?.key??role;
 if(node.kind==='compose.video')return key==='clips'||key==='clip'?.3:key==='audio'||key==='track'?.7:.5;
 if(port?.direction==='in'||node.kind==='generate.video'&&['firstFrame','lastFrame'].includes(key)){
  const inputs=node.ports?.filter(p=>p.direction==='in'&&!['produces','producer'].includes(p.key));
  const keys=inputs?.map(p=>p.key)??(node.kind==='generate.video'?['prompt','firstFrame','lastFrame','reference','videoRef','audioRef']:[]),i=keys.indexOf(key);
  if(i>=0)return keys.length===1?.5:(26+i*58/Math.max(1,keys.length-1))/100;
 }
 return .5;
}
function route(a,b,from=.5,to=.5){const x0=a.x+a.width,y0=a.y+a.height*from,x3=b.x,y3=b.y+b.height*to,d=x3-x0,offset=d>=0?d*.5:6.25*Math.sqrt(-d),x1=x0+offset,x2=x3-offset,points=[];for(let i=0;i<=ROUTE_SAMPLES;i++){const t=i/ROUTE_SAMPLES,u=1-t;points.push({x:u*u*u*x0+3*u*u*t*x1+3*u*t*t*x2+t*t*t*x3,y:u*u*u*y0+3*u*u*t*y0+3*u*t*t*y3+t*t*t*y3});}return points;}
function routeHits(points,box){
 // Segment clipping plus a small conservative margin avoids missing a curve
 // grazing a card corner between samples. Actual SVG paths are checked in QA.
 const minX=box.x-8,maxX=box.x+box.width+8,minY=box.y-8,maxY=box.y+box.height+8;
 for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];let low=0,high=1,hit=true;for(const [start,delta,min,max]of [[a.x,b.x-a.x,minX,maxX],[a.y,b.y-a.y,minY,maxY]]){if(delta===0){if(start<min||start>max){hit=false;break;}}else{const one=(min-start)/delta,two=(max-start)/delta;low=Math.max(low,Math.min(one,two));high=Math.min(high,Math.max(one,two));if(low>high){hit=false;break;}}}if(hit)return true;}
 return false;
}
function sourceLinks(op,node,existing){const links=[];const add=(id,role)=>{const source=existing.find(n=>n.id===id);if(source)links.push({source,to:portFraction(node,null,role)});};if(op.type==='composition.create'){for(const id of op.nodeIds??op.edit?.clips?.map(c=>c.nodeId)??[])add(id,'clips');for(const c of op.edit?.audio??[])add(c.nodeId,'audio');}else if(op.type==='video.create')for(const c of op.inputs??[])add(c.sourceNodeId,c.role);return links;}
function avoidRoutes(base,op,node,existing,occupied,oldRoutes){
 const incoming=sourceLinks(op,node,existing);if(!incoming.length&&!oldRoutes.length)return base;
 const score=box=>oldRoutes.filter(p=>routeHits(p,box)).length+incoming.reduce((sum,link)=>{const p=route(link.source,box,.5,link.to);return sum+occupied.filter(obstacle=>obstacle.id!==link.source.id&&routeHits(p,obstacle)).length;},0);
 let best=base,cost=score(base);if(!cost)return base;
 for(let dy=ROUTE_STEP;dy<=ROUTE_SHIFT;dy+=ROUTE_STEP){const candidate={...base,y:base.y+dy};if(candidate.y>MAX||occupied.some(b=>overlap(candidate,b)))continue;const next=score(candidate);if(next<cost){best=candidate;cost=next;if(!cost)break;}}
 return best;
}
const overlap=(a,b)=>a.x<b.x+b.width+CLEARANCE&&a.x+a.width+CLEARANCE>b.x&&a.y<b.y+b.height+CLEARANCE&&a.y+a.height+CLEARANCE>b.y;
function initialLayout(graph,operations,{measurements=null}={}){
 const ops=structuredClone(operations),fresh=ops.map((op,index)=>({op,index,node:descriptor(op)})).filter(x=>x.node);
 if(!fresh.length)return ops;
 const current=measurements&&measurements.projectId===graph.projectId&&measurements.graphId===graph.graphId&&measurements.graphRevision===graph.revision?measurements.byId:null;
 const existing=graph.nodes.map(n=>({id:n.id,kind:n.kind,ports:n.ports,x:n.position.x,y:n.position.y,...bounds(n,current?.[n.id])})),occupied=[...existing];
 const oldRoutes=(graph.edges??[]).map(e=>{const source=existing.find(n=>n.id===e.source?.nodeId),target=existing.find(n=>n.id===e.target?.nodeId);return source&&target?route(source,target,portFraction(source,e.source.portId),portFraction(target,e.target.portId,e.role)):null;}).filter(Boolean);
 const lanes=[...new Set([0,1,2,3,...existing.map(n=>lane(n.kind)),...fresh.map(x=>lane(x.node.kind))])].sort((a,b)=>a-b),left=new Map(),width=new Map();
 for(const key of lanes)width.set(key,Math.max(300,...existing.filter(n=>lane(n.kind)===key).map(n=>n.width),...fresh.filter(x=>lane(x.node.kind)===key).map(x=>bounds(x.node).width)));
 let previous=null;
 for(const key of lanes){
  const peers=existing.filter(n=>lane(n.kind)===key),lower=existing.filter(n=>lane(n.kind)<key),anchor=peers.length?Math.min(...peers.map(n=>n.x)):0;
  const minimum=previous===null?(key<0?-460:0):left.get(previous)+width.get(previous)+H_GAP;
  left.set(key,Math.max(minimum,anchor,...lower.map(n=>n.x+n.width+H_GAP)));previous=key;
 }
 const nextY=new Map();
 for(const {op,node}of fresh){
  const key=lane(node.kind),size=bounds(node),x=left.get(key),sources=(op.nodeIds??op.edit?.clips?.map(c=>c.nodeId)??[]).map(id=>existing.find(n=>n.id===id)).filter(Boolean);
  let y=Math.max(0,nextY.get(key)??0,sources.length?Math.min(...sources.map(n=>n.y)):0),tries=0;
  for(;;){if(++tries>occupied.length+2||Math.abs(x)>MAX||y>MAX||!Number.isFinite(x+y)){const e=Error('No safe initial layout space within canvas coordinate bounds; existing positions were preserved');e.code='INITIAL_LAYOUT_SPACE';throw e;}const box={x,y,...size},hits=occupied.filter(b=>overlap(box,b));if(!hits.length){const placed=avoidRoutes(box,op,node,existing,occupied,oldRoutes),position={x:placed.x,y:placed.y};op.position=position;occupied.push({...placed,kind:node.kind});nextY.set(key,placed.y+size.height+V_GAP);break;}y=Math.max(...hits.map(b=>b.y+b.height))+V_GAP;}
 }
 return ops;
}
module.exports={initialLayout,bounds,lane,overlap,H_GAP,V_GAP,CLEARANCE};

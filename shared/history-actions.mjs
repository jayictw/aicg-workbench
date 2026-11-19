const excluded=t=>t==='byteplus.run'||t.startsWith('composition.render.')||t.startsWith('run.')||t.startsWith('result.');
export function historyTarget(operations,direction){
 const chains=new Map(),roots=new Map();
 const ordered=Object.entries(operations??{}).sort((a,b)=>(a[1].receipt?.committedRevision??0)-(b[1].receipt?.committedRevision??0));
 ordered.forEach(([id,r],index)=>{if(!r?.patch?.length||typeof r.type!=='string')return;
  if(['undo','composition.undo'].includes(r.type)){const target=chains.get(r.undoTarget);if(!target)return;const root=roots.get(target.root),active=!target.active;Object.assign(root,{active,last:id,index,redo:!active});chains.set(id,{root:target.root,active});}
  else if(!excluded(r.type)){for(const root of roots.values())if(!root.active)root.redo=false;roots.set(id,{active:true,last:id,index,redo:false});chains.set(id,{root:id,active:true});}
 });
 return [...roots.values()].filter(r=>direction==='undo'?r.active:!r.active&&r.redo).sort((a,b)=>b.index-a.index)[0]?.last??null;
}

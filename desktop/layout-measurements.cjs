'use strict';
const {error}=require('./media.cjs');
function captureLayoutMeasurements(value,g){
 if(value.nodeBounds===undefined&&value.nodeBoundsRevision===undefined)return null;
 if(!Array.isArray(value.nodeBounds)||value.nodeBounds.length>g.nodes.length||!Number.isInteger(value.nodeBoundsRevision))throw error('LAYOUT_MEASUREMENTS','Invalid optional node dimensions');
 const byId=Object.create(null),ids=new Set(g.nodes.map(n=>n.id));
 for(const v of value.nodeBounds){if(!v||Object.keys(v).some(k=>!['id','width','height'].includes(k))||!ids.has(v.id)||Object.hasOwn(byId,v.id)||![v.width,v.height].every(n=>typeof n==='number'&&Number.isFinite(n)&&n>0&&n<=20000))throw error('LAYOUT_MEASUREMENTS','Node dimensions must belong to this graph and be finite positive values');byId[v.id]={width:v.width,height:v.height};}
 if(value.nodeBoundsRevision!==g.revision)return null;
 return {projectId:g.projectId,graphId:g.graphId,graphRevision:g.revision,byId};
}
module.exports={captureLayoutMeasurements};

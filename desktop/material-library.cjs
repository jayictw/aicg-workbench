'use strict';
const CATEGORIES=['character','product','scene','style','studio','reference'];
function categories(host,a){
 const g=host.data.business.canvasSection.graphs[a.projectId],n=g?.nodes.find(n=>n.id===a.nodeId);
 const origin=g&&n?require('./source-projection.cjs').frozenOrigin(host,a.projectId,n.id,a.mediaVersionId):null;
 if(origin?.studioSource&&!origin.lineageMismatch)return ['studio'];
 if(n?.classification)return [n.classification.kind];
 if(CATEGORIES.includes(n?.payload.intentPurpose))return [n.payload.intentPurpose];
 if(a.classifications?.length)return [...a.classifications];
 const asset=host.data.business.workspace.assets.find(x=>x.id===a.id),legacy=[...new Set((asset?.usages??[]).filter(x=>CATEGORIES.includes(x)))];
 return legacy.length?legacy:['generic'];
}
function catalogRows(host){return Object.values(host.data.business.canvasSection.catalog).map(a=>({...structuredClone(a),classifications:categories(host,a)}));}
function retainCatalogMetadata(host){
 const sec=host.data.business.canvasSection;
 for(const a of Object.values(sec.catalog)){
  a.classifications=categories(host,a);
  const g=sec.graphs[a.projectId],n=g?.nodes.find(n=>n.id===a.nodeId);
  if(n?.importSource)a.originalImport=structuredClone(n.importSource);
  const versions=new Map((a.versions??[]).map(v=>[v.mediaVersionId,v]));
  for(const [mediaVersionId,m]of Object.entries(g?.mediaVersions??{}))if(m.assetId===a.id||a.kind==='result'&&m.resultId===a.id)versions.set(mediaVersionId,{...versions.get(mediaVersionId),mediaVersionId,sha256:m.sha256,size:m.size,mime:m.mime,sourceProvenance:require('./source-projection.cjs').boundedSource(require('./source-projection.cjs').frozenOrigin(host,a.projectId,a.nodeId,mediaVersionId))});
  a.versions=[...versions.values()];a.currentVersionSource=a.versions.find(v=>v.mediaVersionId===a.mediaVersionId)?.sourceProvenance??null;
 }
}
function placementClassification(host,a){const list=categories(host,a);return list.length===1&&['character','product','scene','generic'].includes(list[0])?{kind:list[0],basis:list[0]==='generic'?'unspecified':'user'}:null;}
module.exports={categories,catalogRows,placementClassification,retainCatalogMetadata};

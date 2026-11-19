'use strict';
const {originForGraph,boundedSource}=require('./source-projection.cjs'),{error}=require('./media.cjs');
function resolved(host,g,nodeId,mid,pending){
 const n=g.nodes.find(n=>n.id===nodeId),m=g.mediaVersions[mid],previous=pending.findLast(p=>p.nodeId===nodeId&&p.provenanceVersions?.[mid]);
 if(previous){const v=previous.provenanceVersions[mid];return {sourceProvenance:structuredClone(v.sourceProvenance),reference:structuredClone(v.reference??null)};}
 const o=originForGraph(host,g,nodeId,mid);let sourceProvenance=o&&!o.lineageMismatch?boundedSource(o):null;
 if(!sourceProvenance)sourceProvenance={kind:'media-version',unknown:true,evidence:'No verified source record for these immutable bytes',original:{name:m?.name??n?.label??'media',sha256:m?.sha256,sourceId:mid}};
 sourceProvenance={...sourceProvenance,sourceProjectId:sourceProvenance.sourceProjectId??g.projectId,sourceNodeId:sourceProvenance.sourceNodeId??nodeId,sourceMediaVersionId:sourceProvenance.sourceMediaVersionId??mid};
 const catalog=host.data.business.canvasSection.catalog;let reference=null;
 const a=o?.kind==='catalog-reference'&&catalog[o.catalogId];
 if(a&&o.sourceMediaVersionId===a.mediaVersionId&&a.metadata.sha256===m?.sha256)reference={catalogId:a.id,sourceProjectId:a.projectId,sourceNodeId:a.nodeId,sourceMediaVersionId:a.mediaVersionId};
 if(!reference)for(const id of [m?.assetId,m?.resultId]){const a=catalog[id];if(a?.projectId===g.projectId&&a.nodeId===nodeId&&a.mediaVersionId===mid&&a.metadata.sha256===m?.sha256){reference={catalogId:a.id,sourceProjectId:a.projectId,sourceNodeId:a.nodeId,sourceMediaVersionId:a.mediaVersionId};break;}}
 return {sourceProvenance,reference};
}
function capture(host,before,after,op,pending){
 const old=before.nodes.find(n=>n.id===op.nodeId),next=after.nodes.find(n=>n.id===op.nodeId);if(!old?.kind.startsWith('asset.')||!next||old.payload.mediaVersionId===next.payload.mediaVersionId)return;
 const oldMid=old.payload.mediaVersionId,mid=next.payload.mediaVersionId,raw=host.data.business.canvasSection.originLinks[before.projectId]?.[old.id],last=pending.findLast(p=>p.nodeId===old.id),versions=structuredClone(last?.provenanceVersions??raw?.provenanceVersions??{});
 if(!versions[oldMid])versions[oldMid]={sha256:before.mediaVersions[oldMid].sha256,...resolved(host,before,old.id,oldMid,pending)};
 const source=op.type==='asset.use'?resolved(host,before,op.sourceNodeId,op.mediaVersionId,pending):{sourceProvenance:{kind:'replacement-media',unknown:true,evidence:'Replacement bytes are verified; no source identity was supplied',original:{name:after.mediaVersions[mid].name??next.label,sha256:after.mediaVersions[mid].sha256,sourceId:mid}},reference:null};
 versions[mid]={sha256:after.mediaVersions[mid].sha256,...source};if(Object.keys(versions).length>256)throw error('SOURCE_LINEAGE_LIMIT','Material retains 256 source versions; no old version was discarded');
 pending.push({kind:'material-version',nodeId:old.id,mediaVersionId:mid,sha256:after.mediaVersions[mid].sha256,sourceMediaVersionId:source.reference?.sourceMediaVersionId??null,sourceProvenance:source.sourceProvenance,provenanceVersions:versions});
}
module.exports={capture,resolved};

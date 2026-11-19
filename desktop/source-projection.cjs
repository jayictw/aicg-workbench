'use strict';
// One read-only projection for the GUI and Canvas Context Snapshot.
const CURRENT_FIELDS=['original','studioSource','stageSource','stageSelection','storyboardSource','storyboardSnapshot','sourceLibraryId','sourceTaskId','sourceRevision','sourceVersion'];
const PROVENANCE_FIELDS=['kind',...CURRENT_FIELDS,'fullName','sourceProjectId','sourceNodeId','sourceMediaVersionId','unknown','evidence'];
function boundedSource(o){if(!o)return null;return Object.fromEntries(PROVENANCE_FIELDS.filter(k=>o[k]!==undefined).map(k=>[k,structuredClone(o[k])]));}
function originForGraph(host,g,nodeId,mediaVersionId){
 const projectId=g.projectId,sec=host.data.business.canvasSection,node=g.nodes.find(n=>n.id===nodeId),raw=sec.originLinks[projectId]?.[nodeId]??(node?.importSource?{kind:node.importSource.kind,original:node.importSource}:null);
 if(!raw)return null;
 const origin=structuredClone(raw);
 const media=g.mediaVersions[mediaVersionId??node?.payload.mediaVersionId];
 const requestedVersion=mediaVersionId??node?.payload.mediaVersionId,versionRecord=origin.provenanceVersions?.[requestedVersion];
 if(versionRecord){
  origin.sourceProvenance=structuredClone(versionRecord.sourceProvenance);origin.provenanceMediaSha256=versionRecord.sha256;origin.resolvedProvenanceVersionId=requestedVersion;
  for(const k of CURRENT_FIELDS)origin[k]=structuredClone(versionRecord.sourceProvenance?.[k]??null);
  for(const k of ['sourceProjectId','sourceNodeId','sourceMediaVersionId'])origin[k]=versionRecord.sourceProvenance?.[k]??null;
  if(Object.hasOwn(versionRecord,'reference')){
   const ref=versionRecord.reference;
   if(ref){Object.assign(origin,structuredClone(ref),{kind:'catalog-reference',boundMediaVersionId:requestedVersion});}
   else{origin.kind='material-version';for(const k of ['catalogId','boundMediaVersionId'])delete origin[k];}
  }
  origin.lineageUnavailable=!versionRecord.sourceProvenance||!!versionRecord.sourceProvenance.unknown;
  origin.unknown=origin.lineageUnavailable;origin.evidence=versionRecord.sourceProvenance?.evidence??null;
 }
 const expected=origin.provenanceMediaSha256??origin.original?.sha256??origin.studioSource?.pngSha256;
 if(expected)origin.provenanceMediaSha256=expected;
 if(expected&&media?.sha256!==expected){origin.historicalProvenance={...boundedSource(origin),mediaSha256:expected};for(const k of CURRENT_FIELDS)origin[k]=null;origin.sourceProvenance=null;origin.lineage=null;origin.unknown=true;origin.lineageMismatch=true;origin.lineageUnavailable=true;origin.lineagePolicy='Current bytes changed; historical source is retained but is not provenance of these bytes.';return origin;}
 // New catalog references freeze lineage at placement. Old references can show the
 // original saved metadata, but never imply that current catalog bytes are pinned.
 if(origin.kind==='catalog-reference'){
  const inherited=origin.sourceProvenance;
  if(inherited&&expected){origin.lineage=structuredClone(inherited);for(const k of CURRENT_FIELDS)origin[k]??=structuredClone(inherited[k]??null);}
  else{origin.lineageUnavailable=true;}
 }
 return origin;
}
function frozenOrigin(host,projectId,nodeId,mediaVersionId){const g=host.data.business.canvasSection.graphs[projectId];return g?originForGraph(host,g,nodeId,mediaVersionId):null;}
function sourceRows(host){
 const sec=host.data.business.canvasSection,rows=[];
 for(const [projectId,g] of Object.entries(sec.graphs))for(const n of g.nodes){
  const o=frozenOrigin(host,projectId,n.id);if(!o?.stageSource&&!o?.studioSource&&!o?.storyboardSource&&!o?.historicalProvenance?.stageSource&&!o?.historicalProvenance?.studioSource&&!o?.historicalProvenance?.storyboardSource)continue;
  const media=g.mediaVersions[n.payload.mediaVersionId],source=o.storyboardSource??o.studioSource??o.stageSource??o.historicalProvenance?.studioSource??o.historicalProvenance?.stageSource??o.historicalProvenance?.storyboardSource;
  rows.push({id:projectId+':'+n.id,projectId,nodeId:n.id,humanCode:n.humanCode,name:o.fullName??n.label,kind:o.storyboardSource||o.historicalProvenance?.storyboardSource?'storyboard':'studio',boardName:o.storyboardSnapshot?.boardName??null,origin:o,source,lineageMismatch:!!o.lineageMismatch,mediaVersionId:n.payload.mediaVersionId??null,sha256:media?.sha256??null,unmappedInputs:o.unmappedInputs??[],policy:'frozen-saved-source; no source writeback or generation'});
 }
 return rows;
}
function placementProvenance(host,a){
 let o=a.projectId&&a.nodeId?frozenOrigin(host,a.projectId,a.nodeId,a.mediaVersionId):a.legacyOrigin??null;
 // A catalog item survives removal of its original canvas node. Resolve only its
 // immutable MID/hash proof, never the current version of another node/source.
 const saved=a.versions?.find(v=>v.mediaVersionId===a.mediaVersionId&&v.sha256===a.metadata?.sha256)?.sourceProvenance;
 if((!o||o.lineageMismatch)&&saved&&!saved.unknown){const expected=saved.original?.sha256??saved.studioSource?.pngSha256;if(expected===a.metadata?.sha256)o=saved;}
 if(!o)return null;
 // A fixed-size immutable record; never recursively serialize an unbounded chain.
 return boundedSource(o);
}
function reboundProvenance(link,{mediaVersionId,sha256,sourceProvenance,sourceMediaVersionId}){
 const versions=structuredClone(link.provenanceVersions??{});
 if(link.boundMediaVersionId&&!versions[link.boundMediaVersionId])versions[link.boundMediaVersionId]={sha256:link.provenanceMediaSha256??link.sha256,sourceProvenance:structuredClone(link.sourceProvenance??null),reference:link.catalogId?{catalogId:link.catalogId,sourceProjectId:link.sourceProjectId,sourceNodeId:link.sourceNodeId,sourceMediaVersionId:link.sourceMediaVersionId}:null};
 versions[mediaVersionId]={sha256,sourceProvenance:structuredClone(sourceProvenance),reference:link.catalogId?{catalogId:link.catalogId,sourceProjectId:link.sourceProjectId,sourceNodeId:link.sourceNodeId,sourceMediaVersionId:sourceMediaVersionId??link.sourceMediaVersionId}:null};
 if(Object.keys(versions).length>256){const e=Error('此引用已保留256個凍結來源版本；原歷史未丟棄，請另建素材引用');e.code='SOURCE_LINEAGE_LIMIT';throw e;}
 return versions;
}
module.exports={frozenOrigin,originForGraph,boundedSource,sourceRows,placementProvenance,reboundProvenance};

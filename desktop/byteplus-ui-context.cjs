 'use strict';
// Read-only inventory of currently owned immutable versions. No edge mutation,
// upload, URL invention or acceptance of unviewed/unaccepted generated results.
function byteplusMaterials(s,nodeId,now=Date.now()){
 const out=[];
 for(const n of s.graph.nodes){
  if(n.id===nodeId)continue;
  let version,owned;
  if(n.kind.startsWith('asset.')){version=n.payload.mediaVersionId;owned=s.graph.mediaVersions[version]?.assetId===n.payload.assetId;}
  else if(n.kind.startsWith('generate.')){const result=s.graph.results[n.payload.selectedResultId];if(result?.acceptance){version=result.mediaVersionId;owned=s.graph.mediaVersions[version]?.resultId===result.id;}}
  const m=version&&s.graph.mediaVersions[version];if(!owned||!m||!['image','video','audio'].includes(m.type))continue;
  // A broken unselected source must not break unrelated Provider contexts.
  // Previously selected missing versions remain stale and fail at preview.
  try{s.checkMediaBytes(m);}catch{continue;}
  const fields=m.type==='image'?['width','height']:m.type==='video'?['width','height','durationMs','fps']:['durationMs'];
  out.push({label:n.label,reference:{assetNodeId:n.id,mediaVersionId:version,contentSha256:m.sha256,byteSize:m.size,mimeType:m.mime,mediaKind:m.type,role:{image:'REFERENCE_IMAGE',video:'REFERENCE_VIDEO',audio:'REFERENCE_AUDIO'}[m.type],sequenceIndex:0,source:{kind:'project',sourceId:version,createdAtMs:now,expiresAtMs:null},availability:{availableFromMs:0,expiresAtMs:null},metadata:Object.fromEntries(fields.map(k=>[k,m[k]]))}});
 }
 return out;
}
module.exports={byteplusMaterials};

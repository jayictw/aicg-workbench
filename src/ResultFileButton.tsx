import {ui,useUiLocale,uiError} from '../shared/ui-locale.mjs';
import React from 'react';
type Graph=Record<string,any>;
export function ResultFileButton({g,nodeId,resultId,mediaVersionId}:{g:Graph,nodeId:string,resultId:string,mediaVersionId:string}){useUiLocale(React);
 const [error,setError]=React.useState(''),[busy,setBusy]=React.useState(false);
 const request={projectId:g.projectId,graphId:g.graphId,nodeId,resultId,mediaVersionId,expectedRevision:g.revision};
 return <><button type="button" disabled={busy} data-result-file-action="reveal" data-project-id={g.projectId} data-graph-id={g.graphId} data-node-id={nodeId} data-result-id={resultId} data-media-version-id={mediaVersionId} data-expected-revision={g.revision} onClick={async()=>{setBusy(true);setError('');try{const r=await (window as any).canvasAPI.resultReveal(request);if(!r.ok)setError(r.error?.message??'無法開啟此結果位置');}catch{setError('無法開啟此結果位置');}finally{setBusy(false);}}}>{ui("開啟檔案位置")}</button>{error&&<div role="alert">{uiError(React,error)}</div>}</>;
}

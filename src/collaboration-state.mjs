export function collaborationSummary(state,readError=''){
 const b=state?.broker,t=state?.transport,warning=t?.sessionTiming?.warningMinutes;
 const phase=readError?'unknown':b?.authorized?(warning?'expiring':'connected'):t?.prepared?'connecting':t?.endedReason==='expired'?'expired':t?.endedReason?'stopped':'idle';
 const labels={unknown:'Codex 狀態待確認',connected:'Codex 已連接',expiring:'Codex 即將到期',connecting:'Codex 連線中',expired:'Codex 已到期',stopped:'Codex 已停止',idle:'Codex 未連接'};
 return {phase,label:labels[phase],pending:(b?.proposals??[]).filter(p=>p.status==='pending').length+(b?.imageBatches??[]).filter(p=>p.status==='proposed').length};
}
export function collaborationNotice(state,error=''){
 const t=state?.transport,s=t?.sessionTiming,stamp=t?.expiresAt??t?.endedAt??'idle';
 if(t?.endedReason==='expired')return {key:`${t.endedAt}:expired`,kind:'warning',text:'Codex 協作已到期，舊提案不可套用。'};
 if(s?.warningMinutes)return {key:`${s.expiresAt}:warning:${s.warningMinutes}`,kind:'warning',text:`Codex 協作將在 ${s.warningMinutes} 分鐘內到期。`};
 if(error||t?.lastError)return {key:`${stamp}:error:${error||t.lastError}`,kind:'error',text:'這次操作遇到問題，請查看協作詳情。'};
 if(t?.endedReason&&!['disconnected','initiating-channel-closed'].includes(t.endedReason))return {key:`${t.endedAt}:ended:${t.endedReason}`,kind:'error',text:'Codex 連線已中止，請查看協作詳情。'};
 return null;
}
export function friendlyCollaborationError(value){
 if(/REVISION_CONFLICT|PREVIEW_CHANGED/.test(value))return '畫布或預覽已更新，請讓 Codex 重新提出修改。';
 if(/SCOPE_EXPIRED|PROPOSAL_INVALID|NOT_CONNECTED/.test(value))return '這次協作或提案已失效，請重新連接後再預覽。';
 if(/PREVIEW_CLICK_REQUIRED/.test(value))return '請在修改預覽按「確認修改」。';
 if(/DRAFT_UNSAVED/.test(value))return '請先完成或取消正在編輯的文字。';
 return '操作未完成，畫布沒有因此自動保存。請查看協作狀態後再試。';
}
export function previewContent(side){
 if(side?.media){const m=side.media;return [m.name||({image:'圖片素材',video:'影片素材',audio:'音訊素材'}[m.type]??'素材'),m.width&&m.height?`${m.width} × ${m.height}`:null,m.size?`${Math.ceil(m.size/1024)} KB`:null].filter(Boolean).join(' · ');}
 return side?.text||'（空白）';
}

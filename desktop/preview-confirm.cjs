'use strict';
const {hash}=require('./media.cjs');
function assertTrustedRenderer(event,win){if(event.sender!==win?.webContents||event.senderFrame!==win.webContents.mainFrame||!event.senderFrame.url.startsWith('canvas://app/'))throw Error('IPC sender rejected');}
function previewDigest(broker,p){return hash(broker.s.core.canonical({proposalId:p.id,expectedRevision:p.expectedRevision,epoch:p.epoch,session:p.session,diff:p.diff}));}
async function applyConfirmedPreview(broker,request,{hasDraft=false}={}){
 const fields=['proposalId','expectedRevision','previewDigest','confirmation'];
 if(!request||typeof request!=='object'||Array.isArray(request)||Object.keys(request).length!==fields.length||fields.some(k=>!Object.hasOwn(request,k))||typeof request.proposalId!=='string'||!Number.isSafeInteger(request.expectedRevision)||!/^([a-f0-9]{64})$/.test(request.previewDigest)||request.confirmation!=='trusted-preview-click/1')throw Object.assign(Error('請從修改預覽確認這次修改'),{code:'PREVIEW_CLICK_REQUIRED'});
 const p=broker.proposals.get(request.proposalId);if(!p)throw Object.assign(Error('這份提案已不可用，請重新預覽'),{code:'MCP_PROPOSAL_NOT_FOUND'});
 if(request.expectedRevision!==p.expectedRevision||request.previewDigest!==previewDigest(broker,p))throw Object.assign(Error('預覽已改變，請重新查看後確認'),{code:'PREVIEW_CHANGED'});
 if(hasDraft)throw Object.assign(Error('請先完成或取消正在編輯的文字'),{code:'DRAFT_UNSAVED'});
 return broker.apply(p.id);
}
module.exports={assertTrustedRenderer,previewDigest,applyConfirmedPreview};

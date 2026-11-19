'use strict';
const c=require('./d1-json.cjs'),sm=()=>require('./studio-model.cjs');
function validateDraft(d,taskId){
 c.keys(d,['version','mode','chosen','sourceJson','automaticText','adoptedText','outputId','referenceSha256']);
 if(d.version!==1||!['BASE','A','B','C'].includes(d.mode)||typeof d.chosen!=='boolean'||!c.text(d.adoptedText,4096,{prompt:true,empty:true}))throw Error('C_STUDIO_INPUT');
 if(d.sourceJson===null){if(d.automaticText!==''||d.outputId!==null||d.referenceSha256!==null)throw Error('C_STUDIO_INPUT');return}
 const s=sm().source(d.sourceJson,taskId);if(s.id!==d.outputId||d.automaticText!==require('./model-description.cjs').modelDescription(s)||! /^[a-f0-9]{64}$/.test(d.referenceSha256))throw Error('C_STUDIO_INPUT');
}
module.exports={validateDraft};

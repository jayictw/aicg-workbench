'use strict';
function textContextItems(params,uiText=s=>s){
 if(!params.isEditable)return null;
 const flags=params.editFlags??{},password=params.inputFieldType==='password';
 return [
  {label:uiText('復原文字編輯'),role:'undo',enabled:!!flags.canUndo},
  {label:uiText('重做文字編輯'),role:'redo',enabled:!!flags.canRedo},
  {type:'separator'},
  {label:uiText('剪下'),role:'cut',enabled:!password&&!!flags.canCut},
  {label:uiText('複製'),role:'copy',enabled:!password&&!!flags.canCopy},
  {label:uiText('貼上'),role:'paste',enabled:!!flags.canPaste},
  {type:'separator'},
  {label:uiText('全選'),role:'selectAll',enabled:!!flags.canSelectAll},
 ];
}
module.exports={textContextItems};

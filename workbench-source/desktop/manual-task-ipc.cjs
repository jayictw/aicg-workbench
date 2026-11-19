'use strict';
function install({ipcMain,controller,getWindow}){
 for(const method of ['list','preview','send','stop'])ipcMain.handle('manual:'+method,async(e,r,...extra)=>{try{const win=getWindow();if(!win||e.sender!==win.webContents||e.senderFrame!==win.webContents.mainFrame||e.senderFrame.url!=='manual-app://app/index.html'||extra.length||!r||JSON.stringify(r).length>512)throw Error('MANUAL_SENDER');const keys=Object.keys(r).sort().join(',');if(keys!==(['list','stop'].includes(method)?'':method==='preview'?'id':'consent,id,previewDigest'))throw Error('MANUAL_SCHEMA');return {ok:true,value:method==='list'?controller.summary():method==='stop'?controller.stop():method==='preview'?controller.preview(r.id):await controller.send(r.id,r.previewDigest,r.consent)}}catch(error){return {ok:false,code:/^(MANUAL_|C_|UK_|DESTINATION_|NOT_A_|WRITER_|C_LEGACY_)/.test(error.code||error.message)?error.code||error.message:'MANUAL_FAILURE'}}});
}
module.exports={install};

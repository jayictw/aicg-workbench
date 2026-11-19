'use strict';
const c=require('./d1-json.cjs');
function install({ipcMain,sender,pipeline}){
 for(const method of ['info','configs','prepare','confirmAndSubmit','invalidate','inspect','recover','resume','queryOnce','poll','download','stop'])ipcMain.handle('seedance:'+method,async(e,r,...extra)=>{
  try{sender(e);if(extra.length||!r||Buffer.byteLength(JSON.stringify(r))>12000000)c.fail('VIDEO_IPC');return {ok:true,value:await pipeline[method](r)}}
  catch(error){const code=error.code||error.message;return {ok:false,code:/^(C_VIDEO_|C_D1_|UK_|CREDENTIAL_)/.test(code)?code:'C_VIDEO_FAILED'}}
 });
 return pipeline;
}
module.exports={install};

'use strict';
// Shared by the real fixed entry and program-only shell regression.
function create({authorize,pendingReceipt,inputOpen,createContext,runSix,onState=()=>{}}){
 let running=false,finished=false,context=null,summary=null;
 const publish=()=>onState({running,finished,context,summary});
 return async(...args)=>{
  let admitted=false;
  try{
   authorize(...args);
   if(pendingReceipt())return {ok:false,code:'SIX_KEY_RECEIPT_UNKNOWN'};
   if(running||finished||inputOpen())return {ok:false,code:'SIX_BUSY_OR_DONE'};
   admitted=true;running=true;publish();
   context=await createContext();publish();summary=await runSix(context);finished=true;publish();
   return {ok:true,value:summary};
  }catch(error){if(admitted)finished=true;return {ok:false,code:/^(SIX_|C_|UK_)/.test(error.code||error.message)?error.code||error.message:'SIX_RUN_FAILURE'}}
  finally{if(admitted){running=false;publish()}}
 };
}
module.exports={create};

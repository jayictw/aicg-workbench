'use strict';
function assertOwnerEntry({args,qa,autoId,env={},execArgv=[],hasSwitch=()=>false}){
 if(qa||autoId||env.C4_DIALOGUE_ENGINEERING_CDP==='1'||args.some(a=>a!=='--owner-four-image-batch')||['remote-debugging-port','remote-debugging-pipe','inspect','inspect-brk','inspect-port'].some(hasSwitch)||execArgv.some(a=>/--(?:inspect|remote-debugging)/i.test(a))||/--(?:inspect|remote-debugging)/i.test(env.NODE_OPTIONS??''))throw Object.assign(Error('OWNER_ENTRY_FIXED_NO_DEBUG'),{code:'OWNER_ENTRY_FIXED_NO_DEBUG'});
}
module.exports={assertOwnerEntry};

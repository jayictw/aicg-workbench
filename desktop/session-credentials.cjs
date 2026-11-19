'use strict';
// Host-only memory provider. There is deliberately no renderer/IPC/input entry.
// Default input authorization denies. A future isolated native input window must
// obtain its own explicit Owner input permit; fee approval alone is insufficient.
const {account,canonical,freeze,fail}=require('./live-policy.cjs');
function sessionCredentials({authorizeInput=()=>false,verifyDescriptor,clock=Date.now,maxUses=4}={}){
 if(!Number.isInteger(maxUses)||maxUses<1||maxUses>4)fail('LIVE_CREDENTIAL_LIMIT');
 let secret=null,descriptor=null,remaining=0,active=false,closed=false,deadlineTimer=null;
 function clear(){clearTimeout(deadlineTimer);deadlineTimer=null;secret=null;descriptor=null;remaining=0;closed=true;}
 function check(){if(closed||!secret||!descriptor||clock()>=descriptor.expiresAt){clear();fail('LIVE_ACCOUNT_NOT_CONNECTED');}}
 return Object.freeze({
  async acceptInput(value,metadata,permit){
   if(closed||secret||typeof value!=='string'||value.length<16||value.length>4096||/[\s\x00-\x1f\x7f]/.test(value))fail('LIVE_CREDENTIAL_INVALID');
   // No default or file/JSON switch can enable real secret input.
   let allowed=false;try{allowed=authorizeInput(permit)===true;}catch{}if(!allowed||typeof verifyDescriptor!=='function')fail('LIVE_INPUT_NOT_AUTHORIZED');
   let verified;try{verified=account(await verifyDescriptor(metadata),clock());}catch{fail('LIVE_ACCOUNT_OR_PRICE_UNVERIFIED');}
   try{allowed=authorizeInput(permit)===true;}catch{allowed=false;}if(closed||secret||!allowed)fail('LIVE_INPUT_NOT_AUTHORIZED');if(verified.expiresAt-clock()>7200000)fail('LIVE_ACCOUNT_OR_PRICE_UNVERIFIED');
   secret=value;descriptor=freeze(structuredClone(verified));remaining=maxUses;deadlineTimer=setTimeout(clear,Math.max(1,descriptor.expiresAt-clock()));deadlineTimer.unref?.();return {configured:true,remainingUses:maxUses,storage:'process-memory-only',account:structuredClone(descriptor)};
  },
  describe(){check();return structuredClone(descriptor);},
  async consume(expected,invoke){
   check();if(active||remaining<1||canonical(expected)!==canonical(descriptor)||typeof invoke!=='function')fail('LIVE_ACCOUNT_BINDING_CHANGED');
   remaining--;active=true;try{return await invoke(secret);}finally{active=false;if(!remaining)clear();}
  },
  clear,
  state(){if(descriptor&&clock()>=descriptor.expiresAt)clear();return {configured:!!secret&&!closed,remainingUses:remaining,active,storage:'process-memory-only'};}
 });
}
module.exports={sessionCredentials};

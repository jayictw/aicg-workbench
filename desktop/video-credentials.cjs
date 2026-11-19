'use strict';
const crypto=require('crypto'),{error}=require('./media.cjs');
function memoryCredentials({batchId,manifestDigest,environment,expiresAt,authorizeInput,maxPosts=2,clock=Date.now}){
 let key=null,closed=false,active=false,posts=0;const scope='video-memory-'+crypto.randomUUID();
 const clear=()=>{key=null;closed=true;clearTimeout(timer);};const timer=setTimeout(clear,Math.max(1,expiresAt-clock()));timer.unref?.();
 const check=()=>{if(closed||!key||clock()>=expiresAt){clear();throw error('VIDEO_CREDENTIAL_EXPIRED','本批記憶憑據已清除或到期');}};
 return Object.freeze({
  accept(value,permit){if(closed||key||typeof value!=='string'||value.length<16||value.length>4096||/[\s\x00-\x1f\x7f]/.test(value)||environment==='mock-http'&&!value.startsWith('SYNTHETIC-VIDEO-'))throw error('VIDEO_CREDENTIAL_INPUT','本演練只接受指定假Key；沒有接收真實Key');if(authorizeInput(permit)!==true)throw error('VIDEO_INPUT_NOT_AUTHORIZED','本次輸入窗或批次已失效');key=value;return {storage:'process-memory-only',accountScope:scope,accountIdentity:'unknown',remainingPosts:maxPosts};},
  async invoke(phase,invoke){check();if(active)throw error('VIDEO_CREDENTIAL_BUSY','同批只允許一個網路操作');if(phase==='submit'&&posts>=maxPosts)throw error('VIDEO_CREDENTIAL_LIMIT','本批提交次數已用完');if(phase==='submit')posts++;active=true;try{return await invoke(key);}finally{active=false;}},
  describe(){return {batchId,manifestDigest,environment,expiresAt,accountScope:scope,accountIdentity:'unknown',storage:'process-memory-only',configured:!!key&&!closed,postUses:posts,active};},clear
 });
}
module.exports={memoryCredentials};

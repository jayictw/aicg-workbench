'use strict';
const retryable=new Set(['STREAM_IDLE_TIMEOUT','STREAM_NETWORK','STREAM_HEADERS_TIMEOUT','STREAM_INCOMPLETE']);
async function completeWithResume(session,url,{wait,clock=Date.now,deadlineAt,stopped=()=>false,canAttempt=()=>true,onWaiting=()=>{}}){for(let attempt=0;attempt<2;attempt++){try{if(!canAttempt())throw Object.assign(Error(),{code:'STREAM_DOWNLOAD_LIMIT'});return await session.run(url);}catch(e){if(stopped()||!canAttempt()||attempt||!retryable.has(e.code)||clock()+60000>=deadlineAt)throw e;onWaiting(e);await wait(60000);}}}
module.exports={completeWithResume};

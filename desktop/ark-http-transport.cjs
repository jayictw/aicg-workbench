'use strict';
const {ENDPOINT,MODEL,fail}=require('./live-policy.cjs'),{hash,error}=require('./media.cjs');
const {createM8Agent,HOST}=require('./m8-socket-agent.cjs'),{createDiagnostic,safeRequestId}=require('./network-diagnostic.cjs');
const png=require('./vendor/m8-3a91/flash-png.cjs');
const SAFE_ERRORS=new Set(['LIVE_SUBMISSION_UNKNOWN','LIVE_STOPPED_BEFORE_POST','LIVE_TRANSPORT_NOT_SUBMITTED','LIVE_RESPONSE_ENCODING','LIVE_RESPONSE_LIMIT','LIVE_RESPONSE_TRUNCATED','LIVE_CREDENTIAL_INVALID','LIVE_APPROVAL_REQUIRED','LIVE_BATCH_EXPIRED','LIVE_BATCH_INPUT_CHANGED','LIVE_HOST_OWNERSHIP_LOST','LIVE_JOURNAL_FAILED']);
class ArkHttpTransport{
 constructor({request,agentFactory=createM8Agent,connectMs=5000,totalMs=120000,responseMax=png.RESPONSE_MAX,clock=Date.now}={}){
  if(!Number.isInteger(connectMs)||connectMs<1||connectMs>5000||!Number.isInteger(totalMs)||totalMs<1||totalMs>120000||!Number.isInteger(responseMax)||responseMax<1||responseMax>48*1024*1024)fail('LIVE_TRANSPORT_LIMIT');
  this.request=request??require('node:https').request;this.injectedRequest=!!request;this.agentFactory=agentFactory;this.clock=clock;this.limits={connectMs,totalMs,responseMax};
 }
 async send({body,bodyHash,credentialProvider,expectedAccount,authorize,onDispatch,signal,onDiagnostic}){
  if(!body||body.model!==MODEL||body.image!==undefined||body.size!=='1024x1024'||body.output_format!=='png'||body.response_format!=='b64_json'||body.watermark!==true||Object.keys(body).sort().join(',')!=='model,output_format,prompt,response_format,size,watermark'||hash(JSON.stringify(body))!==bodyHash)fail('LIVE_WIRE_CHANGED');
  if(!credentialProvider||typeof credentialProvider.consume!=='function')fail('LIVE_ACCOUNT_NOT_CONNECTED');const bytes=Buffer.from(JSON.stringify(body));if(bytes.length>20000)fail('LIVE_WIRE_LIMIT');
  let lastDiagnostic;
  try{return await credentialProvider.consume(expectedAccount,secret=>{
   if(typeof secret!=='string'||secret.length<16||secret.length>4096||/[\s\x00-\x1f\x7f]/.test(secret))fail('LIVE_CREDENTIAL_INVALID');authorize();if(signal?.aborted)fail('LIVE_STOPPED_BEFORE_POST');
   const diag=createDiagnostic(this.clock);diag.mark('predispatch','request-validated');
   return new Promise((resolve,reject)=>{
    let req,agent,settled=false,totalTimer,connectTimer;const chunks=[];
    const report=()=>{lastDiagnostic=diag.snapshot();try{onDiagnostic?.(lastDiagnostic);return true;}catch{return false;}};
    const finish=(code,category,value)=>{if(settled)return;settled=true;clearTimeout(totalTimer);clearTimeout(connectTimer);signal?.removeEventListener('abort',abort);lastDiagnostic=diag.finish(category);report();if(code){req?.destroy();agent?.destroy();reject(Object.assign(error(code,code),{submissionAttempted:diag.d.dispatchMarked,diagnostic:lastDiagnostic}));}else{agent?.destroy();resolve({...value,diagnostic:lastDiagnostic});}};
    const abort=()=>{diag.d.cancelled=true;finish(diag.d.dispatchMarked?'LIVE_SUBMISSION_UNKNOWN':'LIVE_STOPPED_BEFORE_POST','cancel');};
    try{
     if(!report())throw error('LIVE_JOURNAL_FAILED','LIVE_JOURNAL_FAILED');agent=this.agentFactory();
     connectTimer=setTimeout(()=>{diag.d.timeoutKind='connect';finish(diag.d.dispatchMarked?'LIVE_SUBMISSION_UNKNOWN':'LIVE_TRANSPORT_NOT_SUBMITTED','connect-timeout');},this.limits.connectMs);
     totalTimer=setTimeout(()=>{diag.d.timeoutKind='total';finish(diag.d.dispatchMarked?'LIVE_SUBMISSION_UNKNOWN':'LIVE_TRANSPORT_NOT_SUBMITTED','total-timeout');},this.limits.totalMs);
     req=this.request(ENDPOINT,{method:'POST',agent,rejectUnauthorized:true,minVersion:'TLSv1.2',maxHeaderSize:16384,headers:{Authorization:'Bearer '+secret,'Content-Type':'application/json','Content-Length':String(bytes.length),'Accept-Encoding':'identity'}},res=>{
      if(settled){res.destroy();return;}diag.d.responseHeadersReceived=true;diag.d.httpStatus=Number.isInteger(res.statusCode)&&res.statusCode>=100&&res.statusCode<=599?res.statusCode:null;diag.d.providerRequestId=safeRequestId(res.headers?.['x-request-id'],secret);diag.mark('response','headers-received');
      if(!report()){res.destroy();finish('LIVE_JOURNAL_FAILED','local-persistence');return;}
      if(!this.injectedRequest&&(!res.socket?.encrypted||!res.socket.authorized||res.socket.servername!==HOST)){res.destroy();finish('LIVE_SUBMISSION_UNKNOWN','tls');return;}
      const contentType=String(res.headers?.['content-type']??'').split(';')[0].trim().toLowerCase();
      if(res.headers?.['content-encoding']&&res.headers['content-encoding']!=='identity'){res.destroy();finish('LIVE_RESPONSE_ENCODING','encoding');return;}
      const declared=res.headers?.['content-length'];if(declared!==undefined&&(!/^\d+$/.test(String(declared))||Number(declared)>this.limits.responseMax)){res.destroy();finish('LIVE_RESPONSE_LIMIT','response-limit');return;}
      res.on('data',b=>{if(settled)return;if(!diag.d.responseBodyBytes)diag.mark('body','body-started');diag.d.responseBodyBytes+=b.length;if(diag.d.responseBodyBytes>this.limits.responseMax){res.destroy();finish('LIVE_RESPONSE_LIMIT','response-limit');return;}chunks.push(Buffer.from(b));});
      res.once('aborted',()=>finish('LIVE_SUBMISSION_UNKNOWN','body-interrupted'));res.once('error',e=>{diag.network(e?.code);finish('LIVE_SUBMISSION_UNKNOWN','body-interrupted');});
      res.once('end',()=>{if(settled)return;if(declared!==undefined&&Number(declared)!==diag.d.responseBodyBytes){finish('LIVE_RESPONSE_TRUNCATED','body-truncated');return;}diag.d.responseBodyComplete=true;diag.mark('body','body-complete');finish(null,diag.d.httpStatus===407?'proxy':diag.d.httpStatus===200?'none':'http',{status:res.statusCode,contentType,body:Buffer.concat(chunks),requestId:diag.d.providerRequestId});});
     });
     req.once('error',e=>{diag.network(e?.code);finish(diag.d.dispatchMarked?'LIVE_SUBMISSION_UNKNOWN':'LIVE_TRANSPORT_NOT_SUBMITTED');});
     req.once('finish',()=>{if(settled)return;diag.d.bodyWriteFinishedLocal=true;report();});
     req.once('socket',socket=>{if(settled)return;diag.d.socketAssigned=true;diag.mark('connect','socket-assigned');report();const secure=()=>{if(settled)return;clearTimeout(connectTimer);diag.d.tlsEstablished=true;diag.mark('connect','tls-established');report();};if(socket.authorized)secure();else socket.once('secureConnect',secure);});
     signal?.addEventListener('abort',abort,{once:true});authorize();if(signal?.aborted){abort();return;}
     onDispatch();diag.d.dispatchMarked=true;diag.mark('predispatch','dispatch-marked');if(!report()){finish('LIVE_JOURNAL_FAILED','local-persistence');return;}diag.d.requestEndCalled=true;req.end(bytes);
    }catch(e){diag.network(e?.code);finish(diag.d.dispatchMarked?'LIVE_SUBMISSION_UNKNOWN':'LIVE_TRANSPORT_NOT_SUBMITTED',e?.code==='LIVE_JOURNAL_FAILED'?'local-persistence':undefined);}
   });
  });}catch(e){const code=SAFE_ERRORS.has(e?.code)?e.code:'LIVE_ACCOUNT_CONSUME_FAILED';throw Object.assign(error(code,code),{submissionAttempted:!!e?.submissionAttempted,...(lastDiagnostic?{diagnostic:lastDiagnostic}:{})});}
 }
}
function parseFail(code,category){throw Object.assign(error(code,code),{safeParseCategory:category});}
function parseLive(r){
 if(!r||!Number.isInteger(r.status))parseFail('LIVE_RESPONSE_INVALID','output-format');
 if(r.status!==200)return {state:[400,401,403,404,422].includes(r.status)?'failed':'submissionUnknown',reason:'HTTP_'+r.status,requestId:r.requestId??null};
 if(r.contentType!=='application/json'||!Buffer.isBuffer(r.body)||r.body.length>48*1024*1024)parseFail('LIVE_RESPONSE_INVALID','output-format');let v;try{v=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(r.body));}catch{parseFail('LIVE_JSON_FORMAT','json-format');}
 if(!v||typeof v!=='object'||Array.isArray(v)||Object.hasOwn(v,'error')||v.model!==MODEL||!Array.isArray(v.data)||v.data.length!==1)parseFail('LIVE_MODEL_MISMATCH','model-mismatch');const d=v.data[0];
 if(!d||typeof d!=='object'||Array.isArray(d)||Object.hasOwn(d,'error')||Object.hasOwn(d,'url')||d.size!=='1024x1024'||d.output_format!==undefined&&d.output_format!=='png'||typeof d.b64_json!=='string'||!d.b64_json.length||d.b64_json.length>4*Math.ceil(png.MAX/3))parseFail('LIVE_RESPONSE_INVALID','output-format');
 const bytes=Buffer.from(d.b64_json,'base64');if(bytes.toString('base64')!==d.b64_json)parseFail('LIVE_BASE64_FORMAT','base64');let validation;try{validation=png.verifyPNG(bytes);}catch{parseFail('LIVE_PNG_DECODE_FAILED','png-decode');}
 const generatedAt=Number.isSafeInteger(v.created)&&v.created>0&&v.created<253402300800?new Date(v.created*1000).toISOString():null;let usage=null;
 if(v.usage!==undefined){if(!v.usage||typeof v.usage!=='object'||Array.isArray(v.usage))parseFail('LIVE_RESPONSE_INVALID','output-format');usage={};for(const k of ['generated_images','input_images','output_tokens','total_tokens'])if(v.usage[k]!==undefined){if(!Number.isSafeInteger(v.usage[k])||v.usage[k]<0||v.usage[k]>10000000)parseFail('LIVE_RESPONSE_INVALID','output-format');usage[k]=v.usage[k];}if(usage.generated_images!==undefined&&usage.generated_images!==1||usage.input_images!==undefined&&usage.input_images!==0)parseFail('LIVE_RESPONSE_INVALID','output-format');}
 return {state:'succeeded',bytes,m8Validation:{sha256:validation.sha256,size:validation.size,width:validation.width,height:validation.height},generatedAt,timeBasis:generatedAt?'provider-request-created':'unknown',usage,requestId:r.requestId??null};
}
module.exports={ArkHttpTransport,parseLive};

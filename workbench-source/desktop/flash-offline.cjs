'use strict';
// Only constructed by named QA modes. No URL, credential source or HTTP library.
const {MODEL}=require('./flash-png.cjs');
function offlineTransport(readPNG,onInvoke=()=>{}){let calls=0,scenario='success',release,accountEpoch=0;const gates=[];
 const transport=async({payload,credential})=>{if(!/^ACS_FAKE_ONLY_[a-f0-9_-]+$/.test(credential)||payload.model!==MODEL)throw Error('OFFLINE_ONLY');onInvoke();calls++;if(scenario==='timeout')throw Error('SYNTHETIC_TIMEOUT');if(scenario==='delay')await new Promise(r=>{release=r;gates.push(r)});const png=readPNG();const response={model:scenario==='wrong-model'?'wrong':MODEL,data:[{size:'1024x1024',output_format:'png',b64_json:(scenario==='bad-png'?Buffer.from('bad'):png).toString('base64')}]};if(scenario==='empty')response.data=[];if(scenario==='overlimit')response.data[0].b64_json='A'.repeat(12*1024*1024);return Buffer.from(JSON.stringify(response))};
 return {transport,account:()=>accountEpoch,get calls(){return calls},setScenario(s){if(!['success','timeout','delay','wrong-model','bad-png','empty','overlimit'].includes(s))throw Error('OFFLINE_SCENARIO');scenario=s},release(){for(const r of gates.splice(0))r();release=null},changeAccount(){accountEpoch++}};
}
module.exports={offlineTransport};

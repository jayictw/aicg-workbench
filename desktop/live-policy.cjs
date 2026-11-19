'use strict';
const fs=require('node:fs'),path=require('node:path'),{hash,error}=require('./media.cjs');
const PLAN_HASH='f6a12aa0424ae0dde4f7c14d454a2f1a0de327a5bc3e96b8746ded2f384fb80b';
const ENDPOINT='https://ark.cn-beijing.volces.com/api/v3/images/generations';
const MODEL='doubao-seedream-5-0-flash-260915';
const canonical=v=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
const fail=code=>{throw error(code,code);};
function freeze(v){if(v&&typeof v==='object'){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v;}
function localDirectory(root){const base=path.resolve(__dirname,'..'),target=path.resolve(root);if(target!==base&&!target.startsWith(base+path.sep))fail('LIVE_PATH_UNSAFE');let current=base;for(const part of ['',...path.relative(base,target).split(path.sep).filter(Boolean)]){current=path.join(current,part);if(fs.existsSync(current)){const st=fs.lstatSync(current);if(!st.isDirectory()||st.isSymbolicLink()||fs.realpathSync.native(current).toLowerCase()!==current.toLowerCase())fail('LIVE_PATH_UNSAFE');}}return target;}
function loadPlan(){const m=JSON.parse(fs.readFileSync(path.join(__dirname,'../C4-REAL-BATCH.json'),'utf8')),copy={...m};delete copy.manifestSha256;
 if(m.manifestSha256!==PLAN_HASH||hash(JSON.stringify(copy))!==PLAN_HASH||m.model!==MODEL||m.endpoint!==ENDPOINT||m.items.length!==4||m.maxChargedSubmissions!==4||m.proposedBatchCapMinor!==60||m.unitCapMinor!==12||m.concurrency!==1||m.inputImageUploads!==0||m.automaticPostRetries!==0)fail('LIVE_PLAN_CHANGED');
 for(const i of m.items)if(hash(i.prompt)!==i.promptUtf8Sha256||i.inputImages.length||i.outputCount!==1)fail('LIVE_PLAN_CHANGED');return freeze(m);
}
function account(v,now,historical=false){
 const keys=['accountScope','accountScopeKind','accountIdentityVerified','bindingVersion','provider','region','model','unitMinor','currency','priceVerified','priceBasis','accountPriceVerified','verifiedAt','expiresAt','verificationMethod'];
 const legacy=v?.priceVerified===true&&v.accountScopeKind===undefined&&(v.verificationMethod===undefined||v.verificationMethod==='owner-console-confirmed');
 const opaque=v?.accountScopeKind==='credential-session'&&/^credential-session-[a-f0-9-]{36}$/.test(v.accountScope)&&v.accountIdentityVerified===false&&v.accountPriceVerified===false&&v.priceVerified===false&&v.priceBasis==='approved-manifest-cap'&&v.unitMinor===12&&v.verificationMethod==='credential-session-only';
 if(!v||Object.keys(v).some(k=>!keys.includes(k))||typeof v.accountScope!=='string'||!/^[-a-zA-Z0-9]{1,90}$/.test(v.accountScope)||!Number.isSafeInteger(v.bindingVersion)||v.bindingVersion<1||v.provider!=='ark-cn'||v.region!=='cn-beijing'||v.model!==MODEL||!Number.isSafeInteger(v.unitMinor)||v.unitMinor<1||v.unitMinor>12||v.currency!=='CNY'||!legacy&&!opaque||!Number.isSafeInteger(v.verifiedAt)||v.verifiedAt>now||!Number.isSafeInteger(v.expiresAt)||v.expiresAt<=v.verifiedAt||!historical&&v.expiresAt<=now)fail('LIVE_ACCOUNT_OR_PRICE_UNVERIFIED');
 return freeze(structuredClone(v));
}
module.exports={PLAN_HASH,ENDPOINT,MODEL,canonical,freeze,fail,loadPlan,account,localDirectory};

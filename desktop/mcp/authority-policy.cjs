'use strict';
const fs=require('node:fs'),crypto=require('node:crypto');
const APP='app-session/1',FINITE='finite/1';
function hostIdentityValid(v){return !!v&&Number.isSafeInteger(v.pid)&&v.pid>0&&Number.isSafeInteger(v.createdAtMs)&&v.createdAtMs>0&&/^[a-f0-9]{64}$/.test(v.exeSha256??'')&&/^[a-f0-9-]{36}$/.test(v.instanceId??'');}
function normalize(v){if(typeof v==='number')v={expiresAt:v};if(!v||typeof v!=='object')throw Error('MCP_AUTHORITY_POLICY');const p=v.authorityPolicy;if(p===APP){if(v.expiresAt!==null||!hostIdentityValid(v.hostInstance))throw Error('MCP_AUTHORITY_POLICY');return {authorityPolicy:APP,expiresAt:null,hostInstance:{...v.hostInstance}};}if(p!==undefined&&p!==FINITE)throw Error('MCP_AUTHORITY_POLICY');if(!Number.isSafeInteger(v.expiresAt)||v.expiresAt<1)throw Error('MCP_AUTHORITY_POLICY');return {authorityPolicy:FINITE,expiresAt:v.expiresAt};}
function expired(v,now=Date.now()){const a=normalize(v);return a.authorityPolicy===FINITE&&now>=a.expiresAt;}
function validateMarker(v){const a=normalize(v);if(v.version!==(a.authorityPolicy===APP?2:1))throw Error('MCP_ACTIVE_MARKER_INVALID');return a;}
let current=null;
function ownHostIdentity(){if(current)return current;const p=require('../video-lock.cjs').probe(process.pid);if(p.state!=='alive'||!Number.isSafeInteger(Date.parse(p.startedAt)))throw Error('MCP_HOST_IDENTITY_UNAVAILABLE');current=Object.freeze({pid:process.pid,createdAtMs:Date.parse(p.startedAt),exeSha256:crypto.createHash('sha256').update(fs.readFileSync(process.execPath)).digest('hex'),instanceId:crypto.randomUUID()});return current;}
function hostState(v){if(!hostIdentityValid(v))return 'invalid';const p=require('../video-lock.cjs').probe(v.pid);if(p.state!=='alive')return p.state;try{return Date.parse(p.startedAt)===v.createdAtMs&&crypto.createHash('sha256').update(fs.readFileSync(p.exe)).digest('hex')===v.exeSha256?'alive':'replaced';}catch{return 'unknown';}}
function sameHost(a,b){return hostIdentityValid(a)&&hostIdentityValid(b)&&JSON.stringify(a)===JSON.stringify(b);}
module.exports={APP,FINITE,normalize,expired,validateMarker,hostIdentityValid,ownHostIdentity,hostState,sameHost};

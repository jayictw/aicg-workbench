'use strict';
// Strict construction; never spread an Error, request, headers or provider body.
const PHASES=new Set(['predispatch','connect','response','body','parse']);
const CATEGORIES=new Set(['none','dns','tls','proxy','connect-timeout','total-timeout','cancel','socket-reset','network','http','body-interrupted','body-truncated','response-limit','encoding','json-format','model-mismatch','base64','png-decode','output-format','local-persistence','authorization','internal']);
const NETWORK_CODES=new Set(['ENOTFOUND','EAI_AGAIN','ECONNREFUSED','ECONNRESET','ETIMEDOUT','ENETUNREACH','EHOSTUNREACH','EPIPE','EPROTO','CERT_HAS_EXPIRED','UNABLE_TO_VERIFY_LEAF_SIGNATURE','DEPTH_ZERO_SELF_SIGNED_CERT','SELF_SIGNED_CERT_IN_CHAIN','ERR_TLS_CERT_ALTNAME_INVALID','ERR_TLS_CERT_SIGNATURE_ALGORITHM_UNSUPPORTED','ERR_SSL_WRONG_VERSION_NUMBER','ERR_PROXY_CONNECTION_FAILED','ERR_TUNNEL_CONNECTION_FAILED','ERR_PROXY_AUTH_REQUESTED']);
const EVENTS=new Set(['request-validated','socket-assigned','tls-established','headers-received','body-started','body-complete','dispatch-marked','parse-started','http-error','media-persisting','media-persisted','response-invalid','media-write-failed']),brands=new WeakSet();
function categoryForCode(code){if(['ENOTFOUND','EAI_AGAIN'].includes(code))return 'dns';if(/^(CERT_|UNABLE_|DEPTH_|SELF_SIGNED_|ERR_TLS_|ERR_SSL_)/.test(code??''))return 'tls';if(/^ERR_(PROXY|TUNNEL)_/.test(code??''))return 'proxy';if(['ECONNRESET','EPIPE'].includes(code))return 'socket-reset';return 'network';}
function safeRequestId(value,secret){return typeof value==='string'&&/^[-a-zA-Z0-9_.:]{1,200}$/.test(value)&&!(secret&&value.toLowerCase().includes(secret.toLowerCase()))?value:null;}
function createDiagnostic(clock=Date.now){
 const start=clock(),d={version:1,transport:'m8-node-tcp-tls-image',phase:'predispatch',category:'none',startedAt:new Date(start).toISOString(),finishedAt:null,elapsedMs:null,dispatchMarked:false,requestEndCalled:false,bodyWriteFinishedLocal:false,bodyDeliveredToProvider:'unknown',socketAssigned:false,tlsEstablished:false,responseHeadersReceived:false,httpStatus:null,providerRequestId:null,responseBodyBytes:0,responseBodyComplete:false,networkCode:null,timeoutKind:null,cancelled:false,parseOutcome:null,events:[]};
 function mark(phase,event){if(!PHASES.has(phase)||!EVENTS.has(event))throw Error('DIAGNOSTIC_PHASE');d.phase=phase;if(d.events.length<20)d.events.push({phase,event,at:new Date(clock()).toISOString()});}
 function network(code){d.networkCode=NETWORK_CODES.has(code)?code:'UNCLASSIFIED';d.category=categoryForCode(d.networkCode);}
 function finish(category){if(category){if(!CATEGORIES.has(category))throw Error('DIAGNOSTIC_CATEGORY');d.category=category;}d.finishedAt=new Date(clock()).toISOString();d.elapsedMs=Math.max(0,clock()-start);return snapshot();}
 function snapshot(){const out=structuredClone(d);brands.add(out);return out;}
 return {d,mark,network,finish,snapshot};
}
function parseDiagnostic(previous,outcome,category='none',clock=Date.now){if(!brands.has(previous)||!EVENTS.has(outcome))throw Error('DIAGNOSTIC_SCHEMA');const d=structuredClone(previous);d.phase='parse';d.category=CATEGORIES.has(category)?category:'internal';d.parseOutcome=outcome;d.finishedAt=new Date(clock()).toISOString();d.elapsedMs=Math.max(0,clock()-Date.parse(d.startedAt));if(d.events.length<20)d.events.push({phase:'parse',event:outcome,at:d.finishedAt});brands.add(d);return d;}
module.exports={createDiagnostic,parseDiagnostic,safeRequestId,NETWORK_CODES,categoryForCode,isDiagnostic:value=>!!value&&brands.has(value)};

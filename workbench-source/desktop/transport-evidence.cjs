 'use strict';const network=require('./uk-network.cjs');
function read(response,binding,mode){const p=network.readProof(response);if(!p||p.mode!==mode||!p.tlsVerified||!['attemptId','requestId','callId','wireBodySha256'].every(k=>p[k]===binding[k]))throw Error('C_IMAGE_EVIDENCE');return p}module.exports=Object.freeze({read});

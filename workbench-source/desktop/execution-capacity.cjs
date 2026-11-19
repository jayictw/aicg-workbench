'use strict';
// Bounded, format-preserving execution journal policy; business media limits stay independent.
const MiB=1024*1024;
const LIMITS=Object.freeze({recordBytes:12*MiB,prepareBytes:16*MiB,readBytes:18*MiB,sqliteBytes:48*MiB,attempts:64,completionReserveEach:64*1024,sqliteRewriteReserve:2*MiB});
const fail=code=>{throw Object.assign(Error(code),{code})};
const bytes=value=>Buffer.byteLength(require('./d1-json.cjs').jcs(value));
function admit(state,row){if(bytes(row)>LIMITS.recordBytes||bytes({...state,attempts:[...state.attempts,row]})>LIMITS.prepareBytes)fail('C_STUDIO_CAPACITY')}
function payload(state){const encoded=require('./uk-common.cjs').canonical(state);if(Buffer.byteLength(encoded)>LIMITS.readBytes||state.attempts.some(a=>bytes(a)>LIMITS.recordBytes))fail('UK_JOURNAL_CAPACITY');return encoded}
function finalReservation(predictedBytes,count){const reserved=predictedBytes+count*LIMITS.completionReserveEach;if(predictedBytes>LIMITS.prepareBytes||reserved>LIMITS.readBytes||2*reserved+LIMITS.sqliteRewriteReserve>LIMITS.sqliteBytes)fail('SIX_CAPACITY');return reserved}
module.exports={LIMITS,bytes,admit,payload,finalReservation};

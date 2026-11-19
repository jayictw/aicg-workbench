'use strict';
const SESSION_DURATION_MS=2*60*60*1000,WARNING_MS=[10*60*1000,60*1000];
function createTiming(preparedAt){if(!Number.isSafeInteger(preparedAt)||preparedAt<0)throw Error('MCP_CLOCK');return {preparedAt,expiresAt:preparedAt+SESSION_DURATION_MS,durationMs:SESSION_DURATION_MS,policy:'c3-2h-fixed-from-prepare/1'};}
function timing(invitation,now){if(!invitation)return null;const remainingMs=Math.max(0,invitation.expiresAt-now);return {preparedAt:invitation.preparedAt??null,expiresAt:invitation.expiresAt,remainingMs,expired:now>=invitation.expiresAt,warningMinutes:remainingMs>0?(remainingMs<=WARNING_MS[1]?1:remainingMs<=WARNING_MS[0]?10:null):null,policy:invitation.durationPolicy??'absolute-deadline',durationMs:invitation.durationMs??null};}
module.exports={SESSION_DURATION_MS,WARNING_MS,createTiming,timing};

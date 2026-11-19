'use strict';
const {error}=require('./media.cjs');
function reserve(journal,runId,phase){if(phase==='submit')return;const a=journal.data.attempts[runId];if(a.environment==='provider-live'&&!a.wireUsage)throw error('VIDEO_JOURNAL_INVALID','Provider wire budget missing; do not reset original usage');// Lifetime counters are distinct from per-permit request caps.
const limit=Number.MAX_SAFE_INTEGER,usage={query:0,download:0,...a.wireUsage};if(!['query','download'].includes(phase)||!Number.isSafeInteger(usage[phase])||usage[phase]<0||usage[phase]>=limit)throw error('VIDEO_WIRE_LIMIT','Original task observation/download budget exhausted; no replacement POST');usage[phase]++;journal.update(runId,{wireUsage:usage});}
module.exports={reserve};

'use strict';
// Historical one-off approval is not part of the distributed application.
const TEXT='Legacy manual approval is unavailable in this distribution.';
function approval(){
  throw Object.assign(new Error('LEGACY_MANUAL_APPROVAL_UNAVAILABLE'),{code:'LEGACY_MANUAL_APPROVAL_UNAVAILABLE'});
}
module.exports={TEXT,approval};

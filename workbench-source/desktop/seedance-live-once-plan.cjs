'use strict';
// Data-only plan. No capability, Key, Vault or network access.
const plan=Object.freeze(require('../LIVE-ONCE-PREPARED.json'));
function deny(){throw Error('SEEDANCE_REAL_VIDEO_APPROVAL_REQUIRED')}
module.exports=Object.freeze({plan,deny});

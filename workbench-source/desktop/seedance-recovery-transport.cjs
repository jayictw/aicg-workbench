'use strict';
// Defense in depth: even a caller bypassing the UI cannot POST or download here.
class QueryOnlyTransport extends(require('./seedance-transport.cjs').RestrictedSeedanceTransport){
 start(kind,...args){if(kind!=='poll'||this.stats.poll!==0)throw Object.assign(Error('C_VIDEO_RECOVERY_GET_ONLY'),{code:'C_VIDEO_RECOVERY_GET_ONLY'});return super.start(kind,...args)}
}
module.exports={QueryOnlyTransport};

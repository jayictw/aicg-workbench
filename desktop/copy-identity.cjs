'use strict';
const path=require('node:path'),{hash}=require('./media.cjs');
// The existing Studio/Host copy identity, with no dependency on active graph.
// This derives display/context identity only; it creates no authority or storage.
function copyIdForHost(host){return host.assets?.copyId??'copy-'+hash(path.resolve(host.root).toLowerCase()).slice(0,32);}
module.exports={copyIdForHost};

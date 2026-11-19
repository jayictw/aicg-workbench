'use strict';
const fs=require('node:fs'),path=require('node:path'),c=require('./d1-json.cjs'),ROOT=path.resolve(require('../integration-build.json').runtimeRoot);
function manifest(){const f=path.join(ROOT,'CONTROL-FREEZE.json');if(!fs.existsSync(f))throw Error('B2_CONTROL_FREEZE_REQUIRED');return JSON.parse(fs.readFileSync(f))}
function fingerprint(){return manifest().controlFingerprint}
function assertFreeze(){
 const f=manifest();if(f.buildId!==require('../integration-build.json').buildId||f.originalProductFingerprint!==require('./batch2-seal.cjs').originalProductFingerprint||c.hash(Buffer.from(c.jcs(f.code)))!==f.controlFingerprint)throw Error('B2_CONTROL_FREEZE_REQUIRED');
 for(const e of f.code){const b=fs.readFileSync(path.join(__dirname,'..',e.path));if(b.length!==e.bytes||c.hash(b)!==e.sha256)throw Error('B2_CODE_DRIFT')}
 require('./batch2-policy.cjs').loadFrozen();
 // Both the first-batch evidence and original model code stay pinned, including its stop marker.
 for(const e of f.originalFiles){const b=fs.readFileSync(e.path);if(b.length!==e.bytes||c.hash(b)!==e.sha256)throw Error('B2_ORIGINAL_DRIFT')}
 return f;
}
module.exports={fingerprint,assertFreeze};

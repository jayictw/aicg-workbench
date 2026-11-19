 'use strict';
const path=require('node:path'),{boundary}=require('./unified-repository.cjs');
function ownerIsolation(base,config){
 if(config===undefined)return null;
 const fail=()=>{throw Object.assign(Error('Invalid owner-test isolation'),{code:'OWNER_ISOLATION'});};
 if(!config||Object.keys(config).join(',')!=='version'||config.version!==1)fail();
 const source=boundary(path.resolve(base)),task=path.dirname(source);
 if(path.basename(source)!=='source'||!/^p3-owner-full-[0-9]{8}-[a-z0-9]{4}$/.test(path.basename(task)))fail();
 const root=boundary(path.join(task,'runtime','workbench'));
 return Object.freeze({root,profile:path.join(root,'electron-profile'),session:path.join(root,'electron-session'),personal:path.join(root,'personal'),useQaStubs:false,supplierAPIEnabled:false});
}
module.exports={ownerIsolation};

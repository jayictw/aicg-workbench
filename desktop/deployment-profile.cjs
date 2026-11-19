 'use strict';
const fs=require('node:fs'),path=require('node:path'),{boundary}=require('./unified-repository.cjs');
function deploymentProfile(base,config){
 if(config===undefined)return null;
 const fail=()=>{throw Object.assign(Error('Installed application data/profile ownership is invalid'),{code:'DEPLOYMENT_PROFILE'});};
 try{
  if(fs.existsSync(path.resolve(base)+'.dependency-lock')||fs.existsSync(path.resolve(base)+'.dependency-lock.recovering'))fail();
  if(!config||![1,2].includes(config.version)||Object.keys(config).sort().join(',')!==(config.version===1?'dataId,dataRoot,version':'dataId,dataRoot,executionMode,version')||config.version===2&&!['offline-test','user-native'].includes(config.executionMode)||typeof config.dataRoot!=='string'||!path.isAbsolute(config.dataRoot)||typeof config.dataId!=='string'||!/^[a-f0-9-]{36}$/.test(config.dataId))fail();
  const programRoot=boundary(path.resolve(base)),root=boundary(path.resolve(config.dataRoot)),contains=(a,b)=>{const r=path.relative(a,b);return !r.startsWith('..')&&!path.isAbsolute(r);};
  if(contains(programRoot,root)||contains(root,programRoot))fail();
  const file=path.join(root,'.aicg-deployment-data.json'),st=fs.lstatSync(file);if(!st.isFile()||st.isSymbolicLink()||st.nlink!==1||st.size>4096)fail();
  const owner=JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));if(owner.version!==1||owner.product!=='AICG-P4-TEST'||owner.dataId!==config.dataId||typeof owner.programRoot!=='string'||path.resolve(owner.programRoot).toLowerCase()!==programRoot.toLowerCase())fail();
  return Object.freeze({programRoot,root,profile:path.join(root,'electron-profile'),session:path.join(root,'electron-session'),personal:path.join(root,'personal'),useQaStubs:false,executionMode:config.version===2?config.executionMode:'offline-test',supplierAPIEnabled:config.version===2&&config.executionMode==='user-native'});
 }catch{fail();}
}
module.exports={deploymentProfile};

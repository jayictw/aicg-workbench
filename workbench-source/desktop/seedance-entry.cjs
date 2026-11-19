'use strict';
const fs=require('node:fs'),path=require('node:path'),ec=require('./entry-context.cjs');
function factory(automation=false){
 const base=require('./entry-bootstrap.cjs').createQA(automation),tlsRoot=path.join(JSON.parse(fs.readFileSync(path.join(base.paths.codeRoot,'integration-build.json'))).runtimeRoot,'tests/tls');
 const server=require('./seedance-transport.cjs').createControlledServer({key:fs.readFileSync(path.join(tlsRoot,'seedance.key.pem')),cert:fs.readFileSync(path.join(tlsRoot,'seedance.cert.pem')),bytes:fs.readFileSync(path.join(base.paths.codeRoot,'public/assets/seedance25-test.mp4')),evidenceRoot:base.paths.evidenceRoot});
 const launch={...base,get requests(){return base.requests},ready:Promise.all([base.ready,server.ready]),seedance:true,provider:false,credentialModels:['ark-flash','ark-seedance-25'],get videoServer(){return server},close(){server.close();base.close()},assembleSeedance(service,source){
  return require('./seedance-pipeline.cjs').createNetworkQAPipeline({service,source,port:server.port,ca:fs.readFileSync(path.join(tlsRoot,'seedance.cert.pem'),'utf8'),scenarioController:server.setScenario});
 }};
 return ec.brand(Object.freeze(launch));
}
function start(automation=false){if(process.argv.slice(2).length)throw Error('FIXED_ENTRY_ARGUMENTS');const launch=factory(automation);ec.install(launch);require('./main.cjs');return launch}
module.exports={factory,start};
// Imported by automation as a library. The shipped cmd uses entry-seedance-qa.cjs.
// Electron's main-module loader need not set require.main === module.

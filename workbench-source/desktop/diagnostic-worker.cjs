'use strict';
const {parentPort,workerData}=require('node:worker_threads');
const {scan,recheck}=require('./diagnostic-reader.cjs');
require('./runtime-paths.cjs').diagnosticPolicy(workerData);
let snapshot=null,queue=Promise.resolve();
scan(workerData).then(x=>{snapshot=x;parentPort.postMessage({kind:'result',report:x.report})}).catch(()=>parentPort.postMessage({kind:'fatal',code:'D_IO_ERROR'}));
parentPort.on('message',m=>{
 if(m?.kind!=='release')return;
 queue=queue.then(async()=>{const consistency=snapshot?.dir?await recheck(snapshot.watched,snapshot.dir):'unavailable';snapshot=null;parentPort.postMessage({kind:'released',consistency})});
});

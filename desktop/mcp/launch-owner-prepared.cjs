'use strict';
// This launcher reads PUBLIC frozen batch approval only. It never reads a Key,
// input field, vault, existing account profile, clipboard or environment secret.
const fs=require('fs'),path=require('path'),{spawn}=require('child_process'),roots=require('../video-roots.cjs').assertRoots(),packet=JSON.parse(fs.readFileSync(path.join(roots.codeRoot,'OWNER-BYTEPLUS-LAUNCH.json'))),out=path.join(roots.runtimeRoot,'byteplus-owner-status.json');
require('../video-private-input.cjs').assertPrivate();
let buffer='',ready=false;const env={TEMP:process.env.TEMP,TMP:process.env.TMP,SystemRoot:process.env.SystemRoot,WINDIR:process.env.WINDIR},child=spawn(process.execPath,[path.join(__dirname,'launch-approved-video.cjs')],{cwd:roots.codeRoot,windowsHide:true,env,stdio:['pipe','pipe','ignore']});
function publish(v){const temp=out+'.tmp';fs.writeFileSync(temp,JSON.stringify({...v,updatedAt:new Date().toISOString()},null,2));fs.renameSync(temp,out);}
publish({phase:'starting-private-native-input',batchId:packet.approval.batchId,supplierRequests:0,keyAccepted:false});
child.stdout.on('data',b=>{buffer+=b.toString();if(buffer.length>1048576){child.kill();publish({phase:'stopped-invalid-public-status'});return;}for(;;){const i=buffer.indexOf('\n');if(i<0)break;const line=buffer.slice(0,i);buffer=buffer.slice(i+1);try{const m=JSON.parse(line);if(m.type==='video-approved-entry'){ready=true;publish(m);}else if(m.type==='video-batch-status'&&m.status?.batchId===packet.approval.batchId)publish(m);}catch{}}});
child.on('error',()=>publish({phase:'private-launch-failed',batchId:packet.approval.batchId,keyAccepted:false}));child.on('exit',code=>{if(!ready)publish({phase:'private-launch-not-ready',batchId:packet.approval.batchId,exitCode:code,keyAccepted:false});});
child.stdin.end(JSON.stringify(packet));

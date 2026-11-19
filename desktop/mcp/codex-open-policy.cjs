'use strict';
const crypto=require('node:crypto');
const fs=require('node:fs'),path=require('node:path');
const projects=Object.freeze([
 {key:'synthetic-one',name:'合成產品項目',folder:'codex-open-owner-product'},
 {key:'synthetic-two',name:'合成場景項目',folder:'codex-open-owner-scene'},
 {key:'synthetic-empty',name:'空白對話工程項目',folder:'codex-open-empty-dialogue'},
 {key:'synthetic-materials',name:'空畫布素材項目',folder:'codex-empty-materials'}
]);
function select(name){const found=projects.filter(p=>p.name===name);if(found.length!==1)throw Error('MCP_PROJECT_CLARIFICATION_REQUIRED');return found[0];}
function bootstrap(v,launchId,now=Date.now()){
 if(!v||Object.keys(v).sort().join(',')!=='createdAt,launchId,projectName,sessionDigest,ticket'||v.launchId!==launchId||!/^[a-f0-9-]{36}$/.test(launchId)||!/^[a-f0-9]{64}$/.test(v.ticket)||!/^[a-f0-9]{64}$/.test(v.sessionDigest)||!Number.isSafeInteger(v.createdAt)||now<v.createdAt||now-v.createdAt>30000)throw Error('MCP_LAUNCH_TICKET_INVALID');
 return {...v,project:select(v.projectName),consumed:false,ticketHash:crypto.createHash('sha256').update(v.ticket).digest('hex')};
}
function consume(ticket,peer,attestation,now=Date.now()){
 if(ticket.consumed||now<ticket.createdAt||now-ticket.createdAt>30000||peer.clientPid!==attestation.bridgePid||peer.clientSha256!==attestation.bridgeExeSha256)throw Error('MCP_LAUNCH_TICKET_INVALID');
 ticket.consumed=true;delete ticket.ticket;return {proposalPermission:true};
}
function controlledRoot(base,folder){
 if(!projects.some(p=>p.folder===folder))throw Error('MCP_PROJECT_CLARIFICATION_REQUIRED');
 const resolved=path.resolve(base),target=path.join(resolved,'data',folder);
 // Every existing ancestor must resolve to itself; never follow a junction into another project.
 for(const relative of ['', 'data',path.join('data',folder)]){
  const current=path.join(resolved,relative);if(!fs.existsSync(current))continue;
  if(fs.lstatSync(current).isSymbolicLink()||fs.realpathSync.native(current).toLowerCase()!==current.toLowerCase())throw Error('MCP_PROJECT_PATH_UNSAFE');
 }
 let count=0;
 function inspect(entry){if(!fs.existsSync(entry))return;if(++count>10000)throw Error('MCP_PROJECT_PATH_UNSAFE');const stat=fs.lstatSync(entry);if(stat.isSymbolicLink()||fs.realpathSync.native(entry).toLowerCase()!==entry.toLowerCase()||stat.isFile()&&stat.nlink!==1)throw Error('MCP_PROJECT_PATH_UNSAFE');if(stat.isDirectory())for(const name of fs.readdirSync(entry))inspect(path.join(entry,name));}
 for(const name of ['project.json','project.json.previous','media','staging','save-operations'])inspect(path.join(target,name));
 return target;
}
module.exports={projects,select,bootstrap,consume,controlledRoot};

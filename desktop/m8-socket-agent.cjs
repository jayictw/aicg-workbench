'use strict';
// Scoped transplant of M8 3a91 uk-network.perform's successful image socket
// construction. The original module's process-global deny hooks are NOT loaded.
const https=require('node:https'),tls=require('node:tls'),net=require('node:net'),dns=require('node:dns');
const HOST='ark.cn-beijing.volces.com';
function createM8Agent({Socket=net.Socket,nativeConnect=net.Socket.prototype.connect,nativeTLS=tls.connect,nativeLookup=dns.lookup}={}){
 const agent=new https.Agent({keepAlive:false,maxSockets:1});
 agent.createConnection=()=>{
  const raw=new Socket();
  nativeConnect.call(raw,{host:HOST,port:443,lookup:nativeLookup});
  return nativeTLS({socket:raw,servername:HOST,rejectUnauthorized:true,checkServerIdentity:tls.checkServerIdentity,minVersion:'TLSv1.2'});
 };
 return agent;
}
module.exports={createM8Agent,HOST};

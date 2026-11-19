'use strict';
const crypto=require('node:crypto'),authority=require('./authority-policy.cjs'),{validate}=require('./app-contracts.cjs');
class AppBroker{
 constructor(controller,{identity,isStopped=()=>false}={}){this.controller=controller;this.identity=identity;this.isStopped=isStopped;this.epoch=0;this.scope=null;this.peer=null;}
 targetIdentity(){return this.identity;}
 setPeer(peer){this.peer=Object.freeze({...peer});}
 connect(session,expiresAt,policy){this.invalidate();this.session=session;this.authority=authority.normalize(policy??{expiresAt});}
 grant(){this.scope={handle:'app-scope-'+crypto.randomUUID(),session:this.session,projectId:null,graphId:null,proposalPermission:false};return {expiresAt:this.authority.expiresAt};}
 assert(session){if(!this.scope||session!==this.session||authority.expired(this.authority))throw Error('MCP_AUTHORIZATION_REQUIRED');return this.scope;}
 invalidate(){this.epoch++;this.scope=null;}
 disconnect(){this.invalidate();this.session=null;this.peer=null;}
 async query(session,name,args){validate(name,args);this.assert(session);if(name==='session_info')return {authorized:true,applicationAuthority:true,businessAuthorized:false,scope:this.scope,appIdentity:this.identity};return this.controller.run(name,args,this.peer,this.captureClientGuard?.(session,name,args));}
}
module.exports={AppBroker};

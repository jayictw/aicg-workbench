const {Broker}=require('./mcp/broker.cjs'),{uid}=require('./c5-service.cjs'),{error}=require('./media.cjs');
class LocalAgent{
 constructor(service,notify){this.s=service;this.broker=new Broker(service,{notify});}
 async open(){this.close();this.session=uid('session');this.broker.connect(this.session,Date.now()+120*60*1000);this.broker.grant({proposalPermission:true},'native-offline-draft');return this.read();}
 args(extra={}){return {scope:this.broker.scope?.handle,projectId:this.s.graph.projectId,graphId:this.s.graph.graphId,...extra};}
 async read(){if(!this.session)throw error('MCP_NOT_CONNECTED','請先開啟本地 Agent 草稿');return this.broker.query(this.session,'composition_read',this.args());}
 async propose(req){this.s.core.exact(req,['requestId','expectedRevision','summary','changes']);if(!Array.isArray(req.changes)||req.changes.some(c=>c.type!=='composition_change'))throw error('MCP_C5_DRAFT','畫布草稿僅接受 composition_change，編碼／另存仍由人操作');return this.broker.query(this.session,'proposal_create',this.args(req));}
 status(){return this.broker.status();}
 close(){this.broker.disconnect();this.session=null;}
}
module.exports={LocalAgent};

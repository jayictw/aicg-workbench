'use strict';
// Fresh video candidate carries no historical image batch plan, approval or credentials.
class DisabledImageLive{
 constructor(){this.configured=false;}
 list(){return [];}
 invalidate(){}
 async close(){}
 preview(){throw Object.assign(Error('本影片候選沒有真實圖片批次權限'),{code:'MCP_LIVE_BATCH_NOT_AUTHORIZED'});}
 approve(){return this.preview();}
 execute(){return this.preview();}
 status(){return this.preview();}
}
module.exports={DisabledImageLive};

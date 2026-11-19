'use strict';
const c=require('./d1-json.cjs'),factory=require('./d1-factory.cjs');
// No sockets, fetch, Electron net, environment or live branch. QA may supply a
// different dependency object to ImagePipeline; the renderer cannot choose it.
class ControlledOfflineTransport{
 constructor(){this.stats={started:0,shapeChecks:0,authChecks:0};}
 start(wire,expected){if(wire.url!=='https://ark.cn-beijing.volces.com/api/v3/images/generations'||wire.method!=='POST'||wire.headers['Content-Type']!=='application/json'||wire.headers.Authorization!=='Bearer '+expected.secret||c.hash(wire.body)!==expected.bodyHash)throw Error('C_IMAGE_WIRE');this.stats.shapeChecks++;this.stats.authChecks++;this.stats.started++;const request=c.parse(wire.body),bytes=factory.png('C OFFLINE');const body=Buffer.from(JSON.stringify({model:request.model,created:Math.floor(Date.now()/1000),data:[{b64_json:bytes.toString('base64'),size:'1024x1024',output_format:'png'}],usage:{generated_images:1}}));return new Promise(resolve=>setTimeout(()=>resolve({status:200,contentType:'application/json',body}),50));}
}
module.exports={ControlledOfflineTransport};

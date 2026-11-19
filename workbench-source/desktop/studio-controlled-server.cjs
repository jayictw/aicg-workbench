'use strict';
const fs=require('node:fs'),path=require('node:path'),c=require('./d1-json.cjs');
function handler({evidenceRoot,onRequest,getScenario}){let sequence=0;return (req,res)=>{
 onRequest();let chunks=[],size=0;req.on('data',b=>{size+=b.length;if(size>12000000)req.destroy();else chunks.push(b)});req.on('end',()=>{
 try{if(req.method!=='POST'||req.url!=='/api/v3/images/generations')throw Error('CONTROLLED_ROUTE');const raw=Buffer.concat(chunks),body=JSON.parse(raw),sc=getScenario();c.keys(body,['model','prompt','size','output_format','response_format','watermark'],['image']);if(body.model!=='doubao-seedream-5-0-flash-260915'||body.output_format!=='png'||body.response_format!=='b64_json'||body.watermark!==true||!Object.values(require('./studio-model.cjs').sizes).includes(body.size))throw Error('CONTROLLED_BODY');
 const inputs=body.image?require('./reference-images.cjs').wireImages(body.image):[];const input=inputs[0]||null;
 const dir=path.join(evidenceRoot,'offline-requests');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,process.pid+'-'+String(++sequence).padStart(4,'0')+'.json'),JSON.stringify({mode:'controlled-loopback-only',officialRequests:0,wireBodySha256:c.hash(raw),inputSha256:input?.sha256||null,inputs:inputs.map((i,index)=>({index,sha256:i.sha256,mime:i.mime,byteSize:i.size})),request:body},null,2),{flag:'wx'});
 if(sc==='timeout')return;if(sc==='disconnect'){req.socket.destroy();return}if(sc.startsWith('status-')){res.writeHead(+sc.slice(7));res.end();return}
 const [w,h]=body.size.split('x').map(Number),png=require('./studio-synthetic.cjs')(w,h);let response=JSON.stringify({model:'doubao-seedream-5-0-flash-260915',created:1,data:[{b64_json:png.toString('base64'),size:body.size,output_format:'png'}],usage:{generated_images:1,input_images:inputs.length}});if(sc==='bad-json')response='{';if(sc==='bad-png')response=response.replace(png.toString('base64'),'bm90LXBuZw==');const send=()=>{res.writeHead(200,{'Content-Type':'application/json'});res.end(response)};if(sc==='late')setTimeout(send,250);else send();
 }catch{res.writeHead(400);res.end()}
 });
 }}
module.exports={handler};

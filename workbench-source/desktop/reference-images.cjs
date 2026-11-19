'use strict';
// Local provenance is part of the immutable request, never an API parameter.
const c=require('./d1-json.cjs');
const LIMITS=Object.freeze({count:10,eachBytes:10*1024*1024,totalBytes:8*1024*1024,pixels:36000000});
const verified=new Map();
const fail=code=>{throw Object.assign(Error(code),{code})};
function decode(s){if(typeof s!=='string'||!s.length||s.length>4*Math.ceil(LIMITS.eachBytes/3)||require('./save-validation.cjs').base64ByteLength(s)<=0)fail('C_REFERENCE_ENCODING');const b=Buffer.from(s,'base64');if(b.toString('base64')!==s)fail('C_REFERENCE_ENCODING');return b}
function dimensions(w,h){if(!c.integer(w,15)||!c.integer(h,15)||w*h>LIMITS.pixels||w/h<1/16||w/h>16)fail('C_REFERENCE_DIMENSIONS')}
function verify(bytes,mime){
 if(!Buffer.isBuffer(bytes)||!bytes.length||bytes.length>LIMITS.eachBytes)fail('C_REFERENCE_SIZE');const sha256=c.hash(bytes),cacheKey=mime+':'+sha256,cached=verified.get(cacheKey);if(cached)return {...cached};let width,height;
 try{
  if(mime==='image/png')({width,height}=require('./reference-png.cjs').verifyPNG(bytes));
  else if(mime==='image/jpeg'){
   if(bytes.readUInt16BE(0)!==0xffd8||bytes.readUInt16BE(bytes.length-2)!==0xffd9)fail('C_REFERENCE_FORMAT');
   let p=2,scan=false;while(p<bytes.length-2){if(bytes[p++]!==255)fail('C_REFERENCE_FORMAT');while(bytes[p]===255)p++;const marker=bytes[p++];if(marker===0xda){scan=true;break}if(marker===0xd8||marker===0xd9||marker===0||marker>=0xd0&&marker<=0xd7)fail('C_REFERENCE_FORMAT');const n=bytes.readUInt16BE(p);if(n<2||p+n>bytes.length)fail('C_REFERENCE_FORMAT');if([0xc0,0xc1,0xc2].includes(marker)){if(n<8||bytes[p+2]!==8)fail('C_REFERENCE_FORMAT');height=bytes.readUInt16BE(p+3);width=bytes.readUInt16BE(p+5)}p+=n}if(!scan)fail('C_REFERENCE_FORMAT');
  }else if(mime==='image/webp'){
   if(bytes.toString('ascii',0,4)!=='RIFF'||bytes.readUInt32LE(4)+8!==bytes.length||bytes.toString('ascii',8,12)!=='WEBP')fail('C_REFERENCE_FORMAT');let p=12,frame=false;while(p+8<=bytes.length){const type=bytes.toString('ascii',p,p+4),n=bytes.readUInt32LE(p+4),d=p+8;if(d+n>bytes.length)fail('C_REFERENCE_FORMAT');if(type==='ANIM'||type==='ANMF')fail('C_REFERENCE_FORMAT');if(type==='VP8X'){if(n!==10||bytes[d]&2)fail('C_REFERENCE_FORMAT');width=1+bytes.readUIntLE(d+4,3);height=1+bytes.readUIntLE(d+7,3)}if(type==='VP8 '){if(n<10||!bytes.subarray(d+3,d+6).equals(Buffer.from([0x9d,1,0x2a])))fail('C_REFERENCE_FORMAT');width=bytes.readUInt16LE(d+6)&0x3fff;height=bytes.readUInt16LE(d+8)&0x3fff;frame=true}if(type==='VP8L'){if(n<5||bytes[d]!==0x2f)fail('C_REFERENCE_FORMAT');const v=bytes.readUInt32LE(d+1);width=(v&0x3fff)+1;height=((v>>>14)&0x3fff)+1;frame=true}p=d+n+(n&1)}if(!frame||p!==bytes.length)fail('C_REFERENCE_FORMAT');
  }else fail('C_REFERENCE_FORMAT');
  dimensions(width,height);
  // Chromium decodes all three formats at selection. nativeImage decodes PNG/JPEG only;
  // WebP is checked here as a complete static RIFF/frame container without reencoding.
  const electron=require('electron');if(electron.nativeImage&&mime!=='image/webp'){const im=electron.nativeImage.createFromBuffer(bytes);if(im.isEmpty())fail('C_REFERENCE_FORMAT');const size=im.getSize();if(size.width!==width||size.height!==height)fail('C_REFERENCE_DIMENSIONS')}
 }catch(e){if(/^C_REFERENCE_/.test(e.code||''))throw e;fail('C_REFERENCE_FORMAT')}
 const metadata={width,height,mime,size:bytes.length,sha256};if(verified.size>=128)verified.delete(verified.keys().next().value);verified.set(cacheKey,metadata);return {...metadata};
}
function provenance(r){c.keys(r,['referenceId','assetId','origin','category','name']);if(!c.text(r.referenceId,256)||r.assetId!==null&&!c.text(r.assetId,256)||!['local-import','library-reference','studio-snapshot'].includes(r.origin)||!['character','product','scene','style'].includes(r.category)||!c.text(r.name,8192))fail('C_REFERENCE_SOURCE');if(r.origin==='studio-snapshot'&&(r.assetId!==null||r.category!=='scene'))fail('C_REFERENCE_SOURCE')}
function prepare(base,packets,studioBase64){
 if(!Array.isArray(packets)||packets.length>LIMITS.count)fail('C_REFERENCE_COUNT');const list=[];
 for(const p of packets){c.keys(p,['referenceId','assetId','origin','category','name','mime','sha256','byteSize','base64']);const {mime,sha256,byteSize,base64,...source}=p;provenance(source);if(source.origin==='studio-snapshot')fail('C_REFERENCE_SOURCE');const v=verify(decode(base64),mime);if(v.sha256!==sha256||v.size!==byteSize)fail('C_REFERENCE_CHANGED');list.push({source,mime,sha256,byteSize,base64})}
 if(base.version===2&&base.inputs.length){const i=base.inputs[0],s=require('./studio-model.cjs').source(base.studio.sourceJson);list.push({source:{referenceId:s.id,assetId:null,origin:'studio-snapshot',category:'scene',name:'摄影棚快照'},mime:i.mime,sha256:i.sha256,byteSize:i.byteSize,base64:studioBase64})}
 if(!list.length)return {effective:base,base64s:undefined};if(list.length>LIMITS.count)fail('C_REFERENCE_COUNT');if(new Set(list.map(x=>x.sha256)).size!==list.length)fail('C_REFERENCE_DUPLICATE');if(list.reduce((n,x)=>n+x.byteSize,0)>LIMITS.totalBytes)fail('C_REFERENCE_TOTAL_SIZE');
 const effective={...base,version:3,operation:'image-edit',inputs:list.map((x,index)=>({role:'reference',index,sha256:x.sha256,mime:x.mime,byteSize:x.byteSize})),references:list.map(x=>x.source)};validate(effective);return {effective,base64s:list.map(x=>x.base64)};
}
function validate(e,taskId){
 if(e.version!==3||!require('./image-policies.cjs').target(e.target)||e.target.serviceId!=='ark-cn'||e.target.requestedModel!=='doubao-seedream-5-0-flash-260915'||e.operation!=='image-edit'||e.outputCount!==1||!c.text(e.prompt,4096,{prompt:true})||!Array.isArray(e.inputs)||!e.inputs.length||e.inputs.length>10||!Array.isArray(e.references)||e.references.length!==e.inputs.length)fail('C_REFERENCE_INPUT');
 const ids=new Set(),hashes=new Set();let total=0;for(let n=0;n<e.inputs.length;n++){const i=e.inputs[n],r=e.references[n];provenance(r);const id=r.origin+':'+r.referenceId;if(ids.has(id)||hashes.has(i.sha256))fail('C_REFERENCE_DUPLICATE');ids.add(id);hashes.add(i.sha256);if(i.role!=='reference'||i.index!==n||!['image/png','image/jpeg','image/webp'].includes(i.mime)||!c.integer(i.byteSize,1,LIMITS.eachBytes))fail('C_REFERENCE_INPUT');total+=i.byteSize}if(total>LIMITS.totalBytes)fail('C_REFERENCE_TOTAL_SIZE');
 const studio=e.references.map((r,n)=>r.origin==='studio-snapshot'?n:-1).filter(n=>n>=0);
 if(e.studio){const withImage=['B','C'].includes(e.studio.group);if(studio.length!==(withImage?1:0)||withImage&&studio[0]!==e.inputs.length-1)fail('C_REFERENCE_SOURCE');require('./studio-model.cjs').effective({...e,version:2,operation:withImage?'image-edit':'text-to-image',inputs:withImage?[{...e.inputs[studio[0]],index:0}]:[]});const s=require('./studio-model.cjs').validate(e.studio,taskId);if(withImage&&e.references[studio[0]].referenceId!==s.id)fail('C_REFERENCE_SOURCE')}
 else if(studio.length||!c.same(e.parameters,require('./d1-schema.cjs').DEFAULTS))fail('C_REFERENCE_SOURCE');
 return e;
}
function images(e,base64s){validate(e);if(!Array.isArray(base64s)||base64s.length!==e.inputs.length)fail('C_REFERENCE_CHANGED');return base64s.map((b,n)=>{const i=e.inputs[n],bytes=decode(b),v=verify(bytes,i.mime);if(v.sha256!==i.sha256||v.size!==i.byteSize)fail('C_REFERENCE_CHANGED');if(e.references[n].origin==='studio-snapshot'){const s=require('./studio-model.cjs').source(e.studio.sourceJson),ratio=s.scene.ratio.split(':').map(Number);if(i.mime!=='image/png'||![1024,2048].includes(Math.max(v.width,v.height))||Math.abs(v.width/v.height-ratio[0]/ratio[1])>.003)fail('C_REFERENCE_DIMENSIONS')}return bytes})}
function media(e,read){const buffers=e.inputs.map((_,n)=>read(n));images(e,buffers.map(b=>b.toString('base64')));return buffers.map((b,n)=>({id:'m-'+e.inputs[n].sha256,sha256:e.inputs[n].sha256,size:b.length,mime:e.inputs[n].mime,base64:b.toString('base64')}))}
function wireImages(image){const arr=Array.isArray(image)?image:[image];if(!arr.length||arr.length>10)fail('C_REFERENCE_COUNT');let total=0;const seen=new Set();const metadata=arr.map(s=>{if(typeof s!=='string')fail('C_REFERENCE_ENCODING');const m=s.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/s);if(!m)fail('C_REFERENCE_ENCODING');const b=decode(m[2]),v=verify(b,m[1]);total+=v.size;if(seen.has(v.sha256))fail('C_REFERENCE_DUPLICATE');seen.add(v.sha256);return v});if(total>LIMITS.totalBytes)fail('C_REFERENCE_TOTAL_SIZE');return metadata}
module.exports={LIMITS,decode,verify,prepare,validate,images,media,wireImages};

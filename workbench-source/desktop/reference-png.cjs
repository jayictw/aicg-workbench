'use strict';
// Narrow port of the S1 PNG/Base64 validation, entirely offline. No HTTP/keys.
const zlib=require('node:zlib'),crypto=require('node:crypto');
const MODEL='doubao-seedream-5-0-flash-260915',MAX=10*1024*1024,RESPONSE_MAX=4*Math.ceil(MAX/3)+65536;
const fail=code=>{throw Error(code)},hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const table=Array.from({length:256},(_,i)=>{let c=i;for(let j=0;j<8;j++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;return c>>>0});
function crc(b){let c=0xffffffff;for(const x of b)c=table[(c^x)&255]^(c>>>8);return (c^0xffffffff)>>>0}
function verifyPNG(b){
 if(!Buffer.isBuffer(b)||!b.length||b.length>MAX)fail('FLASH_IMAGE_BYTES_LIMIT');
 if(!b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))fail('FLASH_PNG_SIGNATURE');
 let pos=8,header=null,ended=false,closed=false;const chunks=[];
 while(pos<b.length){
  if(pos+12>b.length)fail('FLASH_PNG_TRUNCATED');const n=b.readUInt32BE(pos),kind=b.subarray(pos+4,pos+8),k=kind.toString('ascii'),end=pos+12+n;
  if(![...kind].every(x=>(x>=65&&x<=90)||(x>=97&&x<=122))||(kind[2]&32)||end>b.length)fail('FLASH_PNG_CHUNK');
  const d=b.subarray(pos+8,pos+8+n);if(crc(b.subarray(pos+4,pos+8+n))!==b.readUInt32BE(pos+8+n))fail('FLASH_PNG_CRC');
  if(!header&&k!=='IHDR')fail('FLASH_PNG_HEADER');
  if(k==='IHDR'){if(header||n!==13)fail('FLASH_PNG_HEADER');const w=d.readUInt32BE(0),h=d.readUInt32BE(4);if(w<15||h<15||w*h>36000000||w/h<1/16||w/h>16)fail('FLASH_PNG_DIMENSIONS');if(d[8]!==8||![2,6].includes(d[9])||d[10]||d[11]||d[12])fail('FLASH_PNG_ENCODING_UNSUPPORTED');header={width:w,height:h,channels:d[9]===2?3:4}}
  else if(k==='IDAT'){if(closed)fail('FLASH_PNG_IDAT_ORDER');chunks.push(d)}
  else if(k==='IEND'){if(n||!chunks.length||end!==b.length)fail('FLASH_PNG_END');ended=true}
  else{if(chunks.length)closed=true;if(['acTL','fcTL','fdAT'].includes(k)||!(kind[0]&32))fail('FLASH_PNG_CHUNK_UNSUPPORTED')}
  pos=end;
 }
 if(!ended||!header)fail('FLASH_PNG_END');
 const stride=header.width*header.channels,expected=header.height*(stride+1),compressed=Buffer.concat(chunks);let raw;
 try{const out=zlib.inflateSync(compressed,{maxOutputLength:expected+1,info:true});raw=out.buffer;if(out.engine.bytesWritten!==compressed.length)fail('FLASH_PNG_INFLATION')}catch{fail('FLASH_PNG_INFLATION')}
 if(raw.length!==expected)fail('FLASH_PNG_INFLATION');let prev=Buffer.alloc(stride);const pixels=crypto.createHash('sha256');
 for(let y=0;y<header.height;y++){const offset=y*(stride+1),mode=raw[offset],row=Buffer.from(raw.subarray(offset+1,offset+1+stride));if(mode>4)fail('FLASH_PNG_FILTER');if(mode)for(let i=0;i<stride;i++){const a=i>=header.channels?row[i-header.channels]:0,b=prev[i],c=i>=header.channels?prev[i-header.channels]:0;let pred=0;if(mode===1)pred=a;else if(mode===2)pred=b;else if(mode===3)pred=Math.floor((a+b)/2);else{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);pred=pa<=pb&&pa<=pc?a:pb<=pc?b:c}row[i]=(row[i]+pred)&255}pixels.update(row);prev=row}
 return {...header,mime:'image/png',size:b.length,sha256:hash(b),pixelsSha256:pixels.digest('hex')};
}

module.exports={verifyPNG,crc};

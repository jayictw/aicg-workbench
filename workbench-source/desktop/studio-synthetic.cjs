'use strict';
const zlib=require('node:zlib'),{crc}=require('./flash-png.cjs');
module.exports=function(width,height){
 if(![1024,1152,864,1280,720].includes(width)||!Number.isSafeInteger(height)||width*height>1100000)throw Error('SYNTHETIC_DIMENSIONS');
 const raw=Buffer.alloc(height*(width*3+1));for(let y=0;y<height;y++)for(let x=0;x<width;x++){const p=y*(width*3+1)+1+x*3;raw[p]=x%96<3?200:25+Math.floor(x/16);raw[p+1]=y%96<3?210:50+Math.floor(y/20);raw[p+2]=80}
 const chunk=(type,data)=>{const k=Buffer.from(type),b=Buffer.alloc(data.length+12);b.writeUInt32BE(data.length);k.copy(b,4);data.copy(b,8);b.writeUInt32BE(crc(Buffer.concat([k,data])),data.length+8);return b};
 const h=Buffer.alloc(13);h.writeUInt32BE(width);h.writeUInt32BE(height,4);h[8]=8;h[9]=2;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',h),chunk('tEXt',Buffer.from('Source\0STUDIO MODEL OFFLINE SYNTHETIC')),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
};

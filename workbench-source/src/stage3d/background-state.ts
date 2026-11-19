import { imageSize } from './image-size.ts'
export const backgroundLimits = { fileBytes:8*1024*1024, imageEdge:4096, imagePixels:8*1024*1024, hdrWidth:1024, hdrHeight:512, hdrPixels:1024*512 }
export type BackdropRef={id:string;name:string;size:number;modified:number;kind:'image'|'hdr'}
export type BackdropSettings={mode:'color'|'image'|'hdr';show:boolean;color:string;image:BackdropRef|null;fit:'contain'|'cover';hdr:BackdropRef|null;rotation:number;backgroundIntensity:number;lighting:boolean;environmentIntensity:number;ground:boolean}
export const defaultBackdrop=():BackdropSettings=>({mode:'color',show:true,color:'#343c43',image:null,fit:'contain',hdr:null,rotation:0,backgroundIntensity:1,lighting:false,environmentIntensity:1,ground:true})
export function inspectBackdrop(buffer:ArrayBuffer,kind:'image'|'hdr') {
 if(!buffer.byteLength||buffer.byteLength>backgroundLimits.fileBytes)throw new Error('背景文件必须非空且不超过8 MiB。')
 if(kind==='image'){
  const bytes=new Uint8Array(buffer),png=bytes.length>=8&&bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71,mime=png?'image/png':'image/jpeg',[width,height]=imageSize(bytes,mime)
  if(!width||!height||width>backgroundLimits.imageEdge||height>backgroundLimits.imageEdge||width*height>backgroundLimits.imagePixels)throw new Error('图片最长边≤4096，总像素≤8 MP。')
  return{width,height,mime}
 }
 const header=new TextDecoder('ascii').decode(buffer.slice(0,4096))
 if(!/^#\?(RADIANCE|RGBE)\r?\n/.test(header)||!header.includes('FORMAT=32-bit_rle_rgbe'))throw new Error('仅支持 Radiance RGBE .hdr；不支持 EXR 或改扩展名的普通图片。')
 const match=header.match(/\n-Y\s+(\d+)\s+\+X\s+(\d+)[ \t]*(?:\r?\n)/)
 if(!match)throw new Error('HDR 需为标准 -Y +X 方向的等距柱状全景。')
 const height=Number(match[1]),width=Number(match[2])
 if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<64||height<32||width!==height*2||width>backgroundLimits.hdrWidth||height>backgroundLimits.hdrHeight)throw new Error('HDR 需为2:1等距柱状全景，范围64×32至1024×512。')
 const bytes=new Uint8Array(buffer),start=match.index!+match[0].length
 if(bytes[start]===2&&bytes[start+1]===2&&!(bytes[start+2]&128)){
  let at=start
  for(let row=0;row<height;row++){
   if(at+4>bytes.length||bytes[at]!==2||bytes[at+1]!==2||((bytes[at+2]<<8)|bytes[at+3])!==width)throw new Error('HDR扫描行头损坏或截断。')
   at+=4
   for(let channel=0;channel<4;channel++){let x=0;while(x<width){if(at>=bytes.length)throw new Error('HDR像素数据截断。');const code=bytes[at++],count=code>128?code-128:code,needed=code>128?1:count;if(!count||x+count>width||at+needed>bytes.length)throw new Error('HDR扫描行数据无效或截断。');at+=needed;x+=count}}
  }
  if(at!==bytes.length)throw new Error('HDR像素数据长度与尺寸不符。')
 }else if(bytes.length-start!==width*height*4)throw new Error('HDR平面像素数据长度与尺寸不符或文件截断。')
 return{width,height,mime:'image/vnd.radiance'}
}

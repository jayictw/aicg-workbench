import { inspectGLB } from './glb-inspect'
self.onmessage = async (event: MessageEvent<ArrayBuffer>) => {
 try {
  const buffer=event.data,info=inspectGLB(buffer)
  for(const image of info.embeddedImages){let bitmap:ImageBitmap|undefined;try{bitmap=await createImageBitmap(new Blob([buffer.slice(image.offset,image.offset+image.length)],{type:image.mime}));if(bitmap.width!==image.width||bitmap.height!==image.height)throw new Error('贴图解码尺寸与头部不一致。')}catch{throw new Error('嵌入贴图无法解码；请重新导出有效 PNG/JPEG，原场景保留。')}finally{bitmap?.close()}}
  self.postMessage({ok:true,info,buffer},{transfer:[buffer]})
 }catch(error){self.postMessage({ok:false,message:error instanceof Error?error.message:'GLB预检失败。'})}
}

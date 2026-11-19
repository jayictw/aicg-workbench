import * as T from 'three'
import { RevisionGate } from './state'
import type { BackdropSettings } from './background-state'
type Prepared={kind:'image';bitmap:ImageBitmap;info:{width:number;height:number}}|{kind:'hdr';data:Uint16Array;info:{width:number;height:number;maxHalfValue:number}}
function prepare(file:File,kind:'image'|'hdr',signal:AbortSignal,onWorker:(n:number)=>void):Promise<Prepared>{
 if(!file.size||file.size>8*1024*1024||(kind==='hdr'?!/\.hdr$/i.test(file.name):!/\.(png|jpe?g)$/i.test(file.name)))return Promise.reject(new Error('请选择非空JPG/PNG或Radiance .hdr，单文件最大8 MiB。'))
 return new Promise((resolve,reject)=>{
  const worker=new Worker(new URL('./background-worker.ts',import.meta.url),{type:'module'});let running=true;onWorker(1)
  const stop=()=>{if(!running)return;running=false;clearTimeout(timer);signal.removeEventListener('abort',abort);worker.terminate();onWorker(-1)}
  const abort=()=>{stop();reject(new Error('已取消较早的背景加载。'))},timer=window.setTimeout(()=>{stop();reject(new Error('背景解码超过8秒，已中止并保留原设置。'))},8000)
  signal.addEventListener('abort',abort,{once:true});worker.onmessage=e=>{if(!running){e.data.bitmap?.close();return}stop();e.data.ok?resolve(e.data):reject(new Error(e.data.message))};worker.onerror=()=>{stop();reject(new Error('背景解码线程无法运行。'))};if(signal.aborted){abort();return}file.arrayBuffer().then(buffer=>{if(running)worker.postMessage({buffer,kind},[buffer])}).catch(e=>{stop();reject(e)})
 })
}
export class StageBackdrop {
 private gates={image:new RevisionGate(),hdr:new RevisionGate()};private aborts:{image?:AbortController;hdr?:AbortController}={};private disposed=false
 private photo:T.Texture|null=null;private bitmap:ImageBitmap|null=null;private hdr:T.DataTexture|null=null;private targets:T.WebGLRenderTarget[]=[];private info:{image?:{width:number;height:number};hdr?:{width:number;height:number;maxHalfValue:number}}={}
 private photoScene=new T.Scene();private photoCamera=new T.Camera();private photoQuad:T.Mesh<T.PlaneGeometry,T.ShaderMaterial>
 constructor(private renderers:T.WebGLRenderer[],private onWorker:(n:number)=>void){
  const material=new T.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:false,uniforms:{picture:{value:null},imageAspect:{value:1},frameAspect:{value:1},contain:{value:true},base:{value:new T.Color(0x343c43)}},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.999,1.0);}',fragmentShader:`uniform sampler2D picture;uniform float imageAspect;uniform float frameAspect;uniform bool contain;uniform vec3 base;varying vec2 vUv;
   void main(){float ratio=frameAspect/imageAspect;vec2 scale=contain?vec2(max(ratio,1.0),max(1.0/ratio,1.0)):vec2(min(ratio,1.0),min(1.0/ratio,1.0));vec2 uv=(vUv-0.5)*scale+0.5;vec4 color=vec4(base,1.0);if(uv.x>=0.0&&uv.x<=1.0&&uv.y>=0.0&&uv.y<=1.0){vec4 p=texture2D(picture,uv);color.rgb=mix(base,p.rgb,p.a);}gl_FragColor=color;
   #include <colorspace_fragment>
  }`})
  this.photoQuad=new T.Mesh(new T.PlaneGeometry(2,2),material);this.photoQuad.frustumCulled=false;this.photoScene.add(this.photoQuad)
 }
 async load(file:File,kind:'image'|'hdr'){
  const token=this.gates[kind].next();this.aborts[kind]?.abort();const controller=new AbortController();this.aborts[kind]=controller
  const value=await prepare(file,kind,controller.signal,this.onWorker)
  if(this.disposed||!this.gates[kind].current(token)){if(value.kind==='image')value.bitmap.close();return false}
  if(value.kind==='image'){
   const texture=new T.Texture(value.bitmap);texture.colorSpace=T.SRGBColorSpace;texture.flipY=false;texture.generateMipmaps=false;texture.minFilter=T.LinearFilter;texture.needsUpdate=true
   try{this.renderers.forEach(r=>r.initTexture(texture))}catch(error){texture.dispose();value.bitmap.close();throw error}
   this.photo?.dispose();this.bitmap?.close();this.photo=texture;this.bitmap=value.bitmap;this.info.image=value.info;this.photoQuad.material.uniforms.picture.value=texture;this.photoQuad.material.uniforms.imageAspect.value=value.info.width/value.info.height
  }else{
   const texture=new T.DataTexture(value.data,value.info.width,value.info.height,T.RGBAFormat,T.HalfFloatType);texture.colorSpace=T.LinearSRGBColorSpace;texture.mapping=T.EquirectangularReflectionMapping;texture.flipY=true;texture.generateMipmaps=false;texture.minFilter=T.LinearFilter;texture.magFilter=T.LinearFilter;texture.needsUpdate=true
   const targets:T.WebGLRenderTarget[]=[]
   try{for(const r of this.renderers){const generator=new T.PMREMGenerator(r);try{targets.push(generator.fromEquirectangular(texture))}finally{generator.dispose()}}}catch(error){targets.forEach(t=>t.dispose());texture.dispose();throw new Error(`HDR预滤镜处理失败：${error instanceof Error?error.message:'GPU不可用'}。`)}
   if(this.disposed||!this.gates[kind].current(token)){targets.forEach(t=>t.dispose());texture.dispose();return false}
   this.targets.forEach(t=>t.dispose());this.hdr?.dispose();this.targets=targets;this.hdr=texture;this.info.hdr=value.info
  }
  return true
 }
 bind(scene:T.Scene,settings:BackdropSettings,index:number,aspect:number){
  scene.environment=settings.lighting&&this.targets[index]?this.targets[index].texture:null;scene.environmentIntensity=settings.environmentIntensity;scene.environmentRotation.set(0,T.MathUtils.degToRad(settings.rotation),0);scene.backgroundRotation.copy(scene.environmentRotation);scene.backgroundIntensity=settings.backgroundIntensity
  if(settings.show&&settings.mode==='hdr'&&this.hdr){scene.background=this.hdr;return false}
  if(settings.show&&settings.mode==='image'&&this.photo){scene.background=null;this.photoQuad.material.uniforms.frameAspect.value=aspect;this.photoQuad.material.uniforms.contain.value=settings.fit==='contain';this.photoQuad.material.uniforms.base.value.set(settings.color);this.renderers[index].render(this.photoScene,this.photoCamera);this.renderers[index].clearDepth();return true}
  scene.background=new T.Color(settings.show?settings.color:'#343c43');return false
 }
 diagnostics(){return{imageLoaded:!!this.photo,hdrLoaded:!!this.hdr,pmremTargets:this.targets.length,info:this.info,hdrMaxRadiance:this.info.hdr?T.DataUtils.fromHalfFloat(this.info.hdr.maxHalfValue):null}}
 dispose(){if(this.disposed)return;this.disposed=true;for(const kind of ['image','hdr'] as const){this.gates[kind].cancel();this.aborts[kind]?.abort()};this.targets.forEach(t=>t.dispose());this.targets=[];this.photo?.dispose();this.bitmap?.close();this.hdr?.dispose();this.photo=null;this.hdr=null;this.bitmap=null;this.photoQuad.material.uniforms.picture.value=null;this.photoQuad.geometry.dispose();this.photoQuad.material.dispose();this.photoScene.clear()}
}

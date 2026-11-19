import * as T from 'three'
import { referenceBlurRadius } from './reference-state'
import type { DepthOfField } from './dof-state'
export type DofStatus = { state:'off'|'active'|'fallback'; reason:string }
export const shootingLifecycle={created:0,disposed:0,active:0,targets:0,passes:0}
const publish=()=>{document.documentElement.dataset.shootingLifecycle=JSON.stringify(shootingLifecycle)}
/** Optional, demand-rendered shooting pipeline. No render target/pass is allocated while off.
 * Linear half-float geometry + its actual material depth -> bounded depth-aware disk gather.
 * Background is composited sharp: no invented photo/HDR object depths. Geometry receives ACES/sRGB once.
 * Preview and PNG output share this entry; radius is relative to the actual frame, not its container.
 */
export class ShootingRenderer {
 private target?:T.WebGLRenderTarget
 private quad?:T.Mesh<T.PlaneGeometry,T.ShaderMaterial>
 private output=new T.Scene();private outputCamera=new T.Camera();private background=new T.Scene()
 private failure='';private limitation='';private lastStatus='';private samples=0
 private frames=0;private lastMs=0;private totalMs=0;private directFrames=0;private dofFrames=0
 constructor(private renderer:T.WebGLRenderer,private scene:T.Scene,private camera:T.PerspectiveCamera,private onStatus:(s:DofStatus)=>void){}
 private status(state:DofStatus['state'],reason=''){const signature=state+reason;if(signature!==this.lastStatus){this.lastStatus=signature;this.onStatus({state,reason})}}
 private release(){if(!this.target)return;this.target.dispose();if(this.quad){this.quad.geometry.dispose();this.quad.material.dispose();shootingLifecycle.active--;shootingLifecycle.disposed++;shootingLifecycle.targets--;shootingLifecycle.passes--}this.output.clear();this.target=undefined;this.quad=undefined;publish()}
 reset(){this.release();this.failure='';this.lastStatus=''}
 private ensure(width:number,height:number){
  const r=this.renderer,gl=r.getContext() as WebGL2RenderingContext
  if(!gl.getExtension('EXT_color_buffer_float'))throw new Error('设备不支持浮点颜色附件，已回退清晰预览。')
  if(!this.target){
   const available=Array.from(gl.getInternalformatParameter(gl.RENDERBUFFER,gl.RGBA16F,gl.SAMPLES) as Int32Array)
   this.samples=Math.max(0,...available.filter(n=>n<=4))
   if(this.samples<2)throw new Error('设备不支持带深度的浮点抗锯齿目标，已回退清晰预览。')
   this.target=new T.WebGLRenderTarget(width,height,{type:T.HalfFloatType,format:T.RGBAFormat,depthBuffer:true,stencilBuffer:false,samples:this.samples,depthTexture:new T.DepthTexture(width,height,T.UnsignedIntType)})
   this.target.texture.name='M5 shooting linear geometry';this.target.texture.colorSpace=T.LinearSRGBColorSpace
   this.target.depthTexture!.minFilter=T.NearestFilter;this.target.depthTexture!.magFilter=T.NearestFilter
   const material=new T.ShaderMaterial({name:'M5DepthAwareFocus',depthTest:false,depthWrite:false,transparent:true,toneMapped:true,uniforms:{colorImage:{value:this.target.texture},depthImage:{value:this.target.depthTexture},texel:{value:new T.Vector2()},nearClip:{value:.01},farClip:{value:100},focus:{value:5},strength:{value:.4},radius:{value:7}},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',fragmentShader:`
    #include <common>
    #include <packing>
    uniform sampler2D colorImage;uniform sampler2D depthImage;uniform vec2 texel;
    uniform float nearClip;uniform float farClip;uniform float focus;uniform float strength;uniform float radius;
    varying vec2 vUv;
    float zAt(vec2 uv){return -perspectiveDepthToViewZ(texture2D(depthImage,uv).x,nearClip,farClip);}
    void main(){
     vec4 base=texture2D(colorImage,vUv);float raw=texture2D(depthImage,vUv).x;
     // No geometric depth: preserve background. Transparent depthWrite=false surfaces inherit underlying depth.
     if(base.a<0.00001){gl_FragColor=vec4(0.0);return;}
     float z=zAt(vUv),coc=(raw>=1.0?0.0:radius*strength*clamp(abs(z-focus)/max(z,focus)*4.0,0.0,1.0));
     vec4 sum=base;float weight=1.0;
     if(coc>0.25){for(int i=1;i<=96;i++){
      float f=float(i),angle=f*2.39996323;vec2 uv=clamp(vUv+vec2(cos(angle),sin(angle))*sqrt(f/96.0)*coc*texel,texel*0.5,vec2(1.0)-texel*0.5);
      float d=texture2D(depthImage,uv).x;vec4 color=texture2D(colorImage,uv);float sz=zAt(uv);
      // Reject background and large discontinuities to bound silhouette color leakage.
      float valid=(d<1.0&&color.a>0.00001)?1.0:0.0;
      float w=valid*(1.0-smoothstep(max(0.03,z*0.04),max(0.06,z*0.12),abs(sz-z)));
      sum+=color*w;weight+=w;
     }}
     vec4 filtered=sum/weight;
     // Color target stores premultiplied linear color; preserve original edge coverage.
     gl_FragColor=vec4(filtered.rgb/max(filtered.a,0.00001),base.a);
     #include <tonemapping_fragment>
     #include <colorspace_fragment>
    }`})
   this.quad=new T.Mesh(new T.PlaneGeometry(2,2),material);this.quad.frustumCulled=false;this.output.add(this.quad)
   shootingLifecycle.created++;shootingLifecycle.active++;shootingLifecycle.targets++;shootingLifecycle.passes++;publish()
  }
  if(this.target.width!==width||this.target.height!==height)this.target.setSize(width,height)
  r.setRenderTarget(this.target)
  if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('景深颜色／深度缓冲不完整，已回退清晰预览。')
 }
 render(settings:DepthOfField,frame:{x:number;y:number;width:number;height:number},bind:()=>void){
  const r=this.renderer,start=performance.now(),viewport=new T.Vector4(frame.x,frame.y,frame.width,frame.height)
  const frameScreen=()=>{r.setRenderTarget(null);r.setViewport(viewport);r.setScissor(viewport);r.setScissorTest(true);r.setRenderTarget(null)}
  const direct=()=>{frameScreen();bind();r.render(this.scene,this.camera);this.directFrames++}
  this.limitation=''
  if(settings.enabled)this.scene.traverseVisible(object=>{if(!(object instanceof T.Mesh)||!object.layers.test(this.camera.layers))return;const materials=Array.isArray(object.material)?object.material:[object.material];if(materials.some(material=>material.visible&&material.opacity>0&&(!material.depthWrite||(material.transparent&&material.opacity<1)||('transmission'in material&&Number(material.transmission)>0))))this.limitation='透明或不写入深度的材质缺少可靠焦平面；为保留原色彩与透明度，已回退清晰预览。'})
  if(!settings.enabled){this.release();this.failure='';this.status('off');direct()}
  else if(this.limitation){this.release();this.status('fallback',this.limitation);direct()}
  else if(this.failure){this.status('fallback',this.failure);direct()}
  else {
   const background=this.scene.background,clear=r.getClearColor(new T.Color()).clone(),alpha=r.getClearAlpha(),oldError=r.debug.onShaderError
   let sceneBackground:T.Scene['background']=background,shaderFailure=''
   try{
    const width=Math.max(1,Math.floor(frame.width*r.getPixelRatio())),height=Math.max(1,Math.floor(frame.height*r.getPixelRatio()))
    this.ensure(width,height)
    r.debug.onShaderError=()=>{shaderFailure='景深渲染着色器编译失败，已回退清晰预览。'}
    frameScreen();bind();sceneBackground=this.scene.background
    this.background.background=sceneBackground;this.background.backgroundIntensity=this.scene.backgroundIntensity;this.background.backgroundRotation.copy(this.scene.backgroundRotation)
    r.render(this.background,this.camera)
    this.scene.background=null;r.setRenderTarget(this.target!);r.setScissorTest(false);r.setClearColor(0,0);r.clear();r.render(this.scene,this.camera)
    const u=this.quad!.material.uniforms;u.texel.value.set(1/width,1/height);u.nearClip.value=this.camera.near;u.farClip.value=this.camera.far;u.focus.value=settings.focusDistance;u.strength.value=settings.strength;u.radius.value=referenceBlurRadius(width,height)
    frameScreen();r.render(this.output,this.outputCamera);if(shaderFailure)throw new Error(shaderFailure);this.dofFrames++;this.status('active')
   }catch(e){this.failure=e instanceof Error?e.message:'景深处理不可用，已回退清晰预览。';this.release();this.scene.background=sceneBackground;r.debug.onShaderError=oldError;direct();this.status('fallback',this.failure)}
   finally{this.scene.background=sceneBackground;this.background.background=null;r.setClearColor(clear,alpha);r.debug.onShaderError=oldError;frameScreen()}
  }
  this.lastMs=performance.now()-start;this.totalMs+=this.lastMs;this.frames++;r.setScissorTest(false)
 }
 diagnostics(){return{state:this.lastStatus.startsWith('active')?'active':this.lastStatus.startsWith('fallback')?'fallback':'off',reason:this.failure||this.limitation,targets:this.target?1:0,passes:this.quad?1:0,size:this.target?[this.target.width,this.target.height]:null,samples:this.target?this.samples:0,referenceRadiusPx:7,referenceShortEdge:256,frames:this.frames,directFrames:this.directFrames,dofFrames:this.dofFrames,lastCpuMs:this.lastMs,meanCpuMs:this.totalMs/Math.max(1,this.frames)}}
 dispose(){this.release();this.output.clear();this.background.clear();this.background.background=null}
}

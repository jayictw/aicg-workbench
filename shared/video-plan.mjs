import {exact,fail,mediaRecord,effectiveInput} from './core.mjs';
export const VIDEO_MODEL='dreamina-seedance-2-5-260628';
export const VIDEO_PARAMETERS={model:VIDEO_MODEL,mode:'first',duration:4,resolution:'480p',ratio:'adaptive',generate_audio:true,watermark:true};
export const VIDEO_REFERENCE_RATIOS=['adaptive','16:9','4:3','1:1','3:4','9:16','21:9'];
export function validateVideoParameters(p){
 exact(p,[...Object.keys(VIDEO_PARAMETERS),'generate_audio_explicit']);if(Object.hasOwn(p,'generate_audio_explicit')&&p.generate_audio_explicit!==true)fail('VIDEO_PARAMETERS','聲音選項來源無效');
 if(p.model!==VIDEO_MODEL||!['first','first-last','reference'].includes(p.mode)||p.duration!==4||p.resolution!=='480p'||!(p.mode==='reference'?VIDEO_REFERENCE_RATIOS.includes(p.ratio):p.ratio==='adaptive')||typeof p.generate_audio!=='boolean'||p.watermark!==true)fail('VIDEO_PARAMETERS','Seedance 2.5 · 4秒 · 480p · 聲音依本次選項 · 水印；首尾幀只支援依首幀比例，多圖參考可選比例');
}
export function videoPlan(g,n,effective=effectiveInput(g,n),{audioPolicy=null}={}){
 if(audioPolicy!==null&&audioPolicy!=='always-on/1')fail('VIDEO_AUDIO_POLICY','影片聲音策略不支援');
 if(n?.kind!=='generate.video'||n.payload.execution!=='video-offline')fail('VIDEO_NODE','請選擇影片任務框');validateVideoParameters(n.payload.parameters);
 if(n.payload.videoInputSelection){const v=n.payload.videoInputSelection;if(!['FIRST_FRAME','FIRST_LAST_FRAME','MULTI_REFERENCE'].includes(v.mode)||!['generate','reference'].includes(v.operation)||v.selections.some(p=>!['FIRST_FRAME','LAST_FRAME','REFERENCE_IMAGE'].includes(p.role))||Object.entries(v.parameters).some(([k,value])=>value!==(k==='output_format'?'mp4':n.payload.parameters[k])))fail('VIDEO_TYPED_ROUTE_REQUIRED','此模式或參數請從影片面板的合同預覽執行；舊離線入口不會降級或改用舊素材。');}
 if(effective.errors.length)fail('VIDEO_INPUT',effective.errors.join('；'));
 const parameters=structuredClone(n.payload.parameters),policy=audioPolicy?{audioPolicy}:{};delete parameters.generate_audio_explicit;if(audioPolicy)parameters.generate_audio=true;
 if(n.payload.parameters.mode==='reference'){
  const purposes={reference:'一般參考',product:'產品外觀',character:'人物身份與衣著',scene:'場景環境',style:'風格',studio:'攝影棚構圖與姿勢'};
  if(effective.media.some(m=>!Object.hasOwn(purposes,m.role)))fail('VIDEO_MODE_CONFLICT','多圖參考與首幀／尾幀互斥，請明確移除衝突連線；來源素材仍保留');
  if(effective.media.length<1||effective.media.length>30)fail('VIDEO_REFERENCE_COUNT','多圖參考需要1–30張圖片');
  const frames=effective.media.map(m=>{const meta=mediaRecord(g,m.mediaRef);if(meta.type!=='image'||!['image/png','image/jpeg','image/webp'].includes(meta.mime)||meta.size>=30000000||Math.min(meta.width,meta.height)<300||Math.max(meta.width,meta.height)>6000||meta.width/meta.height<.4||meta.width/meta.height>2.5)fail('VIDEO_FRAME_FORMAT','影片參考圖需為PNG/JPEG/靜態WebP、300–6000像素、比例0.4–2.5且小於30MB');return {...m,name:meta.name??'固定圖片',mime:meta.mime,width:meta.width,height:meta.height,role:'reference_image',purpose:m.role,admission:'not-evaluated'};});
  const prompt=[effective.prompt,...frames.map((f,i)=>'@圖像'+(i+1)+'用途：'+purposes[f.purpose]+'。')].join('\n');
  if(new TextEncoder().encode(prompt).length>16000)fail('VIDEO_PROMPT_LIMIT','含逐圖用途的有效提示詞超過本地16KB保護限制');
  return {version:2,provider:'byteplus-modelark',region:'ap-southeast-1',apiOrigin:'https://ark.ap-southeast.bytepluses.com',model:VIDEO_MODEL,mode:'reference',originalPrompt:effective.prompt,prompt,frames,parameters,...policy,outputCount:1,executionEnvironment:'mock-http',portraitAuthorization:'unknown',uploadAuthorized:false};
 }
 const expected=n.payload.parameters.mode==='first'?['firstFrame']:['firstFrame','lastFrame'];
 if(effective.media.some(m=>!expected.includes(m.role)))fail('VIDEO_MODE_CONFLICT','此模式只使用首幀／尾幀；先移除其他參考，不能混為多模態參考');
 const frames=expected.map(role=>{const items=effective.media.filter(m=>m.role===role);if(items.length!==1)fail('VIDEO_FRAME_MISSING',role==='firstFrame'?'請選擇一張首幀圖片':'請選擇一張尾幀圖片');const m=items[0],meta=mediaRecord(g,m.mediaRef);if(meta.type!=='image'||!['image/png','image/jpeg','image/webp'].includes(meta.mime)||meta.size>=30*1024*1024||Math.min(meta.width,meta.height)<300||Math.max(meta.width,meta.height)>6000||meta.width/meta.height<.4||meta.width/meta.height>2.5)fail('VIDEO_FRAME_FORMAT','圖片需為PNG/JPEG/WebP、300–6000像素、比例0.4–2.5且小於30MB');return {...m,name:meta.name??'固定圖片',mime:meta.mime,width:meta.width,height:meta.height,role:role==='firstFrame'?'first_frame':'last_frame',admission:'not-evaluated'};});
 return {version:1,provider:'byteplus-modelark',region:'ap-southeast-1',apiOrigin:'https://ark.ap-southeast.bytepluses.com',model:VIDEO_MODEL,mode:n.payload.parameters.mode,originalPrompt:effective.prompt,frames,parameters,...policy,outputCount:1,executionEnvironment:'mock-http',portraitAuthorization:'unknown',uploadAuthorized:false};
}

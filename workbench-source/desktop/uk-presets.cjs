'use strict';
const services=[

 {id:'google-developer',platformId:'google',name:'Google 开发者 API',region:null,origin:'https://generativelanguage.googleapis.com',auth:'api-key',models:[['nano21','Nano Banana 2.1','gemini-nano-banana-2.1'],['flash31','Gemini Flash Image','gemini-3.1-flash-image']]},
 {id:'google-cloud',platformId:'google',name:'Google 企业 Cloud（鉴权尚未支持）',region:'us-central1',origin:'https://us-central1-aiplatform.googleapis.com',auth:'iam',models:[]},
 {id:'ark-cn',platformId:'bytedance',name:'火山方舟中国 · 北京',region:'cn-beijing',origin:'https://ark.cn-beijing.volces.com',auth:'api-key',models:[['ark-flash','Seedream 5 Flash','doubao-seedream-5-0-flash-260915'],['ark-pro','Seedream 5 Pro','doubao-seedream-5-0-pro-260628'],['ark-seedance-mini','Seedance 2.0 Mini','doubao-seedance-2-0-mini-260615'],['ark-seedance-25','Seedance 2.5 · 组合参考／纯文字4秒','doubao-seedance-2-5-260628']]},
 {id:'openai',platformId:'openai',name:'OpenAI API',region:null,origin:'https://api.openai.com',auth:'api-key',models:[['gpt-flare','GPT Image 2.5 Flare','gpt-image-2.5-flare-2026-09-08'],['gpt-sun','GPT Image 2.5 Sunburst','gpt-image-2.5-sunburst-2026-09-08']]},
];
const protocols={'google-developer':'google-interactions-v1beta','google-cloud':'google-cloud-lro','ark-cn':'ark-sync-images-v3','openai':'openai-images-v1'};for(const s of services){s.protocolId=protocols[s.id];s.transportImplemented=false}
const platforms=[['bytedance','火山方舟'],['google','Google'],['openai','OpenAI']].map(([id,name])=>({id,name}));
const modelList=services.flatMap(s=>s.models.map(([id,name,exact])=>({id,name,exact,serviceId:s.id,revision:1})));
module.exports={services,platforms,modelList,service:id=>services.find(s=>s.id===id),model:id=>modelList.find(m=>m.id===id),publicPresets:()=>({platforms:platforms.filter(p=>p.id==='bytedance'),services:services.filter(s=>require('./release-scope.cjs').service(s.id)).map(({models,...s})=>({...s,revision:1,realSupported:false})),models:modelList.filter(m=>require('./release-scope.cjs').model(m.id))})};

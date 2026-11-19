'use strict';
// Historical record decoding only. Never exported to product presets or accepted by add/action.
const records=[
{id:'byteplus-sg',platformId:'bytedance',name:'BytePlus ModelArk · 东南亚',region:'ap-southeast-1',origin:'https://ark.ap-southeast.bytepluses.com',auth:'api-key',models:[['bp-pro','Seedream 5.0 Pro','dola-seedream-5-0-pro-260628']]},
{id:'byteplus',platformId:'bytedance',name:'BytePlus 海外',region:'ap-southeast',origin:'https://ark.ap-southeast.bytepluses.com',auth:'api-key',models:[['bp-flash','Seedream 5 Flash','dola-seedream-5-0-flash-260915']]},
{id:'xai',platformId:'xai',name:'xAI 全球 API',region:null,origin:'https://api.x.ai',auth:'api-key',models:[['grok-image','Grok Imagine Image','grok-imagine-image-2.0']]},
{id:'runway',platformId:'runway',name:'Runway API',region:null,origin:'https://api.dev.runwayml.com',auth:'api-key',models:[['runway-image','Gen4 Image','gen4_image']]},
{id:'kling-sg',platformId:'kling',name:'可灵 · 新加坡服务',region:'singapore',origin:'https://api-singapore.klingai.com',auth:'api-key',models:[['kling-o1','Kling Image O1','kling-image-o1']]},
{id:'kling-cn',platformId:'kling',name:'可灵 · 北京服务',region:'beijing',origin:'https://api-beijing.klingai.com',auth:'api-key',models:[['kling-cn-o1','Kling Image O1','kling-image-o1']]}
];
const models=records.flatMap(s=>s.models.map(([id,name,exact])=>({id,name,exact,serviceId:s.id,revision:1})));
exports.serviceForRead=id=>records.find(s=>s.id===id);exports.modelForRead=id=>models.find(m=>m.id===id);

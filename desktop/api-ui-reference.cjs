'use strict';
// UI reference fixtures only. No provider adapter or network implementation.
const modes=['TEXT_TO_IMAGE','IMAGE_REFERENCE','TEXT_TO_VIDEO','FIRST_FRAME','FIRST_LAST_FRAME','MULTI_REFERENCE','VIDEO_REFERENCE'];
const refs={
 UNKNOWN:{id:'UNKNOWN',revision:'1',knowledge:'UNKNOWN',label:'未知能力（可保存）',sources:['USER_CONFIGURATION / 未核实'],checkedAt:null,documentUpdatedAt:null,parameters:{},defaults:{}},
 CONFLICT:{id:'CONFLICT',revision:'1',knowledge:'CONFLICT',label:'冲突示例（仅合成）',sources:['SYNTHETIC-A: maximum 4','SYNTHETIC-B: maximum 2'],checkedAt:'2026-11-10',documentUpdatedAt:null,parameters:{},defaults:{}},
 MOCK_VIDEO:{id:'MOCK_VIDEO',revision:'1',knowledge:'MOCK_ONLY',label:'Mock 视频参考（非官方能力）',sources:['P1-03/SYNTHETIC/UI-REFERENCE-1'],checkedAt:'2026-11-10',documentUpdatedAt:null,modes:modes.filter(x=>!x.includes('IMAGE')&&x!=='VIDEO_REFERENCE'),inputCount:{minImages:1,maxImages:4},parameters:{duration:{type:'number',min:2,max:10},resolution:{type:'string',enum:['480p','1080p']},generate_audio:{type:'boolean',enum:[true,false]}},defaults:{duration:4,resolution:'480p',generate_audio:true}},
 MOCK_IMAGE:{id:'MOCK_IMAGE',revision:'1',knowledge:'MOCK_ONLY',label:'Mock 图片参考（非官方能力）',sources:['P1-03/SYNTHETIC/UI-REFERENCE-1'],checkedAt:'2026-11-10',documentUpdatedAt:null,modes:['TEXT_TO_IMAGE','IMAGE_REFERENCE'],inputCount:{minImages:1,maxImages:4},parameters:{size:{type:'string',enum:['1024x1024','1536x1024']}},defaults:{size:'1024x1024'}}
};
module.exports={modes,references:refs};

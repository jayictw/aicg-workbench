 'use strict';
// Bounded application subset of the China Beijing Ark API. Never a BytePlus endpoint.
module.exports=Object.freeze({version:1,id:'ark-seedance25-text4-480p-v1',presetId:'ark-seedance-25',model:'doubao-seedance-2-5-260628',origin:'https://ark.cn-beijing.volces.com',
 parameters:Object.freeze([{key:'draft',value:false},{key:'duration',value:4},{key:'generate_audio',value:false},{key:'output_format',value:'mp4'},{key:'ratio',value:'16:9'},{key:'resolution',value:'480p'},{key:'service_tier',value:'default'},{key:'watermark',value:true}].map(Object.freeze)),
 media:Object.freeze({width:854,height:480,durationMinMs:3900,durationMaxMs:4100,codec:'h264',pixelFormat:'yuv420p',fps:24,audio:'absent',maxBytes:33554432}),
 hosts:Object.freeze(['ark-content-generation-cn-beijing.tos-cn-beijing.volces.com','ark-acg-cn-beijing.tos-cn-beijing.volces.com']),
 observation:Object.freeze({id:'seedance25-3000-60-50-v1',windowMs:3000000,intervalMs:60000,firstDelayMs:60000,maxQueries:50,maxWindows:1}),
 docs:Object.freeze({model:'https://docs.volcengine.com/docs/ark/seedance-2-5?lang=zh',spec:'https://docs.volcengine.com/docs/ark/model-list?lang=en',create:'https://docs.volcengine.com/docs/ark/create-video-generation-task-api?lang=zh',get:'https://docs.volcengine.com/docs/ark/get-video-generation-task-api?lang=zh',list:'https://docs.volcengine.com/docs/ark/list-video-generation-tasks-api?lang=zh',price:'https://docs.volcengine.com/docs/ark/model-pricing?lang=zh'}),
 // MP4 codec/pixel-format and 32MiB/30s have no provider guarantee. Reject incompatibility; do not weaken validation.
 compatibility:'CONSERVATIVE_LOCAL_SUBSET_NOT_PROVIDER_OUTPUT_GUARANTEE',checkedDate:'2026-10-28'});

'use strict';
const {platforms}=require('./api-platform-policy.cjs');
const fail=code=>{throw Object.assign(Error(friendlyError(code)),{code});};
function keys(x,list){if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).some(k=>!list.includes(k)))fail('UI_FIELD_UNSUPPORTED');}
function resolveTemplate(req){
 keys(req,['platformId','variables','connectionCount']);keys(req.variables??{},['workspace','region','project']);
 const t=platforms.find(x=>x.id===req.platformId);if(!t)fail(require('./api-platform-templates.json').some(x=>x.id===req.platformId)?'PLATFORM_NOT_SUPPORTED':'PLATFORM_UNKNOWN');
 const v=req.variables??{};for(const [k,s]of Object.entries(v)){if(typeof s!=='string'||s.length>200)fail('PLATFORM_VARIABLE_INVALID');if(s&&k!=='region'&&!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(s))fail('PLATFORM_VARIABLE_INVALID');}
 if(v.region&&!t.regionOptions.includes(v.region))fail('PLATFORM_VARIABLE_INVALID');
 const missing=t.required.filter(k=>!v[k]),patch={providerName:t.providerName,kind:t.kind,baseUrl:t.baseUrl,region:t.region,protocolId:t.protocolId,protocolVersion:t.protocolVersion,authType:t.authType,path:t.path,accountScope:'UNKNOWN',localOnly:t.id==='LOCAL',mediaKind:t.mediaKinds[0],templateId:t.id==='MOCK'?'MOCK_VIDEO':'UNKNOWN',connectionName:t.providerName+' · '+((Number.isSafeInteger(req.connectionCount)&&req.connectionCount>=0?req.connectionCount:0)+1)};
 if(t.id==='G.C')patch.accountScope=v.project?'project:'+v.project:'UNKNOWN';
 if(t.id==='MOCK')patch.mediaKind='VIDEO';
 if(t.id==='B'){patch.region=v.region||'global';patch.baseUrl=patch.region==='EU'?'https://api.eu.bfl.ai':patch.region==='US'?'https://api.us.bfl.ai':'https://api.bfl.ai';}
 if(['A.V','A.I'].includes(t.id)){patch.baseUrl=missing.length?'':`https://${v.workspace}.${v.region}.maas.aliyuncs.com/api/v1`;patch.region=v.region||'UNKNOWN';}
 return {patch,missing,template:structuredClone(t)};
}
function friendlyError(code){return ({
 PLATFORM_NOT_SUPPORTED:'此平台当前不开放新建。请选已核实配置模板；自定义和本地接入将在后续版本支持。',HISTORICAL_CONFIG_READ_ONLY:'历史配置仅供查看，不会删除或转换。当前不支持修改或新增这类连接。',PLATFORM_CONFIGURATION_UNSUPPORTED:'连接参数与已核实的平台模板不一致。请重新选择平台；不支持自定义地址或协议。',
 CONFIG_INVALID:'请检查必填信息：平台名称、连接名称和模型标识不能为空。',
 PLATFORM_UNKNOWN:'请选择已列出的平台；未列出的平台暂不开放新建。',PLATFORM_VARIABLE_INVALID:'平台补充信息不正确，请检查工作空间、项目或服务地区。',UI_FIELD_UNSUPPORTED:'此处只接受非敏感配置。请勿输入 API Key 或密码。',
 UI_TEXT_INVALID:'请填写所需信息；输入不能为空或包含控制字符。',CONFIG_URL_UNSAFE:'服务地址格式不正确。请填写完整地址，不要包含账号、密码或查询参数。',LOCAL_TRUST_NOT_IMPLEMENTED:'本地地址仅支持明确的本机或局域网配置；公网 HTTP 和元数据地址不可使用。',
 CONFIG_REVISION_CONFLICT:'设置版本已变化。编辑内容已保留，请重读并比较后再保存。',UNSAVED_CHANGES:'还有未保存的编辑，请先保存或明确放弃。',PROTOCOL_NOT_SUPPORTED:'配置可保存；当前尚未支持此平台的真实调用。',LOCAL_TRANSPORT_NOT_IMPLEMENTED:'本地模型已配置；本地 HTTP 真实调用尚未实现。',
 CAPABILITY_UNKNOWN:'模型能力尚未确认（UNKNOWN）。可以保存，暂不启用生成选项。',CAPABILITY_CONFLICT:'参考资料存在冲突（CONFLICT），请先核对来源。',CONFIG_REFERENCE_MISSING:'请选择已保存的模型和画布任务。',MODEL_MEDIA_MISMATCH:'所选模型的输出类型与画布任务不一致，请选择图片或视频对应的模型。',
 UI_SENSITIVE_VALUE:'输入可能包含凭据或本地路径，请移除敏感内容后再保存。',UI_PROMPT_INVALID:'请检查提示词：文字生成模式需要提示词，且不能包含控制字符。',PARAMETER_RANGE:'参数超出已确认的范围。原输入已保留，请修改后再试。',PARAMETER_TYPE:'参数类型不正确，请检查数值、文字或开关。',PREVIEW_STALE:'设置或素材已变化，请重新查看本次请求摘要。',ORIGINAL_TASK_UNKNOWN:'上一任务的提交结果未知，请核对原任务；不能重复发送。'
 })[code]??'操作未完成，输入已保留。请检查配置，或展开错误详情。';}
module.exports={platforms,resolveTemplate,friendlyError};

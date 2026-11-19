'use strict';
// Original, deliberately closed R1 surface. Schemas are also enforced by the broker.
const str={type:'string',minLength:1,maxLength:256};
const scope={scopeHandle:str},page={cursor:str,limit:{type:'integer',minimum:1,maximum:25}};
const specs={
 session_info:[{},[],'连接状态；不返回内部权限信息'],
 scope_select:[{},[],'取得原生应用已明确授权的短效作用域；不能选择路径或工作库'],
 project_list:[{...scope,...page},['scopeHandle'],'当前内存项目列表；已保存状态单列'],
 project_get:[{...scope,projectId:str},['scopeHandle','projectId'],'项目详情'],
 task_list:[{...scope,...page,projectId:{anyOf:[str,{type:'null'}]}},['scopeHandle'],'任务列表；projectId省略为全库，null为未归属'],
 task_get:[{...scope,taskId:str,projectId:{anyOf:[str,{type:'null'}]}},['scopeHandle','taskId'],'任务详情及归属验证'],
 asset_list:[{...scope,...page},['scopeHandle'],'库级素材metadata；不返回图片、路径或URL'],
 asset_get:[{...scope,assetId:str},['scopeHandle','assetId'],'库级素材metadata'],
 task_assets:[{...scope,...page,taskId:str},['scopeHandle','taskId'],'当前任务显式素材引用，包含顺序与是否选用'],
 saved_studio_list:[{...scope,...page,taskId:str},['scopeHandle','taskId'],'仅Repository已提交的当前棚输出槽；非历史版本库'],
 saved_studio_get:[{...scope,taskId:str,outputId:str},['scopeHandle','taskId','outputId'],'已提交棚输出metadata与hash；不返回图像或场景全文'],
 model_capabilities:[{...scope},['scopeHandle'],'本版本静态能力合同，不读取本机凭证或授予调用权'],
 attempt_list_local:[{...scope,...page,taskId:str},['scopeHandle','taskId'],'既有主程序ledger本地只读投影；零官方查询'],
 attempt_get_local:[{...scope,taskId:str,attemptId:str},['scopeHandle','taskId','attemptId'],'本地attempt及既有成果摘要；不触发poll/download/recover'],
 result_list_local:[{...scope,...page,taskId:str},['scopeHandle','taskId'],'当前任务已有D1成果metadata；已加入与已保存分列']
};
const txt=(max,nonempty=false)=>({type:'string',minLength:nonempty?1:0,maxLength:max,multiline:true});
const r2={
 change_target_get:[{...scope,targetType:{enum:['library','project','task']},targetId:str},['scopeHandle','targetType'],'读取允许编辑字段与基础版本；需单独提案授权'],
 proposal_project_create:[{...scope,requestId:str,baseVersion:str,name:txt(200,true),description:txt(2000)},['scopeHandle','requestId','baseVersion','name'],'仅提出新建项目草稿，原生用户确认后才修改内存'],
 proposal_task_create:[{...scope,requestId:str,baseVersion:str,name:txt(200,true),taskKind:{enum:['image','video']},projectId:{anyOf:[str,{type:'null'}]}},['scopeHandle','requestId','baseVersion','name','taskKind','projectId'],'仅提出新建任务草稿；不生成'],
 proposal_project_edit:[{...scope,requestId:str,baseVersion:str,targetId:str,name:txt(200,true),description:txt(2000)},['scopeHandle','requestId','baseVersion','targetId'],'仅提出项目名称或描述变更草稿'],
 proposal_task_edit:[{...scope,requestId:str,baseVersion:str,targetId:str,name:txt(200,true),prompt:txt(4000)},['scopeHandle','requestId','baseVersion','targetId'],'仅提出任务名称或既有主提示词变更；无任务描述字段'],
 proposal_list:[{...scope,...page},['scopeHandle'],'查询本连接自己的提案及回执，不套用'],
 proposal_get:[{...scope,proposalId:str},['scopeHandle','proposalId'],'查询自己的原提案，回复丢失后先查询，不重建']
};Object.assign(specs,r2);
const tools=Object.entries(specs).map(([name,[properties,required,description]])=>({name,description,inputSchema:{type:'object',properties:JSON.parse(JSON.stringify(properties)),required,additionalProperties:false},annotations:{readOnlyHint:!name.startsWith('proposal_')||['proposal_get','proposal_list'].includes(name),destructiveHint:false,idempotentHint:true,openWorldHint:false}}));
function validate(name,a){const s=specs[name];if(!s)throw Error('MCP_TOOL_NOT_AVAILABLE');if(!a||typeof a!=='object'||Array.isArray(a)||Object.keys(a).some(k=>!Object.hasOwn(s[0],k))||s[1].some(k=>!Object.hasOwn(a,k)))throw Error('MCP_ARGUMENTS');for(const [k,v]of Object.entries(a)){const field=s[0][k];if(field.enum){if(!field.enum.includes(v))throw Error('MCP_ARGUMENTS')}else if(k==='limit'){if(!Number.isSafeInteger(v)||v<1||v>25)throw Error('MCP_ARGUMENTS')}else if(v===null&&k==='projectId')continue;else if(typeof v!=='string'||v.length<(field.minLength??1)||v.length>(field.maxLength??256)||!field.multiline&&Buffer.byteLength(v)>256|| (field.multiline?/[\x00-\x08\x0b\x0c\x0e-\x1f]/:/[\x00-\x1f]/).test(v)||k==='name'&&!v.trim())throw Error('MCP_ARGUMENTS')}return a}
for(const t of tools)for(const f of Object.values(t.inputSchema.properties))delete f.multiline;
module.exports={tools,validate,MAX_REQUEST:16384,MAX_RESPONSE:65536,PROTOCOL:'2025-11-25'};

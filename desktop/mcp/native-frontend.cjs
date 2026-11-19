'use strict';
const {tools:allTools,validate,PROTOCOL,MAX_RESPONSE}=require('./contracts.cjs');
const allowed=new Set(require('../r3-broker.cjs').R3_TOOLS);
const app=require('./app-contracts.cjs'),appAllowed=new Set(app.tools.map(t=>t.name));
const tools=[...app.tools,...allTools.filter(t=>allowed.has(t.name))];
function successfulOpen(name,value,args){const data=value?.structuredContent,current=data?.current??data;return /^appctx-[a-f0-9]{64}$/.test(args?.expectedAppContextId??'')&&data?.appContextId===args.expectedAppContextId&&current?.appContextId===args.expectedAppContextId&&['aicg_project_create','aicg_project_open'].includes(name)&&!value?.isError&&data?.status==='opened'&&current?.view==='canvas'&&typeof data.project?.id==='string'&&typeof data.project?.graphId==='string'&&current.projectId===data.project.id&&current.graphId===data.project.graphId;}
const safeCode=e=>/^MCP_[A-Z_]{1,60}$/.test(e?.message??'')?e.message:'MCP_READ_FAILED';
function schemaHint(name,args){if(name!=='canvas_context_execute'||!Array.isArray(args?.changes))return null;if(args.changes.some(c=>c?.type==='import_uploads'&&!Array.isArray(c.items)))return 'Contract hint: import_uploads requires items:[{uploadId,classification,label?}]. uploads is not a supported field. Read the original receipt and fresh snapshot before a corrected request; no command was forwarded by this frontend validation failure.';return null;}
function bindIdentity(fixed,next){const keys=['projectId','graphId','libraryId','copyId','workspaceId'];if(!next||keys.some(k=>typeof next[k]!=='string'||!/^[-a-zA-Z0-9]{1,120}$/.test(next[k])))throw Error('MCP_SCOPE_IDENTITY');if(fixed&&keys.some(k=>fixed[k]!==next[k]))throw Error('MCP_SCOPE_CHANGED');return fixed??Object.freeze(Object.fromEntries(keys.map(k=>[k,next[k]])));}
class NativeFrontend {
 constructor({connect,appCall=null}){this.toolPage=require('./tool-pages.cjs').createToolsPager(tools,MAX_RESPONSE);this.connect=connect;this.appCall=appCall;this.pendingApp=null;this.initialized=false;this.ready=false;this.connection=null;this.binding=null;this.generation=0;this.stopped=false;this.pendingConnect=null;}
 invalidate(){this.generation++;this.pendingConnect?.abort();this.pendingConnect=null;this.connection?.close();this.connection=null;}
 close(){this.stopped=true;this.pendingApp?.abort();this.pendingApp=null;this.invalidate();}
 async dispatch(m){const id=m?.id??null;const error=code=>({jsonrpc:'2.0',id,error:{code:-32600,message:code}});const result=value=>({jsonrpc:'2.0',id,result:value});
  if(this.stopped)return error('MCP_SESSION_ENDED');
  if(!m||m.jsonrpc!=='2.0'||typeof m.method!=='string'||Object.keys(m).some(k=>!['jsonrpc','id','method','params'].includes(k))||('id'in m&&!['number','string'].includes(typeof m.id)))return error('MCP_INVALID_REQUEST');
  if(m.method==='notifications/initialized'&&this.initialized&&!('id'in m)){this.ready=true;return null;}
  if(!('id'in m))return null;
  if(m.method==='ping')return result({});
  if(m.method==='initialize'){
   if(this.initialized||typeof m.params?.protocolVersion!=='string'||typeof m.params?.clientInfo?.name!=='string'||typeof m.params?.clientInfo?.version!=='string'||!m.params.capabilities||typeof m.params.capabilities!=='object')return error('MCP_INVALID_REQUEST');
   this.initialized=true;return result({protocolVersion:['2024-11-05','2025-03-26','2025-06-18'].includes(m.params.protocolVersion)?m.params.protocolVersion:'2025-06-18',capabilities:{tools:{}},serverInfo:{name:'aicg-canvas-context-snapshot',version:'1.2.0'},instructions:'本地 AICG 工作台：先用 aicg_workbench_status 查狀態，固定 appContextId 與數值修訂；建立／開啟工程及明確恢復協作必帶原 expectedAppContextId，世代改變須重讀後提出新意圖，不可用最新ID補舊要求；使用者明確說開啟時用 aicg_workbench_open，未開不會因列工具或查狀態而啟動。用 aicg_project_list 按唯一名稱／穩定ID／已保存目標解析，再 aicg_project_open 或 create；不要猜第一個工程。成功進入畫布後呼叫 session_info、scope_select、canvas_context_read，內部核驗使用者已登記的本機 MCP 客戶端、權限和工程範圍後接續，無需再點Agent。普通刷新不更換已固定工程；明確open/create成功才可重綁。已套用未保存可讀，未套用草稿不採用。未知操作先aicg_workbench_status帶原requestId查控制回執，畫布用原回執工具；不要重送或重建。無任意檔案、Key、直接付費生成、自動保存權。影片可先canvas_video_capabilities，再canvas_video_prepare請求既有原生一次確認；只有人能批准，不接受批准旗標，未知查原canvas_video_status。GUI未就緒、重名、忙碌、停止或目標改變須如實回報。'});
  }
  if(!this.ready)return error('MCP_NOT_INITIALIZED');
  if(m.method==='tools/list'){try{return result(this.toolPage(m.params??{},id));}catch(e){return {jsonrpc:'2.0',id,error:{code:e.message==='MCP_INVALID_CURSOR'?-32602:-32603,message:e.message}};}}
  if(m.method!=='tools/call')return error('MCP_METHOD_NOT_AVAILABLE');
  try{
   if(!m.params||Object.keys(m.params).some(k=>!['name','arguments','_meta'].includes(k))||!allowed.has(m.params.name)&&!appAllowed.has(m.params.name))throw Error('MCP_TOOL_NOT_AVAILABLE');
   const name=m.params.name,args=structuredClone(m.params.arguments??{});if(appAllowed.has(name)){app.validate(name,args);if(!this.appCall)throw Error('MCP_APP_CONTROL_UNAVAILABLE');const controller=new AbortController(),generation=this.generation;this.pendingApp=controller;let value;try{value=await this.appCall(name,args,{signal:controller.signal});}finally{if(this.pendingApp===controller)this.pendingApp=null;}if(this.stopped||generation!==this.generation)throw Error('MCP_SESSION_ENDED');if(successfulOpen(name,value,args)){this.invalidate();this.binding=null;}const response=result(value);if(Buffer.byteLength(JSON.stringify(response))>MAX_RESPONSE)throw Error('MCP_RESPONSE_LIMIT');return response;}validate(name,args);
   const generation=this.generation;
   if(!this.connection){const controller=new AbortController();this.pendingConnect=controller;const next=await this.connect({signal:controller.signal});if(this.pendingConnect===controller)this.pendingConnect=null;if(this.stopped||generation!==this.generation){next.close();throw Error('MCP_SESSION_ENDED');}try{this.binding=bindIdentity(this.binding,next.identity);}catch(e){next.close();throw e;}this.connection=next;}
   if(this.stopped||generation!==this.generation)throw Error('MCP_SESSION_ENDED');
   const value=await this.connection.call(name,args);
   if(this.stopped||generation!==this.generation)throw Error('MCP_SESSION_ENDED');
   const response=result(value);if(Buffer.byteLength(JSON.stringify(response))>MAX_RESPONSE)throw Error('MCP_RESPONSE_LIMIT');return response;
  }catch(e){if(['MCP_EXTERNAL_DISCONNECTED','MCP_HOST_TIMEOUT','MCP_AUTHORIZATION_REQUIRED'].includes(e.message))this.invalidate();const hint=e.message==='MCP_SCHEMA'?schemaHint(m.params?.name,m.params?.arguments):null;return result({isError:true,content:[{type:'text',text:safeCode(e)},...(hint?[{type:'text',text:hint}]:[])]});}
 }
}
module.exports={NativeFrontend,bindIdentity,successfulOpen,schemaHint};

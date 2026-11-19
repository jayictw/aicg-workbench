// Presentation only. The boolean comes exclusively from existing trusted IPC replies.
export type ModeState='loading'|'unconfirmed'|'ready'
export function modeLabel(qa:boolean|undefined,loading=false){
 if(loading)return '载入中'
 return qa===true?'本地 QA · 不计费':qa===false?'正式模式 · 费用另行确认':'状态未确认'
}
export function booleanMode(value:unknown):boolean|undefined{return typeof value==='boolean'?value:undefined}
export function configurationCopy(qa:boolean|undefined){
 const name=qa===true?'程序假值配置':qa===false?'本机模型配置':'模型配置（状态未确认）'
 return {name,create:qa===undefined?'状态未确认，请先重新载入模式信息，再核对模型配置。':`请先到平台与 API Key建立火山Flash${name}，再刷新配置。`,refreshed:`已刷新${name}；未联网、未验证账户、未发请求。`,readFailed:`无法读取${name}。请到平台与 API Key核对；不会联网验证。`,empty:qa===true?'还没有可用的程序假值配置。请到平台与 API Key选择火山中国服务和Flash，在专用窗口生成程序假值；不接受真Key。':qa===false?'还没有可用的本机模型配置。请到平台与 API Key选择火山中国服务和Flash；Key仅在本机专用窗口输入保存，配置不代表验证或批准生成。':'状态未确认，暂不提供配置建立指引。请重新载入后核对。'}
}
export const currentVideoScope='本版本提供火山中国图片，以及纯文字／图片参考影片；参考图不等于固定首帧。'

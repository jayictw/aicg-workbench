export type VideoStage={phase:string;queryStatus:string;observationState:string;revoked:boolean;code?:string|null;queryDiagnostic?:{stage:string;providerStatus?:string|null}|null}
export function restoredVideoPrompt(draft:{prompt:string}|undefined,fallback:string){return draft?draft.prompt:fallback}
export async function receiveInScope<T>(pending:Promise<T>,current:()=>boolean,accept:(value:T)=>void|Promise<void>){const value=await pending;if(current())await accept(value)}
export function videoStage(a:VideoStage,local:{joined:boolean;saved:boolean}={joined:false,saved:false}){
 if(a.phase==='stopped')return {title:'已取消本次确认，未提交生成',tone:'neutral',detail:'本地预览记录保留；没有平台任务或新提交。'}
 if(a.phase==='completed'&&local.joined)return {title:local.saved?'影片已加入并保存':'影片已加入；工作库有未保存修改',tone:'success',detail:local.saved?'本地原片可重播，来源与保存记录已保留。':'原片保留；确认保存工作库会提交当前全部未保存核心修改。'}
 if(a.phase==='completed')return {title:'原片已验证，等待播放核对',tone:'success',detail:'播放确认后明确加入任务，再保存工作库。'}
 if(a.phase==='response-invalid')return {title:'平台已生成，媒体验证未通过',tone:'attention',detail:'原记录保留，不重新生成。'}
 if(a.queryDiagnostic?.stage==='source-validation'&&a.queryDiagnostic.providerStatus==='succeeded')return {title:'平台已生成，来源验证未通过',tone:'attention',detail:'来源保持阻挡；保留原任务，不更换来源或重新生成。'}
 if(a.code?.startsWith('C_VIDEO_DOWNLOAD'))return {title:'平台已生成，下载未完成',tone:'attention',detail:'仅可在原片下载合同和累计上限内明确恢复；不会重新生成。'}
 if(a.phase==='failed')return {title:'平台明确生成失败',tone:'attention',detail:'本地保留任务记录，不补送生成请求。'}
 if(a.phase==='cancelled'||a.phase==='expired')return {title:a.phase==='cancelled'?'平台已确认取消':'平台已确认任务过期',tone:'attention',detail:'这是平台返回状态；实际扣费以平台账单为准。'}
 if(a.phase==='submission-unknown')return {title:'提交结果未知',tone:'attention',detail:'尚未取得可确认的任务结果，禁止补送或建立替代影片。'}
 if(a.queryStatus==='unknown'||a.observationState==='attention')return {title:'查询异常，影片状态待确认',tone:'attention',detail:'自动查询已停止，保留上次平台状态；查询异常不代表生成失败。'}
 if(a.observationState==='expired')return {title:'已停止查询，平台任务可能仍在进行',tone:'attention',detail:'本次观察期限已到；不是生成失败、取消或退款。'}
 if(a.revoked&&['queued','running','succeeded'].includes(a.phase))return {title:'本机观察已停止',tone:'attention',detail:'平台任务可能仍在进行。恢复只查询同一任务，不重新提交。'}
 return ({prepared:{title:'设置已检查，等待确认生成',tone:'neutral',detail:'预览不会提交请求。'},sending:{title:'正在提交一次请求',tone:'neutral',detail:'等待原回应，不要重复提交。'},queued:{title:'平台排队中',tone:'neutral',detail:'自动查询原任务；可以停止本机观察。'},running:{title:'平台生成中',tone:'neutral',detail:'自动查询原任务；可以停止本机观察。'},succeeded:{title:'平台生成完成，等待取回原片',tone:'success',detail:'下载、来源验证和媒体验证仍须分别通过。'},'response-received':{title:'原片已取得，正在核对本地材料',tone:'neutral',detail:'尚未加入任务。'},'candidate-incomplete':{title:'本地材料待核对',tone:'attention',detail:'只恢复原材料，不重新生成。'}} as Record<string,{title:string;tone:string;detail:string}>)[a.phase]||{title:'原任务记录已保留',tone:'neutral',detail:'展开详情核对原状态。'}
}

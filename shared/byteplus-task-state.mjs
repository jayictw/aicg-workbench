// Presentation from observed local facts only; never a recovery authorization.
export function byteplusTaskState(j={}){
 const code=typeof j.reason==='string'&&/^[A-Z][A-Z0-9_]{0,79}$/.test(j.reason)?j.reason:null;
 const base={reasonCode:code,detail:'只核對原任務，不重新生成；舊成果保留。'};
 if(j.running)return {...base,kind:j.localWaitStopped?'stopping':'running',title:j.localWaitStopped?'正在停止本地等待':'正在查原任務',detail:j.localWaitStopped?'本地等待正在結束；不代表雲端取消或退款。':base.detail};
 if(j.state==='succeeded')return {...base,kind:'saved',title:j.canPublish?'已核對原結果，待接回畫布':'原結果已保留'};
 if(j.reason==='BYTEPLUS_VIDEO_FORMAT')return {...base,kind:'preserved-format',title:'原片保留，格式尚不支援合併'};
 if(j.remoteFacts?.status==='expired')return {...base,kind:'execution-expired',title:'供應商回報任務執行已過期',detail:'這是供應商執行終態；不等於下載URL或taskId查詢期限，原結果保留。'};
 if(['BP_URL_EXPIRED','BP_MEDIA_EXPIRED'].includes(code))return {...base,kind:'media-expired',title:'媒體下載來源／授權期限已到',detail:'媒體載體有效性檢查未通過，與官方任務期限不同；實際URL截止未回報時仍未知，原結果保留。'};
 if([403,404].includes(j.downloadDiagnostics?.httpStatus))return {...base,kind:'download-denied',title:'上次媒體下載受拒（HTTP '+j.downloadDiagnostics.httpStatus+'）',detail:'這是下載HTTP，不是原任務查詢狀態；未證實URL過期，不重新生成，已下載結果保留。'};
 if(['BP_MEDIA_RESPONSE','BP_MEDIA_IO','BP_MEDIA_BYTES','BP_MEDIA_DECODE','BP_RESULT_DECODE'].includes(code))return {...base,kind:'download-incomplete',title:'媒體下載／驗證未完成',detail:'原任務回報仍保留；下載HTTP若未記錄則保持未知，不推定到期或Key錯誤。'};
 if(j.diagnostics?.httpStatus===403)return {...base,kind:'http-denied',title:'原請求受拒（HTTP 403），未證實過期',detail:'需依原Request ID及安全錯誤碼核對；403本身不證明Key錯誤或URL到期。'};
 if(j.diagnostics?.httpStatus===404)return {...base,kind:'not-found',title:'原請求未能取得（HTTP 404）',detail:'原記錄未證實是不存在、存取限制或期限問題；不因404重新提交。'};
 if(j.state==='failed'||j.state==='cancelled-before-send')return {...base,kind:'terminal',title:j.state==='cancelled-before-send'?'原嘗試未送出，確認已失效':j.canReconcile?'原提交已失敗，待核對畫布狀態':'原提交失敗，沒有重新送出'};
 if(j.recoveryDeadlineBlocked)return {...base,kind:'task-id-expired',title:'原taskId查詢有效期已到',detail:'原查詢期限已知到期；不代表已下載本地結果失效，也不授權新POST。'};
 if(j.state==='submissionUnknown'&&!j.taskId)return {...base,kind:'unknown-submit',title:'提交回執未知，沒有可靠 taskId',detail:'停止重送；請核對平台原請求，不能以重開或恢復按鈕新 POST。'};
 if(j.localWaitStopped)return {...base,kind:'stopped',title:'已手動停止本地等待',detail:'原 taskId 與輸入快照保留；不代表雲端取消或退款。'};
 if(j.reason==='process-reopened-no-post-retry')return {...base,kind:'reloaded',title:'重開後原提交回執待核對',detail:'持久記錄顯示派送未獲確認；不推斷事故原因，也不重新提交。'};
 if(['BP_TASK_QUERY_UNKNOWN','BP_HTTP_UNKNOWN','BP_MEDIA_IO','BYTEPLUS_QUERY_BP_HTTP_UNKNOWN','BYTEPLUS_DOWNLOAD_BP_MEDIA_IO'].includes(code))return {...base,kind:'communication',title:'原任務通訊未完成',detail:'原記錄顯示查詢／下載未完成；網路或平台原因尚待核對，只能續查原 taskId。'};
 if(j.state==='queued'&&!code&&['queued','running'].includes(j.remoteFacts?.status))return {...base,kind:'provider-waiting',title:j.remoteFacts.status==='queued'?'最近回報：供應商排隊中':'最近回報：供應商執行中',detail:'等待不等於供應商失敗；目前未在本地輪詢，可依原門檻續查原taskId。'};
 if(j.loadedFromJournal)return {...base,kind:'reloaded',title:'從持久記錄載入的未完成原任務',detail:'目前沒有本地等待；上次是否異常退出或斷線未記錄，不作推斷。'};
 return {...base,kind:'paused',title:j.orphan?'有未保存的原操作':'原任務待核對',detail:'目前沒有本地等待；暫停原因未記錄，不自動重新提交。'};
}

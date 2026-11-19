import {ui,useUiLocale} from '../shared/ui-locale.mjs';
import React from 'react';
import {PURPOSES} from '../shared/image-plan.mjs';
type Any=Record<string,any>;
const labels:Any={expired:'已到期，請重新預覽批次',proposed:'待批准',approved:'已批准，等待 Codex 執行',executing:'本批進行中',completed:'本批已完成',partial:'部分操作未完成',submissionUnknown:'原批結果待查',failed:'本批已停止',cancelled:'已停止等待','results-not-saved':'結果未存入目前畫布，保留原操作待核對'};
export function BatchReview({batches,busy,action}:Any){useUiLocale(React);return <section className="dialogue-batches"><h3>{ui("圖片生成批次")}</h3>{!batches?.length&&<p className="muted">{ui("Codex 建好素材需求後，會在這裡列出本次要生成的圖片。")}</p>}{batches?.map((batch:Any)=>{
 const live=batch.mode==='live',simulated=live&&batch.environment==='mock-http';
 return <article className="c3-proposal" key={batch.batchId} data-batch-id={batch.batchId}><div><strong>{ui("本批")+" "}{batch.outputCount} {" "+ui("張素材圖")}</strong><span className="badge">{(ui(labels[batch.status])??batch.status)}</span></div><p className="muted">{ui("火山方舟 Seedream 5.0 Flash · 1024×1024 PNG")}</p>
 {live?<><p>{simulated ? ui("HTTP 模擬工程驗證 · 不是真實生成") : ui("擬提交純文字文生圖")} {" "+ui("· 最多4次 · 單次上限 ¥0.12 · 本批上限 ¥0.60")}</p><p className="muted">{ui("四段需求擬送往方舟中國區，不上傳參考圖。")}{batch.submissions ? ui("已有提交紀錄，實際費用尚未核對。") : ui("尚未提交。")}{ui("需要本批 Owner 批准與安全帳戶接通；讀取或草稿權不包含收費生成。停止等待不代表退款。")}</p></>:<><p>{ui("免費離線接線測試 · 合成結果 · 總費用 ¥0")}</p><p className="muted">{ui("不讀取憑據，不發供應商請求。真實生成仍需另外批准固定模型與預算。")}</p></>}
 {batch.items.map((item:Any,i:number)=><details key={item.nodeId} className="batch-item" open><summary>{(i+1)}. {item.label} · {ui((PURPOSES as Any)[item.purpose]?.label)}</summary><pre>{item.prompt}</pre><small>{item.size} {" "+ui("· 1張 · 純文字，不上傳參考圖")}</small></details>)}
 {batch.runs?.length>0&&<p role="status">{ui("已建立")+" "}{batch.runs.length} {" "+ui("個原任務；")}{batch.runs.filter((r:Any)=>r.state==='succeeded').length} {" "+ui("張已回填。")}{batch.runs.some((r:Any)=>r.orphan||r.state==='result-not-saved') ? ui("有結果未保存至目前畫布，請保留原操作核對。") : ''}{ui("重複查詢不會重新生成。")}</p>}
 {batch.status==='proposed'&&<button className="primary" disabled={busy} data-c4-approve-batch="true" data-c4-batch-id={batch.batchId} data-c4-manifest-digest={batch.manifestDigest} onClick={()=>action(()=>window.canvasAPI.c4ApproveBatch({batchId:batch.batchId,manifestDigest:batch.manifestDigest}))}>{live ? (simulated ? ui("確認本批 HTTP 模擬 · 真實費用未授權") : ui("確認本批四圖範圍 · 上限 ¥0.60")) : (ui("批准本批離線測試 ·")+" "+String(batch.outputCount)+" "+ui("張 · ¥0"))}</button>}
 </article>;
 })}</section>;}

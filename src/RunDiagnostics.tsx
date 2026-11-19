import {ui,useUiLocale,uiDetails} from '../shared/ui-locale.mjs';
import React from 'react';
import {runStateLabel} from '../shared/generation-label.mjs';
export function RunDiagnostics({fact,run}:any){useUiLocale(React);if(!run||!['failed','submissionUnknown'].includes(run.state))return null;const d=fact?.diagnostics;return <div className="warning run-diagnostics" role="status"><b>{ui(runStateLabel(run))}</b><p>{ui('查看錯誤不會重新送出；結果未知時先核對原操作。')}</p>{d?uiDetails(React,d):<p>{ui('原紀錄未保存供應商詳細原因或 Request ID。')}</p>}</div>;}

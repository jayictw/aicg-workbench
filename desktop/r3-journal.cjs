'use strict';
const fs=require('node:fs'),path=require('node:path'),{error}=require('./media.cjs');
class R3Journal{
 constructor(root){this.file=path.join(root,'r3-requests.jsonl');this.rows=new Map();if(fs.existsSync(this.file)){if(fs.statSync(this.file).size>16*1024*1024)throw error('R3_JOURNAL_LIMIT','操作日誌超出上限，保留原件');for(const line of fs.readFileSync(this.file,'utf8').split('\n').filter(Boolean)){let row;try{row=JSON.parse(line);}catch{throw error('R3_JOURNAL_CORRUPT','操作日誌不完整，保留原件，不盲重送');}if(!['intent','rejected'].includes(row.type)||typeof row.requestId!=='string'||typeof row.digest!=='string'||typeof row.commandId!=='string')throw error('R3_JOURNAL_CORRUPT','操作日誌結構不符');const old=this.rows.get(row.requestId);if(old&&old.digest!==row.digest)throw error('R3_JOURNAL_CORRUPT','操作身份衝突');this.rows.set(row.requestId,{...old,...row});}}}
 bind(row){this.append({...row,type:'intent'});}
 reject(row,e){this.append({...row,type:'rejected',error:{code:e.code??'R3_OPERATION_FAILED',message:e.message}});}
 append(row){const text=JSON.stringify({...row,at:new Date().toISOString()})+'\n';if((fs.existsSync(this.file)?fs.statSync(this.file).size:0)+Buffer.byteLength(text)>16*1024*1024)throw error('R3_JOURNAL_LIMIT','操作日誌超限，未覆寫');const fd=fs.openSync(this.file,'a');try{fs.writeFileSync(fd,text);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}this.rows.set(row.requestId,row);}
}
module.exports={R3Journal};

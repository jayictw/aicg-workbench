'use strict';
const fs=require('node:fs'),path=require('node:path');
class AppOperationJournal{
 constructor(root){this.file=path.join(root,'app-operation-receipts.jsonl');this.rows=new Map();fs.mkdirSync(root,{recursive:true});if(fs.existsSync(this.file)){const st=fs.lstatSync(this.file);if(!st.isFile()||st.isSymbolicLink()||st.nlink!==1||st.size>8*1024*1024)throw Error('APP_RECEIPT_JOURNAL_UNSAFE');const text=fs.readFileSync(this.file,'utf8');for(const line of text.split('\n').filter(Boolean)){let row;try{row=JSON.parse(line);}catch{throw Error('APP_RECEIPT_JOURNAL_DAMAGED');}if(typeof row.requestId!=='string'||!/^[a-f0-9]{64}$/.test(row.intent??''))throw Error('APP_RECEIPT_JOURNAL_DAMAGED');this.rows.set(row.requestId,row);}}}
 set(requestId,intent,value){const {marker,...safe}=value;const row={requestId,intent,value:safe},text=JSON.stringify(row)+'\n';if((fs.existsSync(this.file)?fs.statSync(this.file).size:0)+Buffer.byteLength(text)>8*1024*1024)throw Error('APP_RECEIPT_JOURNAL_LIMIT');const fd=fs.openSync(this.file,'a');try{fs.writeSync(fd,text);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}this.rows.set(requestId,row);}
 get(requestId){return this.rows.get(requestId);}
}
module.exports={AppOperationJournal};

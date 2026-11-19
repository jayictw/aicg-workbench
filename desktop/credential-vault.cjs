'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto'),policy=require('./secret-policy.cjs');
const fail=code=>{throw Object.assign(Error(code),{code});};
const valid=s=>typeof s==='string'&&s.length>=16&&s.length<=4096&&/^[\x21-\x7e]+$/.test(s);
function binding(c){if(!c||typeof c.connectionId!=='string'||!/^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/.test(c.connectionId)||['constructor','prototype','__proto__'].includes(c.connectionId)||!['ORIGINAL','THIRD_PARTY','CUSTOM'].includes(c.kind))fail('CREDENTIAL_CONNECTION_INVALID');const out={};for(const k of ['connectionId','providerId','kind','baseUrl','region','authType','protocolId','protocolVersion']){if(typeof c[k]!=='string')fail('CREDENTIAL_CONNECTION_INVALID');out[k]=c[k];}return JSON.stringify(out);}
function byteplusScope(c){return c?.kind==='ORIGINAL'&&!c.archived&&['p1-01-BP.I','p1-01-BP.V'].includes(c.protocolId)&&c.protocolVersion==='v3'&&c.authType==='BEARER'&&c.region==='ap-southeast-1'&&c.baseUrl==='https://ark.ap-southeast.bytepluses.com/api/v3';}
function wanScope(c){try{return require('./wan-provider.cjs').origin(c.baseUrl).region===c.region;}catch{return false;}}
class CredentialVault{
 #byteplusEpochs=new Map();#memory=new Map();#states=new Map();#pending=new Map();#geminiUses=new Map();#closed=false;
 constructor({directory,safeStorage,platform=process.platform,publicValues=()=>null}){this.directory=path.resolve(directory);this.storage=safeStorage;this.platform=platform;this.publicValues=publicValues;}
 #queue(c,fn,geminiRead=false){const id=c?.connectionId,previous=this.#pending.get(id)||Promise.resolve();const work=previous.then(async()=>{if(this.#closed)fail('CREDENTIAL_CLOSED');if(!geminiRead)await Promise.all(this.#geminiUses.get(id)||[]);if(this.#closed)fail('CREDENTIAL_CLOSED');return fn();}),tail=work.catch(()=>{});this.#pending.set(id,tail);tail.then(()=>{if(this.#pending.get(id)===tail)this.#pending.delete(id);});return work;}
 #file(c){return path.join(this.directory,crypto.createHash('sha256').update(c.connectionId).digest('hex')+'.json');}
 async #paths(){for(let q=this.directory;;q=path.dirname(q)){try{const s=await fs.lstat(q);if(s.isSymbolicLink()||!s.isDirectory())fail('CREDENTIAL_PATH_UNSAFE');}catch(e){if(e.code!=='ENOENT')throw e;}if(path.dirname(q)===q)break;}await fs.mkdir(this.directory,{recursive:true,mode:0o700});}
 async #available(){if(this.platform!=='win32'||['isAsyncEncryptionAvailable','encryptStringAsync','decryptStringAsync'].some(k=>typeof this.storage?.[k]!=='function'))fail('CREDENTIAL_ENCRYPTION_UNAVAILABLE');try{if(await this.storage.isAsyncEncryptionAvailable()!==true)fail('CREDENTIAL_ENCRYPTION_UNAVAILABLE');}catch{fail('CREDENTIAL_ENCRYPTION_UNAVAILABLE');}}
 #clear(id){this.#memory.get(id)?.bytes.fill(0);this.#memory.delete(id);}
 async #read(file){let h;try{h=await fs.open(file,'r');const s=await h.stat(),l=await fs.lstat(file);if(!s.isFile()||l.isSymbolicLink()||s.nlink!==1||s.size>32768||s.ino!==l.ino)fail('CREDENTIAL_PATH_UNSAFE');return JSON.parse(await h.readFile('utf8'));}finally{await h?.close();}}
 async #write(file,cipher){const tmp=file+'.tmp';let h;try{try{await fs.unlink(tmp);}catch(e){if(e.code!=='ENOENT')throw e;}h=await fs.open(tmp,'wx',0o600);await h.writeFile(JSON.stringify({schemaVersion:1,ciphertext:cipher.toString('base64')}));await h.sync();await h.close();h=null;if(this.#closed)fail('CREDENTIAL_CLOSED');await fs.rename(tmp,file);}finally{await h?.close();await fs.unlink(tmp).catch(()=>{});}}
 async #forget(file){for(const p of [file,file+'.tmp'])try{await fs.unlink(p);}catch(e){if(e.code!=='ENOENT')fail('CREDENTIAL_DELETE_FAILED');}}
 async #load(c){const scope=binding(c),id=c.connectionId;await this.#paths();await this.#available();const inMemory=this.#memory.get(id);if(inMemory){if(inMemory.scope!==scope){this.#clear(id);this.#states.set(id,'LOCKED');fail('CREDENTIAL_BINDING_CHANGED');}return inMemory;}
  let raw;try{raw=await this.#read(this.#file(c));}catch(e){if(e.code==='ENOENT'){this.#states.set(id,'EMPTY');return null;}this.#states.set(id,'LOCKED');fail('CREDENTIAL_DECRYPT_FAILED');}
  try{if(raw?.schemaVersion!==1||Object.keys(raw).sort().join(',')!=='ciphertext,schemaVersion'||typeof raw.ciphertext!=='string'||!raw.ciphertext.length||!/^[A-Za-z0-9+/]+={0,2}$/.test(raw.ciphertext))fail('CREDENTIAL_DECRYPT_FAILED');const encrypted=Buffer.from(raw.ciphertext,'base64');let decoded=await this.storage.decryptStringAsync(encrypted);const rotate=decoded.shouldReEncrypt===true;if(rotate){decoded=await this.storage.decryptStringAsync(encrypted);if(decoded.shouldReEncrypt!==false)fail('CREDENTIAL_DECRYPT_FAILED');}const envelope=JSON.parse(decoded.result);if(envelope.version!==1||envelope.scope!==scope||!valid(envelope.secret))fail('CREDENTIAL_BINDING_CHANGED');policy.register(envelope.secret);if(policy.contains(this.publicValues()))fail('CREDENTIAL_PUBLIC_COLLISION');if(rotate){const cipher=await this.storage.encryptStringAsync(decoded.result);if(!Buffer.isBuffer(cipher)||cipher.length<16)fail('CREDENTIAL_ENCRYPT_FAILED');await this.#write(this.#file(c),cipher);}if(this.#closed)fail('CREDENTIAL_CLOSED');const row={scope,bytes:Buffer.from(envelope.secret),remember:true};this.#memory.set(id,row);this.#states.set(id,'REMEMBERED');return row;}catch{this.#clear(id);this.#states.set(id,'LOCKED');fail('CREDENTIAL_DECRYPT_FAILED');}
 }
 async status(c){const byteplusRead=byteplusScope(c);const bflRead=require('./bfl-provider.cjs').connectionScope(c);const minimaxRead=require('./minimax-provider.cjs').connectionScope(c);const klingRead=c?.kind==='ORIGINAL'&&!c.archived&&c.protocolId==='p1-01-K'&&c.protocolVersion==='3.0'&&c.authType==='BEARER'&&c.baseUrl==='https://api-singapore.klingai.com'&&c.region==='singapore';const xaiRead=c?.kind==='ORIGINAL'&&!c.archived&&['p1-01-X.I','p1-01-X.V'].includes(c.protocolId)&&c.protocolVersion==='v1'&&c.authType==='BEARER'&&c.baseUrl==='https://api.x.ai/v1'&&c.region==='UNKNOWN';const openaiRead=c?.kind==='ORIGINAL'&&!c.archived&&c.protocolId==='p1-01-O.I'&&c.protocolVersion==='v1'&&c.authType==='BEARER'&&c.baseUrl==='https://api.openai.com/v1';const wanRead=c?.kind==='ORIGINAL'&&!c.archived&&c.protocolId==='p1-01-A.V'&&c.protocolVersion==='v1'&&c.authType==='BEARER'&&wanScope(c);return this.#queue(c,async()=>{try{const row=await this.#load(c);if((byteplusRead||openaiRead||wanRead||xaiRead||klingRead||minimaxRead||bflRead)&&this.#closed)fail('CREDENTIAL_CLOSED');return {connectionId:c.connectionId,state:row?row.remember?'REMEMBERED':'SESSION':'EMPTY',remembered:!!row?.remember,available:!!row,verification:'NOT_RUN'};}catch(e){this.#clear(c.connectionId);return {connectionId:c.connectionId,state:this.#states.get(c.connectionId)==='LOCKED'?'LOCKED':'UNAVAILABLE',remembered:false,available:false,code:e.code?.startsWith('CREDENTIAL_')?e.code:'CREDENTIAL_STORAGE_FAILED',verification:'NOT_RUN'};}},byteplusRead||openaiRead||wanRead||xaiRead||klingRead||minimaxRead||bflRead);}
 byteplusEpoch(c){if(!byteplusScope(c)||this.#closed)fail('CREDENTIAL_USE_FORBIDDEN');if(!this.#byteplusEpochs.has(c.connectionId))this.#byteplusEpochs.set(c.connectionId,crypto.randomUUID());return this.#byteplusEpochs.get(c.connectionId);}
 async set(c,secret,remember){if(byteplusScope(c))this.#byteplusEpochs.set(c.connectionId,crypto.randomUUID());return this.#queue(c,async()=>{const scope=binding(c),id=c.connectionId;if(!valid(secret)||typeof remember!=='boolean')fail('CREDENTIAL_INPUT_INVALID');policy.register(secret);try{await this.#paths();await this.#available();if(policy.contains(this.publicValues()))fail('CREDENTIAL_PUBLIC_COLLISION');if(remember){const cipher=await this.storage.encryptStringAsync(JSON.stringify({version:1,scope,secret}));if(!Buffer.isBuffer(cipher)||cipher.length<16)fail('CREDENTIAL_ENCRYPT_FAILED');if(this.#closed)fail('CREDENTIAL_CLOSED');await this.#write(this.#file(c),cipher);}else await this.#forget(this.#file(c));this.#clear(id);if(!this.#closed)this.#memory.set(id,{scope,bytes:Buffer.from(secret),remember});this.#states.set(id,remember?'REMEMBERED':'SESSION');return {connectionId:id,state:remember?'REMEMBERED':'SESSION',available:!this.#closed,remembered:remember,verification:'NOT_RUN'};}catch(e){if(!this.#memory.has(id))this.#states.set(id,'LOCKED');fail(e.code?.startsWith('CREDENTIAL_')?e.code:'CREDENTIAL_SAVE_FAILED');}});}
 async remove(c){if(byteplusScope(c))this.#byteplusEpochs.set(c.connectionId,crypto.randomUUID());return this.#queue(c,async()=>{binding(c);this.#clear(c.connectionId);this.#states.set(c.connectionId,'LOCKED');try{await this.#paths();await this.#forget(this.#file(c));}catch{fail('CREDENTIAL_DELETE_FAILED');}this.#states.set(c.connectionId,'EMPTY');return {connectionId:c.connectionId,state:'EMPTY',available:false,remembered:false,verification:'NOT_RUN'};});}
 async use(c,phase,invoke){return this.#queue(c,async()=>{if(!['submit','query','image'].includes(phase)||typeof invoke!=='function')fail('CREDENTIAL_USE_FORBIDDEN');try{const row=await this.#load(c);if(!row)fail('CREDENTIAL_REQUIRED');if(this.#closed)fail('CREDENTIAL_CLOSED');const result=await invoke(row.bytes.toString('utf8'));policy.assertSafe(result);return result;}catch(e){if(e.code==='SENSITIVE_OUTPUT_BLOCKED')throw e;fail(e.code?.startsWith('CREDENTIAL_')?e.code:'CREDENTIAL_USE_FAILED');}});}
 // Opt-in Google Gemini readers share network waits, never secret values.
 // Load/start stays FIFO. Ordinary queued operations drain preceding readers,
 // so a queued replacement/revocation also blocks every later Gemini reader.
 async useGemini(c,phase,invoke){
  if(c?.kind!=='ORIGINAL'||c.archived||!['p1-01-G.I','p1-01-G.O'].includes(c.protocolId)||c.protocolVersion!=='v1beta'||c.authType!=='HEADER_KEY'||c.baseUrl!=='https://generativelanguage.googleapis.com/v1beta'||!['submit','query','image'].includes(phase)||typeof invoke!=='function')fail('CREDENTIAL_USE_FORBIDDEN');
  let work;try{await this.#queue(c,async()=>{const row=await this.#load(c);if(!row)fail('CREDENTIAL_REQUIRED');if(this.#closed)fail('CREDENTIAL_CLOSED');
   work=Promise.resolve().then(async()=>{if(this.#closed)fail('CREDENTIAL_CLOSED');const result=await invoke(row.bytes.toString('utf8'));if(this.#closed)fail('CREDENTIAL_CLOSED');policy.assertSafe(result);return result;});
   const tail=work.then(()=>{},()=>{}),id=c.connectionId;let readers=this.#geminiUses.get(id);if(!readers){readers=new Set();this.#geminiUses.set(id,readers);}readers.add(tail);tail.then(()=>{readers.delete(tail);if(!readers.size&&this.#geminiUses.get(id)===readers)this.#geminiUses.delete(id);});
  },true);return await work;}catch(e){if(e.code==='SENSITIVE_OUTPUT_BLOCKED')throw e;fail(e.code?.startsWith('CREDENTIAL_')?e.code:'CREDENTIAL_USE_FAILED');}
 }

 // Owner-approved B03: separately scoped OpenAI readers; FIFO writers unchanged.
 async useOpenAi(c,phase,invoke){
  if(c?.kind!=='ORIGINAL'||c.archived||c.protocolId!=='p1-01-O.I'||c.protocolVersion!=='v1'||c.authType!=='BEARER'||c.baseUrl!=='https://api.openai.com/v1'||!['submit','query','image'].includes(phase)||typeof invoke!=='function')fail('CREDENTIAL_USE_FORBIDDEN');
  let work;try{await this.#queue(c,async()=>{const row=await this.#load(c);if(!row)fail('CREDENTIAL_REQUIRED');if(this.#closed)fail('CREDENTIAL_CLOSED');
   work=Promise.resolve().then(async()=>{if(this.#closed)fail('CREDENTIAL_CLOSED');const result=await invoke(row.bytes.toString('utf8'));if(this.#closed)fail('CREDENTIAL_CLOSED');policy.assertSafe(result);return result;});
   const tail=work.then(()=>{},()=>{}),id=c.connectionId;let readers=this.#geminiUses.get(id);if(!readers){readers=new Set();this.#geminiUses.set(id,readers);}readers.add(tail);tail.then(()=>{readers.delete(tail);if(!readers.size&&this.#geminiUses.get(id)===readers)this.#geminiUses.delete(id);});
  },true);return await work;}catch(e){if(e.code==='SENSITIVE_OUTPUT_BLOCKED')throw e;fail(e.code?.startsWith('CREDENTIAL_')?e.code:'CREDENTIAL_USE_FAILED');}
 }

 // Wan opt-in readers retain existing FIFO writer and close semantics.
 async useWan(c,phase,invoke){
  if(c?.kind!=='ORIGINAL'||c.archived||c.protocolId!=='p1-01-A.V'||c.protocolVersion!=='v1'||c.authType!=='BEARER'||!wanScope(c)||!['submit','query','image'].includes(phase)||typeof invoke!=='function')fail('CREDENTIAL_USE_FORBIDDEN');
  let work;try{await this.#queue(c,async()=>{const row=await this.#load(c);if(!row)fail('CREDENTIAL_REQUIRED');if(this.#closed)fail('CREDENTIAL_CLOSED');
   work=Promise.resolve().then(async()=>{if(this.#closed)fail('CREDENTIAL_CLOSED');const result=await invoke(row.bytes.toString('utf8'));if(this.#closed)fail('CREDENTIAL_CLOSED');policy.assertSafe(result);return result;});
   const tail=work.then(()=>{},()=>{}),id=c.connectionId;let readers=this.#geminiUses.get(id);if(!readers){readers=new Set();this.#geminiUses.set(id,readers);}readers.add(tail);tail.then(()=>{readers.delete(tail);if(!readers.size&&this.#geminiUses.get(id)===readers)this.#geminiUses.delete(id);});
  },true);return await work;}catch(e){if(e.code==='SENSITIVE_OUTPUT_BLOCKED')throw e;fail(e.code?.startsWith('CREDENTIAL_')?e.code:'CREDENTIAL_USE_FAILED');}
 }

 // xAI opt-in readers reuse FIFO writes/close; only exact xAI image/video scopes.
 async useBfl(c,phase,invoke){
  if(!require('./bfl-provider.cjs').connectionScope(c)||!['submit','query','image'].includes(phase)||typeof invoke!=='function')fail('CREDENTIAL_USE_FORBIDDEN');
  let work;try{await this.#queue(c,async()=>{const row=await this.#load(c);if(!row)fail('CREDENTIAL_REQUIRED');if(this.#closed)fail('CREDENTIAL_CLOSED');
   work=Promise.resolve().then(async()=>{if(this.#closed)fail('CREDENTIAL_CLOSED');const result=await invoke(row.bytes.toString('utf8'));if(this.#closed)fail('CREDENTIAL_CLOSED');policy.assertSafe(result);return result;});
   const tail=work.then(()=>{},()=>{}),id=c.connectionId;let readers=this.#geminiUses.get(id);if(!readers){readers=new Set();this.#geminiUses.set(id,readers);}readers.add(tail);tail.then(()=>{readers.delete(tail);if(!readers.size&&this.#geminiUses.get(id)===readers)this.#geminiUses.delete(id);});
  },true);return await work;}catch(e){if(e.code==='SENSITIVE_OUTPUT_BLOCKED')throw e;fail(e.code?.startsWith('CREDENTIAL_')?e.code:'CREDENTIAL_USE_FAILED');}
 }

 async useMiniMax(c,phase,invoke){
  if(!require('./minimax-provider.cjs').connectionScope(c)||!['submit','query','image'].includes(phase)||typeof invoke!=='function')fail('CREDENTIAL_USE_FORBIDDEN');
  let work;try{await this.#queue(c,async()=>{const row=await this.#load(c);if(!row)fail('CREDENTIAL_REQUIRED');if(this.#closed)fail('CREDENTIAL_CLOSED');
   work=Promise.resolve().then(async()=>{if(this.#closed)fail('CREDENTIAL_CLOSED');const result=await invoke(row.bytes.toString('utf8'));if(this.#closed)fail('CREDENTIAL_CLOSED');policy.assertSafe(result);return result;});
   const tail=work.then(()=>{},()=>{}),id=c.connectionId;let readers=this.#geminiUses.get(id);if(!readers){readers=new Set();this.#geminiUses.set(id,readers);}readers.add(tail);tail.then(()=>{readers.delete(tail);if(!readers.size&&this.#geminiUses.get(id)===readers)this.#geminiUses.delete(id);});
  },true);return await work;}catch(e){if(e.code==='SENSITIVE_OUTPUT_BLOCKED')throw e;fail(e.code?.startsWith('CREDENTIAL_')?e.code:'CREDENTIAL_USE_FAILED');}
 }

 async useXai(c,phase,invoke){
  if(c?.kind!=='ORIGINAL'||c.archived||!['p1-01-X.I','p1-01-X.V'].includes(c.protocolId)||c.protocolVersion!=='v1'||c.authType!=='BEARER'||c.baseUrl!=='https://api.x.ai/v1'||c.region!=='UNKNOWN'||!['submit','query','image'].includes(phase)||typeof invoke!=='function')fail('CREDENTIAL_USE_FORBIDDEN');
  let work;try{await this.#queue(c,async()=>{const row=await this.#load(c);if(!row)fail('CREDENTIAL_REQUIRED');if(this.#closed)fail('CREDENTIAL_CLOSED');
   work=Promise.resolve().then(async()=>{if(this.#closed)fail('CREDENTIAL_CLOSED');const result=await invoke(row.bytes.toString('utf8'));if(this.#closed)fail('CREDENTIAL_CLOSED');policy.assertSafe(result);return result;});
   const tail=work.then(()=>{},()=>{}),id=c.connectionId;let readers=this.#geminiUses.get(id);if(!readers){readers=new Set();this.#geminiUses.set(id,readers);}readers.add(tail);tail.then(()=>{readers.delete(tail);if(!readers.size&&this.#geminiUses.get(id)===readers)this.#geminiUses.delete(id);});
  },true);return await work;}catch(e){if(e.code==='SENSITIVE_OUTPUT_BLOCKED')throw e;fail(e.code?.startsWith('CREDENTIAL_')?e.code:'CREDENTIAL_USE_FAILED');}
 }

 // B06 scoped reader; existing FIFO writes and close semantics.
 async useKling(c,phase,invoke){
  if(c?.kind!=='ORIGINAL'||c.archived||c.protocolId!=='p1-01-K'||c.protocolVersion!=='3.0'||c.authType!=='BEARER'||c.baseUrl!=='https://api-singapore.klingai.com'||c.region!=='singapore'||!['submit','query','image'].includes(phase)||typeof invoke!=='function')fail('CREDENTIAL_USE_FORBIDDEN');
  let work;try{await this.#queue(c,async()=>{const row=await this.#load(c);if(!row)fail('CREDENTIAL_REQUIRED');if(this.#closed)fail('CREDENTIAL_CLOSED');
   work=Promise.resolve().then(async()=>{if(this.#closed)fail('CREDENTIAL_CLOSED');const result=await invoke(row.bytes.toString('utf8'));if(this.#closed)fail('CREDENTIAL_CLOSED');policy.assertSafe(result);return result;});
   const tail=work.then(()=>{},()=>{}),id=c.connectionId;let readers=this.#geminiUses.get(id);if(!readers){readers=new Set();this.#geminiUses.set(id,readers);}readers.add(tail);tail.then(()=>{readers.delete(tail);if(!readers.size&&this.#geminiUses.get(id)===readers)this.#geminiUses.delete(id);});
  },true);return await work;}catch(e){if(e.code==='SENSITIVE_OUTPUT_BLOCKED')throw e;fail(e.code?.startsWith('CREDENTIAL_')?e.code:'CREDENTIAL_USE_FAILED');}
 }

 async useBytePlus(c,phase,invoke){
  if(!byteplusScope(c)||!['submit','query','image'].includes(phase)||typeof invoke!=='function')fail('CREDENTIAL_USE_FORBIDDEN');
  let work;try{await this.#queue(c,async()=>{const row=await this.#load(c);if(!row)fail('CREDENTIAL_REQUIRED');if(this.#closed)fail('CREDENTIAL_CLOSED');
   work=Promise.resolve().then(async()=>{if(this.#closed)fail('CREDENTIAL_CLOSED');const result=await invoke(row.bytes.toString('utf8'));if(this.#closed)fail('CREDENTIAL_CLOSED');policy.assertSafe(result);return result;});
   const tail=work.then(()=>{},()=>{}),id=c.connectionId;let readers=this.#geminiUses.get(id);if(!readers){readers=new Set();this.#geminiUses.set(id,readers);}readers.add(tail);tail.then(()=>{readers.delete(tail);if(!readers.size&&this.#geminiUses.get(id)===readers)this.#geminiUses.delete(id);});
  },true);return await work;}catch(e){if(e.code==='SENSITIVE_OUTPUT_BLOCKED')throw e;fail(e.code?.startsWith('CREDENTIAL_')?e.code:'CREDENTIAL_USE_FAILED');}
 }

 close(){this.#closed=true;for(const id of this.#memory.keys())this.#clear(id);}
}
module.exports={CredentialVault,binding};

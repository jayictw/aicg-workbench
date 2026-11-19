'use strict';
// Flash-only QA consumer of the existing vault. No renderer secret or generic consumer.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {CredentialVault,err}=require('./credential-vault.cjs');
const runtime=require('./runtime-paths.cjs'),{MODEL}=require('./flash-png.cjs');
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function flashCredentials({paths,safeStorage,current}){
 if(!paths.flashEnabled||!['flash-qa','automation'].includes(paths.mode))throw Error('FLASH_QA_ONLY');runtime.assertDescriptor(paths,paths.mode);
 const session=crypto.randomUUID();let epoch=0,last='',writing=false;const generated=new Map();
 function authorize(requestCap){const s=current(),identity=JSON.stringify([s.cap,s.selected,s.active?.libraryId]);if(identity!==last){last=identity;epoch++;generated.clear()}
  if(!s.cap||!s.active||s.blocked||requestCap!==s.cap)throw err('CREDENTIAL_AUTH_EXPIRED');
  const dir=require('./selection-validation.cjs').bounded(paths.librariesRoot,s.selected);runtime.boundary(path.join(dir,'library.json'));const identityRow=require('./library-identity.cjs').validateIdentity(JSON.parse(fs.readFileSync(path.join(dir,'library.json'))),paths.identityKind);if(identityRow.libraryId!==s.active.libraryId)throw err('CREDENTIAL_AUTH_EXPIRED');
  runtime.boundary(path.join(dir,'work.sqlite'));const {DatabaseSync}=require('node:sqlite'),db=new DatabaseSync(path.join(dir,'work.sqlite'),{readOnly:true});try{require('./library-identity.cjs').verifyDatabase(db,identityRow,paths.identityKind);if(db.prepare('SELECT id FROM meta').get()?.id!==identityRow.libraryId)throw err('CREDENTIAL_AUTH_EXPIRED')}finally{db.close()}
  return {profile:fs.realpathSync.native(paths.profileRoot).toLowerCase(),epoch,cap:s.cap,libraryId:identityRow.libraryId,canonicalPath:fs.realpathSync.native(dir).toLowerCase(),session};
 }
 const vault=new CredentialVault({profileRoot:paths.profileRoot,safeStorage,authorize,validateFake:(secret,c)=>generated.has(secret)&&eq(generated.get(secret),c)});
 function bound(read,c){const b=read.data.bindings.find(x=>x.libraryId===c.libraryId&&x.canonicalPath===c.canonicalPath&&x.provider==='fake-provider'),s=b&&read.data.slots.find(x=>x.id===b.slotId);if(!s||!/^ACS_FAKE_ONLY_[a-f0-9_-]+$/.test(s.secret))throw err('CREDENTIAL_NOT_CONFIGURED');return {slot:s,account:{provider:'fake-provider',region:'cn-beijing',model:MODEL,purpose:'generate-single-image',slotId:s.id,slotRevision:s.revision,vaultRevision:read.data.revision,bindingVersion:read.data.revision}}}
 async function inspect(cap){if(writing||vault.writing)throw err('CREDENTIAL_BUSY');const c=authorize(cap),read=await vault.read();if(!eq(c,authorize(cap)))throw err('CREDENTIAL_AUTH_EXPIRED');const b=bound(read,c);return {context:c,account:b.account}}
 async function status(cap){try{const b=await inspect(cap);return {configured:true,state:'configured',revision:b.account.vaultRevision}}catch(e){return {configured:false,state:e.code==='CREDENTIAL_NOT_CONFIGURED'?'unset':'invalid',code:vault.code(e)}}}
 async function action(cap,revoke){if(writing)throw err('CREDENTIAL_BUSY');writing=true;try{const c=authorize(cap);let read=await vault.read();if(!eq(c,authorize(cap)))throw err('CREDENTIAL_AUTH_EXPIRED');let slot;try{slot=bound(read,c).slot}catch(e){if(e.code!=='CREDENTIAL_NOT_CONFIGURED')throw e}
   if(slot){const p=await vault.preview({cap,expectedVaultRevision:read.data.revision,provider:'fake-provider',kind:'remove',slotId:slot.id});const r=await vault.commit({cap,operationId:p.operationId,expectedVaultRevision:p.vaultRevision});if(r.state!=='committed')throw err('CREDENTIAL_FAILED');if(revoke)return;read=await vault.read()}
   if(revoke)return;
   const secret='ACS_FAKE_ONLY_'+crypto.randomUUID()+'_'+crypto.randomBytes(32).toString('hex');generated.set(secret,c);
   try{const p=await vault.preview({cap,expectedVaultRevision:read.data.revision,provider:'fake-provider',kind:'set',secret});const r=await vault.commit({cap,operationId:p.operationId,expectedVaultRevision:p.vaultRevision});if(r.state!=='committed')throw err('CREDENTIAL_FAILED');const b=await vault.preview({cap,expectedVaultRevision:r.receipt.vaultRevision,provider:'fake-provider',kind:'bind',slotId:p.slotId});const ack=await vault.commit({cap,operationId:b.operationId,expectedVaultRevision:b.vaultRevision});if(ack.state!=='committed')throw err('CREDENTIAL_FAILED')}finally{generated.delete(secret)}
  }catch(e){throw Error(vault.code(e))}finally{writing=false}
 }
 // Only accepts a frozen, non-secret account descriptor. The key stays inside this closure.
 async function consume(cap,expected,invoke){if(writing||vault.writing)throw err('CREDENTIAL_BUSY');const c=authorize(cap),read=await vault.read();if(!eq(c,authorize(cap)))throw err('CREDENTIAL_AUTH_EXPIRED');const b=bound(read,c);if(!eq(expected,b.account))throw err('CREDENTIAL_BINDING_CHANGED');
  // Last disk/version + authority checks and invocation are synchronous: no await gap.
  vault.restricted();if(!fs.existsSync(vault.file)||crypto.createHash('sha256').update(fs.readFileSync(vault.file)).digest('hex')!==read.fingerprint||!eq(c,authorize(cap))||writing||vault.writing)throw err('CREDENTIAL_AUTH_EXPIRED');
  return invoke(b.slot.secret);
 }
 return {inspect,status,configure:cap=>action(cap,false),revoke:cap=>action(cap,true),consume,get writing(){return writing||vault.writing}};
}
module.exports={flashCredentials};

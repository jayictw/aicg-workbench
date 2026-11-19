const fs=require('node:fs'),p=require('node:path'),crypto=require('node:crypto');
const {CredentialVault,shape,err}=require('./credential-vault.cjs');const {boundary}=require('./runtime-paths.cjs');
// Every operation uses the same restricted frame/origin gate; no generic invoke or get-secret.
function installCredentials({ipcMain,safeStorage,paths,sender,current}){
 if(paths.mode!=='fake-only')throw Error('CREDENTIAL_MODE_DISABLED');require('./runtime-paths.cjs').assertDescriptor(paths,'fake-only');
 let epoch=0,last='',generated=new Map();const enabled=paths.credentialsEnabled===true;
 function authorize(requestCap){if(!enabled)throw err('CREDENTIAL_QA_ONLY');const s=current();const identity=JSON.stringify([s.cap,s.selected,s.active?.libraryId,s.session]);if(last!==identity){epoch++;last=identity;generated.clear()}
  if(!s.cap||!s.active||s.prepared||s.busy||arguments.length>0&&(typeof requestCap!=='string'||requestCap!==s.cap))throw err('CREDENTIAL_AUTH_EXPIRED');
  const dir=require('./selection-validation.cjs').bounded(paths.librariesRoot,s.selected);boundary(p.join(dir,'library.json'));const id=require('./library-identity.cjs').validateIdentity(JSON.parse(fs.readFileSync(p.join(dir,'library.json'))),paths.identityKind);if(id.libraryId!==s.active.libraryId)throw err('CREDENTIAL_AUTH_EXPIRED');boundary(p.join(dir,'work.sqlite'));const {DatabaseSync}=require('node:sqlite'),db=new DatabaseSync(p.join(dir,'work.sqlite'),{readOnly:true});try{require('./library-identity.cjs').verifyDatabase(db,id,paths.identityKind);if(db.prepare('SELECT id FROM meta').get()?.id!==id.libraryId)throw err('CREDENTIAL_AUTH_EXPIRED')}finally{db.close()}
  return {profile:fs.realpathSync.native(paths.profileRoot).toLowerCase(),epoch,cap:s.cap,libraryId:id.libraryId,canonicalPath:fs.realpathSync.native(dir).toLowerCase(),session:s.session};
 }
 const vault=new CredentialVault({profileRoot:paths.profileRoot,safeStorage,authorize,validateFake:(secret,c)=>{const row=generated.get(secret);return !!row&&row.until>Date.now()&&JSON.stringify(row.context)===JSON.stringify(c)}});
 const respond=fn=>async(e,r,...extra)=>{try{sender(e);const u=new URL(e.senderFrame.url);if(u.host!=='app'||extra.length)throw err('CREDENTIAL_ORIGIN_OR_SCHEMA');if(r!==undefined&&Buffer.byteLength(JSON.stringify(r))>20000)throw err('CREDENTIAL_SCHEMA');return {ok:true,value:await fn(r)}}catch(e){return {ok:false,code:vault.code(e)}}};
 ipcMain.handle('credential:status',respond(r=>{shape(r,[]);return enabled?vault.status():{state:'not-configured',managed:false,slots:[]}}));
 ipcMain.handle('credential:fake',respond(r=>{shape(r,['cap']);const c=authorize(r.cap);for(const [s,v]of generated)if(v.until<Date.now())generated.delete(s);if(generated.size>=8)generated.delete(generated.keys().next().value);const secret='ACS_FAKE_ONLY_'+crypto.randomUUID()+'_'+crypto.randomBytes(32).toString('hex');generated.set(secret,{context:c,until:Date.now()+300000});return {secret,provider:'fake-provider'}}));
 for(const name of ['preview','commit','cancel','receipt'])ipcMain.handle('credential:'+name,respond(r=>vault[name](r)));
 return {vault,authorize,enabled};
}
module.exports={installCredentials};

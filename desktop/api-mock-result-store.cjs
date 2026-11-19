'use strict';
// Mock-only result commit around existing journal and exclusive content store.
const fs=require('node:fs'),path=require('node:path'),{randomUUID}=require('node:crypto');
const media=require('./media.cjs');
const {UnifiedRepository,boundary,content}=require('./unified-repository.cjs');
const {noCreateRetries}=require('./api-mock-response.cjs');
const fail=code=>Object.assign(new Error(code),{code});
const validated=new WeakMap();
class MockResultStore{
 constructor({root,journal,operationId,contract,fault=()=>{},containsKnownSecret=()=>false}){
  this.root=boundary(root);this.journal=journal;this.operationId=operationId;this.contract=structuredClone(contract);this.fault=fault;this.containsKnownSecret=containsKnownSecret;this.failed=false;
  if(contract?.fixtureId!=='MOCK-06-RESULT-1'||contract.mime!=='image/png'||contract.ext!=='.png'||contract.versionId!=='V2'||!/^[-A-Za-z0-9_]{1,90}$/.test(contract.assetId??'')||![contract.width,contract.height,contract.maxBytes].every(x=>Number.isSafeInteger(x)&&x>0)||path.dirname(journal.root)!==this.root||journal.query(operationId).observation?.resultVersions?.V1?.assetId!==contract.assetId)throw fail('MOCK_RESULT_CONTRACT');
  this.media=boundary(path.join(this.root,'media'));fs.mkdirSync(this.media,{recursive:true});
 }
 projection(){return structuredClone(this.journal.query(this.operationId).observation);}
 save(state,patch={}){const old=this.projection(),observation={...old,...structuredClone(patch),state};this.journal.change(this.operationId,{observation});return this.projection();}
 validFile(v){try{if(!v||v.path!==content(this.root,v.sha256))return false;const s=fs.lstatSync(v.path);return s.isFile()&&!s.isSymbolicLink()&&s.nlink===1&&s.size===v.size&&media.hash(fs.readFileSync(v.path))===v.sha256;}catch{return false;}}
 recover(){
  const a=this.journal.query(this.operationId),p=a.observation,current=p.resultVersions?.[p.currentResultVersion];
  if(!this.validFile(current)){const old=p.resultVersions?.V1;if(!this.validFile(old))throw fail('MOCK_CURRENT_RESULT_UNAVAILABLE');return this.save('OUTPUT_REVIEW_REQUIRED',{currentResultVersion:'V1',lastDiagnostic:{code:'CURRENT_RESULT_UNAVAILABLE'}});}
  if(a.resultCommit?.phase==='PREPARED')return this.save('TRANSFER_FAILED',{lastDiagnostic:{code:'RESULT_COMMIT_INCOMPLETE'},resultVersions:{...p.resultVersions,V2:{...p.resultVersions.V2,status:'SAVE_FAILED'}}});
  return p;
 }
 async validate(bytes,{providerFilename}={}){
  const c=this.contract;if(!Buffer.isBuffer(bytes)||bytes.length<1||bytes.length>c.maxBytes)throw fail('MOCK_RESULT_BYTES');
  if(bytes.subarray(0,8).compare(Buffer.from([137,80,78,71,13,10,26,10]))!==0)throw fail('MOCK_RESULT_MIME');
  const file=boundary(path.join(this.media,'.validate-'+randomUUID()+'.png'));let fd;
  try{fd=fs.openSync(file,'wx',0o600);fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);fs.closeSync(fd);fd=undefined;const m=await media.inspect(file);if(m.mime!==c.mime||m.width!==c.width||m.height!==c.height)throw fail('MOCK_RESULT_GEOMETRY');const token=Object.freeze({validated:true});validated.set(token,{owner:this,bytes:Buffer.from(bytes),metadata:m});return token;}
  finally{if(fd!==undefined)fs.closeSync(fd);if(fs.existsSync(file))fs.unlinkSync(file);}
 }
 async commit(token){
  const v=validated.get(token);if(!v||v.owner!==this)throw fail('MOCK_RESULT_UNVERIFIED');
  if(this.failed||this.journal.failed)return {...this.projection(),state:'TRANSFER_FAILED',lastDiagnostic:{code:'RESULT_STORE_STOPPED'}};
  const p=this.projection(),old=p.resultVersions.V1,c=this.contract,m=v.metadata;
  if(!this.validFile(old))throw fail('MOCK_V1_UNAVAILABLE');
  if(p.currentResultVersion==='V2'&&p.resultVersions.V2?.sha256===m.sha256&&this.validFile(p.resultVersions.V2))return p;
  const version={id:'V2',assetId:c.assetId,mediaVersionId:'mv-V2-'+m.sha256.slice(0,24),sha256:m.sha256,size:m.size,mime:m.mime,width:m.width,height:m.height,status:'COMMITTING'};
  try{
   this.journal.change(this.operationId,{resultCommit:{phase:'PREPARED',sha256:m.sha256,size:m.size,currentBefore:p.currentResultVersion},observation:{...p,state:'COMMITTING',resultVersions:{...p.resultVersions,V2:version}}});
   this.fault('before-save');this.fault('before-publish');
   const dest=await UnifiedRepository.prototype.put.call({root:this.root,media:this.media},v.bytes,m);this.fault('after-save');
   if(!this.validFile({...version,path:dest}))throw fail('MOCK_RESULT_SAVE_VERIFY');
   this.fault('before-metadata');
   this.journal.change(this.operationId,{state:'succeeded',resultCommit:{phase:'COMMITTED',sha256:m.sha256,size:m.size},observation:{...p,state:'SUCCEEDED',currentResultVersion:'V2',resultVersions:{...p.resultVersions,V2:{...version,path:dest,status:'SUCCEEDED'}}}});
   return this.projection();
  }catch{this.failed=true;if(this.journal.failed)return {...this.projection(),state:'TRANSFER_FAILED',lastDiagnostic:{code:'RESULT_METADATA_NOT_DURABLE'}};return this.save('TRANSFER_FAILED',{lastDiagnostic:{code:'RESULT_SAVE_FAILED'},resultVersions:{...this.projection().resultVersions,V2:{...version,status:'SAVE_FAILED'}}});}
 }
 async acceptW05(client,request){
  const a=this.journal.query(this.operationId);if(a.imageResponseRequested)return this.projection();
  if(request?.url!=='https://gateway.example.invalid/v1/images/generations'||request.method!=='POST'||request.body?.n!==1||request.body.model!=='host-image-route-7'||request.body.size!==this.contract.width+'x'+this.contract.height||typeof request.body.prompt!=='string'||Object.keys(request.body).sort().join(',')!=='model,n,prompt,size'||this.containsKnownSecret(request))throw fail('MOCK_W05_CONTRACT');
  this.journal.change(this.operationId,{imageResponseRequested:true});if(a.state==='reserved')this.journal.dispatch(this.operationId);
  let response;try{response=await noCreateRetries(client,request);}catch{return this.save('SUBMISSION_UNKNOWN',{lastDiagnostic:{code:'SYNC_RESPONSE_INTERRUPTED'}});}
  const body=response?.body;if(response?.status!==200||!body||!Array.isArray(body.data)||body.data.length===0)return this.save('TRANSFER_FAILED',{lastDiagnostic:{code:'PRIMARY_RESULT_MISSING'}});
  if(body.data.length!==1)return this.save('OUTPUT_REVIEW_REQUIRED',{lastDiagnostic:{code:'OUTPUT_CARDINALITY',candidateCount:body.data.length}});
  const item=body.data[0];if(typeof item?.b64_json!=='string'||Object.keys(item).some(k=>k!=='b64_json')||body.partial===true||body.final===false||body.error)return this.save('TRANSFER_FAILED',{lastDiagnostic:{code:'PRIMARY_RESULT_MISSING'}});
  let token;try{const bytes=Buffer.from(item.b64_json,'base64');if(bytes.toString('base64')!==item.b64_json)throw fail('MOCK_RESULT_BASE64');token=await this.validate(bytes);}catch{return this.save('TRANSFER_FAILED',{lastDiagnostic:{code:'OUTPUT_VALIDATION_FAILED'}});}return this.commit(token);
 }
}
module.exports={MockResultStore};

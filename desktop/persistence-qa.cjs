'use strict';
// Exact-profile synthetic GUI fixture only; this is not an OS-attested MCP connection.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{error}=require('./media.cjs'),{boundary}=require('./unified-repository.cjs');
const ALLOWED=new Set(['session_info','scope_select','canvas_context_read','canvas_context_expand','canvas_context_field','canvas_library_prepare','canvas_library_execute','canvas_request_receipt']);
class PersistenceQa{
 constructor({home,getAgent,getService,getContext,notify}){Object.assign(this,{home,getAgent,getService,getContext,notify});}
 ensure(){const s=this.getService(),agent=this.getAgent(),file=boundary(path.join(this.home,'qa-engineering-scope.json'));if(agent?.host?.peer||!s)throw error('QA_PERSISTENCE_SCOPE','工程客戶端不可取代真實客戶端');const st=fs.lstatSync(file);if(!st.isFile()||st.nlink!==1||st.size>2048)throw error('QA_PERSISTENCE_SCOPE','合成工程標記不合法');const v=JSON.parse(fs.readFileSync(file,'utf8'));if(v.format!=='P3-02-SYNTHETIC-ONLY'||v.libraryId!==s.host.repo.identity.libraryId||v.projectId!==s.graph.projectId||v.graphId!==s.graph.graphId||!require('./library-persistence.cjs').under(this.home,s.host.root))throw error('QA_PERSISTENCE_SCOPE','只允許本次獨立合成工程');if(this.b?.s!==s||this.b?.context!==this.getContext()){this.b?.invalidate();this.b=new(require('./r3-broker.cjs').R3Broker)(s,this.getContext(),{engineering:true,onApplied:()=>this.notify(true),onChanged:()=>this.notify()});this.session='engineering-'+crypto.randomUUID();this.b.connect(this.session,Date.now()+3600000);this.b.grant({proposalPermission:true});}return this.b;}
 async query(r){if(!r||Object.keys(r).some(k=>!['name','args'].includes(k))||!ALLOWED.has(r.name))throw error('QA_PERSISTENCE_TOOL','此工程測試入口沒有一般創作／生成／路徑權');return {evidenceLevel:'ENGINEERING_TEST_ONLY_NOT_REAL_CODEX',value:await this.ensure().query(this.session,r.name,r.args??{})};}
 nativeStatus(){return {...(this.b?.persistence.nativeStatus()??{pending:null}),evidenceLevel:'ENGINEERING_TEST_ONLY_NOT_REAL_CODEX'};}
 confirm(r){return this.ensure().persistence.confirm(r);}
}
module.exports={PersistenceQa};

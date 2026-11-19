'use strict';
// Local guard for the authorized Mock subset. No transport or settings writes.
const {prepareRequest}=require('./api-preflight.cjs');
const {canonical,freeze}=require('./live-policy.cjs');
const {sameSelection}=require('./api-routing.cjs');
const {createHash,randomUUID}=require('node:crypto');
const hash=s=>createHash('sha256').update(s).digest('hex');
const own=(v,k)=>Object.hasOwn(v,k),record=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const error=code=>Object.assign(new Error(code),{code});
const danger=new Set(['__proto__','constructor','prototype']);
// Parse object keys from original text before any whole-object JSON.parse.
// JSON.parse is used only to decode one already delimited string token.
function parseBoundedJson(raw){
 if(typeof raw!=='string')throw error('JSON_SYNTAX');
 if(Buffer.byteLength(raw,'utf8')>65536)throw error('JSON_BYTES');
 let at=0,nodes=0;
 const ws=()=>{while(/[\x20\t\r\n]/.test(raw[at]??'!'))at++;};
 function string(){
  const start=at++;let end=false;
  while(at<raw.length){const c=raw[at++];if(c==='"'){end=true;break;}if(c==='\\')at++;else if(c.charCodeAt(0)<32)throw error('JSON_STRING');}
  if(!end)throw error('JSON_SYNTAX');let s;try{s=JSON.parse(raw.slice(start,at));}catch{throw error('JSON_SYNTAX');}
  if(/[\x00-\x1f\x7f]/.test(s))throw error('JSON_STRING');
  for(let i=0;i<s.length;i++){const u=s.charCodeAt(i);if(u>=0xd800&&u<=0xdbff){const v=s.charCodeAt(++i);if(!(v>=0xdc00&&v<=0xdfff))throw error('JSON_STRING');}else if(u>=0xdc00&&u<=0xdfff)throw error('JSON_STRING');}
  return s;
 }
 function value(depth){
  if(depth>16)throw error('JSON_DEPTH');if(++nodes>4096)throw error('JSON_NODES');ws();const c=raw[at];
  if(c==='"')return string();
  if(c==='{'||c==='['){
   const object=c==='{',out=object?Object.create(null):[],keys=new Set(),close=object?'}':']';at++;ws();if(raw[at]===close){at++;return out;}
   while(at<raw.length){
    if(object){ws();if(raw[at]!=='"')throw error('JSON_SYNTAX');const key=string();if(danger.has(key))throw error('JSON_DANGEROUS_KEY');if(keys.has(key))throw error('JSON_DUPLICATE_KEY');keys.add(key);ws();if(raw[at++]!==':')throw error('JSON_SYNTAX');out[key]=value(depth+1);}
    else out.push(value(depth+1));
    ws();if(raw[at]===close){at++;return out;}if(raw[at++]!==',')throw error('JSON_SYNTAX');
   }throw error('JSON_SYNTAX');
  }
  for(const [token,v]of [['true',true],['false',false],['null',null]])if(raw.startsWith(token,at)){at+=token.length;return v;}
  const m=/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/.exec(raw.slice(at));if(!m)throw error('JSON_SYNTAX');at+=m[0].length;const n=Number(m[0]);if(!Number.isFinite(n))throw error('JSON_NUMBER');return n;
 }
 const result=value(0);ws();if(at!==raw.length)throw error('JSON_SYNTAX');return result;
}
const reserved=new Set(['model','selector','providerId','connectionId','routingId','baseUrl','auth','headers','authorization','apiKey','token','method','path','queryUrl','taskId','outputCount','adapterVersion']);
function reservedPath(value,prefix='overrides'){
 if(!record(value))return null;for(const [k,v]of Object.entries(value)){if(reserved.has(k)||/^(?:auth|api[-_]?key|secret|credential)/i.test(k))return prefix+'.'+k;const nested=reservedPath(v,prefix+'.'+k);if(nested)return nested;}return null;
}
const sameScope=(a,b)=>record(a)&&canonical(a)===canonical(b);
function diagnostic(cap,code,fieldPath,knowledge=cap?.knowledge??'UNKNOWN',refs=cap?.sourceRefs??[]){return freeze({ok:false,code,fieldPath,knowledge,severity:'ERROR',sourceRefs:[...refs],effectiveScope:structuredClone(cap?.scope??null),userAction:'Review the indicated field and evidence, then preview and confirm again.'});}
function intersectRule(base,restriction){
 const rule={...base};
 if(restriction.min!==undefined)rule.min=rule.min===undefined?restriction.min:Math.max(rule.min,restriction.min);
 if(restriction.max!==undefined)rule.max=rule.max===undefined?restriction.max:Math.min(rule.max,restriction.max);
 if(restriction.enum)rule.enum=rule.enum?rule.enum.filter(x=>restriction.enum.includes(x)):[...restriction.enum];
 return rule;
}
function validRestriction(rule){
 return record(rule)&&Object.keys(rule).length>0&&Object.keys(rule).every(k=>['min','max','enum'].includes(k))&&['min','max'].every(k=>rule[k]===undefined||typeof rule[k]==='number'&&Number.isFinite(rule[k]))&&(rule.enum===undefined||Array.isArray(rule.enum)&&rule.enum.every(v=>['string','boolean'].includes(typeof v)||typeof v==='number'&&Number.isFinite(v)));
}
async function prepareGuardedRequest(args,ports){
 const cap=args.capability,fail=(code,field,knowledge,refs)=>diagnostic(cap,code,field,knowledge,refs);let values;
 try{values=parseBoundedJson(args.overridesJson??'{}');}catch(e){return fail(e.code,'overrides','UNKNOWN');}
 if(!record(values))return fail('JSON_SHAPE','overrides');const protectedField=reservedPath(values);if(protectedField)return fail('RESERVED_FIELD',protectedField);
 for(const k of ['n','output_count'])if(own(values,k)&&values[k]!==1)return fail('OUTPUT_COUNT','overrides.'+k);
 if(own(values,'extras'))return fail('PARAMETER_UNSUPPORTED','overrides.extras');
 if(cap?.knowledge==='CONFLICT')return fail('CONFLICT','capability','CONFLICT');
 const effective=structuredClone(cap),notes=[];
 if(!record(effective))return fail('CAPABILITY_UNKNOWN','capability','UNKNOWN');
 const life=effective.lifecycle;
 if(life?.state==='RETIRED'){
  if(!sameScope(life.scope,cap.scope)||!Array.isArray(life.sourceRefs)||!life.sourceRefs.length)return fail('CAPABILITY_UNKNOWN','capability.lifecycle','UNKNOWN');
  return fail('ROUTE_RETIRED','capability.lifecycle','SUPPORTED',life.sourceRefs);
 }
 for(const row of effective.fieldAssertions??[]){
  const needed=row.required===true||own(values,row.field),assertions=row.assertions??[],scoped=assertions.filter(x=>sameScope(x.scope,cap.scope)),refs=scoped.flatMap(x=>x.sourceRefs??[]);
  const official=scoped.filter(x=>x.origin==='OFFICIAL_FIXTURE'&&x.knowledge==='SUPPORTED');
  const conflict=scoped.some(x=>x.knowledge==='CONFLICT')||new Set(official.map(x=>canonical(x.value))).size>1;
  const unknown=!scoped.length||scoped.some(x=>x.knowledge==='UNKNOWN'||!Array.isArray(x.sourceRefs)||!x.sourceRefs.length);
  if(conflict){if(needed)return fail('CONFLICT','capability.'+row.field,'CONFLICT',refs);notes.push({field:row.field,knowledge:'CONFLICT',sourceRefs:refs});continue;}
  if(unknown){if(needed)return fail('CAPABILITY_UNKNOWN','capability.'+row.field,'UNKNOWN',refs);notes.push({field:row.field,knowledge:'UNKNOWN',sourceRefs:refs});continue;}
  if(needed&&scoped.some(x=>x.knowledge!=='SUPPORTED'))return fail('CAPABILITY_UNKNOWN','capability.'+row.field,'UNKNOWN',refs);
  // Only explicitly implemented assertion forms may authorize this subset.
  if(official.length){
   if(row.field==='request.maxBytes'){const n=official[0].value;if(!Number.isSafeInteger(n)||n<=0)return fail('CAPABILITY_UNKNOWN','capability.'+row.field,'UNKNOWN',refs);effective.request.maxBytes=Math.min(effective.request.maxBytes,n);}
   else if(row.field.startsWith('parameters.')&&own(effective.parameters,row.field.slice(11))&&validRestriction(official[0].value)){const field=row.field.slice(11);effective.parameters[field]=intersectRule(effective.parameters[field],official[0].value);}
   else if(needed)return fail('CAPABILITY_UNKNOWN','capability.'+row.field,'UNKNOWN',refs);
  }else if(needed)return fail('CAPABILITY_UNKNOWN','capability.'+row.field,'UNKNOWN',refs);
 }
 const account=effective.accountEvidence;
 if(account){
  if(account.knowledge!=='SUPPORTED'||!sameScope(account.scope,cap.scope)||!account.sourceRefs?.length)return fail('CAPABILITY_UNKNOWN','capability.accountEvidence','UNKNOWN');
  for(const [field,rule]of Object.entries(account.parameters??{})){
   if(!own(effective.parameters,field)||!validRestriction(rule))return fail('CAPABILITY_UNKNOWN','capability.accountEvidence.'+field,'UNKNOWN');
   effective.parameters[field]=intersectRule(effective.parameters[field],rule);
  }
 }
 const result=await prepareRequest({...args,capability:effective,overrides:{...values}},ports);
 return result.ok?freeze({...result,knowledgeNotes:notes}):result;
}
function confirmationDigest(prepared,versions,binding){
 if(!prepared?.ok||!record(versions)||!binding||['routingId','connectionId','configRevision','routingRevision','connectionRevision','credentialEpoch'].some(k=>binding[k]===undefined))throw error('CONFIRMATION_INPUT');
 const images=prepared.images.map(a=>{if(!Number.isSafeInteger(versions[a.assetId])||versions[a.assetId]<1)throw error('CONFIRMATION_INPUT');return {assetId:a.assetId,contentVersion:versions[a.assetId],sha256:a.sha256,role:a.role,sequenceIndex:a.sequenceIndex};});
 return hash(canonical({requestHash:hash(prepared.requestJson),images,binding}));
}
class RequestConfirmations{
 #records=new Map();#consumed=0;
 get consumed(){return this.#consumed;}
 preview(prepared,versions,binding){const token=randomUUID();this.#records.set(token,{digest:confirmationDigest(prepared,versions,binding),binding:{...binding}});return token;}
 consume(token,prepared,versions,binding){
  const old=this.#records.get(token);this.#records.delete(token);
  if(!old||!sameSelection(old.binding,binding)||old.digest!==confirmationDigest(prepared,versions,binding))throw error('CONFIRMATION_CHANGED');
  this.#consumed++;return {consumed:true};
 }
}
module.exports={parseBoundedJson,prepareGuardedRequest,RequestConfirmations};

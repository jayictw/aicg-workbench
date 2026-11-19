'use strict';
// Ark task response usage v1. Provider counters only; never estimate or infer a missing field.
const c=require('./d1-json.cjs');
const FIELDS=['usage','usage.completion_tokens','usage.total_tokens','usage.tool_usage','usage.tool_usage.web_search'];
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const count=v=>c.integer(v);
function parse(value,present=value!==undefined){
 const out={version:1,completion_tokens:null,total_tokens:null,tool_usage:{web_search:null},invalidFields:[]};
 if(!present)return out;
 if(!object(value)){out.invalidFields.push('usage');return out}
 for(const key of ['completion_tokens','total_tokens'])if(Object.hasOwn(value,key)){
  if(count(value[key]))out[key]=value[key];else out.invalidFields.push('usage.'+key);
 }
 if(Object.hasOwn(value,'tool_usage')){
  if(!object(value.tool_usage))out.invalidFields.push('usage.tool_usage');
  else if(Object.hasOwn(value.tool_usage,'web_search')){
   if(count(value.tool_usage.web_search))out.tool_usage.web_search=value.tool_usage.web_search;
   else out.invalidFields.push('usage.tool_usage.web_search');
  }
 }
 return out;
}
function valid(v){try{
 c.keys(v,['version','completion_tokens','total_tokens','tool_usage','invalidFields']);c.keys(v.tool_usage,['web_search']);
 if(v.version!==1||![v.completion_tokens,v.total_tokens,v.tool_usage.web_search].every(x=>x===null||count(x))||!Array.isArray(v.invalidFields)||v.invalidFields.length>FIELDS.length||new Set(v.invalidFields).size!==v.invalidFields.length||!v.invalidFields.every(x=>FIELDS.includes(x)))return false;
 for(const key of ['completion_tokens','total_tokens'])if(v.invalidFields.some(x=>x==='usage'||x==='usage.'+key)&&v[key]!==null)return false;
 if(v.invalidFields.some(x=>['usage','usage.tool_usage','usage.tool_usage.web_search'].includes(x))&&v.tool_usage.web_search!==null)return false;
 return true;
 }catch{return false}}
function checked(v){if(!valid(v))throw Object.assign(Error('C_VIDEO_USAGE_FORMAT'),{code:'C_VIDEO_USAGE_FORMAT'});return structuredClone(v)}
module.exports=Object.freeze({parse,valid,checked});

'use strict';
const crypto=require('node:crypto');
const fail=(code='SCHEMA')=>{throw Object.assign(Error('C_D1_'+code),{code:'C_D1_'+code})};
const integer=(v,min=0,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(v)&&!Object.is(v,-0)&&v>=min&&v<=max;
const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(v);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function unicode(s){if(typeof s!=='string')return false;for(let i=0;i<s.length;i++){const n=s.charCodeAt(i);if(n>=0xd800&&n<=0xdbff){const m=s.charCodeAt(++i);if(!(m>=0xdc00&&m<=0xdfff))return false}else if(n>=0xdc00&&n<=0xdfff)return false}return true}
function keys(v,required,optional=[]){if(!v||Object.getPrototypeOf(v)!==Object.prototype||required.some(k=>!Object.hasOwn(v,k))||Object.keys(v).some(k=>!required.includes(k)&&!optional.includes(k)))fail('FIELDS')}
function text(s,max=128,{empty=false,prompt=false,ascii=false}={}){return typeof s==='string'&&unicode(s)&&(empty||s.length>0)&&Buffer.byteLength(s)<=max&&!s.includes('\0')&&!(prompt?/[\x01-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]/:/[\x00-\x1f\x7f-\x9f]/).test(s)&&(!ascii||/^[\x21-\x7e]+$/.test(s))}
// General JSON preserves old Scene floating point; only generated paths use integer lexemes.
function parse(bytes,{generated=false,max=512*1024*1024}={}){if(!Buffer.isBuffer(bytes))bytes=Buffer.from(bytes);if(bytes.length>max)fail('SIZE');let s;try{s=new TextDecoder('utf-8',{fatal:true}).decode(bytes)}catch{fail('UTF8')}let i=0;const ws=()=>{while(i<s.length&&/[\t\r\n ]/.test(s[i]))i++};
 function read(path,depth){if(depth>150)fail('DEPTH');ws();const start=i,c=s[i];if(c==='"'){i++;while(i<s.length){if(s[i]==='\\'){i+=2;continue}if(s[i++]==='"'){let v;try{v=JSON.parse(s.slice(start,i))}catch{fail('JSON')}if(!unicode(v)||v.includes('\0'))fail('UNICODE');return v}}fail('JSON')}
  if(c==='{'||c==='['){i++;const object=c==='{',v=object?{}:[],seen=new Set();ws();if(s[i]===(object?'}':']')){i++;return v}for(;;){if(object){ws();if(s[i]!=='"')fail('JSON');const k=read(path,depth+1);if(seen.has(k)||['__proto__','constructor','prototype'].includes(k))fail('DUPLICATE_OR_UNSAFE_KEY');seen.add(k);ws();if(s[i++]!==':')fail('JSON');v[k]=read([...path,k],depth+1)}else v.push(read([...path,String(v.length)],depth+1));ws();const stop=s[i++];if(stop===(object?'}':']'))return v;if(stop!==',')fail('JSON')}}
  for(const [word,value]of [['true',true],['false',false],['null',null]])if(s.slice(i,i+word.length)===word){i+=word.length;return value}
  const match=s.slice(i).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);if(!match)fail('JSON');i+=match[0].length;const n=Number(match[0]),inside=generated||path[0]==='business'&&path[1]==='generated';if(!Number.isFinite(n)||Object.is(n,-0)||inside&&(!/^-?(?:0|[1-9]\d*)$/.test(match[0])||!Number.isSafeInteger(n))||!/[.eE]/.test(match[0])&&!Number.isSafeInteger(n))fail('NUMBER');return n;
 }
 const result=read([],0);ws();if(i!==s.length)fail('JSON');return result;
}
function jcs(v,depth=0,ancestors=new Set()){if(depth>24)fail('DEPTH');if(v===null||typeof v==='boolean')return JSON.stringify(v);if(typeof v==='number'){if(!integer(v,-Number.MAX_SAFE_INTEGER))fail('NUMBER');return JSON.stringify(v)}if(typeof v==='string'){if(!unicode(v))fail('UNICODE');return JSON.stringify(v)}if(!v||typeof v!=='object'||ancestors.has(v))fail('JSON_TREE');const next=new Set(ancestors);next.add(v);if(Array.isArray(v)){if(Object.keys(v).length!==v.length||Object.getOwnPropertySymbols(v).length||Array.from({length:v.length},(_,i)=>i).some(i=>!Object.hasOwn(v,i)))fail('ARRAY');return '['+v.map(x=>jcs(x,depth+1,next)).join(',')+']'}if(Object.getPrototypeOf(v)!==Object.prototype||Object.getOwnPropertySymbols(v).length)fail('JSON_TREE');const names=Object.keys(v).sort();if(names.some(k=>!unicode(k)||['__proto__','constructor','prototype'].includes(k)))fail('FIELDS');return '{'+names.map(k=>JSON.stringify(k)+':'+jcs(v[k],depth+1,next)).join(',')+'}'}
const same=(a,b)=>jcs(a)===jcs(b);
const digest=effective=>hash(Buffer.concat([Buffer.from('AICG:effective-request:v1\n','utf8'),Buffer.from(jcs(effective),'utf8')]));
const bundle=(request,result)=>{const {favorite,...immutable}=result;return hash(Buffer.from(jcs({request,result:immutable})))};
module.exports={fail,integer,uuid,hash,unicode,keys,text,parse,jcs,same,digest,bundle};

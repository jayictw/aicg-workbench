'use strict';
const crypto=require('node:crypto');
const fail=(code='UK_SCHEMA')=>{throw Object.assign(Error(code),{code})};
const uuid=x=>typeof x==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(x);
const integer=(x,min=0,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(x)&&!Object.is(x,-0)&&x>=min&&x<=max;
function keys(v,required,optional=[]){if(!v||Object.getPrototypeOf(v)!==Object.prototype||required.some(k=>!Object.hasOwn(v,k))||Object.keys(v).some(k=>!required.includes(k)&&!optional.includes(k)))fail()}
function text(x,max=320){return typeof x==='string'&&!!x.trim()&&x===x.trim()&&[...x].length<=80&&Buffer.byteLength(x)<=max&&!/[\x00-\x1f\x7f\ud800-\udfff]/u.test(x)}
function tree(x,depth=0){if(depth>16)fail();if(typeof x==='number'){if(!integer(x))fail();return}if(x===null||typeof x==='boolean'||typeof x==='string')return;if(Array.isArray(x)){if(x.length>1024)fail();x.forEach(v=>tree(v,depth+1));return}if(!x||Object.getPrototypeOf(x)!==Object.prototype)fail();for(const [k,v]of Object.entries(x)){if(['__proto__','constructor','prototype'].includes(k))fail();tree(v,depth+1)}}
function canonical(x){tree(x);const f=v=>Array.isArray(v)?'['+v.map(f).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+f(v[k])).join(',')+'}':JSON.stringify(v);return f(x)}
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const same=(a,b)=>canonical(a)===canonical(b);
// Parse closed JSON without silently accepting duplicate properties. No eval.
function parse(bytes){const s=new TextDecoder('utf-8',{fatal:true}).decode(bytes);let i=0;const ws=()=>{while(/[\t\n\r ]/.test(s[i]||'!'))i++};
 function value(d){if(d>16)fail('UK_FORMAT');ws();let v;const c=s[i];if(c==='"'){const start=i++;while(i<s.length){if(s[i]==='\\'){i+=2;continue}if(s[i++]==='"'){v=JSON.parse(s.slice(start,i));return v}}fail('UK_FORMAT')}
 if(c==='{'||c==='['){i++;const object=c==='{';v=object?{}:[];const seen=new Set();ws();if(s[i]===(object?'}':']')){i++;return v}for(;;){if(object){ws();if(s[i]!=='"')fail('UK_FORMAT');const k=value(d+1);if(seen.has(k)||['__proto__','constructor','prototype'].includes(k))fail('UK_FORMAT');seen.add(k);ws();if(s[i++]!==':')fail('UK_FORMAT');v[k]=value(d+1)}else v.push(value(d+1));ws();const stop=s[i++];if(stop===(object?'}':']'))return v;if(stop!==',')fail('UK_FORMAT')}}
 for(const [k,v0]of [['true',true],['false',false],['null',null]])if(s.slice(i,i+k.length)===k){i+=k.length;return v0}const m=s.slice(i).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);if(!m)fail('UK_FORMAT');i+=m[0].length;return JSON.parse(m[0])}
 try{const out=value(0);ws();if(i!==s.length)fail('UK_FORMAT');tree(out);return out}catch{fail('UK_FORMAT')}}
const mask=s=>s.length<=12?'••••••••':s.slice(0,4)+'••••••••'+s.slice(-4);
const validSecret=s=>typeof s==='string'&&s.length>=1&&s.length<=16384&&/^[\x21-\x7e]+$/.test(s);
module.exports={fail,uuid,integer,keys,text,tree,canonical,hash,same,parse,mask,validSecret};

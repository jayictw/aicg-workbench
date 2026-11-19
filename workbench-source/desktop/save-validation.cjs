// Save-boundary validation only. No normalization or mutation of the request.
const MAX_REQUEST_BYTES=512*1024*1024,MAX_TREE_DEPTH=150;
const forbidden=new Set(['__proto__','constructor','prototype']);
function jsonStringBytes(s,remaining=Infinity){let n=2;for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);if(c===34||c===92)n+=2;else if(c<32)n+=(c===8||c===9||c===10||c===12||c===13)?2:6;else if(c<128)n++;else if(c<2048)n+=2;else if(c>=0xd800&&c<=0xdbff&&i+1<s.length&&s.charCodeAt(i+1)>=0xdc00&&s.charCodeAt(i+1)<=0xdfff){n+=4;i++}else if(c>=0xd800&&c<=0xdfff)n+=6;else n+=3;if(n>remaining)throw Error('REQUEST_SIZE')}return n}
function validateTree(value,depth=0,maxBytes=MAX_REQUEST_BYTES){
 let bytes=0;const active=new Set(),stack=[];
 const add=n=>{bytes+=n;if(bytes>maxBytes)throw Error('REQUEST_SIZE')};
 // Enter one child at a time: auxiliary frames scale with depth, not width.
 function enter(v,d,array=false){
  if(d>MAX_TREE_DEPTH)throw Error('TREE_DEPTH');
  if(v===null){add(4);return}
  const kind=typeof v;
  if(kind==='undefined'){if(array)add(4);return}
  if(kind==='number'){if(!Number.isFinite(v))throw Error('NON_FINITE');add(String(v).length);return}
  if(kind==='string'){add(jsonStringBytes(v,maxBytes-bytes));return}
  if(kind==='boolean'){add(v?4:5);return}
  if(kind!=='object')throw Error('TREE_TYPE');
  if(active.has(v))throw Error('TREE_CYCLE');
  const arr=Array.isArray(v),proto=Object.getPrototypeOf(v);
  if(!arr&&proto!==Object.prototype&&proto!==null)throw Error('TREE_TYPE');
  let keys=Object.keys(v);
  for(const k of keys)if(forbidden.has(k))throw Error('KEY_REJECTED');
  if(arr){
   for(const k of keys){const n=Number(k);if(!Number.isInteger(n)||n<0||n>=v.length||String(n)!==k)throw Error('TREE_TYPE')}
   // JSON holes are null; account for them without walking a huge sparse array.
   add(2+Math.max(0,v.length-1)+(v.length-keys.length)*4);
  }else{keys=keys.filter(k=>v[k]!==undefined);add(2+Math.max(0,keys.length-1))}
  active.add(v);stack.push({v,d,arr,keys,i:0});
 }
 enter(value,depth);
 while(stack.length){const f=stack[stack.length-1];if(f.i===f.keys.length){active.delete(f.v);stack.pop();continue}const k=f.keys[f.i++];if(!f.arr)add(jsonStringBytes(k,maxBytes-bytes)+1);enter(f.v[k],f.d+1,f.arr)}
 return bytes;
}
// Same alphabet/length/padding grammar as the previous regex. Hash verification
// still validates decoded bytes; no Buffer allocation is needed for this scan.
function base64ByteLength(s){if(typeof s!=='string'||s.length%4!==0)return -1;let end=s.length;if(end&&s.charCodeAt(end-1)===61)end--;if(end&&s.charCodeAt(end-1)===61)end--;for(let i=0;i<end;i++){const c=s.charCodeAt(i);if(!((c>=65&&c<=90)||(c>=97&&c<=122)||(c>=48&&c<=57)||c===43||c===47))return -1}return s.length/4*3-(s.length-end)}
module.exports={validateTree,jsonStringBytes,base64ByteLength,MAX_REQUEST_BYTES,MAX_TREE_DEPTH};

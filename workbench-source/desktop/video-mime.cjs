 'use strict';
// RFC token / quoted-string syntax; no content sniffing, MIME list, CRLF or octet-stream admission.
function isMP4(value){
 if(typeof value!=='string'||value.length>1024||/[^\x09\x20-\x7e]/.test(value))return false;
 const token="[!#$%&'*+.^_`|~0-9A-Za-z-]+",quoted='"(?:[\\x09\\x20-\\x21\\x23-\\x5b\\x5d-\\x7e]|\\\\[\\x09\\x20-\\x7e])*"';
 return new RegExp('^[ \\t]*video/mp4[ \\t]*(?:;[ \\t]*'+token+'[ \\t]*=[ \\t]*(?:'+token+'|'+quoted+')[ \\t]*)*$','i').test(value);
}
module.exports=Object.freeze({isMP4});

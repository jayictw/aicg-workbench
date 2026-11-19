'use strict';
const {contextBridge,ipcRenderer}=require('electron');let nonce=null,gesture=null;
document.addEventListener('click',e=>{gesture=e.isTrusted&&e.target?.closest?.('button#submit')&&!e.target.closest('button#submit').disabled?performance.now():null;},true);
document.addEventListener('keydown',e=>{gesture=e.isTrusted&&!e.repeat&&e.key==='Enter'&&e.target?.closest?.('form#account-form')?performance.now():null;},true);
contextBridge.exposeInMainWorld('accountAPI',Object.freeze({
 ready:async()=>{const r=await ipcRenderer.invoke('c4-account:ready');if(r.ok){nonce=r.value.nonce;return {ok:true,value:{state:r.value.state}};}return r;},
 connect:request=>{const at=gesture;gesture=null;if(at===null||performance.now()-at<0||performance.now()-at>2000||!nonce||!request||Object.keys(request).sort().join(',')!=='metadata,secret')return Promise.resolve({ok:false,code:'LIVE_INPUT_GESTURE_REQUIRED'});return ipcRenderer.invoke('c4-account:connect',{secret:request.secret,metadata:request.metadata,nonce});},
 cancel:()=>ipcRenderer.invoke('c4-account:cancel'),
 onState:fn=>{const listener=(_e,v)=>fn(v);ipcRenderer.on('c4-account:state',listener);return()=>ipcRenderer.removeListener('c4-account:state',listener);}
}));

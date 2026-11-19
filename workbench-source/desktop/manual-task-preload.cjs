'use strict';
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('manualTasks',Object.freeze({stop:()=>ipcRenderer.invoke('manual:stop',{}),list:()=>ipcRenderer.invoke('manual:list',{}),preview:(id)=>ipcRenderer.invoke('manual:preview',{id}),send:(id,previewDigest,consent=false)=>ipcRenderer.invoke('manual:send',{id,previewDigest,consent})}));

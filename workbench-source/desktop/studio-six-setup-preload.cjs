'use strict';
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('unifiedKeys',Object.freeze(Object.fromEntries(['open','status','begin','input','receipt'].map(m=>[m,r=>ipcRenderer.invoke('uk:'+m,r)]))));
contextBridge.exposeInMainWorld('sixRun',Object.freeze({info:()=>ipcRenderer.invoke('six:info',{}),execute:()=>ipcRenderer.invoke('six:execute',{})}));

const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('fakeInput',Object.freeze({context:r=>ipcRenderer.invoke('uk-input:context',r),issue:r=>ipcRenderer.invoke('uk-input:issue',r),submit:r=>ipcRenderer.invoke('uk-input:submit',r),cancel:r=>ipcRenderer.invoke('uk-input:cancel',r)}));

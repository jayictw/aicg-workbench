'use strict';
const {app,dialog}=require('electron');
try{require('./seedance-recovery-entry.cjs').start()}catch{app.whenReady().then(()=>{dialog.showMessageBoxSync({type:'info',title:'原影片单次查询待批准',message:'需要绑定本修订指纹、原 profile、原 attempt 与 Task ID 的一次 GET 明确批准。未发官方请求，不会生成、自动轮询或下载。'});app.exit(2)})}

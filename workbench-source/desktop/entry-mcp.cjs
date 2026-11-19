'use strict';
const fs=require('node:fs'),path=require('node:path'),{app}=require('electron'),config=require('../integration-build.json');
if(process.argv.slice(2).length||path.resolve(config.codeRoot)!==path.resolve(__dirname,'..'))throw Error('MCP_FIXED_ENTRY');
const paths=require('./runtime-paths.cjs').descriptor('mcp-qa');for(const k of ['runtimeRoot','librariesRoot','backupsRoot','tmpRoot','initRoot','evidenceRoot','logRoot','profileRoot','sessionRoot','crashRoot'])fs.mkdirSync(paths[k],{recursive:true});
// Only the existing ledger authority is constructed; no Vault/Service/provider factory.
const ledger=new(require('./uk-ledger.cjs').Ledger)(paths.profileRoot);
const ec=require('./entry-context.cjs'),launch=ec.brand(Object.freeze({paths,ready:Promise.resolve(),mcp:true,provider:false,ledger,close(){ledger.close()}}));ec.install(launch);require('./main.cjs');
app.on('browser-window-created',(_e,w)=>{w.webContents.once('did-finish-load',()=>{if(w.webContents.getURL().startsWith('acs-app:')){w.show();setTimeout(async()=>{if(w.isDestroyed())return;fs.writeFileSync(path.join(paths.evidenceRoot,'EXACT-LAUNCHER.json'),JSON.stringify({status:'VISIBLE',pid:process.pid,buildId:paths.buildId,mode:paths.mode,profileRoot:paths.profileRoot,testHooks:paths.testHooks,provider:false,mcpClientInitiallyConnected:false,officialRequests:require('./uk-network.cjs').stats.officialRequests},null,2));fs.writeFileSync(path.join(paths.evidenceRoot,'EXACT-LAUNCHER.png'),(await w.webContents.capturePage()).toPNG())},300).unref()}})});

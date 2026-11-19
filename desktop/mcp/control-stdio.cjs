'use strict';
// Fixed-purpose child selected only by an authenticated app-control invitation.
const {runStdio}=require('./stdio.cjs'),{internalTools,validate}=require('./app-contracts.cjs');
runStdio({tools:internalTools,validate,serverInfo:{name:'aicg-workbench-control',version:'1.0.0'},instructions:'Authenticated local application control only. This connection has no canvas authority, provider, Key, file or save access. Internal session claim binds the OS-verified native frontend to an explicitly rendered project. Unknown writes require their receipt and a fresh application status; never replay a create/open/claim on transport failure.'});

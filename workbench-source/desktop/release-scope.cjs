'use strict';
const scope=require('../src/product-scope.json');
const service=id=>scope.services.includes(id),model=id=>scope.models.includes(id);
function assertService(id){if(!service(id))throw Object.assign(Error('UK_VERSION_UNAVAILABLE'),{code:'UK_VERSION_UNAVAILABLE'})}
function assertModel(id){if(!model(id))throw Object.assign(Error('UK_VERSION_UNAVAILABLE'),{code:'UK_VERSION_UNAVAILABLE'})}
module.exports=Object.freeze({service,model,assertService,assertModel});

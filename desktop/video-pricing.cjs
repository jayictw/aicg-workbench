'use strict';
// Compatibility readers receive unknown; never turn token usage into dollars.
function fromTokens(){return null;}
function quote(){return {publicEstimateMinor:null,estimateKind:'unknown',accountPrice:'unknown',actualCharge:'unknown'};}
module.exports={fromTokens,quote};

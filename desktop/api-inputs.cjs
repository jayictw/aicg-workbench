'use strict';
// Pure selection/role validation. No I/O, media processing, provider parameters
// or dispatch. The caller supplies a trusted, exact-route reference count rule.
const {freeze}=require('./live-policy.cjs');
const fail=code=>({ok:false,code});
const rolesByMode=Object.freeze({
 TEXT_TO_IMAGE:[],TEXT_TO_VIDEO:[],FIRST_FRAME:['FIRST_FRAME'],
 FIRST_LAST_FRAME:['FIRST_FRAME','LAST_FRAME'],
 MULTI_REFERENCE:['REFERENCE'],IMAGE_REFERENCE:['REFERENCE']
});
const record=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
function prepareInputSelection(input,contract){
 if(!record(input)||!Object.hasOwn(rolesByMode,input.mode))return fail('MODE_CONFLICT');
 // Do not silently discard legacy hidden selections or a second mode field.
 if(Object.keys(input).some(k=>!['mode','prompt','localAssets','selectedImages'].includes(k)))return fail('MODE_CONFLICT');
 if(typeof input.prompt!=='string'||!Array.isArray(input.localAssets)||!Array.isArray(input.selectedImages))return fail('ROLE_CARDINALITY');
 const {mode,prompt,selectedImages,localAssets}=input,allowed=rolesByMode[mode];
 for(const s of selectedImages){
  if(!record(s)||typeof s.assetId!=='string'||!s.assetId||typeof s.role!=='string'||!s.role)return fail('ROLE_CARDINALITY');
  if(Object.keys(s).some(k=>!['assetId','role'].includes(k))||!allowed.includes(s.role))return fail('MODE_CONFLICT');
 }
 const count=selectedImages.length;
 if(allowed.length===0&&count!==0)return fail('MODE_CONFLICT');
 if(mode==='FIRST_FRAME'&&count!==1)return fail('ROLE_CARDINALITY');
 if(mode==='FIRST_LAST_FRAME'){
  if(count!==2||allowed.some(role=>selectedImages.filter(s=>s.role===role).length!==1))return fail('ROLE_CARDINALITY');
  if(selectedImages[0].assetId===selectedImages[1].assetId&&contract?.allowSameAssetFirstLast!==true)return fail('MODE_CONFLICT');
 }
 if(mode==='MULTI_REFERENCE'||mode==='IMAGE_REFERENCE'){
  if(!record(contract)||!Number.isInteger(contract.minImages)||!Number.isInteger(contract.maxImages)||contract.minImages<1||contract.maxImages<contract.minImages)return fail('INPUT_CONTRACT_UNKNOWN');
  if(count<contract.minImages||count>contract.maxImages||new Set(selectedImages.map(s=>s.assetId)).size!==count)return fail('ROLE_CARDINALITY');
 }
 // First/last order is role-defined. Reference order is the explicit selection
 // array order. Prompt wording and local connection order never assign roles.
 const ordered=mode==='FIRST_LAST_FRAME'?allowed.map(role=>selectedImages.find(s=>s.role===role)):selectedImages;
 const images=[];
 for(const [sequenceIndex,s]of ordered.entries()){
  const matches=localAssets.filter(a=>record(a)&&a.assetId===s.assetId);
  if(matches.length!==1||typeof matches[0].url!=='string'||!matches[0].url)return fail('INPUT_REFERENCE_MISSING');
  images.push({assetId:s.assetId,role:s.role,url:matches[0].url,sequenceIndex});
 }
 return freeze({ok:true,mode,prompt,images});
}
module.exports={prepareInputSelection};

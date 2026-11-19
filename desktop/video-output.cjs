'use strict';
// BytePlus ModelArk create-video-generation-task-api, Seedance 2.0 480p table.
const table=[{ratio:16/9,width:864,height:496},{ratio:4/3,width:752,height:560},{ratio:1,width:640,height:640},{ratio:3/4,width:560,height:752},{ratio:9/16,width:496,height:864},{ratio:21/9,width:992,height:432}];
function candidates(plan){const f=plan.frames[0],ratio=f.width/f.height,known=table.find(d=>Math.abs(Math.log(d.ratio/ratio))<.005);return known?[known]:table;}
function fixture(plan){const f=plan.frames[0],ratio=f.width/f.height;return [...table].sort((a,b)=>Math.abs(Math.log(a.ratio/ratio))-Math.abs(Math.log(b.ratio/ratio)))[0];}
function valid(meta,plan){return candidates(plan).some(d=>meta.width===d.width&&meta.height===d.height);}
module.exports={table,candidates,fixture,valid};

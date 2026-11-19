'use strict';
const {error}=require('./media.cjs');
// Shared asynchronous-generation dispatch contract. Fast timings are synthetic-only.
const ASYNC_GENERATION_POLICY=Object.freeze({maxQueries:60,intervalMs:60000,windowMs:3600000,initialDelayMs:60000});
function policy(environment){return environment==='provider-live'?{...ASYNC_GENERATION_POLICY}:{maxQueries:8,intervalMs:80,windowMs:60000,initialDelayMs:0};}
function session(id,now,p){return {id,startedAt:now,deadlineAt:now+p.windowMs,nextQueryAt:now+p.initialDelayMs,queries:0,lastQueryAt:null};}
function valid(s){return s&&typeof s.id==='string'&&/^[-A-Za-z0-9]{1,100}$/.test(s.id)&&['startedAt','deadlineAt','nextQueryAt'].every(k=>Number.isSafeInteger(s[k])&&s[k]>=0)&&s.deadlineAt>=s.startedAt&&Number.isSafeInteger(s.queries)&&s.queries>=0&&s.queries<=60&&(s.lastQueryAt===null||Number.isSafeInteger(s.lastQueryAt)&&s.lastQueryAt>=s.startedAt);}
async function wait(milliseconds,{stopped,clock=Date.now,expiresAt=Infinity}){const until=performance.now()+milliseconds;while(performance.now()<until){if(stopped())return false;if(clock()>=expiresAt)throw error('VIDEO_BATCH_EXPIRED','Video batch observation authority expired');await new Promise(resolve=>setTimeout(resolve,Math.min(250,until-performance.now(),Math.max(1,expiresAt-clock()))));}if(stopped())return false;if(clock()>=expiresAt)throw error('VIDEO_BATCH_EXPIRED','Video batch observation authority expired');return true;}
async function next(s,p,{clock=Date.now,expiresAt=Infinity,stopped=()=>false,wait:pause=wait,reserveResponseMs=0}={}){
 if(!valid(s))throw error('VIDEO_OBSERVATION_INVALID','原任務觀察段資料無法核對；禁止重置');
 if(stopped()||s.queries>=p.maxQueries||clock()>=s.deadlineAt)return false;
 const finishWindow=async()=>{while(clock()<s.deadlineAt){if(stopped()||!await pause(Math.min(60000,s.deadlineAt-clock()),{clock,expiresAt,stopped}))return false;}return false;};
 if(s.nextQueryAt>=s.deadlineAt-reserveResponseMs)return finishWindow();
 const due=s.nextQueryAt;
 if(due>clock()&&!await pause(due-clock(),{clock,expiresAt,stopped}))return false;
 if(stopped())return false;
 if(clock()>=s.deadlineAt-reserveResponseMs)return finishWindow();
 if(clock()>=expiresAt)throw error('VIDEO_BATCH_EXPIRED','Video batch observation authority expired');
 if(clock()<due)throw error('VIDEO_OBSERVATION_EARLY','查詢等待未完成；未發送請求');
 s.queries++;s.lastQueryAt=clock();s.nextQueryAt=s.lastQueryAt+p.intervalMs;
 return true;
}
module.exports={ASYNC_GENERATION_POLICY,policy,session,valid,next,wait};

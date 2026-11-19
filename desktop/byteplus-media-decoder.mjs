// Versioned BytePlus-only decoder. Input is bytes, never a caller media path.
// Pinned existing tools, forced demuxer and pipe-only input; no temporary file,
// external URL, derivative file, rescale, transcode, repository or publication.
import {createHash} from 'node:crypto';
import {readFileSync,statSync,realpathSync} from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
const sha=b=>createHash('sha256').update(b).digest('hex');
function error(code){return Object.assign(Error('BytePlus media decode rejected; original bytes retained by caller.'),{code});}
function reject(code){throw error(code);}
function tool(value,expected){
 if(typeof value!=='string'||!path.isAbsolute(value)||!/^[a-f0-9]{64}$/.test(expected??''))reject('BP_DECODE_CONFIG');
 let resolved,stat;try{resolved=realpathSync(value);stat=statSync(resolved);if(!stat.isFile()||sha(readFileSync(resolved))!==expected)reject('BP_DECODE_CONFIG');}catch{reject('BP_DECODE_CONFIG');}
 return {path:resolved,size:stat.size,mtimeMs:stat.mtimeMs,ctimeMs:stat.ctimeMs};
}
function signature(b){
 if(b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return ['image/png','png_pipe','png'];
 if(b[0]===255&&b[1]===216&&b[2]===255)return ['image/jpeg','jpeg_pipe','mjpeg'];
 if(b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP')return ['image/webp','webp_pipe','webp'];
 if(b.toString('ascii',4,8)==='ftyp'){
  const brand=b.toString('ascii',8,12);if(brand==='qt  ')return ['video/quicktime','mov'];
  if(['isom','iso2','iso4','iso5','iso6','mp41','mp42','avc1','hvc1','M4V '].includes(brand))return ['video/mp4','mov'];
 }
 if(b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WAVE')return ['audio/wav','wav'];
 if(b.toString('ascii',0,3)==='ID3'||b[0]===255&&(b[1]&224)===224)return ['audio/mpeg','mp3'];
 reject('BP_DECODE_SIGNATURE');
}
export function createBytePlusMediaDecoder({ffmpegPath,ffprobePath,ffmpegSha256,ffprobeSha256,timeoutMs=30000}={}){
 if(!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>30000)reject('BP_DECODE_CONFIG');
 const ffmpeg=tool(ffmpegPath,ffmpegSha256),ffprobe=tool(ffprobePath,ffprobeSha256);
 function run(binary,args,bytes,signal){
  return new Promise((resolve,rejectRun)=>{
   let current;try{current=statSync(binary.path);}catch{return rejectRun(error('BP_DECODE_CONFIG'));}
   if(current.size!==binary.size||current.mtimeMs!==binary.mtimeMs||current.ctimeMs!==binary.ctimeMs)return rejectRun(error('BP_DECODE_CONFIG'));
   if(signal?.aborted)return rejectRun(error('BP_DECODE_CANCELLED'));
   let p;try{p=spawn(binary.path,args,{windowsHide:true,stdio:['pipe','pipe','pipe'],shell:false});}catch{return rejectRun(error('BP_DECODE_UNAVAILABLE'));}
   let output='',diagnostic=false,failure=null;
   const stop=code=>{failure??=code;p.kill();};
   const abort=()=>stop('BP_DECODE_CANCELLED');signal?.addEventListener('abort',abort,{once:true});
   const timer=setTimeout(()=>stop('BP_DECODE_TIMEOUT'),timeoutMs);
   p.stdout.on('data',b=>{output+=b.toString('utf8');if(output.length>1048576)stop('BP_DECODE_OUTPUT_LIMIT');});
   // At -v error, any decoder error is fatal, even on tools returning exit 0.
   p.stderr.on('data',b=>{if(b.length)diagnostic=true;});
   p.stdin.on('error',()=>{});
   p.on('error',()=>{failure??='BP_DECODE_UNAVAILABLE';});
   p.on('close',code=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);if(failure||code!==0||diagnostic)rejectRun(error(failure??'BP_DECODE_INVALID'));else resolve(output);});
   p.stdin.end(bytes);
  });
 }
 return async function decodeBytePlusMedia(value,{signal}={}){
  if(!(value instanceof Uint8Array)||value.length===0||value.length>200000000)reject('BP_DECODE_BYTES');
  const bytes=Buffer.from(value),contentSha256=sha(bytes),[mimeType,demuxer,imageCodec]=signature(bytes),image=mimeType.startsWith('image/'),video=mimeType.startsWith('video/');
  const input=['-protocol_whitelist','pipe','-format_whitelist',demuxer,'-f',demuxer,'-i','pipe:0'];
  let probe;try{probe=JSON.parse(await run(ffprobe,['-v','error','-max_alloc','268435456',...input,'-show_streams','-show_format','-of','json'],bytes,signal));}catch(e){throw error(e?.code?.startsWith('BP_DECODE_')?e.code:'BP_DECODE_INVALID');}
  const streams=probe.streams??[],v=streams.filter(s=>s.codec_type==='video'),a=streams.filter(s=>s.codec_type==='audio');let metadata={};
  if(image||video){
   const s=v[0];if(v.length!==1||!s||!Number.isSafeInteger(s.width)||!Number.isSafeInteger(s.height)||s.width<1||s.height<1||s.width>100000||s.height>100000||s.width*s.height>36000000)reject('BP_DECODE_GEOMETRY');
   if(image&&(a.length||streams.length!==1||s.codec_name!==imageCodec))reject('BP_DECODE_CODEC');
   if(video&&(a.length>1||streams.length!==v.length+a.length||!['h264','hevc'].includes(s.codec_name)||!(s.codec_name==='h264'?['yuv420p','yuvj420p','yuv444p','yuvj444p']:['yuv420p','yuv420p10le']).includes(s.pix_fmt)||a.some(s=>!(mimeType==='video/quicktime'?['aac','mp3','pcm_s16le','pcm_s24le']:['aac','mp3']).includes(s.codec_name))))reject('BP_DECODE_CODEC');
   metadata={width:s.width,height:s.height,codec:s.codec_name,pixelFormat:s.pix_fmt,bitDepth:/10/.test(s.pix_fmt)?10:/16/.test(s.pix_fmt)?16:8,hasAlpha:/^(?:rgba|bgra|argb|abgr|ya\d|yuva|gbrap)/.test(s.pix_fmt)};
   if(video){const [n,d]=String(s.avg_frame_rate??'0/1').split('/').map(Number),fps=n/d;if(!Number.isFinite(fps)||fps<=0||fps>60)reject('BP_DECODE_GEOMETRY');metadata.fps=fps;metadata.audioCodec=a[0]?.codec_name??null;}
  }else if(v.length||a.length!==1||streams.length!==1||!(mimeType==='audio/wav'?['pcm_s16le','pcm_s24le']:['mp3']).includes(a[0]?.codec_name)||a[0].channels>2||Number(a[0].sample_rate)<8000||Number(a[0].sample_rate)>48000)reject('BP_DECODE_CODEC');
  else metadata={codec:a[0].codec_name,channels:a[0].channels,sampleRate:Number(a[0].sample_rate),hasAlpha:false,bitDepth:mimeType==='audio/wav'&&a[0].codec_name==='pcm_s24le'?24:mimeType==='audio/wav'?16:null};
  const progress=await run(ffmpeg,['-v','error','-xerror','-err_detect','explode','-max_alloc','268435456','-threads','2',...input,'-map','0:v?','-map','0:a?','-progress','pipe:1','-nostats','-f','null','-'],bytes,signal);
  if(!progress.includes('progress=end'))reject('BP_DECODE_INVALID');
  if(image){const frames=[...progress.matchAll(/^frame=(\d+)$/gm)];if(Number(frames.at(-1)?.[1])!==1)reject('BP_DECODE_ANIMATION');}
  else {const times=[...progress.matchAll(/^out_time_us=(\d+)$/gm)],durationMs=Math.round(Number(times.at(-1)?.[1])/1000);if(!Number.isSafeInteger(durationMs)||durationMs<=0||durationMs>120000)reject('BP_DECODE_GEOMETRY');metadata.durationMs=durationMs;}
  return Object.freeze({capability:'byteplus.media-decoder',capabilityVersion:1,fullyDecoded:true,mimeType,byteSize:bytes.length,contentSha256,...metadata,originalBytesPreserved:true,transcoded:false});
 };
}

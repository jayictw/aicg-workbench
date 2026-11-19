export function describeCanvasChange(value,graph,diff=[],side='after',display=s=>s){
 const mediaFor=id=>diff.find(d=>d.key==='mediaVersions'&&d.id===id)?.[side]??graph.mediaVersions[id];
 const edit=value?.payload?.edit??value?.edit;
 if(!edit){const media=value?.media;if(media)return `${display('來源媒體：')}${display(media.type)} · ${media.name??''}\n${display('固定版本：')}${value.payload?.mediaVersionId??''}\nSHA256 ${media.sha256}`;return value?.text||'—';}
 const line=(c,i,audio)=>{const source=graph.nodes.find(n=>n.id===c.nodeId),m=mediaFor(c.mediaRef.mediaVersionId);return `${display(audio?'音軌':'片段')} ${i+1} · ${c.label}\n${display('來源：')}${source?.humanCode??c.nodeId} · ${source?.label??display('已不在目前畫布')}\n${display('固定版本：')}${c.mediaRef.mediaVersionId}${m?' · SHA '+m.sha256:''}\n${display('裁切：')}${(c.inMs/1000).toFixed(3)} → ${(c.outMs/1000).toFixed(3)} ${display('秒')}${audio?' '+display('· 入場')+' '+(c.atMs/1000).toFixed(3)+' '+display('秒'):''}\n${display('音量：')}${Math.round(c.volume*100)}% · ${display(c.muted?'靜音':'未靜音')}`;};
 return `${display('輸出：')}${edit.width}×${edit.height}／${edit.fps}fps\n\n`+edit.clips.map((c,i)=>line(c,i,false)).join('\n\n')+'\n\n'+(edit.audio.length?edit.audio.map((c,i)=>line(c,i,true)).join('\n\n'):display('沒有額外音軌'));
}

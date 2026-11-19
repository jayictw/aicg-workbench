export const ACTIONS=Object.freeze([
 {id:'undo',label:'撤銷最近畫布編輯',binding:'Ctrl+Z'},
 {id:'redo',label:'重做最近撤銷',binding:'Ctrl+Shift+Z'},
 {id:'clone',label:'複製所選框',binding:'Ctrl+D',help:'不複製成片；集合外輸入不自動複製'},
 {id:'remove',label:'移除所選框／連線',binding:'Delete',help:'原媒體保留、可撤銷；成片播放線在編排中調整'},
 {id:'search',label:'搜尋畫布節點',binding:'Ctrl+F'},
 {id:'newImage',label:'新建圖片任務框',binding:'I'},
 {id:'newVideo',label:'新建影片任務框',binding:'V'},
 {id:'newText',label:'新建文字框',binding:'T'},
 {id:'editPrompt',label:'編輯所選任務提示詞',binding:'P',help:'只在選中一個圖片／影片任務時可用'},
 {id:'zoomIn',label:'放大畫布',binding:'='},
 {id:'zoomOut',label:'縮小畫布',binding:'-'},
 {id:'fit',label:'適應全部節點',binding:'F'},
 {id:'resetZoom',label:'畫布縮放至100%',binding:'0'},
 {id:'save',label:'手動保存工程',binding:'Ctrl+S',help:'只有畫布有焦點且無未套用草稿時執行'},
]);
export const defaults=()=>Object.fromEntries(ACTIONS.map(a=>[a.id,a.binding]));
export const disabled=()=>Object.fromEntries(ACTIONS.map(a=>[a.id,null]));
const known=new Set(ACTIONS.map(a=>a.id)),mods=['Ctrl','Alt','Shift','Win'];
const err=(code,message,extra={})=>Object.assign(new Error(message),{code,...extra});
export function parseChord(value){
 if(typeof value!=='string'||value.length>40||!value.length)throw err('SHORTCUT_FORMAT','請錄入一組有效按鍵');
 const parts=value.split('+'),key=parts.pop(),ms=parts;
 if(ms.some(m=>!mods.includes(m))||new Set(ms).size!==ms.length||!key)throw err('SHORTCUT_FORMAT','按鍵格式無效');
 return {key,ctrl:ms.includes('Ctrl'),alt:ms.includes('Alt'),shift:ms.includes('Shift'),meta:ms.includes('Win'),canonical:[...mods.filter(m=>ms.includes(m)),key].join('+')};
}
export function validateChord(value,platform='win32'){
 if(platform!=='win32')throw err('SHORTCUT_PLATFORM','此候選只支援 Windows；不將 Cmd 假當 Ctrl');
 const p=parseChord(value),k=p.key,c=p.ctrl;
 if(p.alt||p.meta)throw err('SHORTCUT_RESERVED','本版不綁 Alt／Win 或 Ctrl+Alt 組合，保留系統與輸入法操作');
 if(p.shift&&!c&&k==='Delete')throw err('SHORTCUT_RESERVED','Shift+Delete 保留給系統／剪貼簿操作；畫布移除預設為 Delete');
 if(!/^(?:[A-Z0-9]|Delete|=|-|\/|F2|F4|F7|F8|F9)$/.test(k))throw err('SHORTCUT_RESERVED','此鍵保留給輸入、導覽或系統；可用字母、數字、Delete、=、-、/、F2/F4/F7/F8/F9');
 if(c&&(['A','C','X','V','L','R','W','Q','N','T','O','P'].includes(k)||['=','-','0','/'].includes(k)))throw err('SHORTCUT_RESERVED','此組合保留給剪貼簿、視窗或瀏覽器操作，請換一組');
 if(c&&p.shift&&['I','J','C','Escape'].includes(k))throw err('SHORTCUT_RESERVED','此組合保留給開發工具或系統，請換一組');
 return p.canonical;
}
export function chordFromEvent(e){
 if(e.isComposing||e.keyCode===229||['Process','Dead','Unidentified'].includes(e.key))throw err('SHORTCUT_IME','輸入法組字中，不錄入或執行快捷鍵');
 if(e.getModifierState?.('AltGraph'))throw err('SHORTCUT_RESERVED','AltGr 保留給文字輸入');
 if(['Control','Shift','Alt','Meta','OS'].includes(e.key))return null;
 let key=e.key;if(/^Digit[0-9]$/.test(e.code??''))key=e.code.slice(-1);else if(/^Numpad[0-9]$/.test(e.code??'')&&/^[0-9]$/.test(key))key=e.code.slice(-1);else if(e.code==='Equal'||e.code==='NumpadAdd'||key==='+')key='=';else if(e.code==='Minus'||e.code==='NumpadSubtract')key='-';else if(e.code==='Slash')key='/';else if(/^[a-z]$/i.test(key))key=key.toUpperCase();
 return [e.ctrlKey?'Ctrl':null,e.altKey?'Alt':null,e.shiftKey?'Shift':null,e.metaKey?'Win':null,key].filter(Boolean).join('+');
}
export function validateBindings(bindings,platform='win32'){
 if(!bindings||typeof bindings!=='object'||Array.isArray(bindings)||Object.keys(bindings).length!==ACTIONS.length||Object.keys(bindings).some(k=>!known.has(k)))throw err('SHORTCUT_SCHEMA','快捷操作清單不完整或含未知操作');
 const next={},used=new Map();for(const a of ACTIONS){const v=bindings[a.id];if(v===null){next[a.id]=null;continue;}const chord=validateChord(v,platform);if(used.has(chord)){const other=used.get(chord);throw err('SHORTCUT_CONFLICT',chord+' 已用於「'+ACTIONS.find(a=>a.id===other).label+'」，請更換或明確停用該操作',{actionId:a.id,otherActionId:other,chord});}used.set(chord,a.id);next[a.id]=chord;}return next;
}
export function changeBinding(bindings,id,binding){
 if(!known.has(id))throw err('SHORTCUT_ACTION','未知快捷操作');
 const current=validateBindings(bindings),chord=binding===null?null:validateChord(binding);
 const other=chord===null?null:ACTIONS.find(a=>a.id!==id&&current[a.id]===chord);
 if(other)throw err('SHORTCUT_CONFLICT',chord+' 已用於「'+other.label+'」，請更換或明確停用該操作',{actionId:id,otherActionId:other.id,chord});
 return validateBindings({...current,[id]:chord});
}
export const displayBinding=value=>value===null?'已停用':value??'未設定';
export function shortcutContextAllowed(e,ctx){
 if(ctx.blocked||e.defaultPrevented||e.isComposing||e.keyCode===229)return false;
 const path=e.composedPath?.()??[e.target];
 for(const el of path){if(!el?.closest)continue;if(el.isContentEditable||el.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"],video,audio,.card-video,dialog,[role="menu"],.inline-prompt,.provided-images'))return false;}
 const target=path.find(el=>el?.closest);return !!target?.closest('[data-shortcut-scope="canvas"]');
}
export function actionForEvent(e,bindings,context){if(!shortcutContextAllowed(e,context))return null;let chord;try{chord=validateChord(chordFromEvent(e));}catch{return null;}return ACTIONS.find(a=>bindings[a.id]===chord)?.id??null;}

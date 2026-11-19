export type StudioMode='C'|'B'|'A'|'BASE'
export type StudioInput={version:1;mode:StudioMode;chosen:boolean;sourceJson:string|null;automaticText:string;adoptedText:string;outputId:string|null;referenceSha256:string|null}
export const modeNames:Record<StudioMode,string>={C:'图片＋补充文字',B:'只用摄影棚图片',A:'只用补充文字',BASE:'不用摄影棚'}
export const referencePurpose='参考图用于构图、静态姿势与空间关系；人物身份和材质由原始创意决定。'
/** The one text assembler used by editing preview, native confirmation and transport validation. */
export function dailyText(original:string,adopted:string,mode:StudioMode){return [original,...(['A','C'].includes(mode)?[adopted]:[]),...(['B','C'].includes(mode)?[referencePurpose]:[])].filter(x=>x.trim()).join('\n\n')}
export function adoptSnapshot(old:StudioInput|undefined,sourceJson:string,automaticText:string,outputId:string,referenceSha256:string,keep:boolean):StudioInput{return {version:1,mode:old?.chosen?old.mode:'B',chosen:old?.chosen||false,sourceJson,automaticText,adoptedText:keep&&old?old.adoptedText:automaticText,outputId,referenceSha256}}

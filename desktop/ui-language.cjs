'use strict';
const {translate}=require('../shared/ui-locale.mjs'),{nativeMessageKeys}=require('../shared/ui-native-keys.mjs');
class UiLanguage{
 constructor(){this.language='zh-CN';this.text=this.text.bind(this);}
 set(r){if(!r||typeof r!=='object'||Array.isArray(r)||Object.keys(r).join(',')!=='language'||!['zh-CN','en'].includes(r.language))throw Object.assign(Error('Unsupported UI language'),{code:'UI_LOCALE'});this.language=r.language;return {language:this.language};}
 text(raw){if(typeof raw!=='string')return raw;const key=raw.replace(/\s+/g,' ').trim(),leading=raw.match(/^\s*/)[0],trailing=raw.match(/\s*$/)[0];return leading+translate(this.language,key)+trailing;}
 native(){return {language:this.language,messages:Object.fromEntries(nativeMessageKeys.map(k=>[k,translate(this.language,k)]))};}
}
module.exports={UiLanguage};

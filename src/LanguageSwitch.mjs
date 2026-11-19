import React,{useEffect,useState} from 'react';
import {localeStore,ui,useUiLocale} from '../shared/ui-locale.mjs';
export function LanguageSwitch(){
 const language=useUiLocale(React),[issue,setIssue]=useState(false),[nativeIssue,setNativeIssue]=useState(false);
 useEffect(()=>{let current=true;const sync=window.canvasAPI?.uiLanguage;if(sync)Promise.resolve(sync({language})).then(r=>{if(current)setNativeIssue(!r?.ok);}).catch(()=>{if(current)setNativeIssue(true);});return()=>{current=false;};},[language]);
 return React.createElement('span',{className:'ui-language'},
  React.createElement('label',null,React.createElement('span',null,ui('Language')),React.createElement('select',{'aria-label':ui('Interface language'),value:language,onChange:e=>{const result=localeStore.setLanguage(e.target.value);setIssue(!result.persisted);}},React.createElement('option',{value:'zh-CN'},'简体中文'),React.createElement('option',{value:'en'},'English'))),
  (issue||localeStore.getPersistenceState()===false)&&React.createElement('small',{role:'status'},ui('Language preference could not be saved. It applies to this session only.')),
  nativeIssue&&React.createElement('small',{role:'status'},ui('Native dialogs could not switch language. Current input is preserved.')));
}

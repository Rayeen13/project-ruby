import {TEXT_LANGUAGES,voicePackFor} from './languages.9cf4439c01af.js';
export function mountVoiceSettings({document,state,identity,onChange,modelsFor,engines}){
 const el=id=>document.getElementById(id),tauri=globalThis.__TAURI__;
 const options=(select,items)=>{select.replaceChildren();for(const [value,label] of items){const o=document.createElement('option');o.value=value;o.textContent=label;select.append(o);}};
 options(el('text-language'),TEXT_LANGUAGES.map(l=>[l.id,l.name]));el('text-language').value=state.data.textLanguage;
 options(el('voice-language'),[['en','English'],['ja','日本語 · Japanese'],['zh','中文 · Chinese']]);el('voice-language').value=state.data.voiceLanguage;
 options(el('langm-engine'),[['same','Use my selected local LLM · no extra download'],...engines.map(e=>[e.id,e.name])]);
 if(![...el('langm-engine').options].some(o=>o.value===state.data.langm.engine))state.data.langm.engine='same';
 el('langm-engine').value=state.data.langm.engine;el('voice-license').checked=state.data.supertonicTerms;
 function render(){
  const language=state.data.voiceLanguage;
  options(el('voice-engine'),language==='en'?[['kokoro','Natural · Kokoro'],['supertonic3','Original character collection · Supertonic 3']]:language==='ja'?[['supertonic3','Original Japanese character collection · Supertonic 3']]:[['kokoro','Chinese collection · Kokoro']]);
  el('voice-engine').value=voicePackFor(identity());state.data.voiceEngine=el('voice-engine').value;
  const pack=voicePackFor(identity());el('voice-license-row').hidden=pack!=='supertonic3';
  el('voice-pack-note').textContent=pack==='supertonic3'?'Original character presets for Japanese or English. About 154 MB including runtime, shared across all voices. Model: OpenRAIL-M; commercial use subject to its terms. No paid API.':'Kokoro English/Chinese share one pack. About 316 MB on first install; switching language reuses the same files. Apache-2.0 model; bundled component notices retained.';
  el('langm-custom').hidden=state.data.langm.engine==='same';
  el('langm-status').textContent=state.data.langm.engine==='same'?'LangM reuses your selected local LLM. Only the spoken line is translated; displayed chat stays in your text language. No separate model download. Translation quality depends on that model.':'Load a free multilingual model in your chosen local engine, then check the connection. No text is sent to a cloud translation service.';
 }
 const change=()=>{render();state.save();onChange();};
 el('text-language').onchange=()=>{state.data.textLanguage=el('text-language').value;change();};
 el('voice-language').onchange=()=>{state.data.voiceLanguage=el('voice-language').value;change();};
 el('voice-engine').onchange=()=>{state.data.voiceEngine=el('voice-engine').value;change();};
 el('voice-license').onchange=()=>{state.data.supertonicTerms=el('voice-license').checked;state.save();};
 el('langm-engine').onchange=()=>{state.data.langm={engine:el('langm-engine').value,model:''};el('langm-model').replaceChildren();change();};
 el('langm-model').onchange=()=>{state.data.langm.model=el('langm-model').value;state.save();onChange();};
 el('langm-connect').onclick=async()=>{
  el('langm-connect').disabled=true;el('langm-status').textContent='Checking local translation models…';
  try{const models=await modelsFor(state.data.langm.engine);options(el('langm-model'),models.map(m=>[m,m]));if(models.includes(state.data.langm.model))el('langm-model').value=state.data.langm.model;state.data.langm.model=el('langm-model').value;state.save();el('langm-status').textContent='Local LangM ready. Choose a multilingual model for Japanese/Chinese translation.';}
  catch(error){el('langm-status').textContent=String(error.message||error);}finally{el('langm-connect').disabled=false;}
 };
 el('voice-license-link').onclick=event=>{if(tauri){event.preventDefault();void tauri.core.invoke('open_web_url',{url:'https://huggingface.co/Supertone/supertonic-3/blob/main/LICENSE'}).catch(()=>{});}};
 if(state.data.langm.model)options(el('langm-model'),[[state.data.langm.model,state.data.langm.model]]);
 render();return {refresh:render};
}

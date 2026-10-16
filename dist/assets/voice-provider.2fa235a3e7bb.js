import {voicePackFor,needsTranslation} from './languages.2fa235a3e7bb.js';
import {mountVoiceSettings} from './voice-settings.2fa235a3e7bb.js';
import {voicesFor,defaultVoice,selectedVoice,voiceChoiceKey} from './voice-catalogue.2fa235a3e7bb.js';
import {OrderedSpeech,playSpeechBuffer} from './speech-queue.2fa235a3e7bb.js';
export function voiceStyle(identity){const gender=identity.gender==='male'?'male':'female';const tempo=identity.personality.voicePace||({calm:.9,focused:.96,playful:1.03,curious:1.0,sarcastic:.98}[identity.personality.id]||1);return {gender,pace:Math.max(.75,Math.min(1.5,tempo*(identity.bodyId==='chibi'?1.08:identity.bodyId==='office'?.96:1)))};}
export function mountVoice({document,state,identity,onSpeaking=()=>{},onCue=()=>{},translate,modelsFor,engines=[],onPreferences=()=>{}}){
 const el=id=>document.getElementById(id),tauri=globalThis.__TAURI__;let context=null,generation=0,download=false;
 const audioContext=()=>context??=new (globalThis.AudioContext||globalThis.webkitAudioContext)({latencyHint:'interactive'});
 const unlock=()=>{if(!tauri)return;try{void audioContext().resume().catch(()=>{});}catch{}};
 const queue=new OrderedSpeech({
  cancel:()=>tauri?tauri.core.invoke('voice_stop'):Promise.resolve(),
  synthesize:async(text,voice,signal)=>{let spoken=text;if(needsTranslation(text,voice.language,voice.textLanguage)){if(!translate)throw Error('Connect a local LangM for this voice language.');el('voice-status').textContent='Preparing '+({ja:'Japanese',zh:'Chinese',en:'English'}[voice.language])+' speech…';spoken=await translate(text,voice.language,{signal});}if(signal.aborted)throw new DOMException('Stopped','AbortError');return tauri.core.invoke('voice_synthesize',{text:spoken,gender:voice.gender,voice:voice.voice,pace:voice.pace,pack:voice.pack,language:voice.language});},
  play:(bytes,{signal,cue})=>playSpeechBuffer(audioContext(),bytes,{signal,pauseMs:cue?.pauseMs||0,onStart:()=>{if(cue)onCue(cue);onSpeaking(true);el('voice-status').textContent='Speaking · offline VoiceM';}})
 });
 function stop(){generation++;const stopped=queue.stop();onSpeaking(false);return stopped;}
 async function speak(text,{textLanguage}={}){
  const token=++generation,current=identity(),voice={...voiceStyle(current),pack:voicePackFor(current),language:current.voiceLanguage||'en',textLanguage:textLanguage||current.textLanguage||'auto',voice:selectedVoice(current,state.data.voiceChoices).id};unlock();
  try{
   const installed=tauri&&(await tauri.core.invoke('voice_pack_status',{pack:voice.pack})).installed;if(token!==generation)return;
   if(!installed)throw new Error(tauri?'Download this VoiceM pack first. Your Companion’s voice will then work offline.':'Matched VoiceM playback is available in the Windows app. Download the pack there and preview your Companion’s voice.');
   el('voice-status').textContent='Preparing the opening phrase…';await queue.speak(text,voice);
   if(token===generation){onSpeaking(false);el('voice-status').textContent='Ready · offline VoiceM';}
  }catch(error){if(token===generation){await queue.stop();if(token!==generation)return;onSpeaking(false);el('voice-status').textContent=String(error.message||error);}}
 }
 el('voice-enabled').checked=state.data.speak;el('voice-enabled').onchange=()=>{state.data.speak=el('voice-enabled').checked;state.save();if(!state.data.speak)void stop();else unlock();};
 function refreshSelection(){
  const current=identity(),select=el('voice-select');select.replaceChildren();
  const option=document.createElement('option');option.value='auto';option.textContent='Match '+current.name+' · '+defaultVoice(current).name;select.append(option);
  for(const v of voicesFor(current)){const option=document.createElement('option');option.value=v.id;option.textContent=v.name+' · '+v.accent+' · '+v.style;select.append(option);}
  const chosen=state.data.voiceChoices[voiceChoiceKey(current)]||state.data.voiceChoices[current.profile];select.value=voicesFor(current).some(v=>v.id===chosen)?chosen:'auto';
 }
 refreshSelection();el('voice-select').onchange=()=>{void stop();state.data.voiceChoices[voiceChoiceKey(identity())]=el('voice-select').value;state.save();};
 el('voice-preview').onclick=()=>{unlock();const script=el('voice-script')?.value.trim(),language=identity().voiceLanguage||'en';const sample=language==='ja'?'こんにちは。おかえりなさい。今日は何をしましょうか。':language==='zh'?'你好，欢迎回来。今天我们一起做些什么？':`Hello! I'm ${identity().name}. ${identity().personality.pat}`;void speak(script||sample,{textLanguage:script?'auto':language});};el('voice-stop').onclick=()=>void stop();
 let refreshPack=async()=>{};const settings=mountVoiceSettings({document,state,identity,engines,modelsFor,onChange:()=>{void stop();refreshSelection();void refreshPack().catch(()=>{});onPreferences();}});
 el('voice-download').hidden=!tauri;
 if(tauri){
  refreshPack=async()=>{const pack=voicePackFor(identity()),status=await tauri.core.invoke('voice_pack_status',{pack});if(pack!==voicePackFor(identity()))return;el('voice-download').textContent=status.installed?'Repair this voice pack':pack==='supertonic3'?'Download character pack · about 154 MB':'Download Kokoro pack · about 316 MB';el('voice-status').textContent=status.installed?'Voice pack installed · ready offline':'Download this voice pack to preview it.';};void refreshPack().catch(()=>{});
  el('voice-download').onclick=async()=>{if(download)return;download=true;el('voice-download').disabled=true;el('voice-preview').disabled=true;el('voice-progress').hidden=false;el('voice-progress').removeAttribute('value');try{await stop();const pack=voicePackFor(identity());await tauri.core.invoke('voice_pack_download',{pack,acceptLicense:state.data.supertonicTerms});await refreshPack();}catch(error){el('voice-status').textContent=String(error);}finally{download=false;el('voice-download').disabled=false;el('voice-preview').disabled=false;el('voice-progress').hidden=true;}};
  void tauri.event.listen('ruby-voice-progress',event=>{const p=event.payload;el('voice-progress').max=p.total;el('voice-progress').value=p.downloaded;el('voice-status').textContent=`${p.file} · ${(p.downloaded/1000000).toFixed(1)} / ${(p.total/1000000).toFixed(1)} MB`;}).then(unlisten=>window.addEventListener('pagehide',unlisten,{once:true}));
 }
 window.addEventListener('pagehide',()=>{void stop();void context?.close();},{once:true});return {speak,stop,unlock,refresh:()=>{void stop();settings.refresh();refreshSelection();void refreshPack().catch(()=>{});}};
}

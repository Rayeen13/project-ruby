import {voicesFor,defaultVoice,selectedVoice} from './voice-catalogue.e826a62977c4.js';
import {OrderedSpeech,playSpeechBuffer} from './speech-queue.e826a62977c4.js';
export function voiceStyle(identity){const gender=identity.gender==='male'?'male':'female';const tempo=identity.personality.voicePace||({calm:.9,focused:.96,playful:1.03,curious:1.0,sarcastic:.98}[identity.personality.id]||1);return {gender,pace:Math.max(.75,Math.min(1.5,tempo*(identity.bodyId==='chibi'?1.08:identity.bodyId==='office'?.96:1)))};}
export function mountVoice({document,state,identity,onSpeaking=()=>{},onCue=()=>{}}){
 const el=id=>document.getElementById(id),tauri=globalThis.__TAURI__;let context=null,generation=0,download=false;
 const audioContext=()=>context??=new (globalThis.AudioContext||globalThis.webkitAudioContext)({latencyHint:'interactive'});
 const unlock=()=>{if(!tauri)return;try{void audioContext().resume().catch(()=>{});}catch{}};
 const queue=new OrderedSpeech({
  cancel:()=>tauri?tauri.core.invoke('voice_stop'):Promise.resolve(),
  synthesize:(text,voice)=>tauri.core.invoke('voice_synthesize',{text,gender:voice.gender,voice:voice.voice,pace:voice.pace}),
  play:(bytes,{signal,cue})=>playSpeechBuffer(audioContext(),bytes,{signal,pauseMs:cue?.pauseMs||0,onStart:()=>{if(cue)onCue(cue);onSpeaking(true);el('voice-status').textContent='Speaking · downloaded English VoiceM';}})
 });
 function stop(){generation++;const stopped=queue.stop();onSpeaking(false);return stopped;}
 async function speak(text){
  const token=++generation,current=identity(),voice={...voiceStyle(current),voice:selectedVoice(current,state.data.voiceChoices).id};unlock();
  try{
   const installed=tauri&&(await tauri.core.invoke('voice_pack_status')).installed;if(token!==generation)return;
   if(!installed)throw new Error(tauri?'Download Kokoro VoiceM first. Your Companion’s voice will then work offline.':'Matched VoiceM playback is available in the Windows app. Download the pack there and preview your Companion’s voice.');
   el('voice-status').textContent='Preparing the opening phrase…';await queue.speak(text,voice);
   if(token===generation){onSpeaking(false);el('voice-status').textContent='Ready · offline VoiceM';}
  }catch(error){if(token===generation){await queue.stop();if(token!==generation)return;onSpeaking(false);el('voice-status').textContent=String(error.message||error);}}
 }
 el('voice-enabled').checked=state.data.speak;el('voice-enabled').onchange=()=>{state.data.speak=el('voice-enabled').checked;state.save();if(!state.data.speak)void stop();else unlock();};
 function refreshSelection(){
  const current=identity(),select=el('voice-select');select.replaceChildren();
  const option=document.createElement('option');option.value='auto';option.textContent='Match '+current.name+' · '+defaultVoice(current).name;select.append(option);
  for(const v of voicesFor(current)){const option=document.createElement('option');option.value=v.id;option.textContent=v.name+' · '+v.accent+' · '+v.style;select.append(option);}
  select.value=voicesFor(current).some(v=>v.id===state.data.voiceChoices[current.profile])?state.data.voiceChoices[current.profile]:'auto';
 }
 refreshSelection();el('voice-select').onchange=()=>{void stop();state.data.voiceChoices[identity().profile]=el('voice-select').value;state.save();};
 el('voice-preview').onclick=()=>{unlock();void speak(el('voice-script')?.value.trim()||`Hello! I'm ${identity().name}. ${identity().personality.pat}`);};el('voice-stop').onclick=()=>void stop();
 el('voice-download').hidden=!tauri;
 if(tauri){
  const refresh=async()=>{const status=await tauri.core.invoke('voice_pack_status');el('voice-download').textContent=status.installed?'Download / repair VoiceM':'Download VoiceM · about 316 MB';if(status.installed)el('voice-status').textContent='Kokoro VoiceM installed · ready offline';};void refresh().catch(()=>{});
  el('voice-download').onclick=async()=>{if(download)return;download=true;el('voice-download').disabled=true;el('voice-preview').disabled=true;el('voice-progress').hidden=false;el('voice-progress').removeAttribute('value');try{await stop();await tauri.core.invoke('voice_pack_download');await refresh();}catch(error){el('voice-status').textContent=String(error);}finally{download=false;el('voice-download').disabled=false;el('voice-preview').disabled=false;el('voice-progress').hidden=true;}};
  void tauri.event.listen('ruby-voice-progress',event=>{const p=event.payload;el('voice-progress').max=p.total;el('voice-progress').value=p.downloaded;el('voice-status').textContent=`${p.file} · ${(p.downloaded/1000000).toFixed(1)} / ${(p.total/1000000).toFixed(1)} MB`;}).then(unlisten=>window.addEventListener('pagehide',unlisten,{once:true}));
 }
 window.addEventListener('pagehide',()=>{void stop();void context?.close();},{once:true});return {speak,stop,unlock,refresh:()=>{void stop();refreshSelection();}};
}

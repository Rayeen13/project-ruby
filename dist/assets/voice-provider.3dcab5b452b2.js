import {voicesFor,defaultVoice,selectedVoice} from './voice-catalogue.3dcab5b452b2.js';
export function voiceStyle(identity){const gender=identity.gender==='male'?'male':'female';const tempo={calm:.9,focused:.96,playful:1.03,curious:1.0,sarcastic:.98}[identity.personality.id]||1;return {gender,pace:Math.max(.75,Math.min(1.5,tempo*(identity.bodyId==='chibi'?1.08:identity.bodyId==='office'?.96:1)))};}
export function mountVoice({document,state,identity,onSpeaking=()=>{}}){
 const el=id=>document.getElementById(id),tauri=globalThis.__TAURI__;let audio=null,url=null,generation=0,download=false;
 function stop(){generation++;audio?.pause();audio=null;if(url)URL.revokeObjectURL(url);url=null;globalThis.speechSynthesis?.cancel();if(tauri)void tauri.core.invoke('voice_stop').catch(()=>{});onSpeaking(false);}
 async function speak(text){
  stop();const token=generation,current=identity(),style=voiceStyle(current);const chosen=selectedVoice(current,state.data.voiceChoices);text=text.replace(/\[\d+\]/g,'').slice(0,1500);
  try{
   const installed=tauri&&(await tauri.core.invoke('voice_pack_status')).installed;if(token!==generation)return;
   if(installed){
    el('voice-status').textContent='Synthesizing with downloaded VoiceM…';const bytes=await tauri.core.invoke('voice_synthesize',{text,...style,voice:chosen.id});if(token!==generation)return;
    url=URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:'audio/wav'}));audio=new Audio(url);audio.onended=()=>{if(token===generation){onSpeaking(false);el('voice-status').textContent='Ready · offline VoiceM';URL.revokeObjectURL(url);url=null;audio=null;}};audio.onerror=()=>{if(token===generation){onSpeaking(false);el('voice-status').textContent='Audio playback failed. Try Preview again.';}};await audio.play();onSpeaking(true);el('voice-status').textContent='Speaking · downloaded English VoiceM';
   }else{
    if(tauri)throw new Error('Download Kokoro VoiceM first. Your Companion’s voice will then work offline.');
    // Browsers do not provide reliable gender metadata. Never silently substitute a mismatched device voice.
    throw new Error('Matched VoiceM playback is available in the Windows app. Download the pack there and preview your Companion’s voice.');
   }
  }catch(error){if(token===generation){onSpeaking(false);el('voice-status').textContent=String(error.message||error);}}
 }
 el('voice-enabled').checked=state.data.speak;el('voice-enabled').onchange=()=>{state.data.speak=el('voice-enabled').checked;state.save();if(!state.data.speak)stop();};
 function refreshSelection(){
  const current=identity(),select=el('voice-select');select.replaceChildren();
  const option=document.createElement('option');option.value='auto';option.textContent='Match '+current.name+' · '+defaultVoice(current).name;select.append(option);
  for(const v of voicesFor(current)){const option=document.createElement('option');option.value=v.id;option.textContent=v.name+' · '+v.accent+' · '+v.style;select.append(option);}
  select.value=voicesFor(current).some(v=>v.id===state.data.voiceChoices[current.profile])?state.data.voiceChoices[current.profile]:'auto';
 }
 refreshSelection();el('voice-select').onchange=()=>{stop();state.data.voiceChoices[identity().profile]=el('voice-select').value;state.save();};
 el('voice-preview').onclick=()=>speak(`Hello! I'm ${identity().name}. ${identity().personality.pat}`);el('voice-stop').onclick=stop;
 el('voice-download').hidden=!tauri;
 if(tauri){
  const refresh=async()=>{const status=await tauri.core.invoke('voice_pack_status');el('voice-download').textContent=status.installed?'Download / repair VoiceM':'Download VoiceM · about 316 MB';if(status.installed)el('voice-status').textContent='Kokoro VoiceM installed · ready offline';};void refresh().catch(()=>{});
  el('voice-download').onclick=async()=>{if(download)return;stop();download=true;el('voice-download').disabled=true;el('voice-preview').disabled=true;el('voice-progress').hidden=false;el('voice-progress').removeAttribute('value');try{await tauri.core.invoke('voice_pack_download');await refresh();}catch(error){el('voice-status').textContent=String(error);}finally{download=false;el('voice-download').disabled=false;el('voice-preview').disabled=false;el('voice-progress').hidden=true;}};
  void tauri.event.listen('ruby-voice-progress',event=>{const p=event.payload;el('voice-progress').max=p.total;el('voice-progress').value=p.downloaded;el('voice-status').textContent=`${p.file} · ${(p.downloaded/1000000).toFixed(1)} / ${(p.total/1000000).toFixed(1)} MB`;}).then(unlisten=>window.addEventListener('pagehide',unlisten,{once:true}));
 }
 window.addEventListener('pagehide',stop,{once:true});return {speak,stop,refresh:()=>{stop();refreshSelection();}};
}

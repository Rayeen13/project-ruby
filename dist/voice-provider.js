export function voiceStyle(identity){const gender=identity.gender==='male'?'male':'female';const tempo={calm:.9,focused:.96,playful:1.1,curious:1.02}[identity.personality.id]||1;return {gender,pace:Math.max(.75,Math.min(1.5,tempo*(identity.bodyId==='chibi'?1.08:identity.bodyId==='office'?.96:1)))};}
export function mountVoice({document,state,identity,onSpeaking=()=>{}}){
 const el=id=>document.getElementById(id),tauri=globalThis.__TAURI__;let audio=null,url=null,generation=0,download=false;
 function stop(){generation++;audio?.pause();audio=null;if(url)URL.revokeObjectURL(url);url=null;globalThis.speechSynthesis?.cancel();if(tauri)void tauri.core.invoke('voice_stop').catch(()=>{});onSpeaking(false);}
 async function speak(text){
  stop();const token=generation,current=identity(),style=voiceStyle(current);text=text.replace(/\[\d+\]/g,'').slice(0,1500);if(state.data.voice==='male'||state.data.voice==='female')style.gender=state.data.voice;
  try{
   const installed=tauri&&(await tauri.core.invoke('voice_pack_status')).installed;if(token!==generation)return;
   if(installed&&state.data.voice!=='system'){
    el('voice-status').textContent='Synthesizing with downloaded VoiceM…';const bytes=await tauri.core.invoke('voice_synthesize',{text,...style});if(token!==generation)return;
    url=URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:'audio/wav'}));audio=new Audio(url);audio.onended=()=>{if(token===generation){onSpeaking(false);el('voice-status').textContent='Ready · offline VoiceM';URL.revokeObjectURL(url);url=null;audio=null;}};audio.onerror=()=>{if(token===generation){onSpeaking(false);el('voice-status').textContent='Audio playback failed. Try Preview again.';}};await audio.play();onSpeaking(true);el('voice-status').textContent='Speaking · downloaded English VoiceM';
   }else{
    if(!globalThis.speechSynthesis)throw new Error('Device speech is unavailable. Download VoiceM in Windows.');
    const voices=globalThis.speechSynthesis.getVoices().filter(v=>v.localService);if(!voices.length)throw new Error('No offline device voice is available. Download VoiceM in Windows.');
    const utterance=new SpeechSynthesisUtterance(text);utterance.voice=voices.find(v=>/en/i.test(v.lang))||voices[0];utterance.rate=style.pace;utterance.pitch=style.gender==='female'?1.12:.9;utterance.onstart=()=>{if(token===generation)onSpeaking(true);};utterance.onend=()=>{if(token===generation)onSpeaking(false);};utterance.onerror=()=>{if(token===generation){onSpeaking(false);el('voice-status').textContent='Device voice could not play.';}};speechSynthesis.speak(utterance);el('voice-status').textContent='Using offline device voice · download VoiceM for matched male/female voices.';
   }
  }catch(error){if(token===generation){onSpeaking(false);el('voice-status').textContent=String(error.message||error);}}
 }
 el('voice-enabled').checked=state.data.speak;el('voice-enabled').onchange=()=>{state.data.speak=el('voice-enabled').checked;state.save();if(!state.data.speak)stop();};
 el('voice-select').value=state.data.voice;el('voice-select').onchange=()=>{stop();state.data.voice=el('voice-select').value;state.save();};
 el('voice-preview').onclick=()=>speak(`Hello! I'm ${identity().name}. ${identity().personality.pat}`);el('voice-stop').onclick=stop;
 el('voice-download').hidden=!tauri;
 if(tauri){
  const refresh=async()=>{const status=await tauri.core.invoke('voice_pack_status');el('voice-download').textContent=status.installed?'Download / repair VoiceM':'Download VoiceM · about 100 MB';if(status.installed)el('voice-status').textContent='English VoiceM installed · ready offline';};void refresh().catch(()=>{});
  el('voice-download').onclick=async()=>{if(download)return;stop();download=true;el('voice-download').disabled=true;el('voice-preview').disabled=true;el('voice-progress').hidden=false;el('voice-progress').removeAttribute('value');try{await tauri.core.invoke('voice_pack_download');await refresh();}catch(error){el('voice-status').textContent=String(error);}finally{download=false;el('voice-download').disabled=false;el('voice-preview').disabled=false;el('voice-progress').hidden=true;}};
  void tauri.event.listen('ruby-voice-progress',event=>{const p=event.payload;el('voice-progress').max=p.total;el('voice-progress').value=p.downloaded;el('voice-status').textContent=`${p.file} · ${(p.downloaded/1000000).toFixed(1)} / ${(p.total/1000000).toFixed(1)} MB`;}).then(unlisten=>window.addEventListener('pagehide',unlisten,{once:true}));
 }
 window.addEventListener('pagehide',stop,{once:true});return {speak,stop};
}

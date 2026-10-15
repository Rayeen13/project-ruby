import {voicesFor,selectedVoice} from './voice-catalogue.js';
export const SETUP_KEY='project-ruby.setup.v1';
export const SETUP_PRESETS=Object.freeze([
 {id:'recommended',name:'Recommended',tag:'Ready to chat',detail:'Compact offline LLM + Kokoro voices. About 827 MB to download on Windows; installed files are reused.'},
 {id:'custom',name:'Custom',tag:'Your own combination',detail:'Choose an LLM engine, connect a model and select a matching VoiceM. You control what gets installed.'},
 {id:'pro',name:'Pro',tag:'Bring a stronger LLM',detail:'Connect your existing Ollama or LM Studio model, paired with Kokoro voices. Larger LLMs need more memory. No Ruby subscription.'},
 {id:'lite',name:'Lite',tag:'Keep it light',detail:'Compact offline LLM with text chat. Add voices later. About 511 MB on Windows.'}
]);
export function mountApplicationSetup({document,storage,tauri,state,identity,engines,engineSelect,modelSelect,connect,onBusy=()=>{},refreshVoice=()=>{}}){
 const el=id=>document.getElementById(id);let preset='recommended',busy=false,cancelled=false;
 let unlisten=[];if(tauri){for(const [event,render] of [['ruby-ai-pack',p=>({downloaded:p.downloaded,total:p.total,text:p.detail})],['ruby-voice-progress',p=>({...p,text:p.file})]])void tauri.event.listen(event,e=>{if(!busy)return;const p=render(e.payload);el('setup-progress').hidden=!(p.total>0);if(p.total>0){el('setup-progress').max=p.total;el('setup-progress').value=p.downloaded;status(p.text+' · '+(p.downloaded/1000000).toFixed(1)+' / '+(p.total/1000000).toFixed(1)+' MB');}}).then(fn=>unlisten.push(fn));window.addEventListener('pagehide',()=>unlisten.forEach(fn=>fn()),{once:true});}
 const status=text=>{el('setup-status').textContent=text;};
 const choose=id=>{if(busy)return;preset=id;for(const card of el('setup-presets').children){card.classList.toggle('selected',card.dataset.preset===id);card.setAttribute('aria-pressed',String(card.dataset.preset===id));}el('setup-custom').hidden=!['custom','pro'].includes(id);el('setup-engine').value=id==='pro'?'ollama':engineSelect.value;el('setup-title').textContent=SETUP_PRESETS.find(p=>p.id===id).tag;status(tauri?'Downloads start only when you choose Set up. Allow about 1.5 GB of free disk space for archives and extracted components.':'Explore presets here. Install and download offline components inside the Windows app.');};
 for(const spec of SETUP_PRESETS){const card=document.createElement('button');card.type='button';card.dataset.preset=spec.id;const title=document.createElement('strong'),tag=document.createElement('span'),detail=document.createElement('small');title.textContent=spec.name;tag.textContent=spec.tag;detail.textContent=spec.detail;card.append(title,tag,detail);card.onclick=()=>choose(spec.id);el('setup-presets').append(card);}
 for(const engine of engines){const option=document.createElement('option');option.value=engine.id;option.textContent=engine.name;el('setup-engine').append(option);}
 function refresh(){
  const select=el('setup-voice');select.replaceChildren();for(const v of voicesFor(identity())){const option=document.createElement('option');option.value=v.id;option.textContent=v.name+' · '+v.style;select.append(option);}select.value=selectedVoice(identity(),state.data.voiceChoices).id;
  el('setup-model').replaceChildren();for(const source of modelSelect.options){const option=document.createElement('option');option.value=source.value;option.textContent=source.textContent;el('setup-model').append(option);}el('setup-model').value=modelSelect.value;
 }
 async function configureEngine(id){if(engineSelect.value!==id){engineSelect.value=id;engineSelect.dispatchEvent(new Event('change'));}await connect();refresh();}
 el('setup-check').onclick=async()=>{status('Checking your selected engine…');await configureEngine(el('setup-engine').value);status(modelSelect.value?'Model connected. Choose it below, then complete setup.':'No model connected. Start a model in your selected engine, then check again.');};
 el('setup-model').onchange=()=>{modelSelect.value=el('setup-model').value;modelSelect.dispatchEvent(new Event('change'));};
 el('setup-run').onclick=async()=>{
  if(busy)return;if(!tauri&&['recommended','lite'].includes(preset)){status('Use the Windows app to download the offline LLM. Custom can connect to a model already running on this computer.');return;}
  const chosenVoice=el('setup-voice').value,chosenModel=el('setup-model').value;busy=true;cancelled=false;onBusy(true);el('setup-run').disabled=true;el('setup-cancel').hidden=false;el('setup-presets').inert=true;el('setup-custom').inert=true;
  try{
   if(preset==='recommended'||preset==='lite'){
    engineSelect.value='ruby';engineSelect.dispatchEvent(new Event('change'));status('1 / '+(preset==='lite'?'1':'2')+' · Checking and preparing offline LLM…');
    const installed=await tauri.core.invoke('ai_pack_status');if(cancelled)return;if(installed.phase!=='ready')await tauri.core.invoke('ai_pack_run',{download:!installed.installed});if(cancelled)return;await connect();
   }else{
    await configureEngine(el('setup-engine').value);if([...modelSelect.options].some(o=>o.value===chosenModel))modelSelect.value=chosenModel;if(cancelled)return;if(!modelSelect.value)throw new Error('Load a model in your selected engine, then check the connection.');
   }
   if(cancelled)return;
   if(preset!=='lite'){
    if(!tauri)throw new Error('LLM connected. Matched Kokoro VoiceM requires the Windows app.');
    status('Preparing Kokoro VoiceM · verified installed files are reused…');const voiceStatus=await tauri.core.invoke('voice_pack_status');if(cancelled)return;if(!voiceStatus.installed)await tauri.core.invoke('voice_pack_download');if(cancelled)return;
    if(['custom','pro'].includes(preset))state.data.voiceChoices[identity().profile]=chosenVoice;
   }
   if(cancelled)return;state.data.speak=preset!=='lite';state.save();el('voice-enabled').checked=state.data.speak;refreshVoice();
   try{storage?.setItem(SETUP_KEY,JSON.stringify({version:1,preset,engine:engineSelect.value,model:modelSelect.value,completedAt:new Date().toISOString()}));}catch{}
   status('Ready · '+identity().name+' can chat'+(state.data.speak?' and speak offline. Preview her or his voice in VoiceM settings.':'. Add a VoiceM whenever you like.'));el('setup-open-chat').hidden=false;
  }catch(error){status(cancelled?'Setup stopped. Completed downloads are kept; Set up retries missing components.':String(error.message||error));}
  finally{el('setup-progress').hidden=true;if(cancelled)status('Setup stopped. Completed downloads are kept; Set up retries missing components.');busy=false;onBusy(false);el('setup-run').disabled=false;el('setup-cancel').hidden=true;el('setup-presets').inert=false;el('setup-custom').inert=false;}
 };
 el('setup-cancel').onclick=async()=>{cancelled=true;status('Stopping setup…');await Promise.allSettled([tauri?.core.invoke('ai_pack_stop'),tauri?.core.invoke('voice_stop')]);};
 refresh();choose('recommended');return {refresh};
}

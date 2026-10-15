import {CompanionState,parseExpression} from './companion-state.76a47b8847d0.js';
import {searchInternet,searchQuery,googleAiUrl} from './internet-provider.76a47b8847d0.js';
import {mountVoice} from './voice-provider.76a47b8847d0.js';
import {AI_ENGINES,engineFor} from './ai-engines.76a47b8847d0.js';
import {mountAiPack} from './ai-pack.76a47b8847d0.js';
import {NativeChatProvider} from './native-chat-provider.76a47b8847d0.js';
import {LocalChatProvider} from './chat-provider.76a47b8847d0.js';
import {Conversation} from './conversation.76a47b8847d0.js';
export function mountCompanionChat({document,storage,identity,onState=()=>{},onOpen=()=>{},onExpand=()=>{},onClose=()=>{},onExpression=()=>{}}){
 const el=id=>document.getElementById(id),panel=el('chat-panel'),log=el('chat-log'),input=el('chat-input'),model=el('chat-model');
 const baseIdentity=identity,state=new CompanionState(storage);identity=()=>state.identity(baseIdentity());let voice;
 const provider=globalThis.__TAURI__?new NativeChatProvider(globalThis.__TAURI__):new LocalChatProvider();let connecting=null,packBusy=false;
 const engineNote=engine=>!globalThis.__TAURI__&&engine.id==='ruby'?'Download offline AI inside the Windows app → Settings → LLM → Download AI. This website connects to the running server on your device.':engine.note;
 const engineSelect=el('chat-engine');
 for(const engine of AI_ENGINES){const option=document.createElement('option');option.value=engine.id;option.textContent=engine.name;engineSelect.append(option);}
 const chat=new Conversation({provider,storage,identity,onChange:render,prepare:async(text,{signal,history})=>{
  state.observe(text);onExpression(state.data.emotion);renderMemory();
  if(!el('internet-enabled').checked&&!/^(?:please\s+)?(?:search|look up)\b/i.test(text))return;
  el('chat-status').textContent='Searching the internet…';const query=searchQuery(text,history);lastQuery=query;
  const sources=await searchInternet(query,{signal});if(!sources.length)throw new Error('No useful internet results. Try a more specific question.');return sources;
 },onComplete:reply=>{onExpression(reply.mood||state.data.emotion);if(state.data.speak)void voice?.speak(reply.content);}});
 let lastQuery='';
 function renderMemory(){
  const current=identity();el('identity-summary').textContent=`${current.name} · ${current.gender} · age ${current.age} · ${current.personality.name}`;
  el('content-mode').value=state.data.content;el('memory-enabled').checked=state.data.remember;el('memory-list').replaceChildren();
  state.data.memories.forEach((text,index)=>{const item=document.createElement('li'),label=document.createElement('span'),remove=document.createElement('button');label.textContent=text;remove.textContent='×';remove.setAttribute('aria-label','Forget '+text);remove.onclick=()=>{state.data.memories.splice(index,1);state.save();renderMemory();};item.append(label,remove);el('memory-list').append(item);});
  el('owner-feeling').textContent=state.data.feeling?'Last feeling you shared: '+state.data.feeling:'No owner feeling saved.';el('settings-save-status').textContent=state.saved?'Settings and memories stay on this device.':'Storage unavailable · changes are temporary.';
 }
 function downloadJson(name,data){const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 const openLink=url=>globalThis.__TAURI__?globalThis.__TAURI__.core.invoke('open_web_url',{url}):Promise.resolve(window.open(url,'_blank','noopener,noreferrer'));
 const settings=async()=>{await onOpen();panel.hidden=true;el('settings-panel').hidden=false;document.documentElement.classList.add('settings-open');document.documentElement.classList.remove('chat-open');renderMemory();el('settings-close').focus({preventScroll:true});};
 const close=async()=>{panel.hidden=true;el('settings-panel').hidden=true;document.documentElement.classList.remove('chat-open','settings-open');await onClose();};
 el('settings-launcher').onclick=settings;el('chat-settings').onclick=settings;for(const button of document.querySelectorAll('[data-settings-open]'))button.onclick=settings;el('settings-close').onclick=close;
 el('settings-panel').addEventListener('keydown',event=>{if(event.key==='Escape'){event.stopPropagation();void close();}});
 for(const tab of document.querySelectorAll('[data-settings-tab]'))tab.onclick=()=>{for(const page of document.querySelectorAll('[data-settings-page]'))page.hidden=page.dataset.settingsPage!==tab.dataset.settingsTab;for(const other of document.querySelectorAll('[data-settings-tab]'))other.classList.toggle('active',other===tab);};
 el('content-mode').onchange=()=>{state.data.content=el('content-mode').value;state.save();renderMemory();};el('memory-enabled').onchange=()=>{state.data.remember=el('memory-enabled').checked;state.save();renderMemory();};
 el('memory-form').onsubmit=event=>{event.preventDefault();state.remember(el('memory-input').value);el('memory-input').value='';renderMemory();};el('memory-clear').onclick=()=>{state.forget();renderMemory();};el('memory-export').onclick=()=>downloadJson('ruby-companion.json',state.export());
 el('google-ai-open').onclick=()=>{const query=input.value.trim()||lastQuery||[...chat.messages].reverse().find(m=>m.role==='user')?.content||'';if(!query){el('chat-status').textContent='Write a question first.';return;}void openLink(googleAiUrl(query)).catch(error=>{el('chat-status').textContent=String(error);});};
 voice=mountVoice({document,state,identity,onSpeaking:value=>{onState(value?'speaking':chat.state);document.querySelector('#stage').dataset.speaking=String(value);}});
 renderMemory();
 function render(){
  const nearBottom=log.scrollHeight-log.scrollTop-log.clientHeight<45;
  log.replaceChildren();
  for(const message of chat.messages){
   const item=document.createElement('article'),label=document.createElement('small'),text=document.createElement('p');item.className='chat-message '+message.role;
   label.textContent=message.role==='user'?'You':message.name||'Companion';text.textContent=parseExpression(message.content).text|| (message.status==='pending'?'Thinking…':message.status==='cancelled'?'Stopped.':'No reply received.');
   item.append(label,text);if(message.sources?.length){const links=document.createElement('div');links.className='chat-sources';message.sources.forEach((source,index)=>{const link=document.createElement('a');link.textContent=`[${index+1}] ${source.title}`;link.href=source.url;link.target='_blank';link.rel='noopener noreferrer';link.onclick=event=>{event.preventDefault();void openLink(source.url).catch(()=>{});};links.append(link);});item.append(links);}if(message.role==='assistant'&&['cancelled','error'].includes(message.status)){const note=document.createElement('small');note.textContent=message.status==='cancelled'?'Stopped · incomplete':'Interrupted · incomplete';item.append(note);}log.append(item);
  }
  if(!chat.messages.length){const empty=document.createElement('p');empty.className='chat-empty';empty.textContent='A small conversation with your gem. Connect your local AI, then say hello.';log.append(empty);}
  if(nearBottom)log.scrollTop=log.scrollHeight;
  panel.dataset.state=chat.state;el('chat-status').textContent=chat.error||({idle:'Ready',thinking:'Thinking…',replying:'Replying…',error:'Connection error'}[chat.state]);
  el('chat-send').disabled=!!chat.active||!model.value;el('chat-stop').hidden=!chat.active;el('chat-retry').hidden=!!chat.active||!['error','cancelled'].includes(chat.messages.at(-1)?.status);
  engineSelect.disabled=!!chat.active||packBusy;model.disabled=!!chat.active;el('chat-connect').disabled=!!chat.active||!!connecting;
  el('chat-save-status').textContent=chat.saved?'History saved on this device · '+engineFor(engineSelect.value).name:'History is temporary: device storage is unavailable';
  el('chat-launcher').textContent=chat.active?'◈ '+(chat.state==='thinking'?'Thinking…':'Replying…'):'◈ Talk';if(document.querySelector('#stage').dataset.speaking!=='true')onState(chat.state);el('chat-title').textContent='◈ '+identity().name;
 }
 async function connect(){
  if(connecting||chat.active)return;connecting=new AbortController();const controller=connecting,timer=setTimeout(()=>controller.abort(),10000);el('chat-connect').disabled=true;el('chat-status').textContent='Checking local AI…';
  try{const models=await provider.models(controller.signal);model.replaceChildren();for(const id of models){const option=document.createElement('option');option.value=id;option.textContent=id;model.append(option);}chat.error='';chat.state='idle';el('chat-setup').open=false;}
  catch{model.replaceChildren();chat.error=engineSelect.value!=='ruby'?engineFor(engineSelect.value).note+' This server is not reachable yet.':globalThis.__TAURI__?'Local AI is not running. Use Settings → LLM → Download AI or Start AI.':'The website connects to AI already running on your device. Install/start AI inside the Windows app first; your browser may ask for local-network access or block this connection.';chat.state='error';el('chat-setup').open=true;}
  finally{clearTimeout(timer);connecting=null;render();}
 }
 const open=async()=>{await onOpen();panel.hidden=false;el('settings-panel').hidden=true;document.documentElement.classList.add('chat-open');document.documentElement.classList.remove('settings-open');render();log.scrollTop=log.scrollHeight;input.focus({preventScroll:true});};
 for(const button of document.querySelectorAll('[data-chat-open]'))button.onclick=open;
 if(globalThis.__TAURI__)void globalThis.__TAURI__.event.listen('ruby-open-chat',()=>open()).then(unlisten=>window.addEventListener('pagehide',unlisten,{once:true}));
 el('chat-launcher').onclick=open;el('chat-close').onclick=close;
 panel.addEventListener('keydown',event=>{if(event.key==='Escape'){event.stopPropagation();void close();}});
 el('chat-expand').onclick=async()=>{await onExpand();panel.classList.toggle('expanded');el('chat-expand').textContent=panel.classList.contains('expanded')?'Compact':'Expand';input.focus({preventScroll:true});};
 engineSelect.onchange=()=>{chat.stop();voice.stop();model.replaceChildren();const engine=engineFor(engineSelect.value);if(globalThis.__TAURI__)provider.engine=engine.id;else provider.base=engine.base;el('chat-engine-note').textContent=engineNote(engine);el('ai-pack-section').hidden=!globalThis.__TAURI__||engine.id!=='ruby';chat.error='';chat.state='idle';render();};
 el('chat-engine-note').textContent=engineNote(AI_ENGINES[0]);
 el('chat-connect').onclick=connect;el('chat-stop').onclick=()=>{chat.stop();voice.stop();};el('chat-retry').onclick=()=>chat.retry(model.value);
 el('chat-form').onsubmit=async event=>{event.preventDefault();const text=input.value;if(!text.trim()||chat.active)return;if(!model.value){await settings();el('chat-status').textContent='Connect an LLM in Settings.';return;}voice.stop();input.value='';await chat.send(text,model.value);input.focus({preventScroll:true});};
 el('chat-clear').onclick=()=>{voice.stop();chat.clear();input.value='';};
 el('chat-export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({version:1,messages:chat.messages},null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='ruby-conversation.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 mountAiPack({tauri:globalThis.__TAURI__,document,onReady:connect,onBusy:value=>{packBusy=value;engineSelect.disabled=value||!!chat.active;},onStop:()=>{chat.stop();model.replaceChildren();render();}});
 // Setup downloads only after the user presses Download AI.
 render();return {open,stop:()=>{chat.stop();voice.stop();},refresh:()=>{render();renderMemory();}};
}

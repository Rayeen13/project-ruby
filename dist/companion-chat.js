import {mountChatAttachments} from './chat-attachments.js';
import {exportCompanionMemory,parseCompanionMemory,importCompanionMemory,BACKUP_KEY} from './portable-memory.js';
import {CompanionDNA} from './ddna.js';
import {characterContextKey} from './conversation.js';
import {LocalLangM} from './languages.js';
import {SETUP_KEY,mountApplicationSetup} from './application-setup.js';
import {CompanionState,parseExpression} from './companion-state.js';
import {searchInternet,searchQuery,googleAiUrl,shouldSearch,explicitSearch} from './internet-provider.js';
import {mountVoice} from './voice-provider.js';
import {AI_ENGINES,engineFor} from './ai-engines.js';
import {mountAiPack} from './ai-pack.js';
import {NativeChatProvider} from './native-chat-provider.js';
import {LocalChatProvider} from './chat-provider.js';
import {Conversation} from './conversation.js';
export function mountCompanionChat({document,storage,identity,onState=()=>{},onOpen=()=>{},onExpand=()=>{},onClose=()=>{},onExpression=()=>{},getPreferences=()=>({}),applyPreferences=()=>{},onAttachmentHover=()=>{}}){
 const el=id=>document.getElementById(id),panel=el('chat-panel'),log=el('chat-log'),input=el('chat-input'),model=el('chat-model');
 const baseIdentity=identity,state=new CompanionState(storage),ddna=new CompanionDNA(storage);identity=()=>ddna.resolve(state.identity(baseIdentity()));let lastCharacter=characterContextKey(identity());let voice,setup;
 const provider=globalThis.__TAURI__?new NativeChatProvider(globalThis.__TAURI__):new LocalChatProvider();let connecting=null,packBusy=false,submitting=false;
 const engineNote=engine=>!globalThis.__TAURI__&&engine.id==='ruby'?'Download offline AI inside the Windows app → Settings → LLM → Download AI. This website connects to the running server on your device.':engine.note;
 const engineSelect=el('chat-engine');
 for(const engine of AI_ENGINES){const option=document.createElement('option');option.value=engine.id;option.textContent=engine.name;engineSelect.append(option);}
 let savedSetup;try{savedSetup=JSON.parse(storage?.getItem(SETUP_KEY)||'null');}catch{}
 if(AI_ENGINES.some(e=>e.id===savedSetup?.engine)){engineSelect.value=savedSetup.engine;if(globalThis.__TAURI__)provider.engine=engineSelect.value;else provider.base=engineFor(engineSelect.value).base;}
 el('internet-enabled').checked=state.data.internet;el('internet-enabled').onchange=()=>{state.data.internet=el('internet-enabled').checked;state.save();};
 const chat=new Conversation({provider,storage,identity,onChange:render,prepare:async(text,{signal,history})=>{
  state.observe(text);onExpression(state.data.emotion);renderMemory();
  if(!shouldSearch(text,{enabled:el('internet-enabled').checked}))return;
  el('chat-status').textContent='Searching the internet…';const query=searchQuery(text,history);lastQuery=query;
  try{const sources=await searchInternet(query,{signal});if(!sources.length)throw new Error('No useful internet results.');return sources;}catch(error){if(signal.aborted)throw error;if(explicitSearch(text))throw error;return {unavailable:true};}
 },onComplete:reply=>{onExpression(reply.mood||state.data.emotion);if(state.data.speak)void voice?.speak(reply.content,{textLanguage:reply.textLanguage});}});
 const langmProvider=(engine=state.data.langm.engine==='same'?engineSelect.value:state.data.langm.engine)=>{if(globalThis.__TAURI__){const p=new NativeChatProvider(globalThis.__TAURI__);p.engine=engine;return p;}return new LocalChatProvider({base:engineFor(engine).base});};
 const langm=new LocalLangM({provider:langmProvider,model:()=>state.data.langm.engine==='same'?model.value:state.data.langm.model});
 let lastQuery='';
 function renderMemory(){
  if(state.memoryError)el('memory-transfer-status').textContent=state.memoryError;
  const current=identity();el('identity-summary').textContent=`${current.name} · ${current.gender} · age ${current.age} · ${current.personality.name}`;
  el('content-mode').value=state.data.content;el('memory-enabled').checked=state.data.remember;el('memory-list').replaceChildren();
  state.data.memories.forEach((text,index)=>{const item=document.createElement('li'),label=document.createElement('span'),remove=document.createElement('button');label.textContent=text;remove.textContent='×';remove.setAttribute('aria-label','Forget '+text);remove.onclick=()=>{state.data.memories.splice(index,1);state.save();renderMemory();};item.append(label,remove);el('memory-list').append(item);});
  el('owner-feeling').textContent=state.data.feeling?'Last feeling you shared: '+state.data.feeling:'No owner feeling saved.';el('settings-save-status').textContent=state.saved?'Settings and memories stay on this device.':'Storage unavailable · changes are temporary.';
 }
 function downloadJson(name,data){const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 const openLink=url=>globalThis.__TAURI__?globalThis.__TAURI__.core.invoke('open_web_url',{url}):Promise.resolve(window.open(url,'_blank','noopener,noreferrer'));
 const settings=async()=>{voice?.refresh();const layout=onOpen();panel.hidden=true;el('settings-panel').hidden=false;document.documentElement.classList.add('settings-open');document.documentElement.classList.remove('chat-open');renderMemory();setup?.refresh();el('settings-close').focus({preventScroll:true});try{await layout;}catch(error){el('settings-save-status').textContent='Window layout could not update: '+String(error);}};
 const close=async()=>{panel.hidden=true;el('settings-panel').hidden=true;document.documentElement.classList.remove('chat-open','settings-open');await onClose();};
 el('settings-launcher').onclick=settings;el('chat-settings').onclick=settings;for(const button of document.querySelectorAll('[data-settings-open]'))button.onclick=settings;el('settings-close').onclick=close;
 el('settings-panel').addEventListener('keydown',event=>{if(event.key==='Escape'){event.stopPropagation();void close();}});
 for(const tab of document.querySelectorAll('[data-settings-tab]'))tab.onclick=()=>{for(const page of document.querySelectorAll('[data-settings-page]'))page.hidden=page.dataset.settingsPage!==tab.dataset.settingsTab;for(const other of document.querySelectorAll('[data-settings-tab]'))other.classList.toggle('active',other===tab);};
 el('content-mode').onchange=()=>{state.data.content=el('content-mode').value;state.save();renderMemory();};el('memory-enabled').onchange=()=>{state.data.remember=el('memory-enabled').checked;state.save();renderMemory();};
 el('memory-form').onsubmit=event=>{event.preventDefault();state.remember(el('memory-input').value);el('memory-input').value='';renderMemory();};el('memory-clear').onclick=()=>{state.forget();renderMemory();};el('memory-export').onclick=()=>downloadJson('ruby-companion-backup.json',exportCompanionMemory({ddna,state,messages:chat.messages,preferences:getPreferences()}));
 let pendingMemory=null;
 el('memory-import').onchange=async()=>{pendingMemory=null;el('memory-import-apply').hidden=true;const file=el('memory-import').files?.[0];if(!file)return;try{if(file.size>2_000_000)throw Error('Choose a Ruby backup under 2 MB.');pendingMemory=parseCompanionMemory(await file.text());el('memory-transfer-status').textContent=pendingMemory.summary;el('memory-import-apply').hidden=false;}catch(error){el('memory-transfer-status').textContent=String(error.message||error);}};
 el('memory-import-apply').onclick=async()=>{if(!pendingMemory)return;chat.stop();await voice.stop();try{importCompanionMemory({file:pendingMemory,storage,state,ddna,chat,getPreferences,applyPreferences});pendingMemory=null;el('memory-import-apply').hidden=true;el('memory-import').value='';lastCharacter=characterContextKey(identity());voice.refresh();render();renderMemory();el('memory-transfer-status').textContent='Memory imported. Previous state is available as a recovery backup.';}catch(error){el('memory-transfer-status').textContent=String(error.message||error);}};
 el('memory-recovery-export').onclick=()=>{const data=storage?.getItem(BACKUP_KEY);if(data)downloadJson('ruby-before-memory-import.json',JSON.parse(data));else el('memory-transfer-status').textContent='No recovery backup yet.';};
 el('google-ai-open').onclick=()=>{const query=input.value.trim()||lastQuery||[...chat.messages].reverse().find(m=>m.role==='user')?.content||'';if(!query){el('chat-status').textContent='Write a question first.';return;}void openLink(googleAiUrl(query)).catch(error=>{el('chat-status').textContent=String(error);});};
 voice=mountVoice({document,state,identity,engines:AI_ENGINES,modelsFor:engine=>langmProvider(engine).models(),translate:(text,language,options)=>langm.translate(text,language,options),onPreferences:()=>renderMemory(),onCue:cue=>onExpression(cue.mood),onSpeaking:value=>{onState(value?'speaking':chat.state);document.querySelector('#stage').dataset.speaking=String(value);}});
 renderMemory();
 function render(){
  const nearBottom=log.scrollHeight-log.scrollTop-log.clientHeight<45;
  log.replaceChildren();
  for(const message of chat.messages){
   const item=document.createElement('article'),label=document.createElement('small'),text=document.createElement('p');item.className='chat-message '+message.role;
   label.textContent=message.role==='user'?'You':message.name||'Companion';text.textContent=parseExpression(message.content).text|| (message.status==='pending'?'Thinking…':message.status==='cancelled'?'Stopped.':'No reply received.');
   item.append(label,text);if(message.attachment){const file=document.createElement('small');file.className='chat-file-label';file.textContent='▤ '+message.attachment.name+' · '+(message.attachment.truncated?'excerpt shared':'text shared');item.append(file);}if(message.role==='assistant'&&message.status==='complete'){const copy=document.createElement('button');copy.className='chat-copy';copy.textContent='Copy';copy.setAttribute('aria-label','Copy reply');copy.onclick=async()=>{try{await navigator.clipboard.writeText(text.textContent);copy.textContent='Copied';}catch{el('chat-status').textContent='Copy is unavailable here. Select the reply text to copy it.';}};item.append(copy);}if(message.sources?.length){const links=document.createElement('div');links.className='chat-sources';message.sources.forEach((source,index)=>{const link=document.createElement('a');link.textContent=`[${index+1}] ${source.title}`;link.href=source.url;link.target='_blank';link.rel='noopener noreferrer';link.onclick=event=>{event.preventDefault();void openLink(source.url).catch(()=>{});};links.append(link);});item.append(links);}if(message.role==='assistant'&&['cancelled','error'].includes(message.status)){const note=document.createElement('small');note.textContent=message.status==='cancelled'?'Stopped · incomplete':'Interrupted · incomplete';item.append(note);}log.append(item);
  }
  if(!chat.messages.length){const empty=document.createElement('p');empty.className='chat-empty';empty.textContent=model.value?'Say hello, share a thought, or drop a text file here.':'Your Companion is ready to meet you. Open Settings to connect a local LLM, then start a conversation.';log.append(empty);}
  if(nearBottom)log.scrollTop=log.scrollHeight;
  panel.dataset.state=chat.state;el('chat-status').textContent=chat.error||({idle:'Ready',thinking:'Thinking…',replying:'Replying…',error:'Connection error'}[chat.state]);
  el('chat-send').disabled=!!chat.active||!model.value;el('chat-stop').hidden=!chat.active;el('chat-retry').hidden=!!chat.active||!['error','cancelled'].includes(chat.messages.at(-1)?.status);
  engineSelect.disabled=!!chat.active||packBusy;model.disabled=!!chat.active;el('chat-connect').disabled=!!chat.active||!!connecting;
  el('chat-save-status').textContent=chat.saved?'History saved on this device · '+engineFor(engineSelect.value).name:'History is temporary: device storage is unavailable';
  el('chat-launcher').textContent=chat.active?'◈ '+(chat.state==='thinking'?'Thinking…':'Replying…'):'◈ Talk';if(document.querySelector('#stage').dataset.speaking!=='true')onState(chat.state);el('chat-title').textContent='◈ '+identity().name;
 }
 async function connect(){
  if(connecting||chat.active)return;connecting=new AbortController();const controller=connecting,timer=setTimeout(()=>controller.abort(),10000);el('chat-connect').disabled=true;el('chat-status').textContent='Checking local AI…';
  try{const models=await provider.models(controller.signal);model.replaceChildren();for(const id of models){const option=document.createElement('option');option.value=id;option.textContent=id;model.append(option);}if(savedSetup?.engine===engineSelect.value&&models.includes(savedSetup.model))model.value=savedSetup.model;chat.error='';chat.state='idle';el('chat-setup').open=false;}
  catch{model.replaceChildren();chat.error=engineSelect.value!=='ruby'?engineFor(engineSelect.value).note+' This server is not reachable yet.':globalThis.__TAURI__?'Local AI is not running. Use Settings → LLM → Download AI or Start AI.':'The website connects to AI already running on your device. Install/start AI inside the Windows app first; your browser may ask for local-network access or block this connection.';chat.state='error';el('chat-setup').open=true;}
  finally{clearTimeout(timer);connecting=null;render();}
 }
 const open=async()=>{const layout=onOpen();panel.hidden=false;el('settings-panel').hidden=true;document.documentElement.classList.add('chat-open');document.documentElement.classList.remove('settings-open');render();log.scrollTop=log.scrollHeight;input.focus({preventScroll:true});try{await layout;}catch(error){el('chat-status').textContent='Window layout could not update: '+String(error);}};
 for(const button of document.querySelectorAll('[data-chat-open]'))button.onclick=open;
 if(globalThis.__TAURI__)void globalThis.__TAURI__.event.listen('ruby-open-chat',()=>open()).then(unlisten=>window.addEventListener('pagehide',unlisten,{once:true}));
 const attachments=mountChatAttachments({document,open,onHover:onAttachmentHover});
 el('chat-launcher').onclick=open;el('chat-close').onclick=close;
 panel.addEventListener('keydown',event=>{if(event.key==='Escape'){event.stopPropagation();void close();}});
 el('chat-expand').onclick=async()=>{await onExpand();panel.classList.toggle('expanded');el('chat-expand').textContent=panel.classList.contains('expanded')?'Compact':'Expand';input.focus({preventScroll:true});};
 engineSelect.onchange=()=>{chat.stop();voice.stop();model.replaceChildren();const engine=engineFor(engineSelect.value);if(globalThis.__TAURI__)provider.engine=engine.id;else provider.base=engine.base;el('chat-engine-note').textContent=engineNote(engine);el('ai-pack-section').hidden=!globalThis.__TAURI__||engine.id!=='ruby';chat.error='';chat.state='idle';render();};
 el('chat-engine-note').textContent=engineNote(engineFor(engineSelect.value));
 el('chat-connect').onclick=connect;el('chat-stop').onclick=()=>{chat.stop();voice.stop();};el('chat-retry').onclick=async()=>{await voice.stop();await chat.retry(model.value);};
 el('chat-form').onsubmit=async event=>{event.preventDefault();const attachment=attachments.get(),text=input.value.trim()||(attachment?'Discuss this file with me.':'');if(!text||chat.active||submitting)return;if(!model.value){await settings();el('chat-status').textContent='Connect an LLM in Settings.';return;}submitting=true;voice.unlock();input.value='';attachments.clear();try{await voice.stop();await chat.send(text,model.value,{attachment});}finally{submitting=false;input.focus({preventScroll:true});}};
 el('chat-clear').onclick=()=>{el('chat-clear-confirm').hidden=false;el('chat-clear-cancel').focus();};el('chat-clear-cancel').onclick=()=>{el('chat-clear-confirm').hidden=true;input.focus();};el('chat-clear-yes').onclick=()=>{voice.stop();chat.clear();input.value='';attachments.clear();el('chat-clear-confirm').hidden=true;input.focus();};input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();el('chat-form').requestSubmit();}});
 el('chat-export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({version:1,messages:chat.messages},null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='ruby-conversation.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 mountAiPack({tauri:globalThis.__TAURI__,document,onReady:connect,onBusy:value=>{packBusy=value;engineSelect.disabled=value||!!chat.active;},onStop:()=>{chat.stop();model.replaceChildren();render();}});
 setup=mountApplicationSetup({document,storage,tauri:globalThis.__TAURI__,state,identity,engines:AI_ENGINES,engineSelect,modelSelect:model,connect,onBusy:value=>{packBusy=value;engineSelect.disabled=value||!!chat.active;},refreshVoice:()=>voice.refresh()});
 // Downloads require an explicit setup action.
 render();return {open,stop:()=>{chat.stop();voice.stop();},refresh:()=>{const key=characterContextKey(identity());if(key!==lastCharacter){chat.stop();lastCharacter=key;}voice.refresh();setup?.refresh();render();renderMemory();}};
}

import {AI_ENGINES,engineFor} from './ai-engines.5f7505e137c3.js';
import {mountAiPack} from './ai-pack.5f7505e137c3.js';
import {NativeChatProvider} from './native-chat-provider.5f7505e137c3.js';
import {LocalChatProvider} from './chat-provider.5f7505e137c3.js';
import {Conversation} from './conversation.5f7505e137c3.js';
export function mountCompanionChat({document,storage,identity,onState=()=>{},onOpen=()=>{},onExpand=()=>{}}){
 const el=id=>document.getElementById(id),panel=el('chat-panel'),log=el('chat-log'),input=el('chat-input'),model=el('chat-model');
 const provider=globalThis.__TAURI__?new NativeChatProvider(globalThis.__TAURI__):new LocalChatProvider();let connecting=null,packBusy=false;
 const engineSelect=el('chat-engine');
 for(const engine of AI_ENGINES){const option=document.createElement('option');option.value=engine.id;option.textContent=engine.name;engineSelect.append(option);}
 const chat=new Conversation({provider,storage,identity,onChange:render});
 function render(){
  const nearBottom=log.scrollHeight-log.scrollTop-log.clientHeight<45;
  log.replaceChildren();
  for(const message of chat.messages){
   const item=document.createElement('article'),label=document.createElement('small'),text=document.createElement('p');item.className='chat-message '+message.role;
   label.textContent=message.role==='user'?'You':message.name||'Companion';text.textContent=message.content|| (message.status==='pending'?'Thinking…':message.status==='cancelled'?'Stopped.':'No reply received.');
   item.append(label,text);if(message.role==='assistant'&&['cancelled','error'].includes(message.status)){const note=document.createElement('small');note.textContent=message.status==='cancelled'?'Stopped · incomplete':'Interrupted · incomplete';item.append(note);}log.append(item);
  }
  if(!chat.messages.length){const empty=document.createElement('p');empty.className='chat-empty';empty.textContent='A small conversation with your gem. Connect your local AI, then say hello.';log.append(empty);}
  if(nearBottom)log.scrollTop=log.scrollHeight;
  panel.dataset.state=chat.state;el('chat-status').textContent=chat.error||({idle:'Ready',thinking:'Thinking…',replying:'Replying…',error:'Connection error'}[chat.state]);
  el('chat-send').disabled=!!chat.active||!model.value;el('chat-stop').hidden=!chat.active;el('chat-retry').hidden=!!chat.active||!['error','cancelled'].includes(chat.messages.at(-1)?.status);
  engineSelect.disabled=!!chat.active||packBusy;model.disabled=!!chat.active;el('chat-connect').disabled=!!chat.active||!!connecting;
  el('chat-save-status').textContent=chat.saved?'History saved on this device · local AI only':'History is temporary: device storage is unavailable';
  el('chat-launcher').textContent=chat.active?'◈ '+(chat.state==='thinking'?'Thinking…':'Replying…'):'◈ Talk';onState(chat.state);
 }
 async function connect(){
  if(connecting||chat.active)return;connecting=new AbortController();const controller=connecting,timer=setTimeout(()=>controller.abort(),10000);el('chat-connect').disabled=true;el('chat-status').textContent='Checking local AI…';
  try{const models=await provider.models(controller.signal);model.replaceChildren();for(const id of models){const option=document.createElement('option');option.value=id;option.textContent=id;model.append(option);}chat.error='';chat.state='idle';el('chat-setup').open=false;}
  catch{model.replaceChildren();chat.error=engineSelect.value!=='ruby'?engineFor(engineSelect.value).note+' This server is not reachable yet.':globalThis.__TAURI__?'Local AI is not running. Use Download AI or Start AI below.':'The website connects to AI already running on your device. Install/start AI inside the Windows app first; your browser may ask for local-network access or block this connection.';chat.state='error';el('chat-setup').open=true;}
  finally{clearTimeout(timer);connecting=null;render();}
 }
 const open=async()=>{await onOpen();panel.hidden=false;render();log.scrollTop=log.scrollHeight;input.focus({preventScroll:true});};
 for(const button of document.querySelectorAll('[data-chat-open]'))button.onclick=open;
 if(globalThis.__TAURI__)void globalThis.__TAURI__.event.listen('ruby-open-chat',()=>open()).then(unlisten=>window.addEventListener('pagehide',unlisten,{once:true}));
 el('chat-launcher').onclick=open;el('chat-close').onclick=()=>{panel.hidden=true;el('chat-launcher').focus();};
 panel.addEventListener('keydown',event=>{if(event.key==='Escape'){event.stopPropagation();panel.hidden=true;el('chat-launcher').focus();}});
 el('chat-expand').onclick=async()=>{await onExpand();panel.classList.toggle('expanded');el('chat-expand').textContent=panel.classList.contains('expanded')?'Compact':'Expand';input.focus();};
 engineSelect.onchange=()=>{chat.stop();model.replaceChildren();const engine=engineFor(engineSelect.value);if(globalThis.__TAURI__)provider.engine=engine.id;else provider.base=engine.base;el('chat-engine-note').textContent=engine.note;el('ai-pack-section').hidden=!globalThis.__TAURI__||engine.id!=='ruby';chat.error='';chat.state='idle';render();};
 el('chat-engine-note').textContent=AI_ENGINES[0].note;
 el('chat-connect').onclick=connect;el('chat-stop').onclick=()=>chat.stop();el('chat-retry').onclick=()=>chat.retry(model.value);
 el('chat-form').onsubmit=async event=>{event.preventDefault();const text=input.value;if(!text.trim()||chat.active)return;if(!model.value){el('chat-status').textContent='Connect a local model before sending.';el('chat-setup').open=true;return;}input.value='';await chat.send(text,model.value);input.focus({preventScroll:true});};
 el('chat-clear').onclick=()=>{chat.clear();input.value='';};
 el('chat-export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({version:1,messages:chat.messages},null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='ruby-conversation.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 mountAiPack({tauri:globalThis.__TAURI__,document,onReady:connect,onBusy:value=>{packBusy=value;engineSelect.disabled=value||!!chat.active;},onStop:()=>{chat.stop();model.replaceChildren();render();}});
 // Setup downloads only after the user presses Download AI.
 render();return {open,stop:()=>chat.stop(),refresh:render};
}

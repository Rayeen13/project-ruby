// Host operations stay outside the renderer; browser hosts expose none of them.
export function createDesktopHost(tauri) {
 if(typeof tauri?.core?.invoke!=='function'||typeof tauri?.event?.listen!=='function')return null;
 const allowed=new Set(['float','lab','drag','click_through','hide','stop','toggle_pin','snap_left','snap_right','undock','peek','reveal','release','zoom_in','zoom_out','size_reset','chat_open','chat_close','size_small','size_medium','size_large','size_extra_large']);
 return Object.freeze({
  window:action=>['status','minimize','maximize_toggle','fullscreen_toggle','fullscreen_exit','close'].includes(action)?tauri.core.invoke('studio_window_action',{action}):Promise.reject(new Error('Unsupported window action')),
  body:body=>tauri.core.invoke('desktop_body',{body}),
  status:()=>tauri.core.invoke('desktop_status'),
  move:(dx,dy)=>{
   if(!Number.isFinite(dx)||!Number.isFinite(dy)||Math.abs(dx)>240||Math.abs(dy)>240)return Promise.reject(new Error('Invalid companion movement'));
   return tauri.core.invoke('desktop_move',{dx,dy});
  },
  action:action=>{
   if(!allowed.has(action))return Promise.reject(new Error('Unsupported desktop action'));
   return tauri.core.invoke('desktop_action',{action});
  },
  listen:callback=>tauri.event.listen('ruby-desktop-status',event=>callback(event.payload)),
  listenPointer:callback=>tauri.event.listen('ruby-global-pointer',event=>callback(event.payload))
 });
}

export async function mountDesktopControls({host,document,onMode,onStop,onPointer,onState=()=>{}}) {
 if(!host)return;
 const controls=document.querySelector('#desktop-controls'),toolbar=document.querySelector('#floating-toolbar');
 const statusText=document.querySelector('#desktop-status'),floatStatus=document.querySelector('#floating-status');
 for(const item of document.querySelectorAll('[data-native-only]'))item.hidden=false;
 controls.hidden=false;document.querySelector('#desktop-window-actions').hidden=false;
 let previousMode;
 const apply=status=>{
  const floating=status.floating===true;
  document.documentElement.classList.toggle('floating',floating);
  toolbar.hidden=true;
  for(const menu of document.querySelectorAll('.native-menu'))menu.hidden=!floating;
  document.querySelector('#click-through').disabled=!status.shortcutReady||!floating;
  document.querySelector('#menu-click-through').disabled=!status.shortcutReady||!floating;
  const text=status.clickThrough?'Click-through · Ctrl+Alt+Shift+R restores interaction':status.stopped?'Stopped · interaction restored':status.shortcutReady?'Ctrl+Alt+Shift+R stops animation and restores interaction':'Recovery shortcut unavailable · click-through disabled';
  statusText.textContent=text;floatStatus.textContent=text;
  if(floating!==previousMode){onMode(floating);previousMode=floating;}
  onState(status);
  for(const slider of document.querySelectorAll('[data-companion-size]')){const index=status.size<.85?0:status.size<1.18?1:status.size<1.55?2:3;slider.value=String(index);slider.setAttribute('aria-valuetext',['Small','Medium','Large','Extra large'][index]);}for(const label of document.querySelectorAll('[data-size-label]'))label.textContent=status.size<.85?'Small':status.size<1.18?'Medium':status.size<1.55?'Large':'Extra large';
  for(const button of document.querySelectorAll('[data-desktop-action="toggle_pin"]')){button.textContent=status.pinned?'Unpin from top':'Pin above windows';button.setAttribute('aria-pressed',String(status.pinned));}
  if(status.stopped)onStop();
 };
 let pending=false,queuedSize=null;
 const run=async action=>{
  if(pending){if(action.startsWith('size_'))queuedSize=action;return;}
  pending=true;
  try{apply(await host.action(action));}
  catch(error){statusText.textContent=error.message||String(error);floatStatus.textContent=statusText.textContent;}
  finally{pending=false;if(queuedSize){const next=queuedSize;queuedSize=null;void run(next);}}
 };
 for(const slider of document.querySelectorAll('[data-companion-size]'))slider.oninput=()=>run(['size_small','size_medium','size_large','size_extra_large'][Number(slider.value)]);
 for(const button of document.querySelectorAll('[data-desktop-action]')){
  if(button.dataset.desktopAction==='drag'){
   button.addEventListener('pointerdown',event=>{if(event.button===0)run('drag');});
   button.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' ')floatStatus.textContent='Drag this handle with the pointer. The tray can reopen the lab.';});
  }else button.addEventListener('click',()=>run(button.dataset.desktopAction));
 }
 try{
  // Subscribe first so tray/shortcut changes cannot be lost during initialization.
  const unlisten=await host.listen(apply);
  window.addEventListener('pagehide',unlisten,{once:true});
  const stopPointer=await host.listenPointer(onPointer);window.addEventListener('pagehide',stopPointer,{once:true});
  apply(await host.status());
 }catch(error){statusText.textContent='Desktop controls unavailable: '+(error.message||String(error));}
}

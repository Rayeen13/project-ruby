// Host operations stay outside the renderer; browser hosts expose none of them.
export function createDesktopHost(tauri) {
 if(typeof tauri?.core?.invoke!=='function'||typeof tauri?.event?.listen!=='function')return null;
 const allowed=new Set(['float','lab','drag','click_through','hide','stop']);
 return Object.freeze({
  status:()=>tauri.core.invoke('desktop_status'),
  action:action=>{
   if(!allowed.has(action))return Promise.reject(new Error('Unsupported desktop action'));
   return tauri.core.invoke('desktop_action',{action});
  },
  listen:callback=>tauri.event.listen('ruby-desktop-status',event=>callback(event.payload))
 });
}

export async function mountDesktopControls({host,document,onMode,onStop}) {
 if(!host)return;
 const controls=document.querySelector('#desktop-controls'),toolbar=document.querySelector('#floating-toolbar');
 const statusText=document.querySelector('#desktop-status'),floatStatus=document.querySelector('#floating-status');
 controls.hidden=false;
 const apply=status=>{
  const floating=status.floating===true;
  document.documentElement.classList.toggle('floating',floating);
  toolbar.hidden=!floating;
  document.querySelector('#click-through').disabled=!status.shortcutReady||!floating;
  const text=status.clickThrough?'Click-through · Ctrl+Alt+Shift+R restores interaction':status.stopped?'Stopped · interaction restored':status.shortcutReady?'Ctrl+Alt+Shift+R stops animation and restores interaction':'Recovery shortcut unavailable · click-through disabled';
  statusText.textContent=text;floatStatus.textContent=text;
  onMode(floating);
  if(status.stopped)onStop();
 };
 let pending=false;
 const run=async action=>{
  if(pending)return;
  pending=true;
  try{apply(await host.action(action));}
  catch(error){statusText.textContent=error.message||String(error);floatStatus.textContent=statusText.textContent;}
  finally{pending=false;}
 };
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
  apply(await host.status());
 }catch(error){statusText.textContent='Desktop controls unavailable: '+(error.message||String(error));}
}

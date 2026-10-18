// Narrow native adapter; browsers use the standard Fullscreen API.
export function mountWindowFrame({document,window,host}){
 const root=document.documentElement,frame=document.querySelector('#studio-window-frame'),notice=document.querySelector('#window-status');let busy=false;
 if(host){root.classList.add('native-studio');frame.hidden=false;}
 async function refresh(){if(!host)return;try{const state=await host.window('status');root.dataset.fullscreen=String(state.fullscreen);const max=document.querySelector('#window-maximize');max.textContent=state.maximized?'❐':'□';max.setAttribute('aria-label',state.maximized?'Restore window':'Maximize window');}catch(error){notice.textContent=error.message||String(error);}}
 async function run(action){if(busy)return;busy=true;try{if(host){if(action==='fullscreen_toggle'&&(await host.status()).floating)await host.action('lab');await host.window(action);await refresh();}else if(action==='fullscreen_toggle'){if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else throw Error('Fullscreen is unavailable in this browser.');}}catch(error){notice.textContent=error.message||String(error);}finally{busy=false;}}
 const key=event=>{if(event.key==='F11'&&host){event.preventDefault();if(!event.repeat)void run('fullscreen_toggle');}else if(event.key==='Escape'&&host&&root.dataset.fullscreen==='true'){event.preventDefault();void run('fullscreen_exit');}};
 const drag=event=>{if(event.button===0&&host&&event.detail<2)void host.action('drag').catch(error=>{notice.textContent=String(error);});};
 const title=document.querySelector('#window-drag');title.onpointerdown=drag;title.ondblclick=()=>void run('maximize_toggle');
 const buttons=[...document.querySelectorAll('[data-window-action]')];for(const button of buttons)button.onclick=()=>void run(button.dataset.windowAction);
 document.querySelector('#web-fullscreen').hidden=!!host||!document.documentElement.requestFullscreen;
 window.addEventListener('keydown',key);window.addEventListener('resize',refresh);void refresh();
 return {dispose(){window.removeEventListener('keydown',key);window.removeEventListener('resize',refresh);title.onpointerdown=null;title.ondblclick=null;for(const b of buttons)b.onclick=null;}};
}

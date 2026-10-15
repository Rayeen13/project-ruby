export function mountAiPack({tauri,document,onReady,onStop,onBusy=()=>{}}){
 if(!tauri)return null;
 const el=id=>document.getElementById(id),section=el('ai-pack-section');let running=false;
 section.hidden=false;el('chat-browser-setup').hidden=true;
 function apply(status){
  const busy=running||['downloading','verifying','starting'].includes(status.phase);onBusy(busy);
  section.dataset.phase=status.phase;
  el('ai-pack-status').textContent=status.detail;
  el('ai-pack-download').textContent=status.installed?'Download / repair':'Download AI · about 511 MB';
  el('ai-pack-download').disabled=busy||status.phase==='ready';
  el('ai-pack-start').hidden=!status.installed||status.phase==='ready';el('ai-pack-start').disabled=busy;
  el('ai-pack-stop').hidden=!busy&&status.phase!=='ready';
  el('ai-pack-stop').textContent=busy?'Cancel setup':'Stop / unload AI';
  const progress=el('ai-pack-progress');progress.hidden=!busy;
  if(status.total>0){progress.max=status.total;progress.value=status.downloaded;el('ai-pack-bytes').textContent=(status.downloaded/1000000).toFixed(1)+' / '+(status.total/1000000).toFixed(1)+' MB';}
  else{progress.removeAttribute('value');el('ai-pack-bytes').textContent='';}
 }
 async function refresh(){const status=await tauri.core.invoke('ai_pack_status');apply(status);return status;}
 async function run(download){
  if(running)return;running=true;apply({phase:'verifying',detail:'Preparing your local AI…',installed:!download,total:0,downloaded:0});
  try{await tauri.core.invoke('ai_pack_run',{download});running=false;await refresh();await onReady();}
  catch(error){running=false;try{await refresh();}catch{}el('ai-pack-status').textContent=String(error);}
 }
 el('ai-pack-download').onclick=()=>run(true);el('ai-pack-start').onclick=()=>run(false);
 el('ai-pack-stop').onclick=async()=>{onStop();await tauri.core.invoke('ai_pack_stop');await refresh();};
 void tauri.event.listen('ruby-ai-pack',event=>apply(event.payload)).then(unlisten=>window.addEventListener('pagehide',unlisten,{once:true}));
 void refresh().catch(error=>{el('ai-pack-status').textContent=String(error);});
 return {refresh};
}

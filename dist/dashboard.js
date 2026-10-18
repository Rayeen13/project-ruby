export function mountDashboard({document,userProfile,themePrisms,workspaceSnapshot}){
 const el=id=>document.getElementById(id);let queued=false,disposed=false;
 function render(){if(disposed)return;queued=false;const current=workspaceSnapshot();el('dashboard-welcome').textContent=userProfile.read().displayName?'Welcome, '+userProfile.read().displayName+'.':'Your companion, your space.';el('dashboard-companion').textContent=current.name;el('dashboard-identity').textContent=current.identityKind==='humanoid'?'Humanoid character · own identity':'Gem identity · interchangeable robot shell';el('dashboard-shell').textContent=current.body;el('dashboard-personality').textContent=current.personality;el('dashboard-prisms').textContent=String(themePrisms.list().length);const select=el('chat-model');el('dashboard-ai').textContent=select.value?'Selected · '+(select.selectedOptions[0]?.textContent||select.value):'Setup needed';el('dashboard-voice').textContent=el('voice-enabled').checked?'Spoken replies enabled':'Spoken replies off';}
 function schedule(){if(!queued&&!disposed){queued=true;queueMicrotask(render);}}
 for(const type of ['change','click','prismy-profile-changed','prismy-prisms-changed'])document.addEventListener(type,schedule);
 const observer=new MutationObserver(schedule);observer.observe(el('chat-model'),{childList:true,subtree:true});render();
 return {refresh:render,dispose(){disposed=true;observer.disconnect();for(const type of ['change','click','prismy-profile-changed','prismy-prisms-changed'])document.removeEventListener(type,schedule);}};
}

(async()=>{
 const checks=[];
 const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const assert=(value,message)=>{if(!value)throw new Error(message);checks.push(message);};
 try{
  for(let i=0;i<200&&!document.querySelector('#stage')?.dataset.ready;i++)await wait(100);
  const stage=document.querySelector('#stage'),menu=document.querySelector('#model-menu'),select=document.querySelector('#model-select');
  assert(stage.dataset.ready==='true','Actual WebView renderer initialized');
  assert((await window.__TAURI__.core.invoke('desktop_status')).floating,'Executable opens directly as floating mascot');
  await window.__TAURI__.core.invoke('desktop_action',{action:'lab'});await wait(350);
  document.querySelector('#reset-preferences').click();await wait(300);
  assert(document.querySelectorAll('#model-gallery [data-model]').length===5,'Gallery lists all five accepted bodies');
  document.querySelector('[data-category="Professional"]').click();
  assert([...document.querySelectorAll('#model-gallery [data-model]')].filter(card=>!card.hidden).length===1,'Category filter shows matching bodies');
  document.querySelector('[data-model="office"]').click();
  assert(select.value==='office'&&document.querySelector('#personality-select').value==='focused','Gallery changes body and its default personality');
  const persona=document.querySelector('#personality-select');persona.value='calm';persona.dispatchEvent(new Event('change'));await wait(300);
  document.querySelector('[data-category="All"]').click();document.querySelector('[data-model="gamer"]').click();
  assert(persona.value==='playful','Another body keeps its own personality');document.querySelector('[data-model="office"]').click();
  assert(persona.value==='calm','Personality override survives body switching');
  assert(JSON.parse(localStorage.getItem('project-ruby.preferences.v1')).personalities.office==='calm','Personality override is saved');

  for(const id of ['classic','cyber','chibi','office','gamer']){
   select.value=id;select.dispatchEvent(new Event('change',{bubbles:true}));await wait(300);
   const r=stage.getBoundingClientRect(),x=r.left+r.width*.5,y=r.top+r.height*.45;
   document.querySelector('#interaction-feedback').textContent='';
   stage.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,pointerId:70,clientX:x,clientY:y}));
   stage.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,button:0,pointerId:70,clientX:x,clientY:y}));
   assert(document.querySelector('#interaction-feedback').textContent.length>0,id+': real mesh tap reacts');
   stage.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:x,clientY:y,button:2}));
   assert(!menu.hidden,id+': mesh right-click opens bubble');
   assert(menu.querySelector('[data-interaction="wave"]').disabled===(id==='classic'),id+': wave respects hands');
   menu.querySelector('[data-interaction="sleep"]').click();await wait(100);
   assert(menu.hidden&&document.querySelector('#status').textContent.includes('Sleepy'),id+': sleep action works');
   stage.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:x,clientY:y,button:2}));
   menu.querySelector('[data-interaction="wake"]').click();
   assert(document.querySelector('#status').textContent.includes('Curious'),id+': wake action works');
  }
  const r=stage.getBoundingClientRect(),x=r.left+r.width*.5,y=r.top+r.height*.45;
  stage.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,pointerId:71,altKey:true,clientX:x,clientY:y}));
  window.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerId:71,clientX:x+40,clientY:y}));
  stage.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,button:0,pointerId:71,clientX:x+40,clientY:y}));await wait(250);
  assert(Number.parseInt(document.querySelector('#degrees').textContent)<0,'Alt-drag retains corrected orbit direction');
  document.querySelector('#reset').click();await wait(200);
  stage.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:r.left+5,clientY:r.top+5,button:2}));
  assert(menu.hidden,'Empty background never opens model menu');
  stage.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:x,clientY:y,button:2}));
  await window.__TAURI__.core.invoke('desktop_smoke_checkpoint',{phase:'menu'});await wait(2500);
  menu.querySelector('[data-interaction="dance"]').click();assert(document.querySelector('#animate').checked,'Dance resumes animation');
  stage.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:x,clientY:y,button:2}));
  menu.querySelector('[data-interaction="stop"]').click();assert(!document.querySelector('#animate').checked&&!document.querySelector('#follow').checked,'Menu stop disables movement and tracking');
  document.querySelector('#animate').checked=true;document.querySelector('#follow').checked=true;
  await window.__TAURI__.core.invoke('desktop_action',{action:'float'});await wait(250);
  assert(document.documentElement.classList.contains('floating'),'Native floating mode renders compact UI');
  assert(getComputedStyle(document.querySelector('#floating-toolbar')).display==='none','Floating companion has no permanent toolbar frame');
  await window.__TAURI__.core.invoke('desktop_smoke_checkpoint',{phase:'float'});await wait(2500);
  await window.__TAURI__.core.invoke('desktop_smoke_checkpoint',{phase:'look'});await wait(650);
  const globalPointer=JSON.parse(stage.dataset.globalPointer||'null');assert(globalPointer?.x<0&&globalPointer?.y>0,'Native gaze receives pointer outside the companion window');
  document.querySelector('#interaction-feedback').textContent='';
  await window.__TAURI__.core.invoke('desktop_smoke_checkpoint',{phase:'click'});
  let neverGrabbed=true,grounded=true;for(let i=0;i<50;i++){neverGrabbed&&=stage.dataset.grabbed!=='true';grounded&&=Math.abs(Number(stage.dataset.rootY))<.001;await wait(20);}assert(neverGrabbed,'Quick mouse tap never enters grab state');assert(grounded,'Quick mouse tap keeps robot grounded');assert(document.querySelector('#interaction-feedback').textContent.length>0,'Real Windows click reaches robot touch handler');
  await window.__TAURI__.core.invoke('desktop_smoke_checkpoint',{phase:'carry'});
  for(let i=0;i<80&&stage.dataset.grabbed!=='true';i++)await wait(100);
  assert(stage.dataset.grabbed==='true','Real Windows mouse hold grabs the model');
  for(let i=0;i<80&&(stage.dataset.dizzy!=='true'||stage.dataset.grabbed==='true');i++)await wait(100);
  assert(stage.dataset.dizzy==='true'&&stage.dataset.grabbed==='false','Real Windows carry/shake releases into dizzy reaction');
  await window.__TAURI__.core.invoke('desktop_smoke_checkpoint',{phase:'dizzy'});await wait(2500);
  for(let i=0;i<50&&stage.dataset.dizzy==='true';i++)await wait(100);
  assert(stage.dataset.dizzy==='false','Dizzy reaction recovers automatically');
  await window.__TAURI__.core.invoke('desktop_action',{action:'click_through'});
  await window.__TAURI__.core.invoke('desktop_smoke_checkpoint',{phase:'recovery'});
  for(let i=0;i<100;i++){if((await window.__TAURI__.core.invoke('desktop_status')).stopped)break;await wait(100);}
  const state=await window.__TAURI__.core.invoke('desktop_status');assert(!state.clickThrough&&state.stopped,'Real recovery shortcut restores click-through');
  assert(!document.querySelector('#animate').checked&&!document.querySelector('#follow').checked,'Real shortcut pauses animation and tracking');
  await window.__TAURI__.core.invoke('desktop_action',{action:'lab'});await wait(250);
  assert(!document.documentElement.classList.contains('floating'),'Native lab restores full controls');
  await window.__TAURI__.core.invoke('desktop_smoke_report',{passed:true,details:checks.join('\n')});
 }catch(error){await window.__TAURI__.core.invoke('desktop_smoke_report',{passed:false,details:checks.join('\n')+'\nFAIL: '+error.message});}
})();

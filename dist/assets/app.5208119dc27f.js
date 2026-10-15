import {CompanionPhysics} from './companion-physics.5208119dc27f.js';
import {mountCompanionChat} from './companion-chat.5208119dc27f.js';
import {fitDistance,placeCamera} from './camera-fit.5208119dc27f.js';
import {MascotMotion} from './mascot-motion.5208119dc27f.js';
import {GrabState,GrabVisual,drawDizzyFace,HOLD_TO_GRAB_MS,DRAG_TO_GRAB_PX,mayStartGrab} from './companion-grab.5208119dc27f.js';
import {personalityFor} from './personalities.5208119dc27f.js';
import {mountCompanionGallery} from './companion-gallery.5208119dc27f.js';
import {orbitYaw,characterHit,touchPart,TouchReaction,mountModelMenu} from './interactions.5208119dc27f.js';
import {createDesktopHost,mountDesktopControls} from './desktop-host.5208119dc27f.js';
import * as T from '../vendor/three.module.js';
import {createRenderer,renderCanvasSurfaces} from './renderer.5208119dc27f.js';
import {GEM_PROFILES} from './character.5208119dc27f.js';
import {CharacterSelection, CHARACTER_MODELS} from './character-registry.5208119dc27f.js';
import {HAND_GESTURES} from './character-capabilities.5208119dc27f.js';
import {Greeting} from './greeting.5208119dc27f.js';
import {DEFAULT_PREFERENCES,loadPreferences,savePreferences,normalizePreferences} from './preferences.5208119dc27f.js';
try {
const preferenceOptions={models:CHARACTER_MODELS.map(m=>m.id),profiles:GEM_PROFILES.map(p=>p.id),moods:['idle','happy','listen','sleep'],gestures:HAND_GESTURES};
let storage;try{storage=window.localStorage;}catch{}
const greeting=new Greeting(),reaction=new TouchReaction(),motion=new MascotMotion();
const loaded=loadPreferences(storage,preferenceOptions),preferences=loaded.state;
let handPoses={...preferences.gestures},personalities={...preferences.personalities},saveTimer,gallery;
const desktopHost=createDesktopHost(window.__TAURI__),grab=new GrabState();
const reducedMotion=matchMedia('(prefers-reduced-motion:reduce)');
let voiceComputing=false;if(window.__TAURI__)void window.__TAURI__.event.listen('ruby-voice-compute',event=>{voiceComputing=event.payload===true;}).then(unlisten=>window.addEventListener('pagehide',unlisten,{once:true}));
const persona=()=>personalityFor(personalities[selection.spec.id]);

const stage=document.querySelector('#stage'),{renderer,software,lowPower}=createRenderer();const mobile=matchMedia('(pointer:coarse)').matches;renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.25:1.75));if(!software){renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;}else{document.querySelector('#render-mode').textContent='Software 3D · reduced frame rate';}stage.append(renderer.domElement);const scene=new T.Scene(),camera=new T.PerspectiveCamera(35,1,.1,100);scene.add(new T.HemisphereLight(0xcceeff,0x242235,software?.65:3));const key=new T.DirectionalLight(0xffe7da,software?.8:4);key.position.set(3,7,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);scene.add(key);const fill=new T.DirectionalLight(0x9ad8ff,software?.45:2);fill.position.set(-4,3,-3);scene.add(fill);const grid=new T.GridHelper(18,36,0x29434c,0x152630);grid.position.y=-.2;scene.add(grid);const selection=new CharacterSelection(scene);let ruby=selection.active;const platform=new T.Mesh(new T.CylinderGeometry(1.85,1.95,.13,80),new T.MeshStandardMaterial({color:0x2d3c49,roughness:.75}));platform.position.y=-.12;platform.receiveShadow=true;scene.add(platform);const ring=new T.Mesh(new T.TorusGeometry(1.79,.012,8,100),new T.MeshBasicMaterial({color:0xff5278}));ring.rotation.x=Math.PI/2;ring.position.y=-.05;scene.add(ring);
const grabVisual=new GrabVisual(scene),physics=new CompanionPhysics();
let chatUI=null,chatState='idle',chatMood=null;
let floating=false,nativeState={pinned:true,edge:null,peeking:false},lastZoom=0;
async function nativeAction(action){try{await desktopHost?.action(action);}catch(error){document.querySelector('#interaction-feedback').textContent=error.message||String(error);}}
let lastPaint=0;let yaw=0,pitch=.16,distance=8.7,drag=false,last={x:0,y:0},pointer={x:0,y:0},pointerTarget={x:0,y:0},danceUntil=0,turning=false,time=0,prev=performance.now();const angle=document.querySelector('#angle');function reset(){physics.reset(ruby);grab.clear();grabVisual.reset(ruby);yaw=0;pitch=.16;distance=8.7;turning=false;angle.value=0;saveSettings();}function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(stage);resize();const touches=new Map();let tap=null,longPressTimer,holdTimer;
let moveQueue={x:0,y:0},moving=false;
async function moveNative(dx,dy){
 moveQueue.x+=dx;moveQueue.y+=dy;if(moving)return;moving=true;
 try{while((moveQueue.x||moveQueue.y)&&grab.held){const x=Math.max(-240,Math.min(240,moveQueue.x)),y=Math.max(-240,Math.min(240,moveQueue.y));moveQueue.x-=x;moveQueue.y-=y;await desktopHost.move(x,y);}}
 catch(error){grab.end();document.querySelector('#interaction-feedback').textContent=error.message||'Could not move the companion.';}
 finally{moving=false;moveQueue={x:0,y:0};}
}
function beginGrab(e){if(!mayStartGrab(tap,e.pointerId)||grab.held)return;grab.begin(e.screenX,e.screenY,performance.now());tap.moved=true;document.querySelector('#animate').checked=true;stage.classList.add('grabbing');say(persona().grab);}
let bubbleUntil=0;
function say(text){document.querySelector('#companion-bubble').textContent=text;bubbleUntil=performance.now()+3400;document.querySelector('#companion-bubble').hidden=false;}
const pick=(x,y)=>characterHit(ruby.root,camera,stage.getBoundingClientRect(),x,y);
function react(kind){document.querySelector('#animate').checked=true;reaction.trigger(kind,time);document.querySelector('#interaction-feedback').textContent=kind==='pet'?'Happy head pat!':'Boop!';say(kind==='pet'?persona().pat:'Boop! You got me.');saveSettings();}
function interactionAction(action){
 if(action==='chat'){chatUI?.open();return;}
 if(action==='pet'||action==='boop')react(action);
 if(action==='wave'&&selection.capabilities.wave){document.querySelector('#animate').checked=true;greeting.trigger(time);saveSettings();}
 if(action==='dance'){document.querySelector('#animate').checked=true;danceUntil=time+5;motion.dance(time);saveSettings();}
 if(action==='sleep'){reaction.clear();changeMood('sleep');saveSettings();}
 if(action==='wake'){reaction.clear();changeMood('idle');document.querySelector('#animate').checked=true;document.querySelector('#follow').checked=true;saveSettings();}
 if(action==='home'){reset();return;}
 if(action==='dizzy'){grab.dizzyUntil=performance.now()+3800;document.querySelector('#animate').checked=true;say('Woah… give me a moment!');return;}
 if(action==='stop'){chatUI?.stop();grab.clear();grabVisual.reset(ruby);stage.classList.remove('grabbing');document.querySelector('#companion-bubble').hidden=true;greeting.clear();reaction.clear();motion.clear();modelMenu.close();danceUntil=0;turning=false;document.querySelector('#animate').checked=false;document.querySelector('#follow').checked=false;saveSettings();}
}
const modelMenu=mountModelMenu({stage,menu:document.querySelector('#model-menu'),pick,act:interactionAction,capabilities:()=>selection.capabilities,onOpen:()=>{clearTimeout(holdTimer);grab.end();stage.classList.remove('grabbing');if(tap)tap.menu=true;drag=false;}});
let pinchDistance=0;const pinchLength=()=>{const [a,b]=[...touches.values()];return Math.hypot(a.x-b.x,a.y-b.y);};
stage.addEventListener('pointerdown',e=>{
 if(e.button!==0)return;
 clearTimeout(holdTimer);clearTimeout(longPressTimer);
 touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(touches.size===2){pinchDistance=pinchLength();if(tap)tap.moved=true;clearTimeout(longPressTimer);clearTimeout(holdTimer);grab.end();stage.classList.remove('grabbing');}
 drag=touches.size===1;last={x:e.clientX,y:e.clientY};
 if(touches.size===1){const hit=pick(e.clientX,e.clientY);tap={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false,menu:false,orbit:!hit||e.altKey};
  if(hit&&!e.altKey){
   if(e.pointerType==='touch')longPressTimer=setTimeout(()=>{if(tap&&!tap.moved){tap.menu=modelMenu.open(tap.x,tap.y);drag=false;}},550);
   else {const press=tap;holdTimer=setTimeout(()=>{if(tap===press&&!press.moved)beginGrab(e);},HOLD_TO_GRAB_MS);}
  }
 }
 try{stage.setPointerCapture(e.pointerId);}catch{}
});
const endPointer=e=>{
 clearTimeout(longPressTimer);clearTimeout(holdTimer);
 if(grab.held){grab.end();if(floating)nativeAction('release');stage.classList.remove('grabbing');if(e.type==='pointerup')say(grab.dizzy(performance.now())?'Woah… give me a moment!':persona().release);}
 else if(e.type==='pointerup'&&tap?.id===e.pointerId&&!tap.moved&&!tap.menu){const hit=pick(e.clientX,e.clientY);if(hit){const part=touchPart(ruby,hit.object);if(part==='hand'&&selection.capabilities.wave)interactionAction('wave');else react(part==='head'?'pet':'boop');}}
 touches.delete(e.pointerId);tap=null;drag=false;pinchDistance=0;saveSettings();
};
stage.addEventListener('pointerup',endPointer);stage.addEventListener('pointercancel',endPointer);window.addEventListener('pointerup',e=>{if(tap?.id===e.pointerId)endPointer(e);});window.addEventListener('pointercancel',e=>{if(tap?.id===e.pointerId)endPointer(e);});stage.addEventListener('lostpointercapture',e=>{if(tap?.id===e.pointerId)endPointer(e);});
window.addEventListener('blur',()=>{clearTimeout(longPressTimer);clearTimeout(holdTimer);grab.end();stage.classList.remove('grabbing');touches.clear();tap=null;drag=false;});
window.addEventListener('pointermove',e=>{
 if(tap&&Math.hypot(e.clientX-tap.x,e.clientY-tap.y)>DRAG_TO_GRAB_PX){clearTimeout(longPressTimer);clearTimeout(holdTimer);if(!tap.moved&&!tap.orbit&&touches.size===1)beginGrab({pointerId:e.pointerId,screenX:e.screenX,screenY:e.screenY});tap.moved=true;}
 if(tap?.menu)return;
 if(touches.has(e.pointerId)){touches.set(e.pointerId,{x:e.clientX,y:e.clientY});if(touches.size===2){const next=pinchLength();if(next>0&&pinchDistance>0)distance=T.MathUtils.clamp(distance*pinchDistance/next,4.5,12);pinchDistance=next;return;}}
 const r=stage.getBoundingClientRect();if(!desktopHost)pointerTarget={x:T.MathUtils.clamp((e.clientX-r.left)/r.width*2-1,-1,1),y:T.MathUtils.clamp(1-(e.clientY-r.top)/r.height*2,-1,1)};
 if(grab.held&&tap?.id===e.pointerId){const wasDizzy=grab.dizzy(performance.now());const delta=grab.move(e.screenX,e.screenY,performance.now(),{width:r.width,height:r.height,native:floating});if(floating)moveNative(delta.dx,delta.dy);if(!wasDizzy&&grab.dizzy(performance.now()))say('Woah… give me a moment!');return;}
 if(drag&&tap?.moved&&tap.orbit){turning=false;yaw=orbitYaw(yaw,e.clientX-last.x);pitch=T.MathUtils.clamp(pitch+(e.clientY-last.y)*.005,-.15,.85);last={x:e.clientX,y:e.clientY};}
});
stage.addEventListener('wheel',e=>{e.preventDefault();if(floating){if(performance.now()-lastZoom>80){lastZoom=performance.now();nativeAction(e.deltaY<0?'zoom_in':'zoom_out');}}else{distance=T.MathUtils.clamp(distance+e.deltaY*.008,4.5,12);saveSettings();}},{passive:false});stage.addEventListener('dblclick',()=>{reset();if(floating)nativeAction('size_reset');});
document.querySelector('#physics-drop').onclick=()=>{document.querySelector('#animate').checked=true;physics.drop(ruby,1.2);};document.querySelector('#reset').onclick=reset;angle.oninput=()=>{turning=false;yaw=Number(angle.value)*Math.PI/180;saveSettings()};document.querySelector('#turn').onclick=()=>{turning=!turning;if(!turning)saveSettings()};document.querySelector('#dance').onclick=()=>interactionAction('dance');document.querySelectorAll('[data-mood]').forEach(b=>b.onclick=()=>{changeMood(b.dataset.mood);saveSettings();});
document.querySelector('#wave').onclick=()=>interactionAction('wave');
const swatches=document.querySelector('.swatches');swatches.replaceChildren();for(const profile of GEM_PROFILES){const button=document.createElement('button');button.dataset.profile=profile.id;button.textContent=profile.name;button.style.setProperty('--gem-color',profile.color);const dot=document.createElement('i');dot.style.background=profile.color;button.prepend(dot);swatches.append(button);}
document.querySelectorAll('[data-profile]').forEach(b=>b.onclick=()=>{const id=b.dataset.profile;const preset={jasper:{body:'gamer',personality:'playful'},jet:{body:'office',personality:'focused'},opal:{body:'opal',personality:'sarcastic'}}[id];if(preset){personalities[preset.body]=preset.personality;modelSelect.value=preset.body;modelSelect.dispatchEvent(new Event('change'));}changeProfile(id);saveSettings();});

const modelSelect=document.querySelector('#model-select');
// Build categories from the registry so new designs are added, not substituted.
modelSelect.replaceChildren();
for(const category of [...new Set(CHARACTER_MODELS.map(m=>m.category))]){
 const group=document.createElement('optgroup');group.label=category;
 for(const model of CHARACTER_MODELS.filter(m=>m.category===category)){
  const option=document.createElement('option');option.value=model.id;option.textContent=model.name;group.append(option);
 }modelSelect.append(group);
}
function updateModelUI(){
 document.documentElement.style.setProperty('--companion-ratio',({classic:340/390,cyber:310/430,chibi:320/430,office:310/395,gamer:360/450,opal:320/450})[selection.spec.id]);
 if(desktopHost)void desktopHost.body(selection.spec.id).catch(error=>{document.querySelector('#interaction-feedback').textContent=String(error);});
 modelSelect.value=selection.spec.id;gallery?.update();
 const wave=document.querySelector('#wave');wave.disabled=!selection.capabilities.wave;
 wave.title=selection.capabilities.wave?'Wave hello':'The classic body has no hands';
 document.querySelector('#model-caption').textContent=selection.spec.name;
 document.querySelector('#model-description').textContent=selection.spec.description;
 document.querySelector('#print-download').href='./prints/'+selection.spec.id+'-120mm.stl';
 document.querySelector('#print-download').download=selection.spec.id+'-120mm.stl';
 document.querySelector('#unit-name').textContent=ruby.profile.name+' '+selection.spec.revision;
}
const handSide=document.querySelector('#hand-side'),handGesture=document.querySelector('#hand-gesture');
function applyHandPoses(){for(const side of [-1,1])selection.setHandGesture(handPoses[side===-1?'right':'left'],side);}
function updateGestureUI(){
 const side=Number(handSide.value),caps=selection.capabilities,locked=caps.heldProp?.side===side;
 handSide.disabled=!caps.hands;handGesture.disabled=!caps.hands||locked;
 handGesture.value=locked?caps.heldProp.gesture:handPoses[side===-1?'right':'left'];
 document.querySelector('#gesture-note').textContent=!caps.hands?'This body has no hands.':locked?'Right hand keeps its controller grip. Try the left hand.':caps.heldProp?'Left-hand poses stay active while the right hand waves with its controller.':'Wave temporarily opens the right palm; the selected pose returns afterward.';
}
function changeMood(mood){
 selection.setMood(mood);document.querySelectorAll('[data-mood]').forEach(b=>b.classList.toggle('active',b.dataset.mood===mood));
 document.querySelector('#status').textContent='● '+document.querySelector(`[data-mood="${mood}"]`).textContent;
}
function changeProfile(id){
 const p=GEM_PROFILES.find(p=>p.id===id);selection.setProfile(id);ring.material.color.set(p.color);
 document.querySelector('#character-name').textContent=p.name;document.querySelector('#gem-name').textContent=p.gem+' / GEM SERIES';document.querySelector('#companion-bubble').hidden=true;
 document.querySelector('#unit-name').textContent=p.name+' '+selection.spec.revision;document.documentElement.style.setProperty('--accent',p.color);
 document.querySelectorAll('[data-profile]').forEach(b=>b.classList.toggle('selected',b.dataset.profile===id));chatMood=null;chatUI?.refresh();
}
function snapshot(){return normalizePreferences({version:1,model:selection.spec.id,profile:selection.profileId,mood:selection.mood,
 follow:document.querySelector('#follow').checked,animate:document.querySelector('#animate').checked,
 handSide:Number(handSide.value),gestures:handPoses,personalities,camera:{yaw:T.MathUtils.euclideanModulo(yaw+Math.PI,2*Math.PI)-Math.PI,pitch,distance}},preferenceOptions);}
function saveSettings(){
 clearTimeout(saveTimer);saveTimer=setTimeout(()=>{
  document.querySelector('#preference-status').textContent=savePreferences(storage,snapshot(),preferenceOptions)?'Saved on this device.':'Saving is unavailable; controls still work. You can export preferences.';
 },160);
}
function applyPreferences(state){
 grab.clear();grabVisual.reset(ruby);personalities={...state.personalities};ruby=selection.select(state.model);greeting.clear();reaction.clear();motion.clear();modelMenu.close();danceUntil=0;turning=false;
 handPoses={...state.gestures};handSide.value=String(state.handSide);changeMood(state.mood);changeProfile(state.profile);
 yaw=state.camera.yaw;pitch=state.camera.pitch;distance=state.camera.distance;angle.value=Math.round(yaw*180/Math.PI);
 document.querySelector('#follow').checked=state.follow;document.querySelector('#animate').checked=state.animate;
 applyHandPoses();updateModelUI();updateGestureUI();
}
modelSelect.onchange=e=>{grab.clear();grabVisual.reset(ruby);ruby=selection.select(e.target.value);greeting.clear();reaction.clear();motion.clear();modelMenu.close();danceUntil=0;applyHandPoses();updateModelUI();updateGestureUI();chatMood=null;chatUI?.refresh();saveSettings();};
handSide.onchange=()=>{updateGestureUI();saveSettings();};
handGesture.onchange=()=>{
 const side=Number(handSide.value);if(selection.setHandGesture(handGesture.value,side))handPoses[side===-1?'right':'left']=handGesture.value;
 updateGestureUI();saveSettings();
};
for(const id of ['follow','animate'])document.querySelector('#'+id).onchange=saveSettings;
document.querySelector('#reset-preferences').onclick=()=>{applyPreferences(normalizePreferences(DEFAULT_PREFERENCES,preferenceOptions));saveSettings();};
document.querySelector('#export-preferences').onclick=()=>{
 const blob=new Blob([JSON.stringify(snapshot(),null,2)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='project-ruby-preferences.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
gallery=mountCompanionGallery({models:CHARACTER_MODELS,select:modelSelect,onModel:id=>{modelSelect.value=id;modelSelect.dispatchEvent(new Event('change'));},getPersonality:()=>personalities[selection.spec.id],onPersonality:id=>{personalities[selection.spec.id]=id;gallery.update();say(persona().pat);saveSettings();}});
applyPreferences(preferences);
chatUI=mountCompanionChat({document,storage,identity:()=>({name:ruby.profile.name,body:selection.spec.name,personality:persona(),profile:selection.profileId,bodyId:selection.spec.id}),onExpression:mood=>{chatMood=mood;},onClose:async()=>{if(desktopHost)await nativeAction('chat_close');},onState:state=>{chatState=state;stage.dataset.chatState=state;},onOpen:async()=>{modelMenu.close();if(desktopHost)await nativeAction('chat_open');},onExpand:async()=>{if(floating)await nativeAction('lab');}});
document.querySelector('#preference-status').textContent=loaded.available?'Preferences stay on this device.':'Saving is unavailable; controls still work. You can export preferences.';
mountDesktopControls({host:desktopHost,document,
 onState:value=>{nativeState=value;stage.dataset.pinned=String(value.pinned);stage.dataset.edge=value.edge||'none';stage.dataset.peeking=String(value.peeking);document.documentElement.dataset.dockEdge=value.floating&&value.peeking?value.edge||'none':'none';},
 onPointer:value=>{if(Number.isFinite(value?.x)&&Number.isFinite(value?.y)){pointerTarget={x:T.MathUtils.clamp(value.x,-1,1),y:T.MathUtils.clamp(value.y,-1,1)};stage.dataset.globalPointer=JSON.stringify(pointerTarget);}},
 onMode:value=>{grab.clear();grabVisual.reset(ruby);floating=value;if(value){document.querySelector('#follow').checked=true;document.querySelector('#animate').checked=true;}grid.visible=!value;platform.visible=!value;ring.visible=!value;resize();},
 onStop:()=>{chatUI?.stop();grab.clear();grabVisual.reset(ruby);stage.classList.remove('grabbing');document.querySelector('#companion-bubble').hidden=true;greeting.clear();reaction.clear();motion.clear();modelMenu.close();danceUntil=0;turning=false;document.querySelector('#animate').checked=false;document.querySelector('#follow').checked=false;saveSettings();}
});
function frame(now){requestAnimationFrame(frame);if(document.hidden){prev=now;return;}const fps=voiceComputing?(software||lowPower?1:15):(software||lowPower?8:30);if(now-lastPaint<1000/fps)return;lastPaint=now;const elapsed=Math.max(0,(now-prev)/1000),dt=Math.min(elapsed,.05);prev=now;const running=document.querySelector('#animate').checked;if(running){time+=elapsed;if(turning)yaw+=elapsed*.6;}const gazeBlend=1-Math.exp(-12*dt);pointer.x+=(pointerTarget.x-pointer.x)*gazeBlend;pointer.y+=(pointerTarget.y-pointer.y)*gazeBlend;ruby.setMood(reaction.moodAt(time)||(['thinking','replying','speaking'].includes(chatState)?(chatState==='thinking'?'listen':chatState==='speaking'&&chatMood&&chatMood!=='idle'?chatMood:'happy'):chatMood)||selection.mood);ruby.update(time*persona().tempo,{pointer,follow:document.querySelector('#follow').checked&&!grab.held&&!grab.dizzy(now),dance:false,waveWeight:greeting.weightAt(time),dt});reaction.apply(ruby.root,time);reaction.applyHead(ruby.head,time,{reduced:reducedMotion.matches});motion.apply(ruby,time,dt,{held:grab.held,reduced:reducedMotion.matches,edge:floating?nativeState.edge:null,peeking:nativeState.peeking});placeCamera(camera,distance,yaw,pitch);grabVisual.apply(ruby,grab,camera,stage.getBoundingClientRect(),distance,now,{native:floating,reduced:reducedMotion.matches});const contact=physics.apply(ruby,dt,{held:grab.held,enabled:!floating&&document.querySelector('#physics-enabled').checked});stage.dataset.grounded=String(contact.grounded);const fitted=Math.max(floating?8.7:distance,fitDistance(ruby.root,camera.aspect,yaw,pitch));placeCamera(camera,fitted,yaw,pitch);stage.dataset.cameraDistance=String(fitted);stage.dataset.headYaw=String(ruby.head.rotation.y);if(grab.dizzy(now))drawDizzyFace(ruby,reducedMotion.matches?0:now);stage.dataset.expression=ruby.mood;stage.dataset.personality=persona().id;document.querySelector('#stage').dataset.rootY=String(ruby.root.position.y);document.querySelector('#stage').dataset.grabbed=String(grab.held);document.querySelector('#stage').dataset.dizzy=String(grab.dizzy(now));if(now>bubbleUntil)document.querySelector('#companion-bubble').hidden=true;const deg=Math.round(T.MathUtils.euclideanModulo(yaw*180/Math.PI+180,360)-180);document.querySelector('#degrees').textContent=deg+'°';if(document.activeElement!==angle)angle.value=deg;if(software)ruby.root.traverse(o=>{if(o.isMesh&&o.geometry.type==='PlaneGeometry')o.visible=false;});renderer.render(scene,camera);if(floating)renderer.domElement.style.backgroundColor='transparent';if(software){ruby.root.traverse(o=>{if(o.isMesh&&o.geometry.type==='PlaneGeometry')o.visible=true;});renderCanvasSurfaces(renderer,ruby.root,camera);}}requestAnimationFrame(frame);stage.dataset.ready='true';
}catch(e){document.querySelector('#error').textContent='The 3D preview could not start. Please enable WebGL in your browser. '+e.message;}

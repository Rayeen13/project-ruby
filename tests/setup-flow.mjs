import {selectedVoice} from '../dist/voice-catalogue.js';
import assert from 'node:assert/strict';
import {mountApplicationSetup,SETUP_KEY} from '../dist/application-setup.js';
class Element {
 constructor(){this.dataset={};this.children=[];this.value='';this.hidden=false;this.classList={toggle(){}};}
 append(...children){this.children.push(...children);}
 replaceChildren(...children){this.children=[...children];}
 setAttribute(){}
 dispatchEvent(){}
 get options(){return this.children;}
}
const elements=new Map(),document={getElementById:id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);},createElement:()=>new Element()};
const el=document.getElementById,originalWindow=globalThis.window;globalThis.window={addEventListener(){}};
const calls=[],saved=new Map(),state={data:{voiceChoices:{},speak:false},save(){}},engineSelect=new Element(),modelSelect=new Element();engineSelect.value='ruby';modelSelect.append(Object.assign(new Element(),{value:'current',textContent:'Current LLM'}));modelSelect.value='current';
let resolveStatus,pending=true;
const tauri={event:{async listen(){return ()=>{};}},core:{async invoke(command){calls.push(command);if(command==='ai_pack_status')return pending?new Promise(resolve=>resolveStatus=resolve):{installed:true,phase:'ready'};if(command==='voice_pack_status')return {installed:true};}}};
try{
 const setup=mountApplicationSetup({document,storage:{setItem:(k,v)=>saved.set(k,v)},tauri,state,identity:()=>({name:'Ruby',gender:'female',profile:'ruby'}),engines:[{id:'ruby',name:'Ruby'},{id:'ollama',name:'Ollama'}],engineSelect,modelSelect,connect:async()=>{modelSelect.value='current';}});
 const running=el('setup-run').onclick();assert(el('setup-custom').inert,'Choices freeze during setup');await el('setup-cancel').onclick();resolveStatus({installed:false,phase:'stopped'});await running;
 assert(!calls.includes('ai_pack_run'),'Cancelling while checking cache cannot start a later download');assert(!calls.includes('voice_pack_download'));assert.match(el('setup-status').textContent,/stopped/);assert.equal(el('setup-run').disabled,false);
 pending=false;calls.length=0;await el('setup-run').onclick();assert(!calls.includes('ai_pack_run'),'Already running LLM is reused');assert(!calls.includes('voice_pack_download'),'Installed VoiceM is reused');assert.equal(JSON.parse(saved.get(SETUP_KEY)).preset,'recommended');assert.equal(state.data.speak,true);
 el('setup-presets').children.find(c=>c.dataset?.preset==='custom');
 // Fake elements retain data attributes exactly as the DOM does.
 el('setup-presets').children[1].onclick();modelSelect.append(Object.assign(new Element(),{value:'second',textContent:'Second LLM'}));setup.refresh();el('setup-model').value='second';el('setup-voice').value='af_bella';await el('setup-run').onclick();
 assert.equal(modelSelect.value,'second','Chosen model survives connection refresh');assert.equal(selectedVoice({profile:'ruby',gender:'female'},state.data.voiceChoices).id,'af_bella','Chosen VoiceM survives connection refresh');assert.equal(JSON.parse(saved.get(SETUP_KEY)).model,'second');
 console.log('Setup flow: early cancellation, frozen choices, installed-file reuse and Custom model/voice preservation passed.');
}finally{globalThis.window=originalWindow;}

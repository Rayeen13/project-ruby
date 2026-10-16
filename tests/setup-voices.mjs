import assert from 'node:assert/strict';
import {voicesFor,defaultVoice,selectedVoice} from '../dist/voice-catalogue.js';
import {CompanionState,parseExpression} from '../dist/companion-state.js';
import {systemMessage,contextMessages} from '../dist/conversation.js';
import {SETUP_PRESETS} from '../dist/application-setup.js';
const state=new CompanionState({getItem:()=>null});
for(const profile of ['ruby','saph','emme','amy','jasper','jet','opal']){
 const identity=state.identity({name:profile,profile,personality:{prompt:'Be useful.'}});
 assert(voicesFor(identity).length>=4);assert(voicesFor(identity).every(v=>v.gender===identity.gender));
 assert.equal(defaultVoice(identity).gender,identity.gender);
 assert.equal(selectedVoice(identity,{[profile]:identity.gender==='male'?'af_heart':'am_puck'}).gender,identity.gender);
 assert(!/\[(?:happy|curious|neutral)\]/.test(systemMessage(identity)));
}
const bad=[{role:'user',content:'introduce ur self'},{role:'assistant',status:'complete',content:"I'm [neutral] and always [neutral]."}];
assert(!contextMessages(bad,state.identity({profile:'ruby',personality:{prompt:''}})).some(m=>m.content.includes("I'm [neutral]")),'Malformed legacy replies cannot teach the next response');
assert.equal(parseExpression("I'm [female] from [Project Ruby].").text,"I'm female from Project Ruby.");
assert.equal(parseExpression('Answer [1]. Use array[0].').text,'Answer [1]. Use array[0].');
assert.deepEqual(SETUP_PRESETS.map(p=>p.id),['recommended','custom','pro','lite']);
console.log('Setup voices: gender isolation, per-Companion defaults, invalid override recovery and clean prompt/history passed.');

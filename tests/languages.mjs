import assert from 'node:assert/strict';
import {LocalLangM,needsTranslation,voicePackFor} from '../dist/languages.js';
import {CompanionState} from '../dist/companion-state.js';
import {systemMessage} from '../dist/conversation.js';
import {voicesFor,selectedVoice,voiceChoiceKey} from '../dist/voice-catalogue.js';
let request;const source='Hello, welcome back.';const langm=new LocalLangM({model:()=> 'free-local-model',provider:()=>({async *stream(r){request=r;yield 'おかえりなさい。';}})});
assert.equal(await langm.translate(source,'ja',{signal:new AbortController().signal}),'おかえりなさい。');assert.equal(source,'Hello, welcome back.');assert.equal(request.model,'free-local-model');assert.match(request.messages[0].content,/Japanese/);assert.equal(request.messages[1].content,source);assert(!request.messages.some(m=>m.content.includes('owner secret')));
assert(needsTranslation(source,'ja','en'));assert(!needsTranslation(source,'en','en'));assert(!needsTranslation('こんにちは。','ja'));
const bad=new LocalLangM({model:()=> 'weak-local-model',provider:()=>({async *stream(){yield 'I cannot translate this.';}})});await assert.rejects(bad.translate(source,'ja',{signal:new AbortController().signal}),/did not return Japanese/);
let saved;const storage={getItem:()=>saved,setItem:(_,v)=>saved=v};const state=new CompanionState(storage);state.data.textLanguage='en';state.data.voiceLanguage='ja';state.data.voiceEngine='supertonic3';state.save();const copy=new CompanionState(storage);assert.equal(copy.data.textLanguage,'en');assert.equal(copy.data.voiceLanguage,'ja');
for(const language of ['en','ja','zh'])for(const gender of ['female','male'])for(const voiceEngine of ['kokoro','supertonic3']){
 const i={profile:'opal',gender,voiceLanguage:language,voiceEngine};const voices=voicesFor(i);assert(voices.length>=4);assert(voices.every(v=>v.gender===gender&&v.pack===voicePackFor(i)));assert(voices.every(v=>v.language==='multi'||v.language===language));
 const chosen=voices.at(-1);assert.equal(selectedVoice(i,{[voiceChoiceKey(i)]:chosen.id}).id,chosen.id);assert.equal(selectedVoice(i,{opal:gender==='male'?'af_heart':'am_puck'}).gender,gender);
}
const message=systemMessage(copy.identity({profile:'opal',personality:{prompt:'Be witty.'}}));assert.match(message,/Reply in English/);assert(!message.includes('Reply in Japanese'),'Displayed response language is independent from spoken translation');
console.log('PASS: local LangM isolation, separate text/voice languages, persisted settings and language/gender voice filtering.');

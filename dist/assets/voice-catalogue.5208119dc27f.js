import {voicePackFor} from './languages.5208119dc27f.js';
// Explicit speaker metadata from the Kokoro publisher and Sherpa v1.0 voice table.
export const VOICES=Object.freeze([
 {id:'af_heart',name:'Heart',gender:'female',accent:'US',style:'Warm · expressive',sid:3},
 {id:'af_bella',name:'Bella',gender:'female',accent:'US',style:'Bright · confident',sid:2},
 {id:'af_sarah',name:'Sarah',gender:'female',accent:'US',style:'Clear · composed',sid:9},
 {id:'bf_emma',name:'Emma',gender:'female',accent:'UK',style:'Soft · measured',sid:21},
 {id:'am_michael',name:'Michael',gender:'male',accent:'US',style:'Steady · conversational',sid:16},
 {id:'am_fenrir',name:'Fenrir',gender:'male',accent:'US',style:'Grounded · confident',sid:14},
 {id:'am_puck',name:'Puck',gender:'male',accent:'US',style:'Lively · playful',sid:18},
 {id:'bm_george',name:'George',gender:'male',accent:'UK',style:'Composed · articulate',sid:26},
 {id:'zf_xiaobei',name:'Xiaobei',gender:'female',accent:'Chinese',style:'Chinese voice',sid:45,language:'zh'},
 {id:'zf_xiaoni',name:'Xiaoni',gender:'female',accent:'Chinese',style:'Chinese voice',sid:46,language:'zh'},
 {id:'zf_xiaoxiao',name:'Xiaoxiao',gender:'female',accent:'Chinese',style:'Chinese voice',sid:47,language:'zh'},
 {id:'zf_xiaoyi',name:'Xiaoyi',gender:'female',accent:'Chinese',style:'Chinese voice',sid:48,language:'zh'},
 {id:'zm_yunjian',name:'Yunjian',gender:'male',accent:'Chinese',style:'Chinese voice',sid:49,language:'zh'},
 {id:'zm_yunxi',name:'Yunxi',gender:'male',accent:'Chinese',style:'Chinese voice',sid:50,language:'zh'},
 {id:'zm_yunxia',name:'Yunxia',gender:'male',accent:'Chinese',style:'Chinese voice',sid:51,language:'zh'},
 {id:'zm_yunyang',name:'Yunyang',gender:'male',accent:'Chinese',style:'Chinese voice',sid:52,language:'zh'},
 ...['female','male'].flatMap((gender,g)=>Array.from({length:5},(_,i)=>({id:'st_'+(g?'m':'f')+(i+1),name:'Character '+(i+1),gender,accent:'Japanese / English',style:'Original character preset',sid:g*5+i,pack:'supertonic3',language:'multi'})))
].map(v=>Object.freeze({pack:'kokoro',language:'en',...v})));
export const voicesFor=identity=>VOICES.filter(v=>v.gender===(identity.gender==='male'?'male':'female')&&v.pack===voicePackFor(identity)&&(v.language==='multi'||v.language===(identity.voiceLanguage||'en')));
export const voiceChoiceKey=identity=>[identity.profile,identity.voiceLanguage||'en',voicePackFor(identity)].join(':');
const ACTING_VOICES={calm:['bf_emma','bm_george'],focused:['af_sarah','bm_george'],playful:['af_heart','am_puck'],sarcastic:['af_bella','am_michael'],deredere:['af_heart','am_puck'],tsundere:['af_bella','am_fenrir'],kuudere:['af_sarah','bm_george'],dandere:['bf_emma','am_michael'],yandere:['af_bella','am_michael'],himedere:['bf_emma','bm_george'],oujidere:['bf_emma','bm_george'],kamidere:['af_bella','am_fenrir'],bakadere:['af_heart','am_puck'],hajidere:['bf_emma','am_michael'],shundere:['af_sarah','bm_george'],nyandere:['af_heart','am_puck']};
export function defaultVoice(identity){
 const available=voicesFor(identity);if(voicePackFor(identity)==='supertonic3'||identity.voiceLanguage==='zh')return available[0];
 const acting=ACTING_VOICES[identity.personality?.id];
 if(acting)return voicesFor(identity).find(v=>v.id===acting[identity.gender==='male'?1:0]);
 const id=identity.gender==='male'?({jasper:'am_puck',jet:'bm_george',saph:'am_michael'}[identity.profile]||'am_fenrir'):({ruby:'af_heart',emme:'bf_emma',amy:'af_sarah',opal:'af_bella'}[identity.profile]||'af_heart');
 return voicesFor(identity).find(v=>v.id===id)||voicesFor(identity)[0];
}
export function selectedVoice(identity,choices={}){return voicesFor(identity).find(v=>v.id===(choices[voiceChoiceKey(identity)]||choices[identity.profile]))||defaultVoice(identity);}

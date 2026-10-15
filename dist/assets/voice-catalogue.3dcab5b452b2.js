// Explicit speaker metadata from the Kokoro publisher and Sherpa v1.0 voice table.
export const VOICES=Object.freeze([
 {id:'af_heart',name:'Heart',gender:'female',accent:'US',style:'Warm · expressive',sid:3},
 {id:'af_bella',name:'Bella',gender:'female',accent:'US',style:'Bright · confident',sid:2},
 {id:'af_sarah',name:'Sarah',gender:'female',accent:'US',style:'Clear · composed',sid:9},
 {id:'bf_emma',name:'Emma',gender:'female',accent:'UK',style:'Soft · measured',sid:21},
 {id:'am_michael',name:'Michael',gender:'male',accent:'US',style:'Steady · conversational',sid:16},
 {id:'am_fenrir',name:'Fenrir',gender:'male',accent:'US',style:'Grounded · confident',sid:14},
 {id:'am_puck',name:'Puck',gender:'male',accent:'US',style:'Lively · playful',sid:18},
 {id:'bm_george',name:'George',gender:'male',accent:'UK',style:'Composed · articulate',sid:26}
].map(Object.freeze));
export const voicesFor=identity=>VOICES.filter(v=>v.gender===(identity.gender==='male'?'male':'female'));
export function defaultVoice(identity){
 const id=identity.gender==='male'?({jasper:'am_puck',jet:'bm_george',saph:'am_michael'}[identity.profile]||'am_fenrir'):({ruby:'af_heart',emme:'bf_emma',amy:'af_sarah',opal:'af_bella'}[identity.profile]||'af_heart');
 return voicesFor(identity).find(v=>v.id===id)||voicesFor(identity)[0];
}
export function selectedVoice(identity,choices={}){return voicesFor(identity).find(v=>v.id===choices[identity.profile])||defaultVoice(identity);}

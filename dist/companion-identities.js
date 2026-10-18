import {personalityFor} from './personalities.js';
// Identity belongs to a gem, never to a robot shell. Humanoids own their identity.
export const COMPANION_IDENTITIES=Object.freeze([
 {id:'ruby',name:'Ruby',gem:'Ruby',color:'#ff5278',gender:'female',age:24,personality:'playful'},
 {id:'saph',name:'Saph',gem:'Sapphire',color:'#529dff',gender:'male',age:25,personality:'calm'},
 {id:'emme',name:'Emme',gem:'Emerald',color:'#42efb2',gender:'female',age:26,personality:'calm'},
 {id:'amy',name:'Amy',gem:'Amethyst',color:'#bf86ff',gender:'female',age:24,personality:'curious'},
 {id:'jasper',name:'Jasper',gem:'Jasper',color:'#ffaf66',gender:'male',age:27,personality:'playful'},
 {id:'jet',name:'Jet',gem:'Jet',color:'#96b8cc',gender:'male',age:28,personality:'focused'},
 {id:'opal',name:'Opal',gem:'Opal',color:'#b4b8ff',gender:'female',age:25,personality:'sarcastic',bodyId:'opal',role:'anime maid android'}
].map(Object.freeze));
export const companionFor=id=>COMPANION_IDENTITIES.find(p=>p.id===id)||COMPANION_IDENTITIES[0];
export const entityForBody=id=>id?COMPANION_IDENTITIES.find(p=>p.bodyId===id):undefined;
export const robotProfile=id=>COMPANION_IDENTITIES.some(p=>p.id===id&&!p.bodyId)?id:'ruby';
export function effectiveProfile(bodyId,profile){return entityForBody(bodyId)?.id||(!bodyId&&companionFor(profile).bodyId?profile:robotProfile(profile));}
export function resolveCompanionIdentity(base){const spec=companionFor(effectiveProfile(base.bodyId,base.profile));return {...base,profile:spec.id,name:spec.name,personality:base.profile!==spec.id?personalityFor(spec.personality):base.personality,gender:spec.gender,age:spec.age,role:spec.role||'robot companion',identityKind:spec.bodyId?'humanoid':'gem'};}

import {COMPANION_IDENTITIES,effectiveProfile,robotProfile,entityForBody} from './companion-identities.js';
import {normalizeWardrobe} from './wardrobe.js';
import {PERSONALITIES,DEFAULT_PERSONALITIES} from './personalities.js';
export const DEFAULT_PREFERENCES=Object.freeze({
 version:1,model:'gamer',profile:'ruby',robotProfile:'ruby',robotModel:'gamer',identityPersonalities:Object.freeze(Object.fromEntries(COMPANION_IDENTITIES.map(p=>[p.id,p.personality]))),mood:'idle',follow:true,animate:true,
 wardrobe:Object.freeze(normalizeWardrobe()),handSide:1,gestures:Object.freeze({right:'relaxed',left:'relaxed'}),
 camera:Object.freeze({yaw:0,pitch:.16,distance:8.7}),personalities:DEFAULT_PERSONALITIES
});
const finite=(value,fallback,min,max)=>typeof value==='number'&&Number.isFinite(value)?Math.min(max,Math.max(min,value)):fallback;
export function normalizePreferences(value,{models,profiles,moods,gestures}){
 const d=DEFAULT_PREFERENCES,v=value?.version===1?value:{};
 const pick=(list,value,fallback)=>list.includes(value)?value:fallback;
 const model=pick(models,v.model,d.model),rememberedProfile=robotProfile(v.robotProfile||v.profile),rememberedModel=pick(models.filter(id=>!entityForBody(id)),v.robotModel,entityForBody(model)?'gamer':model);
 const identityPersonalities=Object.fromEntries(COMPANION_IDENTITIES.map(p=>[p.id,pick(PERSONALITIES.map(item=>item.id),v.identityPersonalities?.[p.id],p.personality)]));
 if(!v.identityPersonalities){const active=effectiveProfile(model,v.profile);identityPersonalities[active]=pick(PERSONALITIES.map(p=>p.id),v.personalities?.[model],identityPersonalities[active]);if(v.personalities?.opal)identityPersonalities.opal=pick(PERSONALITIES.map(p=>p.id),v.personalities.opal,'sarcastic');}
 return {
  version:1,wardrobe:normalizeWardrobe(v.wardrobe),model,profile:effectiveProfile(model,pick(profiles,v.profile,d.profile)),robotProfile:entityForBody(model)?rememberedProfile:effectiveProfile(model,v.profile),robotModel:entityForBody(model)?rememberedModel:model,identityPersonalities,mood:pick(moods,v.mood,d.mood),
  follow:typeof v.follow==='boolean'?v.follow:d.follow,animate:typeof v.animate==='boolean'?v.animate:d.animate,
  handSide:v.handSide===-1||v.handSide===1?v.handSide:d.handSide,
  gestures:{right:pick(gestures,v.gestures?.right,d.gestures.right),left:pick(gestures,v.gestures?.left,d.gestures.left)},
  camera:{yaw:finite(v.camera?.yaw,d.camera.yaw,-Math.PI,Math.PI),pitch:finite(v.camera?.pitch,d.camera.pitch,-.15,.85),distance:finite(v.camera?.distance,d.camera.distance,2,18)},
  personalities:Object.fromEntries(models.map(id=>[id,pick(PERSONALITIES.map(p=>p.id),v.personalities?.[id],DEFAULT_PERSONALITIES[id]||'curious')]))
 };
}
export const PREFERENCES_KEY='project-ruby.preferences.v1';
export function loadPreferences(storage,options){
 let text;
 try{text=storage?.getItem(PREFERENCES_KEY);}catch{return {state:normalizePreferences(null,options),available:false};}
 try{return {state:normalizePreferences(JSON.parse(text||'null'),options),available:!!storage};}
 catch{return {state:normalizePreferences(null,options),available:!!storage};}
}
export function savePreferences(storage,value,options){
 try{if(!storage)return false;storage.setItem(PREFERENCES_KEY,JSON.stringify(normalizePreferences(value,options)));return true;}
 catch{return false;}
}

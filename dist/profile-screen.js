import {parseUserProfile} from './user-profile.js';
import {downloadThemeData} from './theme-creator.js';
export function mountProfileScreen({document,userProfile}){
 const el=id=>document.getElementById(id);let pending=null,request=0,disposed=false;
 const say=text=>{el('profile-status').textContent=text;};
 function render(){const profile=userProfile.read();el('profile-name').value=profile.displayName;el('profile-bio').value=profile.bio;el('profile-avatar').textContent=profile.displayName?profile.displayName.slice(0,2).toUpperCase():'◇';el('profile-display').textContent=profile.displayName||'Your local profile';document.dispatchEvent(new Event('prismy-profile-changed'));}
 el('profile-form').onsubmit=event=>{event.preventDefault();try{userProfile.save({displayName:el('profile-name').value,bio:el('profile-bio').value});render();say('Profile saved on this device. It is not sent to your LLM or a server.');}catch(error){say(error.message);}};
 el('profile-export').onclick=()=>downloadThemeData(document,'prismy-profile.json',userProfile.export());
 el('profile-import').onchange=async()=>{const token=++request,file=el('profile-import').files?.[0];pending=null;el('profile-review').hidden=true;if(!file)return;try{if(file.size>4096)throw Error('Choose a profile backup under 4 KB.');const value=parseUserProfile(await file.text());if(disposed||token!==request)return;pending=value;el('profile-review-text').textContent='Replace this device’s display profile with '+(value.displayName||'an unnamed profile')+'? Companion memory and settings stay unchanged.';el('profile-review').hidden=false;}catch(error){if(!disposed&&token===request)say(error.message);}};
 const reset=()=>{request++;pending=null;el('profile-import').value='';el('profile-review').hidden=true;};
 el('profile-import-apply').onclick=()=>{if(!pending)return;try{userProfile.save(pending);reset();render();say('Profile imported.');}catch(error){say(error.message);}};el('profile-import-cancel').onclick=reset;
 render();return {dispose(){disposed=true;reset();for(const id of ['profile-export','profile-import-apply','profile-import-cancel'])el(id).onclick=null;el('profile-form').onsubmit=null;el('profile-import').onchange=null;}};
}

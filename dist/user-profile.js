export const USER_PROFILE_KEY='prismy.user-profile.v1';
export function normalizeUserProfile(value){
 if(value?.version!==1)return {version:1,displayName:'',bio:''};
 return {version:1,displayName:typeof value.displayName==='string'?value.displayName.replace(/[\u0000-\u001f]/g,'').trim().slice(0,60):'',bio:typeof value.bio==='string'?value.bio.replace(/[\u0000-\u001f]/g,' ').trim().slice(0,240):''};
}
export function parseUserProfile(source){if(typeof source!=='string'||new TextEncoder().encode(source).length>4096)throw Error('Choose a profile backup under 4 KB.');let value;try{value=JSON.parse(source);}catch{throw Error('Invalid profile JSON.');}if(value?.schema!=='prismy.user-profile'||value.version!==1||typeof value.displayName!=='string'||typeof value.bio!=='string')throw Error('Unsupported profile backup.');return normalizeUserProfile(value);}
export class UserProfileStore{
 constructor(storage){this.storage=storage;try{this.value=normalizeUserProfile(JSON.parse(storage?.getItem(USER_PROFILE_KEY)||'null'));}catch{this.value=normalizeUserProfile(null);}}
 read(){return {...this.value};}
 save(value){const next=normalizeUserProfile({...value,version:1});try{if(!this.storage)throw Error();this.storage.setItem(USER_PROFILE_KEY,JSON.stringify(next));}catch{throw Error('Profile could not be saved. Your previous profile is unchanged.');}this.value=next;return this.read();}
 export(){return JSON.stringify({schema:'prismy.user-profile',...this.read()},null,2)+'\n';}
}

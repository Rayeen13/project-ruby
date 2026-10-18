import {resolveCompanionIdentity,COMPANION_IDENTITIES} from './companion-identities.js';
import {PERSONALITIES} from './personalities.js';
const validPersonality=id=>PERSONALITIES.some(p=>p.id===id);
// Ruby's portable identity seed. Not Kurumi's canonical 1 MiB DDNA binary format.
export const DDNA_KEY='project-ruby.ddna.seed.v1';
const cast=Object.fromEntries(COMPANION_IDENTITIES.map(p=>[p.id,[p.name,p.gender,p.age]]));
const profiles=Object.keys(cast);
const validId=id=>typeof id==='string'&&/^[a-zA-Z0-9-]{16,80}$/.test(id);
export function validateDDNA(value){
 if(value?.schema!=='ruby.ddna.seed'||value.version!==1||!Array.isArray(value.identities)||value.identities.length>64)throw Error('Unsupported DDNA seed backup.');
 const identities=value.identities.map(r=>{if(!validId(r?.id)||!profiles.includes(r.profile)||typeof r.createdAt!=='string'||!Number.isFinite(Date.parse(r.createdAt)))throw Error('Invalid Companion identity.');return {id:r.id,profile:r.profile,name:cast[r.profile][0],gender:cast[r.profile][1],age:cast[r.profile][2],createdAt:r.createdAt,origin:'Project Ruby',personality:{original:validPersonality(r.personality?.original)?r.personality.original:'curious',active:validPersonality(r.personality?.active)?r.personality.active:'curious'},values:['honesty','owner privacy','owner autonomy'],relationship:'friendly AI companion'};});
 if(new Set(identities.map(r=>r.id)).size!==identities.length)throw Error('Duplicate Companion identity.');
 const active={};for(const p of profiles){const id=value.active?.[p];if(id!==undefined){if(!identities.some(r=>r.id===id&&r.profile===p))throw Error('DDNA identity reference is invalid.');active[p]=id;}}
 return {schema:'ruby.ddna.seed',version:1,identities,active};
}
export class CompanionDNA{
 constructor(storage){this.storage=storage;this.saved=true;try{const raw=JSON.parse(storage?.getItem(DDNA_KEY)||'null');this.data=validateDDNA(raw);if(raw.identities.some(r=>r.profile==='opal'&&r.age!==18))this.save();}catch{this.data={schema:'ruby.ddna.seed',version:1,identities:[],active:{}};}}
 save(){try{this.storage.setItem(DDNA_KEY,JSON.stringify(this.data));this.saved=true;}catch{this.saved=false;}return this.saved;}
 resolve(identity){identity=resolveCompanionIdentity(identity);const profile=profiles.includes(identity.profile)?identity.profile:'ruby';let root=this.data.identities.find(r=>r.id===this.data.active[profile]);if(!root){root={id:globalThis.crypto.randomUUID(),profile,name:cast[profile][0],gender:cast[profile][1],age:cast[profile][2],createdAt:new Date().toISOString(),origin:'Project Ruby',personality:{original:identity.personality?.id||'curious',active:identity.personality?.id||'curious'},values:['honesty','owner privacy','owner autonomy'],relationship:'friendly AI companion'};this.data.identities.push(root);this.data.active[profile]=root.id;this.save();}if(root.personality.active!==identity.personality?.id){root.personality.active=identity.personality?.id||'curious';this.save();}return {...identity,name:root.name,gender:root.gender,age:root.age,ddnaId:root.id,values:root.values,relationship:root.relationship};}
 export(){return structuredClone(this.data);}
 merged(incoming){incoming=validateDDNA(incoming);return validateDDNA({...this.data,identities:[...this.data.identities.filter(r=>!incoming.identities.some(i=>i.id===r.id)),...incoming.identities],active:{...this.data.active,...incoming.active}});}
}

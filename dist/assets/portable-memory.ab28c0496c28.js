import {CompanionState,COMPANION_KEY} from './companion-state.ab28c0496c28.js';
import {CHAT_KEY,restoreConversation} from './conversation.ab28c0496c28.js';
import {DDNA_KEY,validateDDNA} from './ddna.ab28c0496c28.js';
export const BACKUP_KEY='project-ruby.before-memory-import.v1';
export function exportCompanionMemory({ddna,state,messages,preferences}){
 return {schema:'project-ruby.portable-companion',version:1,exportedAt:new Date().toISOString(),ddna:ddna.export(),brain:{owner:state.export(),dialogue:{version:1,messages}},preferences};
}
export function parseCompanionMemory(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>2_000_000)throw Error('Choose a Ruby backup under 2 MB.');
 let file=JSON.parse(text);if(file?.schema==='project-ruby.companion')file={schema:'project-ruby.portable-companion',version:1,ddna:{schema:'ruby.ddna.seed',version:1,identities:[],active:{}},brain:{owner:file,dialogue:{version:1,messages:[]}}};if(file?.schema!=='project-ruby.portable-companion'||file.version!==1||file.brain?.owner?.schema!=='project-ruby.companion'||!Array.isArray(file.brain?.owner?.memories)||!Array.isArray(file.brain?.dialogue?.messages))throw Error('Unsupported Companion memory backup.');
 const ddna=validateDDNA(file.ddna),state=new CompanionState({getItem:()=>JSON.stringify(file.brain.owner)});
 const messages=restoreConversation({getItem:()=>JSON.stringify(file.brain.dialogue)});
 return {ddna,owner:state.data,messages,preferences:file.preferences?.version===1?file.preferences:undefined,summary:`${ddna.identities.length} identities, ${state.data.memories.length} owner notes and ${messages.length} messages. Existing notes and dialogue will be merged. Matching gem profiles continue the imported identity.`};
}
export function mergeDialogue(existing,incoming){const seen=new Set();return [...existing,...incoming].filter(m=>{if(!m.id)return true;if(seen.has(m.id))return false;seen.add(m.id);return true;}).slice(-200);}
export function importCompanionMemory({file,storage,state,ddna,chat,getPreferences,applyPreferences}){
 const nextDNA=ddna.merged(file.ddna),nextNotes=[...new Set([...state.data.memories,...file.owner.memories])],nextMessages=mergeDialogue(chat.messages,file.messages);
 if(nextNotes.length>2048)throw Error('Merged memory exceeds 2,048 notes; export and review the notes first.');
 const previous=exportCompanionMemory({ddna,state,messages:chat.messages,preferences:getPreferences()});
 // Keep a recovery checkpoint before any mutation; failure to store it cancels import.
 storage.setItem(BACKUP_KEY,JSON.stringify(previous));
 const oldKeys=[DDNA_KEY,COMPANION_KEY,CHAT_KEY].map(key=>[key,storage.getItem(key)]);
 try{
  storage.setItem(DDNA_KEY,JSON.stringify(nextDNA));
  storage.setItem(COMPANION_KEY,JSON.stringify({...state.data,memories:nextNotes,feeling:state.data.feeling||file.owner.feeling}));
  storage.setItem(CHAT_KEY,JSON.stringify({version:1,messages:nextMessages}));
 }catch(error){for(const [key,value] of oldKeys){try{value===null?storage.removeItem(key):storage.setItem(key,value);}catch{}}throw Error('Memory import could not be saved. The recovery checkpoint is kept.');}
 ddna.data=nextDNA;state.data.memories=nextNotes;state.data.feeling=state.data.feeling||file.owner.feeling;chat.messages=nextMessages;
 if(file.preferences)applyPreferences(file.preferences);
 chat.emit();return previous;
}

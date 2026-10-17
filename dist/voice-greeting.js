const DB='project-ruby.greeting-audio.v1',STORE='audio',MAX_BYTES=1500000,MAX_ENTRIES=8;
export function greetingLine(identity){const name=String(identity.name||'Ruby').replace(/[<>\[\]]/g,'').slice(0,32),id=identity.personality?.id;
 if(identity.voiceLanguage==='ja')return `おかえりなさい。${name}です。今日もよろしくね。`;
 if(identity.voiceLanguage==='zh')return `欢迎回来。我是${name}。今天也一起加油吧。`;
 return ['sarcastic','tsundere','himedere'].includes(id)?`Oh, you're back. I'm ${name}. Try to keep up today.`:['playful','deredere','bakadere','nyandere'].includes(id)?`You're back! I'm ${name}. Ready for a little adventure?`:`Welcome back. I'm ${name}. Let's make today a good one.`;
}
export const greetingCacheKey=(text,voice)=>JSON.stringify(['greeting-v1',voice.pack,voice.voice,voice.language,voice.gender,voice.pace,text]);
export function createGreetingCache(indexedDB=globalThis.indexedDB){
 let database;const open=()=>database??=new Promise((resolve,reject)=>{if(!indexedDB)return reject(Error('Audio cache unavailable'));const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE,{keyPath:'key'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('Audio cache blocked'));});
 const transaction=async(mode,action)=>{const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,mode),store=tx.objectStore(STORE);let result;action(store,value=>{result=value;});tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});};
 return {
  async get(key){try{return await transaction('readonly',(s,set)=>{s.get(key).onsuccess=e=>set(e.target.result?.bytes);});}catch{return undefined;}},
  async put(key,bytes){if(!bytes?.length||bytes.length>MAX_BYTES)return;try{await transaction('readwrite',s=>{s.put({key,bytes:Uint8Array.from(bytes),at:Date.now()});s.getAll().onsuccess=e=>{const rows=e.target.result.sort((a,b)=>b.at-a.at);for(const row of rows.slice(MAX_ENTRIES))s.delete(row.key);};});}catch{}},
  async clear(){try{await transaction('readwrite',s=>s.clear());return true;}catch{return false;}}
 };
}
export class LaunchGreeting{
 constructor(){this.claimed=false;this.version=0;}
 cancel(){this.claimed=true;this.version++;}
 async run({enabled,available,play}){if(this.claimed||!enabled)return false;const version=this.version;if(!await available()||this.claimed||version!==this.version)return false;this.claimed=true;await play();return true;}
}

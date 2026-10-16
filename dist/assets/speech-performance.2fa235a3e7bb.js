import {speechChunks} from './speech-text.2fa235a3e7bb.js';
// A portable performance plan. Native Kokoro receives words, never unsupported direction tags.
const cues={
 softly:{pace:.91,mood:'listen',pauseMs:100},whisper:{pace:.88,mood:'listen',pauseMs:120},
 excited:{pace:1.08,mood:'happy',pauseMs:0},sarcastic:{pace:.96,mood:'idle',pauseMs:100},
 sigh:{pace:.92,mood:'listen',pauseMs:200,vocal:'Ah… '},
 chuckle:{pace:1.03,mood:'happy',pauseMs:100,vocal:'Heh. '},
 laugh:{pace:1.05,mood:'happy',pauseMs:100,vocal:'Ha, ha. '},
 groan:{pace:.9,mood:'listen',pauseMs:180,vocal:'Ugh… '},
 'groan heavily':{pace:.86,mood:'listen',pauseMs:250,vocal:'Ugh… '},
 gasp:{pace:1.05,mood:'listen',pauseMs:80,vocal:'Oh! '},
 sad:{pace:.9,mood:'listen',pauseMs:160},happy:{pace:1.04,mood:'happy',pauseMs:0},
 pause:{pace:1,mood:'idle',pauseMs:300}
};
const aliases={soft:'softly',whispers:'whisper',whispering:'whisper',sighs:'sigh',sighing:'sigh',chuckles:'chuckle',chuckling:'chuckle',laughs:'laugh',laughing:'laugh',groans:'groan',groaning:'groan',gasps:'gasp',gasping:'gasp',cheerfully:'happy',deadpan:'sarcastic',pauses:'pause'};
export function speechCue(value){let id=value.toLowerCase().trim().replace(/\s+/g,' ');id=aliases[id]||id;return cues[id]?{id,...cues[id]}:null;}
export function speechPlan(text,{first=100,rest=220}={}){
 const segments=[];let buffer='',cue=null;
 const flush=()=>{if(buffer.trim()){segments.push({text:buffer,cue});buffer='';}};
 for(const part of String(text).split(/(\[[^\]\n]{1,48}\]|\([^()\n]{1,48}\))/g)){
  const next=/^[\[(]/.test(part)?speechCue(part.slice(1,-1)):null;
  if(next){flush();cue=next;if(cue.vocal)buffer+=cue.vocal;}else buffer+=part;
 }
 flush();const plan=[];
 for(const segment of segments)for(const text of speechChunks(segment.text,{first:plan.length?rest:first,rest}))plan.push({text,cue:segment.cue});
 return plan;
}

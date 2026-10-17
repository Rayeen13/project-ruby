import assert from 'node:assert/strict';
import {speechChunks,OrderedSpeech,playSpeechBuffer} from '../dist/speech-queue.js';
const long='The opening sentence must be heard first. '+('The rest of the answer stays in order, including every sentence. '.repeat(40));
const parts=speechChunks(long);assert(parts[0].startsWith('The opening sentence'));assert(parts[0].length<=100);assert.equal(parts.join(''),long.trim());assert(parts.length>2);assert(parts.every(p=>p.length<=220));
assert.equal(speechChunks('Word [1]. Next line.').join(''),'Word . Next line.');
assert.equal(speechChunks('😃'.repeat(200)).join(''),'😃'.repeat(200));
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
const played=[],requested=[],ends=[];const queue=new OrderedSpeech({cancel:async()=>{},synthesize:async t=>{requested.push(t);return t;},play:(wav,{signal})=>{played.push(wav);const d=deferred();signal.addEventListener('abort',()=>d.resolve(),{once:true});ends.push(d);return d.promise;}});
const task=queue.speak(long);for(let i=0;i<20&&!ends.length;i++)await new Promise(r=>setImmediate(r));
assert.deepEqual(played,[parts[0]],'First audio buffer is always the opening phrase');assert.equal(requested.length,2,'Prefetch is bounded to one phrase');
for(let i=0;i<parts.length;i++){for(let j=0;j<20&&!ends[i];j++)await new Promise(r=>setImmediate(r));assert(ends[i]);ends[i].resolve();}
await task;assert.deepEqual(played,parts,'No skipped, duplicated or reordered phrases beyond the former 1500-character limit');
let oldNative=deferred(),started=[],releaseCancel;const gate=deferred();
const race=new OrderedSpeech({cancel:async()=>{if(releaseCancel)await gate.promise;},synthesize:async t=>{started.push(t);if(t==='Old opening.')return oldNative.promise;return t;},play:async()=>{}});
const old=race.speak('Old opening.');for(let i=0;i<20&&!started.length;i++)await new Promise(r=>setImmediate(r));
releaseCancel=true;const fresh=race.speak('New opening.');await new Promise(r=>setImmediate(r));assert.deepEqual(started,['Old opening.'],'New synthesis waits for previous cancellation and native call');
oldNative.resolve('obsolete');gate.resolve();await Promise.all([old,fresh]);assert.deepEqual(started,['Old opening.','New opening.']);
const starts=[];const context={currentTime:4,destination:{},resume:async()=>{},decodeAudioData:async bytes=>({bytes}),createBufferSource(){return {connect(){},disconnect(){},start(...args){starts.push(args);queueMicrotask(()=>this.onended?.());},stop(){}};}};
await playSpeechBuffer(context,[82,73,70,70]);assert.equal(starts[0][1],0,'Audio playback starts at sample zero, never a stale media position');
const bad={...context,createBufferSource:()=>({connect(){},disconnect(){},start(){throw Error('Device unavailable');}})};
await assert.rejects(playSpeechBuffer(bad,[1]),/Device unavailable/,'Playback errors cannot silently skip to a later phrase');
console.log('PASS: complete ordered speech, bounded prefetch, cancellation race and sample-zero playback.');
const {speechPlan}=await import('../dist/speech-performance.js');
const {PERSONALITIES}=await import('../dist/personalities.js');
const {voiceStyle}=await import('../dist/voice-provider.js');
const {defaultVoice}=await import('../dist/voice-catalogue.js');
const directed=speechPlan('[softly] The first words stay first. (chuckles) Another update? [groan heavily] Of course.');
assert(directed[0].text.startsWith('The first words'));assert.equal(directed[0].cue.id,'softly');assert(directed.some(p=>p.cue?.id==='groan heavily'&&p.text.includes('Ugh')));assert(directed.every(p=>!/[\[\]()]/.test(p.text)));
assert.equal(speechPlan('Keep (important detail) and [array] literal.')[0].text,'Keep (important detail) and [array] literal.');
for(const id of ['deredere','tsundere','kuudere','dandere','yandere','himedere','oujidere','kamidere','bakadere','hajidere','shundere','nyandere']){
 const personality=PERSONALITIES.find(p=>p.id===id);assert(personality);assert(personality.prompt);assert(personality.voicePace);
 for(const gender of ['female','male']){const i={profile:'opal',gender,personality};assert.equal(defaultVoice(i).gender,gender);assert.equal(voiceStyle(i).pace,personality.voicePace);}
}
console.log('PASS: supported delivery cues, literal parentheses, 12 archetypes and matched voice direction.');
const graph=[];const makeNode=kind=>({gain:{value:1},delayTime:{value:0},connect(to){graph.push([kind,to]);},disconnect(){graph.push(['disconnect',kind]);}});let appliedGain,appliedDelay;const dsp={...context,createGain(){const n=makeNode('gain');appliedGain??=n;return n;},createDelay(){return appliedDelay=makeNode('delay');}};await playSpeechBuffer(dsp,[1],{volume:.35,effect:'gentle-robot'});assert.equal(appliedGain.gain.value,.35);assert.equal(appliedDelay.delayTime.value,.013);assert(graph.some(x=>x[0]==='disconnect'&&x[1]==='delay'));console.log('PASS: saved volume reaches playback gain and gentle robot nodes disconnect.');

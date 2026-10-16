import {speechPlan} from './speech-performance.2aab6768d368.js';
export {speechChunks} from './speech-text.2aab6768d368.js';
export class OrderedSpeech{
 constructor({synthesize,play,cancel}){Object.assign(this,{synthesize,play,cancel});this.generation=0;this.inflight=null;this.barrier=Promise.resolve();this.controller=null;}
 stop(){
  this.generation++;this.controller?.abort();this.controller=null;
  // Cancellation must finish and the old native call must settle before a new one starts.
  const cancellation=Promise.resolve().then(()=>this.cancel());
  this.barrier=Promise.allSettled([this.barrier,this.inflight,cancellation]).then(()=>{});return this.barrier;
 }
 async speak(text,voice){
  const ready=this.stop(),token=this.generation,controller=new AbortController();this.controller=controller;
  const current=()=>token===this.generation&&!controller.signal.aborted;
  const synth=part=>{const delivery={...voice,pace:Math.max(.75,Math.min(1.5,(voice?.pace||1)*(part.cue?.pace||1)))};const task=Promise.resolve().then(()=>this.synthesize(part.text,delivery,controller.signal));this.inflight=task;void task.finally(()=>{if(this.inflight===task)this.inflight=null;}).catch(()=>{});return task;};
  await ready;if(!current())return;
  const chunks=speechPlan(text,voice?.language&&voice.language!=='en'?{first:70,rest:100}:undefined);if(!chunks.length)return;
  let bytes=await synth(chunks[0]);
  for(let i=0;i<chunks.length&&current();i++){
   const playing=this.play(bytes,{signal:controller.signal,text:chunks[i].text,cue:chunks[i].cue,index:i});
   // Only one phrase is prepared ahead. Synthesizing it cannot replace the currently playing buffer.
   const next=i+1<chunks.length?synth(chunks[i+1]).then(bytes=>({bytes}),error=>({error})):null;
   await playing;if(!current())return;
   if(next){const result=await next;if(!current())return;if(result.error)throw result.error;bytes=result.bytes;}
  }
 }
}
export async function playSpeechBuffer(context,bytes,{signal,pauseMs=0,onStart=()=>{}}={}){
 if(signal?.aborted)return;
 if(pauseMs)await new Promise(resolve=>{const finish=()=>{clearTimeout(timer);signal?.removeEventListener('abort',finish);resolve();};const timer=setTimeout(finish,pauseMs);signal?.addEventListener('abort',finish,{once:true});});
 if(signal?.aborted)return;await context.resume();
 const data=Uint8Array.from(bytes),buffer=await context.decodeAudioData(data.buffer);if(signal?.aborted)return;
 await new Promise((resolve,reject)=>{
  const source=context.createBufferSource();source.buffer=buffer;source.connect(context.destination);let done=false;
  const finish=error=>{if(done)return;done=true;signal?.removeEventListener('abort',abort);source.onended=null;source.disconnect();if(error)reject(error);else resolve();};
  const abort=()=>{try{source.stop();}catch{}finish();};
  source.onended=()=>finish();signal?.addEventListener('abort',abort,{once:true});
  try{source.start(context.currentTime+.025,0);onStart();}catch(error){finish(error);}
 });
}

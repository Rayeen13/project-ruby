const samples={en:'Welcome back. Let us take a short break.',ja:'おかえりなさい。少し休みましょう。',zh:'欢迎回来。我们休息一下吧。'};
const bounded=(value,max=80)=>typeof value==='string'?value.slice(0,max):'';
const milliseconds=value=>Number.isFinite(value)&&value>=0?Math.round(value):null;
export class VoiceCheck{
 constructor({play,onChange=()=>{},timestamp=()=>new Date().toISOString()}){Object.assign(this,{play,onChange,timestamp});this.sequence=0;this.active=0;this.value=null;}
 snapshot(){return this.value?JSON.parse(JSON.stringify(this.value)):null;}
 emit(){this.onChange(this.snapshot());}
 cancel(){if(!this.active)return;this.active=0;this.value.status='cancelled';this.emit();}
 async run(context){
  if(this.active)return false;
  const language=Object.hasOwn(samples,context.language)?context.language:'en',token=++this.sequence;this.active=token;
  this.value={schema:'prismy.voice-check',version:1,appVersion:'0.5.2',createdAt:this.timestamp(),status:'running',companion:bounded(context.companion),pack:bounded(context.pack),voice:bounded(context.voice),language,samples:[],note:'Two fixed local samples; no chat, owner memory or unique hardware identifiers. First sample may already be warm. Latency ends at scheduled playback and excludes hardware output buffering. No audio cache or translation is used.'};this.emit();
  try{
   for(let i=0;i<2;i++){
    const measurement=await this.play(samples[language],language);
    if(this.active!==token)return false;
    const firstAudioMs=milliseconds(measurement?.firstAudioMs),completeMs=milliseconds(measurement?.completeMs);
    if(firstAudioMs===null||completeMs===null||completeMs<firstAudioMs)throw Error('No completed voice measurement');
    this.value.samples.push({sample:i===0?'first':'repeat',firstAudioMs,completeMs,device:bounded(measurement.device,120)||'Not reported'});this.emit();
   }
   this.active=0;this.value.status='complete';this.emit();return true;
  }catch{
   if(this.active===token){this.active=0;this.value.status='failed';this.emit();}return false;
  }
 }
}
export function voiceCheckSummary(report){
 if(!report)return 'No measurements yet.';
 const timing=value=>value===undefined?'—':(value/1000).toFixed(1)+' s';
 const [first,repeat]=report.samples;
 return 'First audio: '+timing(first?.firstAudioMs)+' · Repeat: '+timing(repeat?.firstAudioMs)+' · Device: '+(repeat?.device||first?.device||'Awaiting synthesis');
}
export function mountVoiceCheck({document,available,describe,play,stop,exportReport}){
 const el=id=>document.getElementById(id),button=el('voice-check-start'),cancel=el('voice-check-stop'),download=el('voice-check-export'),status=el('voice-check-status'),results=el('voice-check-results');
 const check=new VoiceCheck({play,onChange:report=>{
  button.disabled=!available||report.status==='running';cancel.hidden=report.status!=='running';download.disabled=!report.samples.length;
  status.textContent=({running:report.samples.length?'Playing the repeat sample…':'Preparing the first sample. First use can take longer…',complete:'Check complete. Compare how it sounds and how long it takes.',cancelled:'Check stopped. Partial measurements are retained.',failed:'Check could not finish. Check the voice status below; install the selected pack and unmute playback.'})[report.status];
  results.textContent=report.companion+' · '+report.pack+' · '+report.voice+'\n'+voiceCheckSummary(report);
 }});
 button.disabled=!available;cancel.hidden=true;download.disabled=true;
 status.textContent=available?'Plays two short fixed samples locally. Uses your selected voice; no translation, download or chat history. First sample may already be warm.':'Run this check in the Windows app after installing a voice pack.';
 button.onclick=()=>{if(available)void check.run(describe());};cancel.onclick=()=>{check.cancel();void stop();};
 download.onclick=()=>{const report=check.snapshot();if(report?.samples.length)exportReport(report);};
 return check;
}

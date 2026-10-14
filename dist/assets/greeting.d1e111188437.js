const smooth=value=>{const x=Math.max(0,Math.min(1,value));return x*x*(3-2*x);};
// Simulation-time envelope: pausing time pauses both the greeting and its fades.
export class Greeting {
 constructor(){this.clear();}
 clear(){this.startedAt=0;this.endsAt=-Infinity;this.startWeight=0;}
 trigger(time){this.startWeight=this.weightAt(time);this.startedAt=time;this.endsAt=time+4;}
 weightAt(time){
  if(time>=this.endsAt)return 0;
  const enter=this.startWeight+(1-this.startWeight)*smooth((time-this.startedAt)/.45);
  return enter*smooth((this.endsAt-time)/.55);
 }
}

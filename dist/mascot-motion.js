import * as T from './vendor/three.module.js';
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export class MascotMotion {
 constructor(){this.heads=new WeakMap();this.danceStart=0;this.danceEnd=-Infinity;}
 dance(time){this.danceStart=time;this.danceEnd=time+5;}
 clear(){this.danceEnd=-Infinity;this.heads=new WeakMap();}
 apply(character,time,dt,{reduced=false,held=false}={}){
  const head=character.head;
  if(character.body)character.body.position.y=0;
  if(!this.heads.has(head))this.heads.set(head,{rotation:head.quaternion.clone(),y:head.position.y});
  const state=this.heads.get(head);head.position.y=state.y;
  const active=!held&&!reduced&&time<this.danceEnd;
  const weight=active?smooth((time-this.danceStart)/.7)*smooth((this.danceEnd-time)/.9):0;
  head.rotation.z+=Math.sin(time*2.3)*.035*weight;
  head.rotation.x+=Math.sin(time*1.6)*.018*weight;
  const target=head.quaternion.clone();state.rotation.slerp(target,reduced?1:1-Math.exp(-9*Math.min(.05,Math.max(0,dt))));head.quaternion.copy(state.rotation);
 }
}

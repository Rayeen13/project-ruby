import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {Greeting} from '../dist/greeting.js';
import {CHARACTER_MODELS} from '../dist/character-registry.js';
const g=new Greeting();assert.equal(g.weightAt(0),0);g.trigger(0);
assert.equal(g.weightAt(0),0);assert.equal(g.weightAt(.45),1);assert.equal(g.weightAt(4),0);
for(const t of [.1,1,3.7]){const before=g.weightAt(t);g.trigger(t);assert(Math.abs(g.weightAt(t)-before)<1e-10);}
assert.equal(g.weightAt(20),0);g.clear();assert.equal(g.weightAt(0),0);
const ctx=new Proxy({}, {get:()=>()=>{}}),createCanvas=()=>({getContext:()=>ctx});
let checked=0;
for(const spec of CHARACTER_MODELS.filter(s=>s.capabilities.wave)){
 for(const dance of [false,true])for(const [x,y] of [[0,0],[-1,-1],[-1,1],[1,-1],[1,1]]){
  const c=spec.create({createCanvas}),timeline=new Greeting();c.setHandGesture('point');timeline.trigger(0);
  const right=c.arms.find(a=>a.side===-1);
  for(let i=0;i<=105;i++){
   const t=i/24;c.update(t,{dt:1/24,pointer:{x,y},dance,waveWeight:timeline.weightAt(t)});c.root.updateMatrixWorld(true);
   const limb=new T.Box3().setFromObject(right.forearm,true);
   c.head.traverse(o=>{if(o.isMesh&&o.geometry.type!=='PlaneGeometry')assert(!new T.Box3().setFromObject(o,true).intersectsBox(limb),`${spec.id}: transition collision t=${t}, pointer=${x},${y}, dance=${dance}`);});
   if(c.controller)assert.equal(c.controller.parent,right.hand);
   checked++;
  }
  if(spec.id!=='gamer'){const d=right.hand.userData.digits;assert(Math.abs(d.fingers[0].base.rotation.x)<1e-6);assert(d.fingers[1].base.rotation.x<-.5);}
 }
 // Starting, restarting and stopping at fixed simulation time must not jump.
 const c=spec.create({createCanvas});c.update(0,{waveWeight:0,follow:false});const initial=c.arms[0].arm.quaternion.clone();
 const timeline=new Greeting();timeline.trigger(0);c.update(0,{waveWeight:timeline.weightAt(0),follow:false});assert(initial.angleTo(c.arms[0].arm.quaternion)<1e-6);
 if(c.controller){const initial=c.controller.quaternion.clone();c.update(0,{waveWeight:1e-6,follow:false});assert(initial.angleTo(c.controller.quaternion)<1e-4);}
}
console.log(`PASS: ${checked} greeting transition poses, continuous retrigger, gesture return and controller grip.`);

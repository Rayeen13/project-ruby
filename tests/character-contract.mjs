import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {CHARACTER_MODELS,CharacterSelection} from '../dist/character-registry.js';
const context=new Proxy({}, {get:()=>()=>{}});
let canvasCalls=0;
const createCanvas=()=>{canvasCalls++;return {width:0,height:0,getContext:()=>context};};
// No document global: creation must use the host's injected canvas factory.
const selection=new CharacterSelection(new T.Scene(),{createCanvas});
for(const spec of CHARACTER_MODELS){
 const c=selection.select(spec.id),caps=selection.capabilities;
 for(const method of ['setProfile','setMood','update'])assert.equal(typeof c[method],'function');
 assert(c.root.isObject3D);assert(Object.isFrozen(spec));assert(Object.isFrozen(caps));
 assert.equal(spec.canWave,caps.wave);assert.equal(Boolean(c.arms?.length),caps.hands);
 selection.setProfile('emme');selection.setMood('happy');
 c.update(0,{pointer:{x:1,y:-1},follow:true,dt:.016});
 assert.equal(selection.setHandGesture('open',1),caps.hands);
 assert.equal(selection.setHandGesture('unknown',1),false);
 assert.throws(()=>selection.setHandGesture('open',0),RangeError);
 if(caps.hands){
  for(const rig of c.arms){assert.equal(rig.hand.userData.digits.fingers.length,4);assert(rig.hand.userData.digits.thumbTip);}
  if(caps.heldProp){assert.equal(selection.setHandGesture('open',-1),false);assert.equal(selection.setHandGesture('grip',-1),true);}
  else{assert.equal(selection.setHandGesture('point',-1),true);c.update(0,{follow:false});const d=c.arms.find(a=>a.side===-1).hand.userData.digits;assert(Math.abs(d.fingers[0].base.rotation.x)<1e-6);assert(d.fingers[1].base.rotation.x<-.5);}
 }
}
const cached=selection.select('office');selection.select('classic');assert.equal(selection.select('office'),cached);
assert.equal(selection.profileId,'emme');assert.equal(cached.mood,'happy');
assert.throws(()=>selection.select('missing'));
assert.equal(selection.active,cached);assert(canvasCalls>0);
console.log('PASS: five character contracts, injected canvas, capability routing and cached switching.');

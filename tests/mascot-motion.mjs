import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {MascotMotion} from '../dist/mascot-motion.js';
import {TouchReaction} from '../dist/interactions.js';
const root=new T.Group(),body=new T.Group(),head=new T.Group();root.add(body);body.add(head);head.position.y=2;
const character={root,body,head},motion=new MascotMotion(),reaction=new TouchReaction();
motion.apply(character,0,1/60);reaction.trigger('boop',0);
let previous=head.quaternion.clone();
for(let i=1;i<240;i++){
 const t=i/60;body.position.y=.13;head.rotation.set(0,0,0);reaction.apply(root,t);reaction.applyHead(head,t);motion.apply(character,t,1/60);
 assert.equal(root.position.y,0,'Tap reaction cannot lift the complete character');assert.equal(body.position.y,0,'Idle body remains grounded');
 assert(previous.angleTo(head.quaternion)<.01,'Head reaction must be continuous between frames');previous.copy(head.quaternion);
}
motion.dance(4);
for(let i=0;i<=330;i++){const t=4+i/60;head.rotation.set(0,0,0);motion.apply(character,t,1/60);assert(Math.abs(head.rotation.z)<.04);assert.equal(body.position.y,0);}
assert(head.quaternion.angleTo(new T.Quaternion())<.001,'Sway returns to neutral');
console.log('PASS: grounded tap/idle, bounded smooth head gestures and eased sway recovery.');

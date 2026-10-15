import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {CHARACTER_MODELS} from '../dist/character-registry.js';
import {CompanionPhysics} from '../dist/companion-physics.js';
const createCanvas=()=>({width:0,height:0,getContext:()=>new Proxy({},{get:()=>()=>{}})});
for(const spec of CHARACTER_MODELS){const c=spec.create({createCanvas}),physics=new CompanionPhysics();physics.drop(c,1.4);let previous=2,landed=false;for(let i=0;i<360;i++){c.root.position.y=0;c.root.rotation.z=Math.sin(i/30)*.04;const contact=physics.apply(c,1/60);assert(contact.bottom>=-.055-1e-6,'No platform penetration');if(i<20)assert(c.root.position.y<=previous+1e-6,'Gravity moves down');previous=c.root.position.y;landed||=contact.grounded;}assert(landed,spec.id+' lands');assert.equal(physics.apply(c,1/60).velocity,0);c.root.position.y=1;physics.apply(c,1/60,{held:true});assert(c.root.position.y>=1);const before=c.root.position.y;physics.apply(c,1/60);assert(c.root.position.y<before,'Released body falls');}
console.log('Physics: all five rigid bodies fall, land, remain above platform through tilt and release from grabs.');

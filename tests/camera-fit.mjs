import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {CHARACTER_MODELS,CharacterSelection} from '../dist/character-registry.js';
import {fitDistance,placeCamera} from '../dist/camera-fit.js';
const context=new Proxy({}, {get:()=>()=>{}});
const selection=new CharacterSelection(new T.Scene(),{createCanvas:()=>({width:0,height:0,getContext:()=>context})});
let count=0;
for(const model of CHARACTER_MODELS){
 const c=selection.select(model.id);await c.ready;
 for(const aspect of [340/420,.5,1,1.6])for(const yaw of [0,Math.PI/2,Math.PI])for(const pitch of [.16,.85])for(const waveWeight of [0,.5,1]){
  c.update(2,{pointer:{x:1,y:1},follow:true,waveWeight,dt:1/60});c.root.updateMatrixWorld(true);
  const camera=new T.PerspectiveCamera(35,aspect,.1,100);placeCamera(camera,fitDistance(c.root,aspect,yaw,pitch),yaw,pitch);
  const box=new T.Box3().setFromObject(c.root);
  for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
   const p=new T.Vector3(x,y,z).project(camera);assert(Math.abs(p.x)<1&&Math.abs(p.y)<1&&p.z<1&&p.z>-1,`${model.id}: geometry is clipped`);
  }
  count++;
 }
}
console.log(`PASS: ${count} body/aspect/orbit/gaze/wave combinations fit without clipping.`);

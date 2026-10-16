import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {OPAL_OUTFITS,normalizeWardrobe,selectedOutfit,wardrobePeriod} from '../dist/wardrobe.js';
import {OpalCharacter} from '../dist/opal-character.js';
import {CHARACTER_MODELS} from '../dist/character-registry.js';
import {drawDizzyFace} from '../dist/companion-grab.js';
const local=h=>new Date(2026,9,16,h,0),settings=normalizeWardrobe({automatic:true,schedule:{morning:'classic',afternoon:'rose',evening:'work',night:'evening'}});
for(const [h,period,id] of [[0,'night','evening'],[5,'night','evening'],[6,'morning','classic'],[11,'morning','classic'],[12,'afternoon','rose'],[16,'afternoon','rose'],[17,'evening','work'],[21,'evening','work'],[22,'night','evening'],[23,'night','evening']]){assert.equal(wardrobePeriod(local(h)),period);assert.equal(selectedOutfit(settings,local(h)),id);}
assert.equal(selectedOutfit({...settings,work:true},local(7)),'work');assert.equal(selectedOutfit({...settings,automatic:false,outfit:'rose'},local(7)),'rose');assert.equal(normalizeWardrobe({outfit:'foreign'}).outfit,'classic');
for(const spec of CHARACTER_MODELS){
 const fills=[],ctx=new Proxy({fillRect:(...args)=>fills.push(args)}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)}),c=spec.create({createCanvas:()=>({getContext:()=>ctx})});
 c.update(0,{follow:false});fills.length=0;drawDizzyFace(c,1000);
 assert.equal(fills.some(a=>a[0]===0&&a[1]===0&&a[2]===c.canvas.width&&a[3]===c.canvas.height),spec.id==='classic',spec.id+' must preserve face transparency during dizziness');
 if(spec.id==='opal'){
  for(const outfit of OPAL_OUTFITS){c.setOutfit(outfit.id);assert.equal([...c.outfits.values()].filter(g=>g.visible).length,1);assert(c.outfits.get(outfit.id).visible);assert.equal(c.glasses.visible,outfit.id==='work');}
  c.setOutfit('classic');assert.equal(c.outfit,'classic');assert(c.head.position.y>2.5);assert(c.arms.every(r=>r.hand.userData.digits.fingers.length===4));
 }
}
console.log('PASS: local-time wardrobe boundaries, work/manual overrides, costume visibility and transparent dizzy faces on every Companion.');

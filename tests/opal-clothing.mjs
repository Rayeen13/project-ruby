import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {OpalCharacter} from '../dist/opal-character.js';
const c=new OpalCharacter({createCanvas:()=>({getContext:()=>new Proxy({}, {get:()=>()=>{},set:()=>true})})});await c.ready;
assert.notEqual(c.mannequin,c.wardrobe);assert.equal(c.mannequin.userData.entity,'body');assert.equal(c.wardrobe.userData.entity,'clothing');
let source;c.mannequin.traverse(o=>{if(o.isSkinnedMesh&&(Array.isArray(o.material)?o.material:[o.material]).some(m=>/Tops.*CLOTH/i.test(m.name)))source=o;});
const originalWeights=Array.from(source.geometry.attributes.skinWeight.array),originalIndex=Array.from(source.geometry.index.array);
const garments=[...c.outfits.values()].flatMap(g=>g.children);
assert.equal(garments.length,4,'One continuous garment per outfit, with no copied apron overlay');
for(const dress of garments){
 assert.notEqual(dress.geometry,source.geometry);assert.notEqual(dress.material,source.material);assert.equal(dress.skeleton,source.skeleton);
 assert.deepEqual(Array.from(dress.geometry.index.array),originalIndex,'No triangles removed from garment');
 const w=dress.geometry.attributes.skinWeight;for(let i=0;i<w.count;i++)assert(Math.abs([0,1,2,3].reduce((n,j)=>n+w.getComponent(i,j),0)-1)<1e-5);
}
assert.deepEqual(Array.from(source.geometry.attributes.skinWeight.array),originalWeights,'Clothing never changes mannequin weights');
const vertex=(m,i)=>m.getVertexPosition(i,new T.Vector3()).applyMatrix4(m.matrixWorld);
c.update(0,{dt:.016});const before=garments.map(m=>[0,100,500,900].map(i=>vertex(m,i)));
const transform=new T.Matrix4().compose(new T.Vector3(2,.7,-1),new T.Quaternion().setFromEuler(new T.Euler(.4,-.6,.2)),new T.Vector3(1.3,1.3,1.3));
c.root.matrixAutoUpdate=false;c.root.matrix.copy(transform);c.root.updateMatrixWorld(true);
garments.forEach((m,j)=>[0,100,500,900].forEach((i,k)=>assert(vertex(m,i).distanceTo(before[j][k].clone().applyMatrix4(transform))<1e-5,'Carry, shake and size transforms move clothes with body')));
for(let t=0;t<3;t+=.15){c.update(t,{wave:true,waveWeight:1,dt:.016});for(const m of garments)for(const i of [0,100,500,900])assert(vertex(m,i).toArray().every(Number.isFinite));}
const shader={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <color_fragment>'};garments[0].material.onBeforeCompile(shader);assert(shader.fragmentShader.includes('float panel'));assert(shader.vertexShader.includes('opalRest = position'));
console.log('PASS: separate mannequin/clothes, full garment topology, isolated weights, carry/shake/resize covariance and finite wave poses.');

import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {OpalCharacter} from '../dist/opal-character.js';
const c=new OpalCharacter({createCanvas:()=>({getContext:()=>new Proxy({}, {get:()=>()=>{},set:()=>true})})});await c.ready;
assert.notEqual(c.mannequin,c.wardrobe);assert.equal(c.mannequin.userData.entity,'body');assert.equal(c.wardrobe.userData.entity,'clothing');
let source;c.mannequin.traverse(o=>{if(o.isSkinnedMesh&&(Array.isArray(o.material)?o.material:[o.material]).some(m=>/Tops.*CLOTH/i.test(m.name)))source=o;});
const originalWeights=Array.from(source.geometry.attributes.skinWeight.array),originalIndex=Array.from(source.geometry.index.array);
const garments=[...c.outfits.values()].flatMap(g=>g.children).filter(m=>m.userData.garment==='dress');
assert.equal(garments.length,7,'One continuous garment per outfit, with no copied apron overlay');
for(const dress of garments){
 assert.notEqual(dress.geometry,source.geometry);assert.notEqual(dress.material,source.material);assert.equal(dress.skeleton,source.skeleton);
 assert.equal(dress.geometry.userData.sourceIndexCount,originalIndex.length);assert(dress.geometry.index.count>=originalIndex.length,'Every source triangle is retained/refined');
 assert.deepEqual(Array.from(dress.geometry.attributes.skinWeight.array).slice(0,originalWeights.length),originalWeights,'Artist Bust/Sleeve/Skirt weights are preserved');
 const w=dress.geometry.attributes.skinWeight;for(let i=0;i<w.count;i++)assert(Math.abs([0,1,2,3].reduce((n,j)=>n+w.getComponent(i,j),0)-1)<1e-5);
}
assert.deepEqual(Array.from(source.geometry.attributes.skinWeight.array),originalWeights,'Clothing never changes mannequin weights');
const vertex=(m,i)=>m.getVertexPosition(i,new T.Vector3()).applyMatrix4(m.matrixWorld);
c.update(0,{dt:.016});const before=garments.map(m=>[0,100,500,900].map(i=>vertex(m,i)));
const transform=new T.Matrix4().compose(new T.Vector3(2,.7,-1),new T.Quaternion().setFromEuler(new T.Euler(.4,-.6,.2)),new T.Vector3(1.3,1.3,1.3));
c.root.matrixAutoUpdate=false;c.root.matrix.copy(transform);c.root.updateMatrixWorld(true);
garments.forEach((m,j)=>[0,100,500,900].forEach((i,k)=>assert(vertex(m,i).distanceTo(before[j][k].clone().applyMatrix4(transform))<1e-5,'Carry, shake and size transforms move clothes with body')));
for(let t=0;t<3;t+=.15){c.update(t,{wave:true,waveWeight:1,dt:.016});for(const m of garments)for(const i of [0,100,500,900])assert(vertex(m,i).toArray().every(Number.isFinite));}
const shader={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <color_fragment>'};garments[0].material.onBeforeCompile(shader);assert(shader.fragmentShader.includes('float panel'));assert(shader.vertexShader.includes('opalRest = fabricRest'));
console.log('PASS: separate mannequin/clothes, full garment topology, isolated weights, carry/shake/resize covariance and finite wave poses.');

// Covered body faces must stay occluded even when chest springs move. Keep the
// original mannequin geometry for future fitting and preserve neck/hands/legs.
assert(c.bodyCoverage.length>0);for(const item of c.bodyCoverage){assert.notEqual(item.mesh.geometry,item.original);assert(item.hiddenTriangles>0);const p=item.original.attributes.position;const retained=new Set(item.mesh.geometry.index.array);for(const i of item.original.index.array)if(p.getY(i)>1.46||p.getY(i)<.9||Math.abs(p.getX(i))>.53)assert(retained.has(i),'Visible anatomy outside the costume is retained');}
assert.equal(c.clothRig.joints.filter(p=>p.kind==='cloth').length,16);assert.equal(c.clothRig.joints.filter(p=>p.kind==='chest').length,4);assert(c.clothRig.joints.every(p=>!/_end$/.test(p.joint.bone.name)));
for(const id of ['victorian','bluebell','pinstripe']){const trim=c.outfits.get(id).children.find(m=>m.userData.garment==='hem-trim');assert(trim.isSkinnedMesh&&trim.geometry.attributes.position.count>300);assert.equal(trim.skeleton,source.skeleton);}
// Finite, bounded dynamic deformation under repeated carry/shake at low and high FPS.
for(const fps of [8,30,60]){
 c.root.matrixAutoUpdate=true;c.root.position.set(0,0,0);c.root.rotation.set(0,0,0);c.root.scale.setScalar(1);c.root.updateMatrixWorld(true);c.vrm.springBoneManager.reset();c.clothRig.reset();let motion=0;
 for(let i=0;i<fps*4;i++){const t=i/fps;c.root.position.x=.15*Math.sin(t*12);c.root.rotation.z=.08*Math.sin(t*10);c.root.updateMatrixWorld(true);c.update(t,{dt:1/fps,wave:true,waveWeight:1});motion=Math.max(motion,c.clothRig.motion);for(const p of c.clothRig.joints.filter(p=>p.kind==='chest'||!c.clothRig.fabricActive)){assert(p.tail.toArray().every(Number.isFinite));assert(p.joint.bone.quaternion.angleTo(p.rest)<=p.limit+1e-5,'Cloth cannot flip inside-out');for(const collider of p.colliders){const centre=collider.shape.offset.clone().applyMatrix4(collider.matrixWorld);assert(p.tail.distanceTo(centre)+.001>=collider.shape.radius,'Cloth particle remains outside body collider');}}}
 assert(motion>.01,'Cloth genuinely deforms under shaking, independently of root transforms');
}
const {clothPreviewOffset}=await import('../dist/opal-cloth-rig.js');assert.equal(clothPreviewOffset(4,0),null);assert.equal(clothPreviewOffset(0,undefined),null);assert(clothPreviewOffset(1.3,0));
console.log('PASS: torso/sleeve coverage, intact exposed anatomy, artist cloth weights, three gathered hems and bounded/colliding fabric physics at 8/30/60 FPS.');

c.dispose();

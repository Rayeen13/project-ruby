import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {OpalCharacter} from '../dist/opal-character.js';
import {refineGarment} from '../dist/garment-mesh.js';
const canvas=()=>({getContext:()=>new Proxy({}, {get:()=>()=>{},set:()=>true})});
const c=new OpalCharacter({createCanvas:canvas});await c.ready;assert(c.fabric,'The production path must use Jolt, not the fallback');
const f=c.fabric,lower=()=>f.representatives.map((i,k)=>f.rest[i*3+1]<.9?k:-1).filter(k=>k>=0);
const sag=()=>lower().reduce((sum,k)=>sum+f.points[k].y-f.targets[k].y,0)/lower().length;
const check=()=>{for(let k=0;k<f.points.length;k++){assert(f.points[k].toArray().every(Number.isFinite));assert(f.points[k].distanceTo(f.targets[k])<=f.limits[k]+.003,'Cloth stays within its painted attachment distance');if(f.limits[k]===0)assert(f.points[k].distanceTo(f.targets[k])<1e-5,'Pinned collar/bodice/waist follows the actual skeleton');}};
for(let i=0;i<90;i++)c.update(0,{dt:1/30,follow:false});check();const down=sag();assert(down<-.005,'Gravity deforms the fabric itself while the mannequin stays still');
const reverse=new f.J.Vec3(0,9.81,0);f.system.SetGravity(reverse);f.J.destroy(reverse);f.reset();for(let i=0;i<90;i++)c.update(0,{dt:1/30,follow:false});check();assert(sag()>down+.01,'Reversing physical gravity reverses the drape response');f.system.SetGravity(f.gravity);
for(const fps of [8,30,60]){
 c.root.position.set(0,0,0);c.root.rotation.set(0,0,0);c.root.updateMatrixWorld(true);c.vrm.springBoneManager.reset();c.clothRig.reset();f.reset();let chest=0;
 for(let i=0;i<fps*2;i++){c.root.position.x=.12*Math.sin(i/fps*12);c.root.rotation.z=.06*Math.sin(i/fps*10);c.root.updateMatrixWorld(true);c.update(0,{dt:1/fps,follow:false});check();chest=Math.max(chest,c.clothRig.chestMotion);for(const p of c.clothRig.joints.filter(p=>p.kind==='chest'))assert(p.joint.bone.quaternion.angleTo(p.rest)<=p.limit+1e-5);}
 assert(chest>.04,'Chest visibly responds to actual body motion');c.root.position.set(0,0,0);c.root.rotation.set(0,0,0);for(let i=0;i<fps*2;i++){c.root.updateMatrixWorld(true);c.update(0,{dt:1/fps,follow:false});}assert(c.clothRig.chestMotion<.002,'Chest settles naturally at every frame rate');
}
// Multiple UV vertices welded to one physical particle cannot tear apart.
for(let i=0;i<f.map.length;i++){const p=f.mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(f.mesh.matrixWorld).multiplyScalar(1/1.85);assert(p.distanceTo(f.points[f.map[i]])<1e-5,'Rendered skinning matches the solved physical surface');}
for(const id of ['rose','evening','work','victorian','bluebell','pinstripe','classic']){c.setOutfit(id);c.update(0,{dt:1/30});assert.equal(f.system.GetNumBodies(),f.colliders.length+1,'Only the visible garment is simulated; switching outfits does not accumulate bodies');check();assert(c.outfits.get(id).children.some(m=>m.userData.garment==='hem-trim'),'Every outfit has a stitched gathered hem');}
c.dispose();assert(f.disposed);
const plane=new T.PlaneGeometry(1,1);plane.setAttribute('skinIndex',new T.Uint16BufferAttribute(new Uint16Array(16),4));const weights=new Float32Array(16);for(let i=0;i<4;i++)weights[i*4]=1;plane.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));const refined=refineGarment(plane,.15,5);assert(refined.attributes.position.count>plane.attributes.position.count);const area=g=>{let sum=0;for(let i=0;i<g.index.count;i+=3){const a=new T.Vector3().fromBufferAttribute(g.attributes.position,g.index.getX(i)),b=new T.Vector3().fromBufferAttribute(g.attributes.position,g.index.getX(i+1)),c=new T.Vector3().fromBufferAttribute(g.attributes.position,g.index.getX(i+2));sum+=b.sub(a).cross(c.sub(a)).length()*.5;}return sum;};assert(Math.abs(area(plane)-area(refined))<1e-6,'Refinement retains the full authored surface');
const fallback=new OpalCharacter({createCanvas:canvas,createGarmentPhysics:async()=>null});await fallback.ready;assert(fallback.loaded&&!fallback.fabric&&!fallback.clothRig.fabricActive);fallback.update(0,{dt:1/30});fallback.dispose();
console.log('PASS: real Jolt gravity/reversed gravity, pinned attachments, bounded cloth/chest at 8/30/60 FPS, seam continuity, stitched hems, body lifecycle, surface refinement and injected fallback.');

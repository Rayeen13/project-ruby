import assert from 'node:assert/strict';
const calls=[];const ctx=new Proxy({roundRect:(...a)=>calls.push(a)}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>ctx})};
const T=await import('../dist/vendor/three.module.js');
const {CHARACTER_MODELS}=await import('../dist/character-registry.js');
let checked=0;
for(const spec of CHARACTER_MODELS){const angles=[];const c=spec.create();await c.ready;c.setProfile('ruby');if(!spec.canWave)continue;
 for(const dance of [false,true])for(const [x,y] of [[0,0],[-1,-1],[-1,1],[1,-1],[1,1]])for(let i=0;i<48;i++){
  c.update(i/8,{wave:true,dance,pointer:{x,y},dt:1});c.root.updateMatrixWorld(true);
  const right=c.arms.find(a=>a.side===-1);angles.push(c.humanoid?right.hand.rotation.z:right.arm.rotation.z);const limb=c.humanoid?new T.Box3().setFromPoints([right.forearm.getWorldPosition(new T.Vector3()),right.hand.getWorldPosition(new T.Vector3())]).expandByScalar(.055):new T.Box3().setFromObject(right.forearm,true);
  const palm=new T.Vector3(),shoulder=new T.Vector3();right.hand.getWorldPosition(palm);right.arm.getWorldPosition(shoulder);assert(palm.y>shoulder.y,`${spec.id}: hand not raised`);
  let collision=c.humanoid&&c.getHeadBounds().intersectsBox(limb);c.head.traverse(o=>{if(o.isMesh&&o.geometry.type!=='PlaneGeometry'&&new T.Box3().setFromObject(o,true).intersectsBox(limb))collision=true;});
  assert(!collision,`${spec.id}: collision t=${i/8} pointer=${x},${y} dance=${dance}`);checked++;
 }
 assert(Math.max(...angles)-Math.min(...angles)>(c.humanoid?.35:.5),`${spec.id}: greeting arc too small`);
 for(const rig of c.arms){assert.equal(rig.hand.userData.digits.fingers.length,4);assert(rig.hand.userData.digits.thumbTip);const d=rig.hand.userData.digits;if(!c.humanoid)assert(Math.sign(d.thumb.position.x)===rig.side,`${spec.id}: wrong handed thumb`);if(!c.humanoid)assert(Math.sign(d.fingers[0].base.position.x)===rig.side,`${spec.id}: index finger must neighbor thumb`);}
 c.setHandGesture('point');c.update(0,{follow:false});const digits=c.arms.find(a=>a.side===-1).hand.userData.digits;
 if(spec.id!=='gamer'){assert(Math.abs(digits.fingers[0].base.rotation[c.humanoid?'z':'x'])<1e-6);assert(Math.abs(digits.fingers[1].base.rotation[c.humanoid?'z':'x'])>.5);}
 c.setHandGesture('relaxed');
 if(c.controller)assert.equal(c.controller.parent,c.rightArm.hand);
 c.update(0,{follow:false});c.root.updateMatrixWorld(true);const bodyWidth=new T.Box3().setFromObject(c.root,true).getSize(new T.Vector3()).x,headWidth=(c.humanoid?c.getHeadBounds():new T.Box3().setFromObject(c.head,true)).getSize(new T.Vector3()).x;assert(bodyWidth<headWidth*(spec.id==='opal'?3.5:1.4),`${spec.id}: overextended resting arms`);
 console.log(`${spec.id}: clear for 480 sampled wave poses`);
}
for(const id of ['classic','office','gamer']){const c=CHARACTER_MODELS.find(s=>s.id===id).create();calls.length=0;c.update(0,{follow:false});const expected=id==='classic'?100:id==='office'?118:128;assert(calls.some(a=>a[2]===expected&&a[3]>130),`${id} needs large open eyes`);}
console.log(`PASS: ${checked} poses, controller attachment and enlarged eye dimensions.`);

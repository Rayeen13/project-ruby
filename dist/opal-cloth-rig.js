import * as T from './vendor/three.module.js';

// VRM secondary-motion joints are a lightweight cloth rig, not rigid attachments.
// Scale-dependent spring/collision parameters follow three-vrm's documented rule.
export function configureOpalCloth(vrm,scale){
 const manager=vrm.springBoneManager,joints=[...manager.joints],colliders=[...manager.colliders],groups=[...manager.colliderGroups],cloth=[];
 for(const joint of joints){
  joint.settings.stiffness*=scale;joint.settings.hitRadius*=scale;
  if(/Bust|Skirt|Sleeve/.test(joint.bone.name)){
   manager.deleteJoint(joint);
   if(/_end$/.test(joint.bone.name))continue;
   const chest=/Bust/.test(joint.bone.name),distal=/Bust2/.test(joint.bone.name),sleeve=/Sleeve/.test(joint.bone.name),side=/_L_/.test(joint.bone.name)?'_L_':'_R_';
   const collisionGroups=chest?[]:sleeve?groups.filter(g=>g.colliders.some(c=>c.parent.name.includes(side)&&/Arm/.test(c.parent.name))):joint.colliderGroups;
   cloth.push({joint,kind:chest?'chest':'cloth',frequency:chest?(distal?4.4:3.2):0,damping:distal?.36:.32,velocity:new T.Vector3(),rest:joint.bone.quaternion.clone(),restMatrix:joint.bone.matrix.clone(),axis:joint.initialLocalChildPosition.clone().normalize(),child:joint.initialLocalChildPosition.clone(),tail:new T.Vector3(),previous:new T.Vector3(),colliders:[...new Set(collisionGroups.flatMap(g=>g.colliders))],limit:chest?(distal?.12:.20):sleeve?.38:.48});
  }
 }
 for(const collider of colliders){collider.shape.radius*=scale;if(collider.shape.tail)collider.shape.tail.multiplyScalar(scale);}
 // The loader initialized tails before rotateVRM0/display scaling and before
 // the relaxed arm pose. Rebase world-space tails after each initialization.
 vrm.scene.updateWorldMatrix(true,true);manager.reset();
 return new OpalClothRig(vrm,cloth,scale);
}

export class OpalClothRig{
 constructor(vrm,joints,scale){this.vrm=vrm;this.joints=joints.sort((a,b)=>depth(a.joint.bone)-depth(b.joint.bone));this.scale=scale;this.motion=0;this.chestMotion=0;this.lastOrigin=new T.Vector3();this.reset();}
 reset(){
  this.vrm.scene.updateWorldMatrix(true,true);
  for(const p of this.joints){const bone=p.joint.bone;bone.quaternion.copy(p.rest);bone.updateMatrix();bone.updateWorldMatrix(false,true);p.tail.copy(p.child).applyMatrix4(bone.matrixWorld);p.previous.copy(p.tail);p.velocity.set(0,0,0);}
  this.vrm.scene.getWorldPosition(this.lastOrigin);this.motion=0;this.chestMotion=0;
 }
 update(dt){
  if(!(dt>0))return;this.vrm.scene.updateWorldMatrix(true,true);
  const origin=this.vrm.scene.getWorldPosition(new T.Vector3());if(origin.distanceTo(this.lastOrigin)>this.scale*.8){this.reset();return;}this.lastOrigin.copy(origin);
  let remaining=Math.min(dt,.125);this.motion=0;this.chestMotion=0;
  while(remaining>1e-6){const step=Math.min(remaining,1/60);remaining-=step;for(const p of this.joints)if(!this.fabricActive||p.kind==='chest')this.step(p,step);}
 }
 step(p,dt){
  const bone=p.joint.bone,restWorld=new T.Matrix4().multiplyMatrices(bone.parent.matrixWorld,p.restMatrix),base=new T.Vector3().setFromMatrixPosition(restWorld),target=p.child.clone().applyMatrix4(restWorld),restDirection=target.clone().sub(base),length=restDirection.length();if(length<1e-6)return;restDirection.normalize();
  let next;
  if(p.kind==='chest'){
   // Supported soft tissue: a damped oscillator about the authored shape.
   // World-space inertia reacts to carrying/shaking; no canned jiggle loop.
   // Both mannequin and bodice retain the same four Bust bones/skin weights.
   const omega=2*Math.PI*p.frequency;
   p.velocity.addScaledVector(target.clone().sub(p.tail),omega*omega*dt).multiplyScalar(Math.exp(-2*p.damping*omega*dt));
   next=p.tail.clone().addScaledVector(p.velocity,dt);
  }else{
   next=p.tail.clone().add(p.tail.clone().sub(p.previous).multiplyScalar(.52)).addScaledVector(restDirection,1.8*this.scale*dt);next.y-=.035*dt;
  }
  const constrain=()=>{const direction=next.clone().sub(base);if(direction.lengthSq()<1e-12)direction.copy(restDirection);direction.normalize();const angle=restDirection.angleTo(direction);if(angle>p.limit){const q=new T.Quaternion().setFromUnitVectors(restDirection,direction);q.slerp(new T.Quaternion(),1-p.limit/angle);direction.copy(restDirection).applyQuaternion(q);}next.copy(base).addScaledVector(direction,length);};
  constrain();
  for(let pass=0;pass<4;pass++){
   for(const collider of p.colliders){const shape=collider.shape,centre=shape.offset.clone().applyMatrix4(collider.matrixWorld),delta=next.clone().sub(centre),radius=shape.radius+.006*this.scale,distance=delta.length();if(distance<radius){if(distance<1e-6)delta.copy(restDirection);else delta.divideScalar(distance);next.copy(centre).addScaledVector(delta,radius);}}
   constrain();
  }
  p.previous.copy(p.tail);p.tail.copy(next);if(p.kind==='chest')p.velocity.copy(p.tail).sub(p.previous).divideScalar(dt);
  const localDirection=next.clone().applyMatrix4(restWorld.clone().invert()).normalize();bone.quaternion.setFromUnitVectors(p.axis,localDirection).premultiply(p.rest);bone.updateMatrix();bone.updateWorldMatrix(false,true);const angle=bone.quaternion.angleTo(p.rest);if(p.kind==='chest')this.chestMotion=Math.max(this.chestMotion,angle);else this.motion=Math.max(this.motion,angle);
 }
}
function depth(bone){let n=0;while(bone.parent){bone=bone.parent;n++;}return n;}

// Keep the full mannequin geometry available, but don't draw skin or its outline
// underneath the always-covered bodice. This is standard avatar outfit occlusion;
// it complements shared skinning rather than pretending fabric cannot intersect.
export function coverOpalTorso(vrm){
 const coverage=[];
 vrm.scene.traverse(mesh=>{
  if(!mesh.isSkinnedMesh||!/Body.*SKIN/i.test((Array.isArray(mesh.material)?mesh.material:[mesh.material]).map(m=>m.name).join(' ')))return;
  const original=mesh.geometry,p=original.attributes.position,index=original.index;if(!index)return;
  const covered=i=>{const x=Math.abs(p.getX(i)),y=p.getY(i);return (x<.205&&y>1.01&&y<1.435)||(x>=.19&&x<.50&&y>1.22&&y<1.42);};
  const retained=[];for(let i=0;i<index.count;i+=3){const a=index.getX(i),b=index.getX(i+1),c=index.getX(i+2);if(!(covered(a)&&covered(b)&&covered(c)))retained.push(a,b,c);}
  if(retained.length===index.count)return;
  const geometry=original.clone();geometry.setIndex(retained);geometry.clearGroups();for(const group of original.groups)geometry.addGroup(0,retained.length,group.materialIndex);
  mesh.geometry=geometry;coverage.push({mesh,original,hiddenTriangles:(index.count-retained.length)/3});
 });
 return coverage;
}

export function clothPreviewOffset(time,start){
 const t=time-start;if(!Number.isFinite(t)||t<0||t>3)return null;
 const envelope=Math.sin(Math.PI*t/3)**2;
 return {x:.12*Math.sin(t*12)*envelope,z:.07*Math.sin(t*10)*envelope};
}

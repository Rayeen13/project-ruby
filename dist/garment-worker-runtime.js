import * as T from './vendor/three.module.js';
import {GarmentPhysics,loadGarmentPhysics} from './garment-physics.js';
// Numeric pose/geometry only: no DOM, avatar loader, network downloads or UI.
export class GarmentWorkerRuntime{
 async boot(){this.J=await loadGarmentPhysics();}
 makeMesh(data,bones){
  const geometry=new T.BufferGeometry();for(const [name,a] of Object.entries(data.attributes))geometry.setAttribute(name,new T.BufferAttribute(a.array,a.itemSize,a.normalized));geometry.setIndex(new T.BufferAttribute(data.index,1));
  const mesh=new T.SkinnedMesh(geometry);mesh.matrixAutoUpdate=false;mesh.bindMode=data.bindMode;mesh.bindMatrix.fromArray(data.bindMatrix);mesh.skeleton=new T.Skeleton(bones,data.boneInverses.map(a=>new T.Matrix4().fromArray(a)));return mesh;
 }
 applyPose(pose){
  for(const [i,a] of pose.bones.entries()){this.bones[i].matrix.fromArray(a);this.bones[i].matrixWorld.fromArray(a);}
  for(const [name,a] of Object.entries(pose.colliders)){const b=this.colliders[name];b.matrix.fromArray(a);b.matrixWorld.fromArray(a);}
  for(const m of [this.mesh,...this.trims]){m.matrix.fromArray(pose.matrix);m.matrixWorld.fromArray(pose.matrix);m.bindMatrixInverse.fromArray(pose.bindMatrixInverse);}
 }
 run(message){
  const start=performance.now();
  if(message.type==='select'){
   this.physics?.dispose();this.bones=message.pose.bones.map(()=>{const b=new T.Bone();b.matrixAutoUpdate=false;return b;});this.colliders=Object.fromEntries(Object.keys(message.pose.colliders).map(n=>{const b=new T.Object3D();b.matrixAutoUpdate=false;return [n,b];}));
   this.mesh=this.makeMesh(message.mesh,this.bones);this.trims=message.trims.map(d=>{const mesh=this.makeMesh(d,this.bones);mesh.userData.fabricAttachment=d.attachments.map(a=>({...a,offset:new T.Vector3().fromArray(a.offset)}));return mesh;});this.applyPose(message.pose);
   const vrm={scene:new T.Group(),humanoid:{getRawBoneNode:n=>this.colliders[n]}};this.physics=new GarmentPhysics(this.J,vrm);this.physics.select(this.mesh,this.trims);this.anchor=new T.Vector3().setFromMatrixPosition(this.mesh.matrixWorld);
  }else{
   this.applyPose(message.pose);const anchor=new T.Vector3().setFromMatrixPosition(this.mesh.matrixWorld);
   // A screen drag/teleport is not a physical impulse through the body.
   if(message.type==='reset'||anchor.distanceTo(this.anchor)>.5)this.physics.reset();else this.physics.update(Math.min(message.dt,.05));this.anchor.copy(anchor);
  }
  const meshes=[this.mesh,...this.trims].map(m=>{m.computeBoundingBox();return {position:m.geometry.attributes.position.array.slice(),normal:m.geometry.attributes.normal.array.slice(),min:m.boundingBox.min.toArray(),max:m.boundingBox.max.toArray()};});
  return {type:'frame',sequence:message.sequence,revision:message.revision,meshes,motion:this.physics.motion,frameJump:this.physics.frameJump,stepMs:performance.now()-start};
 }
}

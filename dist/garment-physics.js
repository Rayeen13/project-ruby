import * as T from './vendor/three.module.js';
let library;
export const loadGarmentPhysics=()=>library??=import('./vendor/jolt-physics.wasm-compat.js').then(module=>module.default());
const unit=1/1.85;
const scale=new T.Matrix4().makeScale(unit,unit,unit);
// A garment asset keeps its authored skin weights. Jolt owns cloth stretch,
// bending, gravity, skinned attachment limits/backstops and body collisions.
export class GarmentPhysics{
 static async create(vrm){return new GarmentPhysics(await loadGarmentPhysics(),vrm);}
 constructor(J,vrm){
  this.J=J;this.vrm=vrm;this.motion=0;this.disposed=false;this.tmp=new T.Vector3();this.matrix=new T.Matrix4();this.skin=new T.Matrix4();this.inverse=new T.Matrix4();this.bones=[];this.offset=new T.Vector3();this.linear=new T.Matrix3();
  const settings=new J.JoltSettings();settings.mMaxBodies=64;settings.mMaxBodyPairs=256;settings.mMaxContactConstraints=256;settings.mMaxWorkerThreads=0;
  const pairs=new J.ObjectLayerPairFilterTable(2);pairs.EnableCollision(0,1);
  const layers=new J.BroadPhaseLayerInterfaceTable(2,2),l0=new J.BroadPhaseLayer(0),l1=new J.BroadPhaseLayer(1);layers.MapObjectToBroadPhaseLayer(0,l0);layers.MapObjectToBroadPhaseLayer(1,l1);J.destroy(l0);J.destroy(l1);
  settings.mObjectLayerPairFilter=pairs;settings.mBroadPhaseLayerInterface=layers;settings.mObjectVsBroadPhaseLayerFilter=new J.ObjectVsBroadPhaseLayerFilterTable(layers,2,pairs,2);
  this.world=new J.JoltInterface(settings);J.destroy(settings);this.system=this.world.GetPhysicsSystem();this.bi=this.system.GetBodyInterface();
  this.gravity=new J.Vec3(0,-9.81,0);this.system.SetGravity(this.gravity);this.column=new J.Vec4(0,0,0,0);this.origin=new J.RVec3(0,0,0);this.identity=J.Quat.prototype.sIdentity();this.rootIdentity=J.RMat44.prototype.sIdentity();this.jointMatrices=new J.ArrayMat44();
  this.colliders=[];this.centre=new T.Vector3();this.axis=new T.Vector3();this.rotation=new T.Quaternion();this.q=new J.Quat(0,0,0,1);this.lastOrigin=new T.Vector3();vrm.scene.updateWorldMatrix(true,true);
  const capsules=[];for(const side of ['left','right'])capsules.push([side+'UpperArm',side+'LowerArm',.024],[side+'LowerArm',side+'Hand',.019],[side+'UpperLeg',side+'LowerLeg',.048],[side+'LowerLeg',side+'Foot',.030]);capsules.push(['hips','spine',.070],['spine','neck',.075]);
  for(const [a,b,radius] of capsules){
   const from=vrm.humanoid.getRawBoneNode(a),to=vrm.humanoid.getRawBoneNode(b);if(!from||!to)continue;
   from.getWorldPosition(this.centre);to.getWorldPosition(this.axis);const half=Math.max(.001,this.axis.distanceTo(this.centre)*unit*.5-radius);
   const shape=new J.CapsuleShape(half,radius,null),creation=new J.BodyCreationSettings(shape,this.origin,this.identity,J.EMotionType_Kinematic,0);const body=this.bi.CreateBody(creation);J.destroy(creation);this.bi.AddBody(body.GetID(),J.EActivation_DontActivate);this.colliders.push({from,to,radius,body});
  }
 }
 copyMatrix(to,from){const a=from.elements;for(let i=0;i<4;i++){this.column.Set(a[i*4],a[i*4+1],a[i*4+2],a[i*4+3]);to.SetColumn4(i,this.column);}}
 select(mesh,trims=[]){
  if(this.mesh===mesh)return;this.removeGarment();this.mesh=mesh;this.trims=trims;const J=this.J,geometry=mesh.geometry;
  this.rest=geometry.attributes.fabricRest?.array.slice()||geometry.attributes.position.array.slice();this.trimRest=trims.map(m=>m.geometry.attributes.position.array.slice());this.restore=()=>{geometry.attributes.position.array.set(this.rest);geometry.attributes.position.needsUpdate=true;};
  const p=this.rest,index=geometry.index.array,weights=geometry.attributes.skinWeight,ids=geometry.attributes.skinIndex;
  const unique=new Map(),representatives=[],map=[];
  for(let i=0;i<p.length/3;i++){const key=[p[i*3],p[i*3+1],p[i*3+2]].map(v=>Math.round(v*1e6)).join();if(!unique.has(key)){unique.set(key,representatives.length);representatives.push(i);}map[i]=unique.get(key);}
  this.representatives=representatives;this.map=map;this.targets=representatives.map(()=>new T.Vector3());this.points=representatives.map(()=>new T.Vector3());this.previousOffsets=representatives.map(()=>new T.Vector3());
  const shared=new J.SoftBodySharedSettings(),vertex=new J.SoftBodySharedSettingsVertex();
  const bounds=new T.Box3().setFromArray(p),waist=1.065;this.limits=[];
  for(const i of representatives){const x=Math.abs(p[i*3]),y=p[i*3+1],skirt=T.MathUtils.smoothstep(waist-y,0,waist-bounds.min.y),sleeve=T.MathUtils.smoothstep(x,.19,.30)*(1-T.MathUtils.smoothstep(x,.48,.57));const painted=y<waist?.14*skirt:y>1.17?.025*sleeve:0,limit=painted<.002?0:painted;this.limits.push(limit);vertex.mPosition.x=p[i*3];vertex.mPosition.y=y;vertex.mPosition.z=p[i*3+2];vertex.mInvMass=limit>0?1000:0;shared.mVertices.push_back(vertex);}
  J.destroy(vertex);const face=new J.SoftBodySharedSettingsFace(0,0,0,0);
  for(let i=0;i<index.length;i+=3){const a=map[index[i]],b=map[index[i+1]],c=map[index[i+2]];if(a===b||a===c||b===c)continue;face.set_mVertex(0,a);face.set_mVertex(1,b);face.set_mVertex(2,c);shared.AddFace(face);}J.destroy(face);
  const attributes=new J.SoftBodySharedSettingsVertexAttributes();attributes.mCompliance=.00001;attributes.mShearCompliance=.00001;attributes.mBendCompliance=1000;shared.CreateConstraints(attributes,1,J.SoftBodySharedSettings_EBendType_Dihedral);J.destroy(attributes);
  const skeleton=mesh.skeleton;shared.mInvBindMatrices.resize(skeleton.bones.length);this.jointMatrices.resize(skeleton.bones.length);
  for(let i=0;i<skeleton.bones.length;i++){const bind=shared.mInvBindMatrices.at(i);bind.mJointIndex=i;this.matrix.multiplyMatrices(skeleton.boneInverses[i],mesh.bindMatrix);this.copyMatrix(bind.mInvBind,this.matrix);}
  shared.mSkinnedConstraints.resize(representatives.length);
  for(let k=0;k<representatives.length;k++){const i=representatives[k],constraint=shared.mSkinnedConstraints.at(k);constraint.mVertex=k;constraint.mMaxDistance=this.limits[k];constraint.mBackStopDistance=.012;constraint.mBackStopRadius=p[i*3+1]<waist?0:.025;for(let j=0;j<4;j++){const w=constraint.get_mWeights(j);w.mInvBindIndex=ids.getComponent(i,j);w.mWeight=weights.getComponent(i,j);}}
  this.skinMatrices();
  // Calibrate stretch/bend rest data to the fitted humanoid pose, not the
  // original export's wide T-pose. Keep bind-space positions for skinning.
  for(let k=0;k<representatives.length;k++){const i=representatives[k],v=shared.mVertices.at(k);this.tmp.fromArray(this.rest,i*3).applyMatrix4(this.blendMatrix(mesh,i));v.mPosition.x=this.tmp.x;v.mPosition.y=this.tmp.y;v.mPosition.z=this.tmp.z;}
  shared.CalculateEdgeLengths();shared.CalculateBendConstraintConstants();shared.CalculateLRALengths();
  for(let k=0;k<representatives.length;k++){const i=representatives[k],v=shared.mVertices.at(k);v.mPosition.x=p[i*3];v.mPosition.y=p[i*3+1];v.mPosition.z=p[i*3+2];}
  shared.CalculateSkinnedConstraintNormals();shared.Optimize();
  this.origin.Set(0,0,0);const creation=new J.SoftBodyCreationSettings(shared,this.origin,this.identity,1);creation.mUpdatePosition=false;creation.mAllowSleeping=false;creation.mFacesDoubleSided=true;creation.mNumIterations=8;creation.mVertexRadius=.004;// Dissipate shake energy rather than letting constraints ring at low FPS.
  creation.mLinearDamping=3;creation.mMaxLinearVelocity=2;
  this.body=this.bi.CreateSoftBody(creation);J.destroy(creation);this.bi.AddBody(this.body.GetID(),J.EActivation_Activate);this.properties=J.castObject(this.body.GetMotionProperties(),J.SoftBodyMotionProperties);this.properties.SetEnableSkinConstraints(true);this.reset();
 }
 skinMatrices(){
  const mesh=this.mesh;mesh.updateWorldMatrix(true,false);mesh.skeleton.update();this.prefix=new T.Matrix4().multiplyMatrices(scale,mesh.matrixWorld).multiply(mesh.bindMatrixInverse);
  this.bones.length=mesh.skeleton.bones.length;
  for(let i=0;i<mesh.skeleton.bones.length;i++){const bone=this.bones[i]||new T.Matrix4();bone.multiplyMatrices(this.prefix,mesh.skeleton.bones[i].matrixWorld).multiply(mesh.skeleton.boneInverses[i]).multiply(mesh.bindMatrix);this.bones[i]=bone;this.matrix.multiplyMatrices(this.prefix,mesh.skeleton.bones[i].matrixWorld);this.copyMatrix(this.jointMatrices.at(i),this.matrix);}
 }
 reset(){if(!this.body)return;this.accumulator=0;this.skinMatrices();this.properties.SkinVertices(this.rootIdentity,this.jointMatrices.data(),this.jointMatrices.size(),true,this.world.GetTempAllocator());this.motion=0;for(const offset of this.previousOffsets)offset.set(0,0,0);this.writeMesh();}
 update(dt){
  if(!this.body||!(dt>0))return;this.skinMatrices();
  for(const {from,to,body} of this.colliders){from.getWorldPosition(this.centre);to.getWorldPosition(this.axis);this.tmp.copy(this.axis).sub(this.centre).normalize();this.rotation.setFromUnitVectors(new T.Vector3(0,1,0),this.tmp);this.centre.add(this.axis).multiplyScalar(unit*.5);this.origin.Set(this.centre.x,this.centre.y,this.centre.z);this.q.Set(this.rotation.x,this.rotation.y,this.rotation.z,this.rotation.w);this.bi.SetPositionAndRotation(body.GetID(),this.origin,this.q,this.J.EActivation_DontActivate);}
  this.properties.SkinVertices(this.rootIdentity,this.jointMatrices.data(),this.jointMatrices.size(),false,this.world.GetTempAllocator());
  // XPBD reconstructs velocity from position / dt. Never feed it a tiny
  // remainder step: ordinary RAF jitter previously amplified those velocities.
  // Accumulate elapsed time and let Jolt divide it into equal fixed ticks.
  const tick=1/60;this.accumulator=Math.min((this.accumulator||0)+dt,.125);
  const steps=Math.floor((this.accumulator+1e-9)/tick);
  if(steps){this.world.Step(steps*tick,steps);this.accumulator=Math.max(0,this.accumulator-steps*tick);}
  this.enforceEnvelope();this.writeMesh();
 }
 enforceEnvelope(){
  // Jolt solves skin constraints before edges. Apply the authored hard envelope
  // once after the solve so stretch/contact corrections cannot pull shoulder
  // seams away from their attachment map during a sharp animation change.
  for(let k=0;k<this.representatives.length;k++){const i=this.representatives[k],target=this.targets[k].fromArray(this.rest,i*3).applyMatrix4(this.blendMatrix(this.mesh,i)),vertex=this.properties.GetVertex(k),position=vertex.mPosition;this.tmp.set(position.GetX(),position.GetY(),position.GetZ()).sub(target);const distance=this.tmp.length(),limit=this.limits[k];if(distance<=limit||distance<1e-10)continue;this.tmp.divideScalar(distance);position.Set(target.x+this.tmp.x*limit,target.y+this.tmp.y*limit,target.z+this.tmp.z*limit);const velocity=vertex.mVelocity,outward=velocity.GetX()*this.tmp.x+velocity.GetY()*this.tmp.y+velocity.GetZ()*this.tmp.z;if(outward>0)velocity.Set(velocity.GetX()-this.tmp.x*outward,velocity.GetY()-this.tmp.y*outward,velocity.GetZ()-this.tmp.z*outward);}
 }
 blendMatrix(mesh,i,out=this.skin){const ids=mesh.geometry.attributes.skinIndex,w=mesh.geometry.attributes.skinWeight;out.elements.fill(0);for(let j=0;j<4;j++){const weight=w.getComponent(i,j),m=this.bones[ids.getComponent(i,j)].elements;for(let k=0;k<16;k++)out.elements[k]+=weight*m[k];}return out;}
 writeMesh(){
  const mesh=this.mesh,positions=mesh.geometry.attributes.position;this.motion=0;this.frameJump=0;
  for(let k=0;k<this.representatives.length;k++){const v=this.properties.GetVertex(k).mPosition;this.points[k].set(v.GetX(),v.GetY(),v.GetZ());const i=this.representatives[k];this.targets[k].fromArray(this.rest,i*3).applyMatrix4(this.blendMatrix(mesh,i));this.motion=Math.max(this.motion,this.points[k].distanceTo(this.targets[k]));this.tmp.copy(this.points[k]).sub(this.targets[k]);this.frameJump=Math.max(this.frameJump,this.tmp.distanceTo(this.previousOffsets[k]));this.previousOffsets[k].copy(this.tmp);}
  for(let i=0;i<positions.count;i++){this.inverse.copy(this.blendMatrix(mesh,i)).invert();this.tmp.copy(this.points[this.map[i]]).applyMatrix4(this.inverse);positions.setXYZ(i,this.tmp.x,this.tmp.y,this.tmp.z);}positions.needsUpdate=true;mesh.geometry.computeVertexNormals();mesh.computeBoundingBox();
  for(const trim of this.trims){const a=trim.geometry.attributes.position;for(let i=0;i<a.count;i++){const attachment=trim.userData.fabricAttachment[i],skin=this.blendMatrix(trim,i);this.linear.setFromMatrix4(skin);this.offset.copy(attachment.offset).applyMatrix3(this.linear);this.tmp.copy(this.points[this.map[attachment.a]]).lerp(this.points[this.map[attachment.b]],attachment.t).add(this.offset);this.inverse.copy(skin).invert();this.tmp.applyMatrix4(this.inverse);a.setXYZ(i,this.tmp.x,this.tmp.y,this.tmp.z);}a.needsUpdate=true;trim.geometry.computeVertexNormals();trim.computeBoundingBox();}
 }
 removeGarment(){if(this.body){const id=this.body.GetID();this.bi.RemoveBody(id);this.bi.DestroyBody(id);this.body=null;this.properties=null;this.restore();for(let i=0;i<this.trims.length;i++){this.trims[i].geometry.attributes.position.array.set(this.trimRest[i]);this.trims[i].geometry.attributes.position.needsUpdate=true;}}this.mesh=null;}
 dispose(){if(this.disposed)return;this.removeGarment();for(const {body} of this.colliders){const id=body.GetID();this.bi.RemoveBody(id);this.bi.DestroyBody(id);}for(const value of [this.jointMatrices,this.q,this.rootIdentity,this.identity,this.origin,this.column,this.gravity,this.world])this.J.destroy(value);this.disposed=true;}
}

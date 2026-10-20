import * as T from './vendor/three.module.js';
const colliderNames=['hips','spine','neck',...['left','right'].flatMap(s=>['UpperArm','LowerArm','Hand','UpperLeg','LowerLeg','Foot'].map(b=>s+b))];
const arrays=geometry=>({attributes:Object.fromEntries(Object.entries(geometry.attributes).map(([name,a])=>[name,{array:a.array.slice(),itemSize:a.itemSize,normalized:a.normalized}])),index:geometry.index.array.slice()});
const meshData=mesh=>({...arrays(mesh.geometry),bindMatrix:mesh.bindMatrix.toArray(),bindMode:mesh.bindMode,boneInverses:mesh.skeleton.boneInverses.map(m=>m.toArray())});
// The UI never imports/executes a Jolt step. One in-flight request, no queued
// frames, and an independent timer can terminate an unresponsive simulation.
export class GarmentWorker{
 static async create(vrm,options){const client=new GarmentWorker(vrm,options);await client.ready;return client;}
 constructor(vrm,{createWorker=()=>new Worker(new URL('./garment-worker.js',import.meta.url),{type:'module',name:'Opal cloth'}),stepTimeout=1500,bootTimeout=15000}={}){
  this.vrm=vrm;this.worker=createWorker();this.stepTimeout=stepTimeout;this.motion=0;this.frameJump=0;this.elapsed=0;this.revision=0;this.sequence=0;this.state='starting';this.busy=false;this.disposed=false;this.names=colliderNames.filter(n=>vrm.humanoid.getRawBoneNode(n));
  this.ready=new Promise((resolve,reject)=>{this.resolveReady=resolve;this.rejectReady=reject;});
  this.worker.onmessage=e=>this.receive(e.data);this.worker.onerror=e=>this.fail(e.message||'Cloth worker failed');this.worker.onmessageerror=()=>this.fail('Invalid cloth worker message');
  this.arm(bootTimeout);this.worker.postMessage({type:'boot'});
 }
 arm(ms){clearTimeout(this.timer);this.timer=setTimeout(()=>this.fail('Cloth simulation exceeded its time budget'),ms);this.timer.unref?.();}
 fail(reason){if(this.disposed||this.error)return;this.error=new Error(reason);this.state='failed';clearTimeout(this.timer);this.worker.terminate();this.busy=false;this.restore();this.rejectReady(this.error);}
 pose(){
  this.vrm.scene.updateWorldMatrix(true,true);this.mesh.updateWorldMatrix(true,false);
  return {matrix:this.mesh.matrixWorld.toArray(),bindMatrixInverse:this.mesh.bindMatrixInverse.toArray(),bones:this.mesh.skeleton.bones.map(b=>b.matrixWorld.toArray()),colliders:Object.fromEntries(this.names.map(n=>[n,this.vrm.humanoid.getRawBoneNode(n).matrixWorld.toArray()]))};
 }
 select(mesh,trims=[]){
  if(this.mesh===mesh)return;this.restore();this.mesh=mesh;this.trims=trims;this.originals=[mesh,...trims].map(m=>({mesh:m,position:m.geometry.attributes.position.array.slice(),normal:m.geometry.attributes.normal?.array.slice()}));
  this.revision++;this.needsSelect=true;this.elapsed=0;this.motion=0;this.frameJump=0;
 }
 restore(){for(const o of this.originals||[]){o.mesh.geometry.attributes.position.array.set(o.position);o.mesh.geometry.attributes.position.needsUpdate=true;if(o.normal){o.mesh.geometry.attributes.normal.array.set(o.normal);o.mesh.geometry.attributes.normal.needsUpdate=true;}o.mesh.boundingBox=null;}this.originals=[];}
 reset(){this.needsReset=true;this.elapsed=0;}
 update(dt){
  if(this.error)throw this.error;if(this.disposed||!this.mesh||!(dt>0))return;
  this.elapsed=Math.min(.05,this.elapsed+dt);if(this.state==='starting'||this.busy)return;
  const type=this.needsSelect?'select':this.needsReset?'reset':'step',message={type,sequence:++this.sequence,revision:this.revision,pose:this.pose(),dt:this.elapsed};
  if(this.needsSelect){message.mesh=meshData(this.mesh);message.trims=this.trims.map(m=>({...meshData(m),attachments:m.userData.fabricAttachment.map(a=>({...a,offset:a.offset.toArray()}))}));}
  this.needsSelect=false;this.needsReset=false;this.elapsed=0;this.busy=true;this.state='working';this.arm(type==='select'?10000:this.stepTimeout);
  try{this.worker.postMessage(message);}catch(error){this.fail(error.message);}
 }
 receive(message){
  if(this.disposed||this.error)return;
  if(message.type==='error'){this.fail(message.error||'Cloth simulation failed');return;}
  if(message.type==='ready'){clearTimeout(this.timer);this.state='ready';this.resolveReady();return;}
  if(message.type!=='frame'||message.sequence!==this.sequence)return;
  clearTimeout(this.timer);this.busy=false;this.state='ready';this.stepMs=message.stepMs;
  if(message.revision!==this.revision)return;
  for(const [i,data] of message.meshes.entries()){
   const mesh=[this.mesh,...this.trims][i];if(!mesh||data.position.length!==mesh.geometry.attributes.position.array.length){this.fail('Invalid cloth geometry result');return;}
   for(const a of [data.position,data.normal])for(const v of a)if(!Number.isFinite(v)){this.fail('Non-finite cloth simulation result');return;}
   mesh.geometry.attributes.position.array.set(data.position);mesh.geometry.attributes.position.needsUpdate=true;
   mesh.geometry.attributes.normal.array.set(data.normal);mesh.geometry.attributes.normal.needsUpdate=true;
   mesh.boundingBox=new T.Box3(new T.Vector3().fromArray(data.min),new T.Vector3().fromArray(data.max));
  }
  this.motion=message.motion;this.frameJump=message.frameJump;
 }
 dispose(){if(this.disposed)return;this.disposed=true;clearTimeout(this.timer);this.worker.terminate();this.restore();this.state='disposed';}
}

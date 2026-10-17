import * as T from './vendor/three.module.js';
// VRM 1 canonical T-pose: +Z forward, left arm +X, palms -Y.
// Rotations are relative to the normalized rest pose, never raw mesh axes.
const axisX=new T.Vector3(1,0,0),axisY=new T.Vector3(0,1,0),axisZ=new T.Vector3(0,0,1);
const rotation=(axis,angle)=>new T.Quaternion().setFromAxisAngle(axis,angle);
export function sampleHumanoidArmPose(time,{side='right',gesture='relaxed',waveWeight=0}={}){
 const sign=side==='left'?1:-1,w=T.MathUtils.clamp(waveWeight,0,1),swing=Math.sin(time*Math.PI*2*1.15),pose={};
 const put=(name,q)=>{pose[side+name]={rotation:q.toArray()};};
 put('UpperArm',rotation(axisZ,T.MathUtils.lerp(-sign*1.22,sign*.38,w)));
 // Bend at the elbow, then turn the forearm along its length so the palm
 // faces the viewer. The wrist deviates around the palm normal, not backwards.
 put('LowerArm',rotation(axisZ,T.MathUtils.lerp(-sign*.08,sign*1.12,w)).multiply(rotation(axisX,-Math.PI/2*w)));
 put('Hand',rotation(axisY,-sign*swing*.30*w));
 const curl=gesture==='open'?0:gesture==='relaxed'?.16:gesture==='grip'?.75:1;
 for(const [i,digit] of ['Index','Middle','Ring','Little'].entries()){
  const c=(gesture==='point'&&i===0?0:curl)*(1-w);
  for(const [joint,factor] of [['Proximal',1],['Intermediate',1.05],['Distal',.7]])put(digit+joint,rotation(axisZ,-sign*c*factor));
 }
 put('ThumbMetacarpal',rotation(axisY,-sign*curl*.35*(1-w)));
 put('ThumbProximal',rotation(axisZ,-sign*curl*.45*(1-w)));
 put('ThumbDistal',rotation(axisZ,-sign*curl*.55*(1-w)));
 return pose;
}
export function normalizedRigRotation(rotation,vrm){
 // VRM 0 faces -Z before rotateVRM0. Conjugate by Y=pi to share +Z poses.
 return vrm.meta?.metaVersion==='0'?[-rotation[0],rotation[1],-rotation[2],rotation[3]]:rotation;
}
export function applyHumanoidArmPose(vrm,pose){for(const [name,transform] of Object.entries(pose)){const bone=vrm.humanoid.getNormalizedBoneNode(name);if(bone)bone.quaternion.fromArray(normalizedRigRotation(transform.rotation,vrm));}}
// A real, finite Three.js animation clip for games using a VRM humanoid.
// Update the mixer before vrm.update(dt); missing optional finger bones are skipped.
export function createHumanoidGestureClip(vrm,{side='right',gesture='wave',duration=3.2,fps=30}={}){
 if(!Number.isFinite(duration)||duration<=0||duration>30||!Number.isFinite(fps)||fps<1||fps>120)throw Error('Invalid gesture timing');
 const count=Math.ceil(duration*fps),times=[],tracks=new Map();
 for(let i=0;i<=count;i++){const t=i/count*duration;times.push(t);const edge=Math.min(1,t/.45,(duration-t)/.45),weight=gesture==='wave'?T.MathUtils.smoothstep(edge,0,1):0;
  const pose=sampleHumanoidArmPose(t,{side,gesture:gesture==='wave'?'relaxed':gesture,waveWeight:weight});
  for(const [name,transform] of Object.entries(pose)){const bone=vrm.humanoid.getNormalizedBoneNode(name);if(!bone)continue;if(!tracks.has(name))tracks.set(name,{bone,values:[]});tracks.get(name).values.push(...normalizedRigRotation(transform.rotation,vrm));}
 }
 return new T.AnimationClip('ruby.'+gesture+'.'+side,duration,[...tracks.values()].map(({bone,values})=>new T.QuaternionKeyframeTrack(bone.uuid+'.quaternion',times,values)));
}

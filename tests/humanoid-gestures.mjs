import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {OpalCharacter} from '../dist/opal-character.js';
import {sampleHumanoidArmPose,applyHumanoidArmPose,normalizedRigRotation,createHumanoidGestureClip} from '../dist/humanoid-gestures.js';
const c=new OpalCharacter({createCanvas:()=>({getContext:()=>new Proxy({},{get:()=>()=>{}})})});await c.ready;
const palm=new T.Vector3(0,-1,0),front=new T.Vector3(0,0,1);
for(const side of ['left','right'])for(let i=0;i<120;i++){
 applyHumanoidArmPose(c.vrm,sampleHumanoidArmPose(i/30,{side,waveWeight:1}));c.syncPose();c.root.updateMatrixWorld(true);
 const hand=c.bone(side+'Hand'),q=hand.getWorldQuaternion(new T.Quaternion()),normal=palm.clone().applyQuaternion(q);
 assert(normal.dot(front)>.94,side+': palm must face forward throughout wrist wave');
 assert(hand.getWorldPosition(new T.Vector3()).y>c.bone(side+'UpperArm').getWorldPosition(new T.Vector3()).y,'Hand rises above its shoulder');
 assert(!c.getHeadBounds().containsPoint(hand.getWorldPosition(new T.Vector3())),'Hand stays outside head');
}
for(const side of ['left','right'])for(const gesture of ['open','relaxed','point','grip','fist']){
 const pose=sampleHumanoidArmPose(0,{side,gesture});for(const transform of Object.values(pose))assert(Math.abs(new T.Quaternion().fromArray(transform.rotation).length()-1)<1e-8);
 if(gesture==='point')assert(new T.Quaternion().fromArray(pose[side+'IndexProximal'].rotation).angleTo(new T.Quaternion())<1e-8);
 if(gesture==='open')assert(new T.Quaternion().fromArray(pose[side+'MiddleIntermediate'].rotation).angleTo(new T.Quaternion())<1e-8);
}
const clip=createHumanoidGestureClip(c.vrm);assert(clip.tracks.length>=18);assert(clip.tracks.every(t=>t.name.endsWith('.quaternion')));assert.equal(clip.duration,3.2);
for(const track of clip.tracks){assert.deepEqual([...track.values.slice(0,4)].map(v=>v||0),[...track.values.slice(-4)].map(v=>v||0));assert([...track.values].every(Number.isFinite));}
const mixer=new T.AnimationMixer(c.vrm.humanoid.normalizedHumanBonesRoot);mixer.clipAction(clip).setLoop(T.LoopOnce).play();mixer.update(1);c.syncPose();c.root.updateMatrixWorld(true);assert(palm.clone().applyQuaternion(c.bone('rightHand').getWorldQuaternion(new T.Quaternion())).z>.94,'Reusable clip produces the same outward palm');
const canonical=sampleHumanoidArmPose(.3,{waveWeight:1}).rightHand.rotation;assert.deepEqual(normalizedRigRotation(canonical,{meta:{metaVersion:'1'}}),canonical);assert.deepEqual(normalizedRigRotation(canonical,{meta:{metaVersion:'0'}}),[-canonical[0],canonical[1],-canonical[2],canonical[3]]);
console.log('PASS: both humanoid palms face forward, hands clear the head, finger poses are normalized, VRM0/1 conversion and a real mixer-playable clip.');

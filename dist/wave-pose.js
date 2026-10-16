import * as T from './vendor/three.module.js';
// Compact side arms with separately articulated robotic digits.
export function mountSideArms(character){
 const compact=character.shoulderSpan!==undefined;
 const layout=character.armLayout||{},x=layout.x??(compact?.58:.52),y=layout.y??(compact?.69:(character.head.position.y>2?1.03:.88));
 for(const rig of character.arms){
  const {arm,forearm,hand,side}=rig;
  arm.position.set(side*x,y,layout.z??.12);arm.scale.setScalar(1);
  for(const child of [...arm.children])if(child!==forearm)arm.remove(child);
  character.sphere(arm,.065,character.dark,[0,0,0]);
  const cuff=character.sphere(arm,1,character.shell,[0,-.065,0]);cuff.scale.set(.075,.105,.075);
  forearm.position.set(0,-(layout.upper??.09),0);
  for(const child of [...forearm.children])if(child!==hand)forearm.remove(child);
  hand.position.set(0,-(layout.lower??.10),.005);hand.scale.setScalar(layout.handScale??1);
  if(character.armLayout){
   character.bar(arm,[0,-.055,0],[0,-layout.upper,0],.043,character.skin);
   rig.sleeve=character.bar(forearm,[0,0,0],[0,-layout.lower,0],.036,character.coat);
  }
  for(const child of [...hand.children])if(child!==character.controller)hand.remove(child);
  const palm=character.armLayout?character.sphere(hand,1,character.coat,[0,-.012,0],[.094,.058,.041]):character.box(hand,.185,.105,.075,.018,character.armor,[0,-.012,0]);
  palm.name='robot-palm';
  const fingers=[];
  for(let i=0;i<4;i++){
   const length=[.065,.073,.069,.055][i],base=new T.Group(),tip=new T.Group();
   base.name=['index','middle','ring','little'][i]+'-knuckle';
   base.position.set((i-1.5)*.049*(-side),-.074,0);hand.add(base);
   character.box(base,.033,length*.55,.056,.006,character.armor,[0,-length*.275,0]);
   tip.position.y=-length*.55;base.add(tip);tip.name='finger-tip-joint';
   character.box(tip,.031,length*.45,.052,.006,character.armor,[0,-length*.225,0]);
   fingers.push({base,tip});
  }
  const thumb=new T.Group(),thumbTip=new T.Group();
  thumb.name='opposing-thumb';thumb.position.set(side*.116,-.023,.015);hand.add(thumb);
  thumb.rotation.z=side*.65;
  character.box(thumb,.039,.037,.057,.007,character.armor,[0,-.018,0]);
  thumbTip.position.y=-.037;thumb.add(thumbTip);
  character.box(thumbTip,.035,.03,.052,.006,character.armor,[0,-.015,0]);
  hand.userData.digits={fingers,thumb,thumbTip,side};
  character.handGestures??={};
  character.setHandGesture=(pose,side=-1)=>{
   if(!['relaxed','open','grip','point','fist'].includes(pose))throw new Error('Unknown hand gesture: '+pose);
   character.handGestures[side]=pose;
  };
  setHandPose(hand,'relaxed');
  rig.palmNormal=new T.Vector3(0,0,1);
 }
}
// Joint angles can be driven by an animator or future object-grip solver.
export function setHandPose(hand,pose='relaxed',weight=1){
 const digits=hand.userData.digits;if(!digits)return;
 const curl=pose==='open'?0:pose==='relaxed'?.18:pose==='grip'?.8:1.1;
 digits.fingers.forEach(({base,tip},i)=>{
  const angle=pose==='point'&&i===0?0:curl;
  base.rotation.x=T.MathUtils.lerp(base.rotation.x,-angle,weight);tip.rotation.x=T.MathUtils.lerp(tip.rotation.x,-angle*.9,weight);
 });
 digits.thumb.rotation.x=T.MathUtils.lerp(digits.thumb.rotation.x,pose==='open'?0:-curl*.65,weight);
 digits.thumb.rotation.y=T.MathUtils.lerp(digits.thumb.rotation.y,pose==='grip'||pose==='fist'?-digits.side*.65:0,weight);
 digits.thumbTip.rotation.x=T.MathUtils.lerp(digits.thumbTip.rotation.x,-curl*.8,weight);
}
const target=new T.Quaternion(),identity=new T.Quaternion(),rotation=new T.Euler();
function blendRotation(group,x,y,z,weight){
 target.setFromEuler(rotation.set(x,y,z));group.quaternion.slerp(target,weight);
}
export function applyWavePose(character,rig,t,{holding=false,weight=1}={}){
 const {arm,forearm,hand}=rig;
 const restPropAngle=holding?arm.rotation.z+hand.rotation.z+character.controller.rotation.z:0;
 weight=T.MathUtils.clamp(weight,0,1);
 character.head.quaternion.slerp(identity,weight);
 setHandPose(hand,holding?'grip':'open',weight);
 const shoulder=-1.87+Math.sin(t*3.7)*.28;
 blendRotation(arm,0,0,shoulder,weight);
 blendRotation(forearm,0,0,0,weight);
 blendRotation(hand,0,0,Math.PI-shoulder+Math.sin(t*3.7)*.16,weight);
 if(holding&&character.controller){
  // Keep the prop upright throughout the blended wrist/shoulder movement.
  character.controller.rotation.z=-(arm.rotation.z+hand.rotation.z)+restPropAngle*(1-weight);
  character.controller.position.set(.13,T.MathUtils.lerp(-.04,.10,weight),.12);
 }
}

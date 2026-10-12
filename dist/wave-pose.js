import * as T from './vendor/three.module.js';
// Compact side arms with separately articulated robotic digits.
export function mountSideArms(character){
 const compact=character.shoulderSpan!==undefined;
 const x=compact?.58:.52,y=compact?.69:(character.head.position.y>2?1.03:.88);
 for(const rig of character.arms){
  const {arm,forearm,hand,side}=rig;
  arm.position.set(side*x,y,.12);arm.scale.setScalar(1);
  for(const child of [...arm.children])if(child!==forearm)arm.remove(child);
  character.sphere(arm,.065,character.dark,[0,0,0]);
  const cuff=character.sphere(arm,1,character.shell,[0,-.065,0]);cuff.scale.set(.075,.105,.075);
  forearm.position.set(0,-.09,0);
  for(const child of [...forearm.children])if(child!==hand)forearm.remove(child);
  hand.position.set(0,-.10,.005);hand.scale.setScalar(1);
  for(const child of [...hand.children])if(child!==character.controller)hand.remove(child);
  const palm=character.box(hand,.185,.105,.075,.018,character.armor,[0,-.012,0]);
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
export function setHandPose(hand,pose='relaxed'){
 const digits=hand.userData.digits;if(!digits)return;
 const curl=pose==='open'?0:pose==='relaxed'?.18:pose==='grip'?.8:1.1;
 digits.fingers.forEach(({base,tip},i)=>{
  const angle=pose==='point'&&i===0?0:curl;
  base.rotation.x=-angle;tip.rotation.x=-angle*.9;
 });
 digits.thumb.rotation.x=pose==='open'?0:-curl*.65;
 digits.thumb.rotation.y=pose==='grip'||pose==='fist'?-digits.side*.65:0;
 digits.thumbTip.rotation.x=-curl*.8;
}
export function applyWavePose(character,rig,t,{holding=false}={}){
 const {arm,forearm,hand}=rig;
 character.head.rotation.set(0,0,0);
 setHandPose(hand,holding?'grip':'open');
 // The whole short arm swings sideways at its body hinge; no forward thrust.
 arm.rotation.set(0,0,-1.87+Math.sin(t*3.7)*.28);
 forearm.rotation.set(0,0,0);
 hand.rotation.set(0,0,Math.PI-arm.rotation.z+Math.sin(t*3.7)*.16);
 if(holding&&character.controller){
  character.controller.rotation.z=-(arm.rotation.z+hand.rotation.z);
  character.controller.position.set(.13,.10,.12);
 }
}

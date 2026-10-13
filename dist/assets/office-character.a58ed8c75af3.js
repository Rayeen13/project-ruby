import * as T from '../vendor/three.module.js';
import {RubyCharacter} from './character.a58ed8c75af3.js';
// A separate body implementation; shared geometry helpers and animation contract.
export class OfficeCharacter extends RubyCharacter {
 build(){
  // Compact appliance-like robot: no human neck, lapels or elongated skull.
  this.head.position.y=1.62;this.shoulderSpan=1.1;
  this.shell.color.set(0x626f7c);this.shell.metalness=.3;this.shell.roughness=.5;
  this.armor.color.set(0xc7d0d4);this.armor.metalness=.28;this.accent.emissiveIntensity=.12;
  this.box(this.head,1.38,.91,.72,.18,this.armor,[0,0,0]);
  this.box(this.head,1.2,.7,.1,.16,this.dark,[0,-.015,.384]);
  const face=this.mesh(this.head,new T.PlaneGeometry(1.13,.62),new T.MeshBasicMaterial({map:this.faceTex,transparent:true,depthWrite:false}),[0,-.015,.441]);face.castShadow=false;
  for(const side of [-1,1]){
   this.box(this.head,.085,.38,.42,.04,this.shell,[side*.755,-.015,-.025]);
   this.box(this.head,.014,.13,.14,.005,this.accent,[side*.806,-.015,.02]);
  }
  this.box(this.head,.21,.027,.035,.009,this.accent,[.39,.36,.355]);
  this.box(this.body,.8,.57,.56,.13,this.shell,[0,.87,0]);
  this.box(this.body,.56,.34,.06,.08,this.armor,[0,.9,.305]);
  this.box(this.body,.14,.024,.025,.008,this.accent,[-.12,.94,.35]);
  for(let i=0;i<3;i++)this.box(this.body,.07,.018,.026,.005,this.dark,[-.095+i*.095,.82,.35]);
  this.arms=[];this.feet=[];
  for(const side of [-1,1]){
   const arm=new T.Group();arm.position.set(side*.47,1.04,0);this.body.add(arm);
   this.sphere(arm,.09,this.dark,[0,0,0]);
   this.box(arm,.18,.2,.24,.065,this.armor,[side*.025,-.09,0]);
   const forearm=new T.Group();forearm.position.set(side*.035,-.22,0);arm.add(forearm);
   this.sphere(forearm,.065,this.dark,[0,0,0]);
   this.box(forearm,.18,.16,.2,.05,this.shell,[0,-.075,.02]);
   const hand=new T.Group();hand.position.set(0,-.19,.04);forearm.add(hand);
   this.box(hand,.2,.15,.15,.05,this.armor,[0,0,0]);
   for(const x of [-.05,.025])this.box(hand,.06,.07,.08,.02,this.shell,[x,-.095,.025]);
   this.sphere(hand,.04,this.armor,[-side*.12,-.015,0],[1,1.4,1]);
   this.arms.push({arm,forearm,hand,side});
   const leg=new T.Group();leg.position.set(side*.27,.36,0);this.body.add(leg);
   this.box(leg,.2,.22,.25,.04,this.dark,[0,.065,0]);
   this.box(leg,.44,.24,.59,.09,this.shell,[0,-.19,.12]);
   this.box(leg,.42,.035,.55,.012,this.armor,[0,-.32,.12]);
   this.box(leg,.21,.05,.055,.016,this.accent,[0,-.2,.427]);this.feet.push(leg);
  }
  this.root.scale.setScalar(1.16);
 }

 update(t,options={}){
  super.update(t,options);
  this.body.position.y=Math.sin(t*1.5)*.007;
  if(!options.dance){this.head.rotation.z=Math.sin(t*.65)*.008;this.head.rotation.x*=.55;this.head.rotation.y*=.7;}
  const c=this.ctx,color=this.eyeColor||'#ff5278',gx=this.gaze.x,gy=this.gaze.y;
  c.clearRect(0,0,640,280);c.fillStyle='#d4e8eb';c.strokeStyle='#d4e8eb';c.shadowColor=color;c.shadowBlur=9;
  const blink=Math.sin(t*1.3)>.993;
  for(const base of [224,416]){const x=base+gx*26,y=127-gy*18;c.beginPath();if(this.mood==='happy'&&!blink){c.lineWidth=10;c.lineCap='round';c.arc(x,y+20,56,Math.PI,2*Math.PI);c.stroke();}else{const h=blink?5:this.mood==='sleep'?9:this.mood==='listen'?150:134;c.roundRect(x-59,y-h/2,118,h,Math.min(32,h/2));c.fill();}}
  c.shadowBlur=0;c.strokeStyle='#a6bec6';c.lineWidth=3;c.beginPath();c.moveTo(306,204);c.quadraticCurveTo(320,209,334,204);c.stroke();
  if(this.mood==='listen'){c.fillStyle=color;for(let i=0;i<5;i++){const h=4+Math.abs(Math.sin(t*4+i))*9;c.fillRect(302+i*8,248-h/2,3,h);}}
  this.faceTex.needsUpdate=true;
 }
}

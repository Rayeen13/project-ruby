import * as T from '../vendor/three.module.js';
import {RubyCharacter} from './character.3a6657ccd156.js';
// Original stylised android. No imported character, costume or animation assets.
export class OpalCharacter extends RubyCharacter {
 build(){
  this.head.position.y=1.9;
  this.skin=new T.MeshToonMaterial({color:0xf4d8ce});
  this.hair=new T.MeshToonMaterial({color:0x313449});
  this.coat=new T.MeshToonMaterial({color:0xe5e7f0});
  this.shell.color.set(0x323c52);this.armor.color.set(0xe5e7f0);
  // Rounded face, asymmetric silver-violet bob and a gem hair clasp.
  this.sphere(this.head,1,this.hair,[0,.03,-.09],[.54,.61,.43]);
  this.sphere(this.head,1,this.skin,[0,-.025,.10],[.435,.52,.35]);
  for(const side of [-1,1]){
   this.sphere(this.head,1,this.hair,[side*.43,-.1,-.01],[.115,.51,.31]);
   this.sphere(this.head,.09,this.skin,[side*.43,-.04,.12],[.65,1,.7]);
  }
  for(let i=0;i<6;i++){
   const lock=this.mesh(this.head,new T.ConeGeometry(.14,.46,4),i===1?this.coat:this.hair,[-.35+i*.135,.25,.33]);lock.rotation.z=Math.PI+.15;lock.scale.z=.4;
  }
  const clasp=this.mesh(this.head,new T.OctahedronGeometry(.095),this.accent,[.46,.15,.25]);clasp.scale.z=.4;
  const face=this.mesh(this.head,new T.PlaneGeometry(.77,.45),new T.MeshBasicMaterial({map:this.faceTex,transparent:true,depthWrite:false}),[0,-.055,.448]);face.castShadow=false;
  // Short flight jacket, angular tunic and ankle boots, with a fully solid core for printing.
  this.sphere(this.body,1,this.dark,[0,1.04,0],[.30,.39,.23]);
  this.box(this.body,.65,.43,.43,.10,this.coat,[0,1.13,0]);
  this.box(this.body,.07,.38,.04,.01,this.dark,[0,1.13,.24]);
  this.mesh(this.body,new T.OctahedronGeometry(.07),this.accent,[0,1.25,.28]);
  this.mesh(this.body,new T.CylinderGeometry(.29,.39,.32,8),this.dark,[0,.76,0]);
  this.arms=[];this.feet=[];
  for(const side of [-1,1]){
   const arm=new T.Group(),forearm=new T.Group(),hand=new T.Group();this.body.add(arm);arm.add(forearm);forearm.add(hand);this.arms.push({arm,forearm,hand,side});
   const leg=new T.Group();leg.position.set(side*.18,.39,0);this.body.add(leg);
   this.box(leg,.19,.36,.22,.05,this.armor,[0,.03,0]);
   this.box(leg,.25,.25,.38,.07,this.shell,[0,-.25,.055]);
   this.box(leg,.24,.035,.37,.008,this.accent,[0,-.37,.055]);this.feet.push(leg);
  }
 }
 update(t,options={}){
  super.update(t,options);
  const c=this.ctx,gx=this.gaze.x,gy=this.gaze.y;c.clearRect(0,0,640,280);
  const blink=Math.sin(t*1.3)>.993||this.mood==='sleep';
  for(const side of [-1,1]){
   const x=320+side*133,y=117;c.save();c.translate(x,y);
   if(blink||this.mood==='happy'){c.strokeStyle='#3d3048';c.lineWidth=8;c.lineCap='round';c.beginPath();c.moveTo(-56,9);c.quadraticCurveTo(0,this.mood==='happy'?-32:17,56,7);c.stroke();}
   else{
    c.fillStyle='#fff5f3';c.beginPath();c.ellipse(0,0,61,61,0,0,Math.PI*2);c.fill();
    c.fillStyle=this.eyeColor;c.beginPath();c.ellipse(gx*17,gy*-12+5,32,53,0,0,Math.PI*2);c.fill();
    c.fillStyle='#25253b';c.beginPath();c.ellipse(gx*17,gy*-12+3,15,38,0,0,Math.PI*2);c.fill();
    c.fillStyle='white';c.beginPath();c.ellipse(gx*17-12,gy*-12-18,10,13,-.3,0,Math.PI*2);c.fill();
    c.strokeStyle='#3d3048';c.lineWidth=9;c.beginPath();c.moveTo(-60,0);c.quadraticCurveTo(-15,-78,63,-13);c.stroke();
   }
   c.restore();
  }
  c.strokeStyle='#9d596f';c.lineWidth=4;c.beginPath();c.moveTo(292,219);c.quadraticCurveTo(320,232,348,211);c.stroke();this.faceTex.needsUpdate=true;
 }
}

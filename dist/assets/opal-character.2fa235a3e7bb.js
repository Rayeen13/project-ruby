import * as T from '../vendor/three.module.js';
import {RubyCharacter} from './character.2fa235a3e7bb.js';
// Original stylised android. No imported character, costume or animation assets.
export class OpalCharacter extends RubyCharacter {
 build(){
  this.head.position.y=1.9;
  this.skin=new T.MeshToonMaterial({color:0xe0e5ef});
  this.hair=new T.MeshToonMaterial({color:0x313449});
  this.coat=new T.MeshToonMaterial({color:0xe5e7f0});
  this.shell.color.set(0x323c52);this.armor.color.set(0xe5e7f0);
  // Full, overlapping bob and swept fringe; every lock is a closed solid.
  this.sphere(this.head,1,this.hair,[0,.04,-.075],[.54,.61,.44]);
  this.sphere(this.head,1,this.skin,[0,-.025,.10],[.435,.52,.35]);
  const streak=new T.MeshToonMaterial({color:0x969bc9});
  for(const side of [-1,1]){
   const bob=this.sphere(this.head,1,this.hair,[side*.43,-.075,-.015],[.12,.52,.32]);bob.rotation.z=-side*.09;
   const ear=this.mesh(this.head,new T.CylinderGeometry(.105,.105,.045,24),this.shell,[side*.56,-.07,.015]);ear.rotation.z=Math.PI/2;
   const port=this.mesh(this.head,new T.TorusGeometry(.065,.012,8,24),this.accent,[side*.587,-.07,.015]);port.rotation.y=Math.PI/2;
   this.bar(this.head,[side*.37,-.18,.324],[side*.30,-.32,.335],.009,this.shell);
   this.bar(this.head,[side*.30,-.32,.335],[side*.23,-.35,.35],.006,this.accent);
  }
  for(const [x,y,rz] of [[-.31,.32,-.28],[-.145,.35,-.35],[.035,.36,-.38],[.225,.36,-.30]]){
   const lock=this.sphere(this.head,1,this.hair,[x,y,.335],[.155,.265,.165]);lock.rotation.z=rz;
  }
  const highlight=this.sphere(this.head,1,streak,[-.25,.37,.477],[.025,.17,.018]);highlight.rotation.z=-.32;
  // Maid headband sits over the full hair volume; frills are closed solids for export.
  for(let i=0;i<9;i++){
   const a=.18+(Math.PI-.36)*i/8;
   const frill=this.sphere(this.head,1,this.coat,[Math.cos(a)*.46,.24+Math.sin(a)*.40,.12],[.065,.078,.045]);frill.rotation.z=a-Math.PI/2;
  }
  const clasp=this.mesh(this.head,new T.OctahedronGeometry(.095),this.accent,[.46,.15,.25]);clasp.scale.z=.4;
  const face=this.mesh(this.head,new T.PlaneGeometry(.77,.45),new T.MeshBasicMaterial({map:this.faceTex,transparent:true,depthWrite:false}),[0,-.055,.448]);face.castShadow=false;
  this.mesh(this.body,new T.CylinderGeometry(.12,.13,.20,20),this.dark,[0,1.43,0]);
  this.mesh(this.body,new T.TorusGeometry(.125,.018,8,24),this.accent,[0,1.40,0]).rotation.x=Math.PI/2;
  // Original android maid uniform: dark dress, white bib/apron and mechanical boots.
  this.sphere(this.body,1,this.dark,[0,1.04,0],[.30,.39,.23]);
  this.box(this.body,.65,.43,.43,.10,this.dark,[0,1.13,0]);
  this.box(this.body,.38,.33,.06,.06,this.coat,[0,1.10,.24]);
  for(const side of [-1,1]){const collar=this.box(this.body,.13,.16,.045,.025,this.coat,[side*.09,1.33,.245]);collar.rotation.z=side*.4;}
  this.box(this.body,.16,.06,.045,.02,this.dark,[0,1.25,.30]);
  this.mesh(this.body,new T.OctahedronGeometry(.07),this.accent,[0,1.25,.28]);
  this.mesh(this.body,new T.CylinderGeometry(.29,.39,.32,12),this.dark,[0,.76,0]);
  this.box(this.body,.43,.28,.07,.06,this.coat,[0,.78,.36]);
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

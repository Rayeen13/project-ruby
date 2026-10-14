import * as T from '../vendor/three.module.js';
import {applyWavePose, mountSideArms, setHandPose} from './wave-pose.88aced984891.js';
export const GEM_PROFILES = Object.freeze([
 {id:'ruby',name:'Ruby',gem:'Ruby',color:'#ff5278'},
 {id:'saph',name:'Saph',gem:'Sapphire',color:'#529dff'},
 {id:'emme',name:'Emme',gem:'Emerald',color:'#42efb2'},
 {id:'amy',name:'Amy',gem:'Amethyst',color:'#bf86ff'}
]);
// Replaceable character: geometry and behaviour are independent of stage/UI.
export class RubyCharacter {
 constructor({createCanvas=()=>document.createElement('canvas')}={}){this.createCanvas=createCanvas;
  this.root=new T.Group();this.body=new T.Group();this.root.add(this.body);this.head=new T.Group();this.body.add(this.head);this.head.position.y=1.93;this.mood='idle';this.gaze=new T.Vector2();this.profile=GEM_PROFILES[0];
  this.shell=new T.MeshStandardMaterial({color:0xd4dfe8,metalness:.12,roughness:.48});
  this.armor=new T.MeshStandardMaterial({color:0xa5b7cd,metalness:.22,roughness:.48});
  this.dark=new T.MeshStandardMaterial({color:0x080e19,metalness:.35,roughness:.3});
  this.accent=new T.MeshStandardMaterial({color:0xff5278,emissive:0xff5278,emissiveIntensity:.4,metalness:.35,roughness:.4});
  this.light=new T.MeshBasicMaterial({color:0xff5278});
  this.faceTex=this.makeFace();this.build();mountSideArms(this);
 }
 box(parent,w,h,d,r,mat,pos){
  const s=new T.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
  const b=Math.min(r,d*.25);const g=new T.ExtrudeGeometry(s,{depth:d-2*b,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:b,bevelThickness:b,curveSegments:8});g.center();return this.mesh(parent,g,mat,pos);
 }
 mesh(parent,g,mat,pos,scale){const m=new T.Mesh(g,mat);m.position.set(...pos);if(scale)m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 sphere(parent,r,mat,pos,scale){return this.mesh(parent,new T.SphereGeometry(r,32,20),mat,pos,scale);}
 bar(parent,a,b,r,mat){const start=new T.Vector3(...a),end=new T.Vector3(...b),v=end.clone().sub(start);const m=this.mesh(parent,new T.CylinderGeometry(r,r,v.length(),12),mat,start.add(end).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return m;}
 build(){
  // One uninterrupted oval face: all expression pixels sit ahead of the helmet.
  this.sphere(this.head,1,this.shell,[0,0,0],[.96,.77,.63]);
  this.sphere(this.head,1,this.dark,[0,-.035,.43],[.82,.55,.24]);
  for(const side of [-1,1]){
   this.sphere(this.head,.19,this.armor,[side*.94,.06,-.035],[.65,1,1]);
   const hub=this.mesh(this.head,new T.TorusGeometry(.118,.019,8,32),this.accent,[side*1.065,.06,-.035]);hub.rotation.y=Math.PI/2;
  }
  // A single soft antenna gives a playful silhouette without sharp horns.
  this.bar(this.head,[.22,.65,-.09],[.32,.92,-.13],.035,this.armor);
  this.sphere(this.head,.09,this.accent,[.32,.95,-.13]);
  const face=this.mesh(this.head,new T.PlaneGeometry(1.35,.8),new T.MeshBasicMaterial({map:this.faceTex,transparent:true,depthWrite:false}),[0,-.035,.685]);face.castShadow=false;
  this.sphere(this.body,1,this.shell,[0,.99,0],[.42,.46,.32]);
  this.sphere(this.body,1,this.armor,[0,1.04,.25],[.23,.22,.085]);
  this.sphere(this.body,.075,this.light,[0,1.06,.34]);
  this.arms=[];this.feet=[];
  for(const s of [-1,1]){
   const arm=new T.Group();arm.position.set(s*.44,1.18,0);arm.scale.setScalar(.78);this.body.add(arm);arm.rotation.z=s*.17;
   this.sphere(arm,.15,this.dark,[0,0,0]);
   this.sphere(arm,1,this.shell,[s*.025,-.09,0],[.14,.2,.15]);
   this.bar(arm,[0,-.15,0],[s*.05,-.39,0],.065,this.dark);
   this.sphere(arm,.095,this.accent,[s*.05,-.36,0]);
   const forearm=new T.Group();forearm.position.set(s*.05,-.36,0);arm.add(forearm);
   this.sphere(forearm,1,this.shell,[0,-.16,.035],[.13,.2,.14]);
   this.box(forearm,.06,.15,.03,.014,this.light,[s*.075,-.14,.163]);
   const hand=new T.Group();hand.position.set(0,-.36,.045);forearm.add(hand);
   this.sphere(hand,1,this.shell,[0,-.02,.01],[.14,.15,.11]);
   for(const x of [-.075,0,.075]){this.box(hand,.052,.13,.075,.02,this.dark,[x,-.15,.035]);this.box(hand,.05,.065,.08,.018,this.armor,[x,-.22,.065]);}
   const thumb=this.box(hand,.08,.16,.09,.025,this.armor,[-s*.155,-.045,.015]);thumb.rotation.z=-s*.5;
   this.arms.push({arm,forearm,hand,side:s});
   const leg=new T.Group();leg.position.set(s*.25,.52,0);this.body.add(leg);
   this.bar(leg,[0,0,0],[0,-.27,.03],.09,this.dark);
   this.box(leg,.21,.22,.26,.05,this.armor,[0,-.08,.04]);
   this.sphere(leg,1,this.shell,[0,-.38,.14],[.24,.145,.35]);
   this.box(leg,.43,.04,.62,.014,this.light,[0,-.5,.13]);
   this.feet.push(leg);
  }
 }
 makeFace(){this.canvas=this.createCanvas();this.canvas.width=640;this.canvas.height=280;this.ctx=this.canvas.getContext('2d');const tex=new T.CanvasTexture(this.canvas);tex.colorSpace=T.SRGBColorSpace;return tex;}
 setAccent(color){this.accent.color.set(color);this.accent.emissive.set(color);this.light.color.set(color);this.eyeColor=color;}
 setProfile(id){this.profile=GEM_PROFILES.find(x=>x.id===id)||GEM_PROFILES[0];this.setAccent(this.profile.color);}
 setMood(mood){this.mood=mood;}
 update(t,{pointer={x:0,y:0},follow=true,dance=false,wave=false,waveWeight=wave?1:0,dt=.016}={}){
  const blend=1-Math.exp(-12*dt);this.gaze.lerp(new T.Vector2(follow?pointer.x:0,follow?pointer.y:0),blend);
  const gx=this.gaze.x,gy=this.gaze.y;this.body.position.y=Math.sin(t*2)*.018;
  this.head.rotation.set(-gy*.1,gx*.2,dance?Math.sin(t*7)*.15:Math.sin(t)*.018);
  this.feet.forEach((f,i)=>f.rotation.x=dance?Math.sin(t*7+i*Math.PI)*.27:0);
  this.arms.forEach(({arm,forearm,hand,side:s})=>{arm.rotation.z=s*(.42+Math.sin(t*2)*.025);arm.rotation.x=Math.sin(t*2)*.045;forearm.rotation.x=0;hand.rotation.set(0,0,0);setHandPose(hand,this.handGestures[s]||'relaxed');if(dance){arm.rotation.z=s*(.7+Math.sin(t*7)*.45);forearm.rotation.x=0;}forearm.rotation.z=0;hand.rotation.x=0;if(waveWeight>0&&s===-1)applyWavePose(this,{arm,forearm,hand},t,{weight:waveWeight});});
  const c=this.ctx;c.clearRect(0,0,640,280);const color=this.eyeColor||'#ff5278',blink=Math.sin(t*1.3)>.993;
  c.shadowColor=color;c.shadowBlur=22;c.fillStyle=color;c.strokeStyle=color;
  for(const base of [214,426]){const x=base+gx*35,y=119-gy*20;c.beginPath();if(this.mood==='happy'&&!blink){c.lineWidth=15;c.lineCap='round';c.arc(x,y+13,37,Math.PI,Math.PI*2);c.stroke();}else{const h=blink?6:this.mood==='sleep'?12:this.mood==='listen'?99:90;c.roundRect(x-36,y-h/2,72,h,Math.min(34,h/2));c.fill();if(h>20){c.shadowBlur=0;c.fillStyle='#e4fbff';c.beginPath();c.ellipse(x-12,y-h/2+19,9,12,-.3,0,Math.PI*2);c.fill();c.beginPath();c.arc(x+13,y+15,4,0,Math.PI*2);c.fill();c.fillStyle=color;c.shadowBlur=22;}}}
  c.shadowBlur=0;c.globalAlpha=.65;c.lineWidth=2;c.beginPath();c.moveTo(302,191);c.quadraticCurveTo(320,205,338,191);c.stroke();c.globalAlpha=1;
  c.globalAlpha=.22;c.fillStyle=color;for(const x of [143,497]){c.beginPath();c.ellipse(x,182,23,9,0,0,Math.PI*2);c.fill();}c.globalAlpha=1;
  if(this.mood==='listen'){for(let i=0;i<5;i++){const h=5+Math.abs(Math.sin(t*5+i))*12;c.fillRect(302+i*8,249-h/2,3,h);}}
  this.faceTex.needsUpdate=true;
 }
}

import * as T from '../vendor/three.module.js';
import {applyWavePose,setHandPose} from './wave-pose.2fa235a3e7bb.js';
import {OfficeCharacter} from './office-character.2fa235a3e7bb.js';
// Gamer is a separate catalog model; accessories remain attached to the rig.
export class GamerCharacter extends OfficeCharacter {
 build(){
  super.build();this.shoulderSpan=1.62;
  this.shell.color.set(0x252840);this.armor.color.set(0x667096);
  this.accent.emissiveIntensity=.5;
  // Over-ear headphones with a curved headband and padded earcups.
  const band=this.mesh(this.head,new T.TorusGeometry(1.1,.055,10,48,Math.PI),this.shell,[0,.02,.015]);band.scale.y=.84;
  const bandTrim=this.mesh(this.head,new T.TorusGeometry(1.1,.018,8,48,Math.PI),this.accent,[0,.02,.078]);bandTrim.scale.y=.84;
  for(const side of [-1,1]){
   this.box(this.head,.18,.45,.38,.065,this.dark,[side*.965,-.01,.015]);
   this.box(this.head,.16,.48,.4,.06,this.shell,[side*1.1,-.01,.015]);
   const ring=this.mesh(this.head,new T.TorusGeometry(.15,.023,8,32),this.accent,[side*1.205,-.01,.015]);ring.rotation.y=Math.PI/2;
   this.sphere(this.head,.06,this.armor,[side*1.21,-.01,.015],[.3,1,1]);
  }
  // Both outward-facing earcup screens share the listening-state display.
  this.earCanvas=this.createCanvas();this.earCanvas.width=256;this.earCanvas.height=256;
  this.earContext=this.earCanvas.getContext('2d');this.earTexture=new T.CanvasTexture(this.earCanvas);this.earTexture.colorSpace=T.SRGBColorSpace;
  this.earScreens=[];
  for(const side of [-1,1]){
   const screen=this.mesh(this.head,new T.PlaneGeometry(.22,.24),new T.MeshBasicMaterial({map:this.earTexture}),[side*1.245,-.01,.015]);
   screen.rotation.y=side*Math.PI/2;screen.castShadow=false;this.earScreens.push(screen);
  }
  // Visible support links bridge the clearance gap without entering the shell.
  for(const side of [-1,1])this.bar(this.head,[side*.82,-.01,.015],[side*.98,-.01,.015],.04,this.dark);
  // A short headset microphone, off to the side of the face.
  this.bar(this.head,[1.11,-.13,.19],[.89,-.37,.52],.021,this.dark);
  this.bar(this.head,[.89,-.37,.52],[.55,-.37,.57],.021,this.dark);
  this.box(this.head,.12,.06,.065,.02,this.dark,[.52,-.37,.57]);
  // Hoodie-inspired chest panel and a small original pixel-star emblem.
  this.box(this.body,.52,.31,.06,.07,this.shell,[0,.9,.35]);
  this.bar(this.body,[-.19,1.1,.385],[-.15,.92,.385],.009,this.accent);
  this.bar(this.body,[.19,1.1,.385],[.15,.92,.385],.009,this.accent);
  this.box(this.body,.13,.045,.025,.01,this.accent,[0,.99,.394]);
  this.box(this.body,.045,.13,.025,.01,this.accent,[0,.99,.394]);
  this.box(this.body,.3,.025,.025,.008,this.armor,[0,.8,.393]);
  // Facing +Z: anatomical right is -X (viewer's left from the front).
  this.rightArm=this.arms.find(a=>a.side===-1);
  this.leftArm=this.arms.find(a=>a.side===1);
  const pad=new T.Group();pad.name='right-hand-controller';pad.position.set(.12,-.005,.12);this.rightArm.hand.add(pad);this.controller=pad;
  this.box(pad,.47,.2,.14,.06,this.dark,[0,0,0]);
  for(const side of [-1,1]){const grip=this.box(pad,.145,.24,.16,.045,this.shell,[side*.18,-.08,0]);grip.rotation.z=side*-.25;this.box(pad,.13,.035,.055,.014,this.armor,[side*.155,.13,-.02]);}
  this.box(pad,.1,.028,.026,.006,this.armor,[-.145,.018,.092]);
  this.box(pad,.028,.1,.026,.006,this.armor,[-.145,.018,.092]);
  const buttonColors=[0x63e9c1,0xef7098,0x77aaff,0xe8cd74];
  [[.14,.055],[.185,.015],[.14,-.025],[.095,.015]].forEach(([x,y],i)=>this.sphere(pad,.018,new T.MeshStandardMaterial({color:buttonColors[i],roughness:.45}),[x,y,.095],[1,1,.5]));
  for(const x of [-.055,.055])this.sphere(pad,.033,this.armor,[x,-.047,.09],[1,1,.5]);
  this.box(pad,.06,.015,.015,.004,this.accent,[0,.055,.086]);
 }
 update(t,options={}){
  // Controller stays attached as the right arm rises and waves.
  super.update(t,{...options,wave:false,waveWeight:0});
  this.controller.rotation.z=0;this.controller.position.set(.13,-.04,.12);
  const r=this.rightArm;r.arm.rotation.set(0,0,-.42);r.forearm.rotation.set(0,0,0);r.hand.rotation.set(0,0,0);
  setHandPose(r.hand,'grip');
  const waveWeight=options.waveWeight??(options.wave?1:0);
  if(waveWeight>0)applyWavePose(this,r,t,{holding:true,weight:waveWeight});
  // EMO-inspired digital eyes: cyan, rounded and expressive, without a mouth.
  const c=this.ctx,gx=this.gaze.x,gy=this.gaze.y,blink=Math.sin(t*1.3)>.993;
  c.clearRect(0,0,640,280);c.globalAlpha=1;c.fillStyle='#76f4f1';c.strokeStyle='#76f4f1';c.shadowColor='#35d9ed';c.shadowBlur=18;
  for(const base of [210,430]){const x=base+gx*28,y=137-gy*22;c.beginPath();
   if(this.mood==='happy'&&!blink){c.lineWidth=17;c.lineCap='round';c.arc(x,y+25,61,Math.PI,2*Math.PI);c.stroke();}
   else{const h=blink?7:this.mood==='sleep'?12:this.mood==='listen'?160:146;c.roundRect(x-64,y-h/2,128,h,Math.min(34,h/2));c.fill();}
  }
  c.shadowBlur=0;this.faceTex.needsUpdate=true;
  const ec=this.earContext;ec.clearRect(0,0,256,256);ec.fillStyle='#071019';ec.fillRect(0,0,256,256);
  const listening=this.mood==='listen';ec.strokeStyle=listening?'#76f4f1':'#344451';ec.lineWidth=5;ec.strokeRect(7,7,242,242);
  ec.fillStyle=listening?'#76f4f1':'#617887';ec.textAlign='center';ec.font='bold 24px system-ui';ec.fillText(listening?'LISTEN':'STANDBY',128,215);
  if(listening){ec.shadowColor='#35d9ed';ec.shadowBlur=12;for(let i=0;i<5;i++){const h=25+Math.abs(Math.sin(t*5+i*.9))*85;ec.beginPath();ec.roundRect(44+i*35,117-h/2,20,h,7);ec.fill();}ec.shadowBlur=0;}
  else{ec.beginPath();ec.arc(128,115,13,0,Math.PI*2);ec.fill();}
  this.earTexture.needsUpdate=true;
 }
}

import * as T from '../vendor/three.module.js';
import {RubyCharacter} from './character.ab28c0496c28.js';
import {OPAL_OUTFITS} from './wardrobe.ab28c0496c28.js';
// Original anime android. Costumes are authored solids, not copied character assets.
export class OpalCharacter extends RubyCharacter {
 build(){
  this.head.position.y=2.68;this.head.scale.setScalar(.72);
  this.armLayout={x:.43,y:2.12,z:.24,upper:.29,lower:.26,handScale:.70};this.restArmAngle=.10;
  this.skin=new T.MeshToonMaterial({color:0xffe3da});
  this.hair=new T.MeshToonMaterial({color:0x202338});
  this.coat=new T.MeshToonMaterial({color:0xf5f1f2});
  this.shell.color.set(0x303347);this.armor.color.set(0xf4e9e7);
  const soft=new T.MeshToonMaterial({color:0x666486});
  // Smaller head and longer torso/legs give Opal an adult anime silhouette.
  this.sphere(this.head,1,this.hair,[0,.025,-.06],[.395,.465,.315]);
  this.sphere(this.head,1,this.skin,[0,-.035,.075],[.325,.397,.273]);
  this.sphere(this.head,1,this.skin,[0,-.285,.10],[.225,.165,.21]);
  this.sphere(this.head,1,this.hair,[0,-.49,-.18],[.36,.69,.20]);
  for(const side of [-1,1]){
   const lock=this.sphere(this.head,1,this.hair,[side*.326,-.30,-.18],[.085,.55,.12]);lock.rotation.z=side*.035;
   const fringe=this.sphere(this.head,1,this.hair,[side*.24,.14,.245],[.105,.29,.075]);fringe.rotation.z=-side*.20;
   this.sphere(this.head,1,this.skin,[side*.323,-.055,.02],[.042,.082,.055]);
   // Small temple port is the retained android detail.
   const port=this.mesh(this.head,new T.TorusGeometry(.038,.007,6,20),this.accent,[side*.355,-.065,.04]);port.rotation.y=Math.PI/2;
   this.bar(this.head,[side*.27,-.19,.25],[side*.23,-.27,.25],.0035,soft);
  }
  for(const [x,y,z,r] of [[-.17,.27,.27,-.28],[-.045,.28,.30,-.23],[.10,.30,.28,-.40]]){
   const fringe=this.sphere(this.head,1,this.hair,[x,y,z],[.10,.20,.065]);fringe.rotation.z=r;
  }
  for(const x of [-.21,-.09,.07,.23])this.bar(this.head,[x,.39,.17],[x-.04,.20,.315],.004,soft);
  // Continuous hairband with individually rounded lace scallops.
  const band=this.mesh(this.head,new T.TorusGeometry(.37,.024,8,48,Math.PI),this.coat,[0,.075,.04]);
  for(let i=0;i<11;i++){const a=Math.PI*i/10;this.sphere(this.head,1,this.coat,[Math.cos(a)*.39,.075+Math.sin(a)*.40,.04],[.045,.052,.032]);}
  this.bow(this.head,[-.36,.25,.08],.085,this.dark);
  const face=this.mesh(this.head,new T.PlaneGeometry(.56,.39),new T.MeshBasicMaterial({map:this.faceTex,transparent:true,depthWrite:false}),[0,-.075,.354]);face.castShadow=false;
  this.glasses=new T.Group();this.head.add(this.glasses);this.glasses.position.set(0,-.045,.371);
  for(const side of [-1,1]){const ring=this.mesh(this.glasses,new T.TorusGeometry(.087,.006,6,32),this.dark,[side*.124,0,0]);ring.scale.y=.70;}
  this.bar(this.glasses,[-.04,0,0],[.04,0,0],.004,this.dark);
  this.bar(this.body,[0,2.19,0],[0,2.37,0],.085,this.skin);
  this.sphere(this.body,1,this.skin,[0,1.90,0],[.28,.36,.17]);
  this.sphere(this.body,1,this.skin,[0,1.48,0],[.235,.18,.16]);
  this.sphere(this.head,1,this.skin,[0,-.14,.35],[.014,.025,.025]);
  this.outfits=new Map();this.dressMaterials=new Map();
  for(const spec of OPAL_OUTFITS){const outfit=new T.Group();outfit.name='opal-outfit-'+spec.id;this.body.add(outfit);this.buildOutfit(outfit,spec.id);this.outfits.set(spec.id,outfit);}
  this.arms=[];this.feet=[];
  for(const side of [-1,1]){
   const arm=new T.Group(),forearm=new T.Group(),hand=new T.Group();this.body.add(arm);arm.add(forearm);forearm.add(hand);this.arms.push({arm,forearm,hand,side});
   const leg=new T.Group();leg.position.set(side*.155,1.42,0);this.body.add(leg);
   this.mesh(leg,new T.CylinderGeometry(.086,.065,.63,20),this.coat,[0,-.30,0]);
   this.sphere(leg,.067,this.coat,[0,-.64,0],[1,1.12,1]);
   this.mesh(leg,new T.CylinderGeometry(.064,.045,.62,20),this.coat,[0,-.96,0]);
   this.sphere(leg,1,this.dark,[0,-1.31,.055],[.105,.09,.18]);
   this.box(leg,.18,.035,.30,.012,this.dark,[0,-1.385,.05]);
   this.box(leg,.16,.025,.04,.006,this.coat,[0,-1.25,.10]);
   this.feet.push(leg);
  }
  this.setOutfit('classic');
 }
 bow(parent,pos,size,material){
  const group=new T.Group();parent.add(group);group.position.set(...pos);
  for(const side of [-1,1]){const loop=this.sphere(group,1,material,[side*size*.55,0,0],[size*.65,size*.40,size*.22]);loop.rotation.z=side*.3;}
  this.sphere(group,size*.22,material,[0,0,.01]);return group;
 }
 skirt(parent,{top=.23,bottom=.55,height=.62,y=1.15,material,apron=true}){
  // A closed lathed bell with gentle radial pleats; lace is real geometry.
  const points=[new T.Vector2(0,-height/2),new T.Vector2(bottom,-height/2),new T.Vector2(bottom*.95,-height*.34),new T.Vector2(top,height/2),new T.Vector2(0,height/2)];
  const skirt=this.mesh(parent,new T.LatheGeometry(points,64),material,[0,y,0]);
  const a=skirt.geometry.attributes.position;
  for(let i=0;i<a.count;i++){const x=a.getX(i),z=a.getZ(i),angle=Math.atan2(z,x),pleat=1+.018*Math.cos(angle*16);a.setXYZ(i,x*pleat,a.getY(i),z*pleat);}a.needsUpdate=true;skirt.geometry.computeVertexNormals();
  for(let i=0;i<32;i++){const angle=i*Math.PI*2/32;this.sphere(parent,1,this.coat,[Math.cos(angle)*bottom,y-height/2+.012,Math.sin(angle)*bottom],[.035,.032,.035]);}
  if(apron){
   const profile=[[top*.98,height*.40],[top+.06,height*.08],[bottom*.91,-height*.36]];
   const vertices=[],indices=[],steps=32;
   for(let i=0;i<=steps;i++){const a=-.75+1.5*i/steps;for(const offset of [0,.014])for(const [r,h] of profile)vertices.push(Math.sin(a)*(r+offset),h,Math.cos(a)*(r+offset));}
   const quad=(a,b,c,d)=>indices.push(a,b,c,a,c,d);
   for(let i=0;i<steps;i++){const n=i*6,m=n+6;for(let j=0;j<2;j++){quad(n+j,m+j,m+j+1,n+j+1);quad(n+j+3,n+j+4,m+j+4,m+j+3);}quad(n,n+3,m+3,m);quad(n+2,m+2,m+5,n+5);}
   for(const n of [0,steps*6])for(let j=0;j<2;j++)quad(n+j,n+j+1,n+j+4,n+j+3);
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();
   const cloth=new T.MeshToonMaterial({color:0xfff9f4,side:T.DoubleSide});this.mesh(parent,geo,cloth,[0,y,.022]);
   for(let i=0;i<=16;i++){const angle=-.75+i*1.5/16;this.sphere(parent,1,this.coat,[Math.sin(angle)*bottom*.92,y-height*.36,Math.cos(angle)*bottom*.92+.023],[.035,.026,.025]);}
  }
 }
 buildOutfit(group,id){
  const color={classic:0x242435,rose:0xb65d7c,evening:0x29263f,work:0x293d56}[id],dress=new T.MeshToonMaterial({color});
  this.dressMaterials.set(id,dress);
  const bodice=[new T.Vector2(0,-.28),new T.Vector2(.235,-.28),new T.Vector2(.205,-.16),new T.Vector2(.245,.025),new T.Vector2(.28,.12),new T.Vector2(.27,.23),new T.Vector2(0,.23)];
  this.mesh(group,new T.LatheGeometry(bodice,48),dress,[0,1.88,0],[1,1,.70]);
  this.sphere(group,1,dress,[0,2.06,0],[.31,.20,.19]);
  this.sphere(group,1,this.coat,[0,1.99,.179],[.17,.20,.033]);
  for(const side of [-1,1]){
   const strap=this.box(group,.065,.40,.025,.01,this.coat,[side*.21,2.04,.14]);strap.rotation.z=-side*.18;
   const collar=this.box(group,.12,.14,.03,.012,this.coat,[side*.065,2.23,.12]);collar.rotation.z=side*.45;
   // Puff sleeves stay at the shoulder, clear of the waving hand.
   this.sphere(group,1,dress,[side*.33,2.10,0],[.10,.13,.13]);
  }
  this.bow(group,[0,2.16,.214],.07,id==='rose'?this.coat:this.dark);
  this.mesh(group,new T.CylinderGeometry(.237,.239,.065,32),this.coat,[0,1.63,0],[1,1,.78]);
  this.bow(group,[0,1.62,-.21],.14,this.coat);
  for(const side of [-1,1]){const tail=this.box(group,.065,.22,.018,.008,this.coat,[side*.075,1.49,-.22]);tail.rotation.z=side*.25;}
  const length=id==='evening'?.98:id==='work'?.78:.65;
  this.skirt(group,{height:length,y:1.60-length/2,bottom:id==='evening'?.53:.56,material:dress});
  if(id==='rose'){
   this.bow(group,[0,1.66,.215],.075,dress);
   for(const side of [-1,1])this.bow(group,[side*.37,1.06,.40],.06,dress);
  }
  if(id==='evening'){
   for(let i=0;i<9;i++)this.sphere(group,.012,this.coat,[(i-4)*.041,2.12-Math.cos((i-4)*.28)*.025,.202]);
   this.mesh(group,new T.OctahedronGeometry(.038),this.accent,[0,2.08,.22]);
  }
  if(id==='work'){
   this.box(group,.115,.105,.016,.01,this.coat,[.12,1.84,.21]);
   this.box(group,.065,.012,.02,.003,this.accent,[.12,1.86,.223]);
  }
 }
 setOutfit(id){if(!this.outfits?.has(id))return;this.outfit=id;for(const [key,group] of this.outfits)group.visible=key===id;if(this.glasses)this.glasses.visible=id==='work';for(const rig of this.arms||[])if(rig.sleeve)rig.sleeve.material=['work','evening'].includes(id)?this.dressMaterials.get(id):this.coat;}
 update(t,options={}){
  super.update(t,options);
  this.paintFace(t,false);
 }
 drawDizzyEyes(ms){this.paintFace(ms*.001,true);}
 paintFace(t,dizzy){
  const c=this.ctx,gx=this.gaze.x,gy=this.gaze.y;c.clearRect(0,0,640,280);
  const blink=!dizzy&&(Math.sin(t*1.3)>.993||this.mood==='sleep');
  for(const side of [-1,1]){
   const x=320+side*132,y=114;c.save();c.translate(x,y);
   if(blink||(!dizzy&&this.mood==='happy')){c.strokeStyle='#382b43';c.lineWidth=8;c.lineCap='round';c.beginPath();c.moveTo(-56,9);c.quadraticCurveTo(0,this.mood==='happy'?-32:17,56,7);c.stroke();}
   else{
    c.fillStyle='#fffaf8';c.beginPath();c.ellipse(0,0,64,58,-side*.08,0,Math.PI*2);c.fill();
    if(dizzy){c.strokeStyle='#62517d';c.lineWidth=6;c.beginPath();for(let i=0;i<=64;i++){const a=i*.19+t*2,r=i/64*43,px=Math.cos(a)*r,py=Math.sin(a)*r;if(i)c.lineTo(px,py);else c.moveTo(px,py);}c.stroke();}
    else{
     c.fillStyle='#8980bd';c.beginPath();c.ellipse(gx*17,gy*-12+5,33,51,0,0,Math.PI*2);c.fill();
     c.fillStyle='#33334e';c.beginPath();c.ellipse(gx*17,gy*-12+4,14,36,0,0,Math.PI*2);c.fill();
     c.fillStyle='white';c.beginPath();c.ellipse(gx*17-12,gy*-12-18,10,13,-.3,0,Math.PI*2);c.fill();c.beginPath();c.arc(gx*17+13,gy*-12+23,5,0,Math.PI*2);c.fill();
    }
    c.strokeStyle='#30253d';c.lineWidth=9;c.beginPath();c.moveTo(-63,1);c.quadraticCurveTo(-12,-70,64,-12);c.stroke();
    c.lineWidth=5;c.beginPath();c.moveTo(side*57,-15);c.lineTo(side*73,-30);c.stroke();
   }
   c.restore();
  }
  c.fillStyle='#dc93a6';c.globalAlpha=.30;for(const x of [110,530]){c.beginPath();c.ellipse(x,186,28,9,0,0,Math.PI*2);c.fill();}c.globalAlpha=1;
  c.strokeStyle='#a25e78';c.lineWidth=4;c.beginPath();c.moveTo(298,218);c.quadraticCurveTo(320,dizzy?205:229,342,216);c.stroke();this.faceTex.needsUpdate=true;
 }
}

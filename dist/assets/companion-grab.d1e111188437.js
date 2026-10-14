import * as T from '../vendor/three.module.js';

export const HOLD_TO_GRAB_MS=420;
export const DRAG_TO_GRAB_PX=12;
export function mayStartGrab(tap,pointerId){return !!tap&&tap.id===pointerId&&!tap.orbit&&!tap.menu;}

// Screen-space input only. Native positioning belongs to the desktop host.
export class GrabState {
 constructor(){this.clear();}
 clear(){this.held=false;this.offset={x:0,y:0};this.last=null;this.direction=0;this.axis=null;this.anchor=null;this.extreme=null;this.turns=[];this.dizzyUntil=0;this.velocity=0;}
 begin(x,y,ms){this.held=true;this.last={x,y,ms};this.direction=0;this.axis=null;this.anchor={x,y,ms};this.extreme=null;this.turns=[];this.velocity=0;}
 move(x,y,ms,{width,height,native=false}={}){
  if(!this.held||!this.last)return {dx:0,dy:0};
  const dx=x-this.last.x,dy=y-this.last.y,dt=Math.max(1,ms-this.last.ms);
  this.last={x,y,ms};this.velocity=Math.max(-1,Math.min(1,dx/dt));
  if(!native){this.offset.x=Math.max(-width*.32,Math.min(width*.32,this.offset.x+dx));this.offset.y=Math.max(-height*.28,Math.min(height*.28,this.offset.y+dy));}
  this.turns=this.turns.filter(t=>ms-t<1100);
  // Track whole swings, not per-event distance: real mice deliver many tiny deltas.
  if(!this.axis&&Math.max(Math.abs(x-this.anchor.x),Math.abs(y-this.anchor.y))>=18)this.axis=Math.abs(x-this.anchor.x)>=Math.abs(y-this.anchor.y)?'x':'y';
  if(this.axis){
   const value=this.axis==='x'?x:y;
   if(!this.direction){this.direction=Math.sign(value-this.anchor[this.axis]);this.extreme={value,ms};}
   else if((value-this.extreme.value)*this.direction>=0)this.extreme={value,ms};
   else if(Math.abs(value-this.extreme.value)>=18){
    const travel=Math.abs(this.extreme.value-this.anchor[this.axis]),duration=Math.max(1,this.extreme.ms-this.anchor.ms);
    if(travel>=28&&travel/duration>.28&&(this.turns.length===0||ms-this.turns.at(-1)>65))this.turns.push(ms);
    this.anchor={x,y,ms:this.extreme.ms};this.anchor[this.axis]=this.extreme.value;this.extreme={value,ms};this.direction*=-1;
    if(this.turns.length>=3){this.dizzyUntil=ms+3800;this.turns=[];}
   }
  }
  return {dx,dy};
 }
 end(){this.held=false;this.last=null;this.velocity=0;this.turns=[];this.direction=0;}
 dizzy(ms){return ms<this.dizzyUntil;}
}

export class GrabVisual {
 constructor(scene){
  this.stars=new T.Group();this.stars.visible=false;scene.add(this.stars);
  const shape=new T.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5+Math.PI/2,r=i%2?.045:.1;const x=Math.cos(a)*r,y=Math.sin(a)*r;if(i)shape.lineTo(x,y);else shape.moveTo(x,y);}shape.closePath();
  const geometry=new T.ExtrudeGeometry(shape,{depth:.025,bevelEnabled:true,bevelSize:.006,bevelThickness:.006,bevelSegments:1,steps:1});
  const material=new T.MeshBasicMaterial({color:0xffdf72,transparent:true,depthWrite:false});
  for(let i=0;i<5;i++){const star=new T.Mesh(geometry,material);this.stars.add(star);}
  this.box=new T.Box3();this.bases=new WeakMap();this.pose={lift:0,lean:0};this.previousMs=null;
 }
 apply(character,state,camera,rect,distance,ms,{native=false,reduced=false}={}){
  const root=character.root;if(!this.bases.has(root))this.bases.set(root,root.position.clone());const base=this.bases.get(root);
  root.position.x=base.x;root.position.z=base.z;
  if(!native){
   const scale=2*Math.tan(camera.fov*Math.PI/360)*distance/Math.max(1,rect.height);
   const right=new T.Vector3().setFromMatrixColumn(camera.matrixWorld,0),up=new T.Vector3().setFromMatrixColumn(camera.matrixWorld,1);
   const delta=right.multiplyScalar(state.offset.x*scale).add(up.multiplyScalar(-state.offset.y*scale));root.position.add(delta);
  }
  const dizzy=state.dizzy(ms);
  const dt=this.previousMs===null?0:Math.min(.05,Math.max(0,(ms-this.previousMs)/1000));this.previousMs=ms;
  const blend=1-Math.exp(-10*dt),targetLift=state.held?.055:0;
  const targetLean=reduced?0:state.held?state.velocity*-.06:dizzy?Math.sin(ms*.003)*.025:0;
  this.pose.lift+=(targetLift-this.pose.lift)*blend;this.pose.lean+=(targetLean-this.pose.lean)*blend;
  root.position.y+=this.pose.lift;root.rotation.z+=this.pose.lean;
  this.stars.visible=dizzy;const fade=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};const opacity=fade((ms-(state.dizzyUntil-3800))/220)*fade((state.dizzyUntil-ms)/400);for(const star of this.stars.children)star.material.opacity=opacity;
  if(dizzy){
   this.box.setFromObject(character.head);const top=this.box.max.y,centre=this.box.getCenter(new T.Vector3());
   for(let i=0;i<5;i++){const star=this.stars.children[i],a=(reduced?0:ms*.0016)+i*Math.PI*2/5;star.position.set(centre.x+Math.cos(a)*.48,top+.18+Math.sin(a*2)*.035,centre.z+Math.sin(a)*.3);star.rotation.set(0,-a,Math.sin(a)*.3);}
  }
 }
 reset(character){const base=this.bases.get(character.root);if(base)character.root.position.copy(base);this.stars.visible=false;this.pose={lift:0,lean:0};this.previousMs=null;}
}

export function drawDizzyFace(character,ms){
 const c=character.ctx,canvas=character.canvas;if(!c||!canvas)return;
 c.clearRect(0,0,canvas.width,canvas.height);c.fillStyle='#080d17';c.fillRect(0,0,canvas.width,canvas.height);
 c.strokeStyle=character.eyeColor||'#83f4ed';c.lineWidth=canvas.height*.028;c.lineCap='round';
 for(const x of [canvas.width*.32,canvas.width*.68]){c.beginPath();for(let i=0;i<=64;i++){const a=i*.18+ms*.002,r=i/64*canvas.height*.17;const px=x+Math.cos(a)*r,py=canvas.height*.48+Math.sin(a)*r;if(i)c.lineTo(px,py);else c.moveTo(px,py);}c.stroke();}
 character.faceTex.needsUpdate=true;
}

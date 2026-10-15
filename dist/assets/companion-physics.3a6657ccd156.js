import * as T from '../vendor/three.module.js';
// Single rigid Companion body and static support plane. No joint/mesh deformation.
export class CompanionPhysics{
 constructor({gravity=9.81,floor=-.055}={}){this.gravity=gravity;this.floor=floor;this.bodies=new WeakMap();this.box=new T.Box3();}
 reset(character){this.bodies.delete(character.root);}
 drop(character,height=1){this.bodies.set(character.root,{height:Math.max(.1,Math.min(2,height)),velocity:0,grounded:false});}
 apply(character,dt,{held=false,enabled=true}={}){
  if(!enabled){this.reset(character);return {grounded:true,velocity:0};}
  const root=character.root;let state=this.bodies.get(root);if(!state){state={height:root.position.y,velocity:0,grounded:false};this.bodies.set(root,state);}
  if(held){state.height=root.position.y;state.velocity=0;state.grounded=false;}
  else{let remaining=Math.min(.1,Math.max(0,dt));while(remaining>0){const step=Math.min(1/120,remaining);state.velocity-=this.gravity*step;state.height+=state.velocity*step;remaining-=step;}root.position.y=state.height;}
  root.updateMatrixWorld(true);this.box.setFromObject(root);const penetration=this.floor-this.box.min.y;
  if(penetration>=0){root.position.y+=penetration;state.height=root.position.y;state.velocity=0;state.grounded=true;}else state.grounded=false;
  return {grounded:state.grounded,velocity:state.velocity,bottom:this.box.min.y+Math.max(0,penetration)};
 }
}

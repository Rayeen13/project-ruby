import * as T from './vendor/three.module.js';

export function orbitYaw(yaw,deltaX){return yaw-deltaX*.009;}
export function characterHit(root,camera,rect,x,y){
 if(rect.width<=0||rect.height<=0)return null;
 const pointer=new T.Vector2((x-rect.left)/rect.width*2-1,1-(y-rect.top)/rect.height*2);
 if(Math.abs(pointer.x)>1||Math.abs(pointer.y)>1)return null;
 root.updateMatrixWorld(true);camera.updateMatrixWorld(true);
 const ray=new T.Raycaster();ray.setFromCamera(pointer,camera);
 return ray.intersectObject(root,true).find(hit=>{
  for(let node=hit.object;node;node=node.parent)if(!node.visible)return false;
  return true;
 })||null;
}
export function touchPart(character,object){
 for(let node=object;node;node=node.parent){
  if(node===character.head)return 'head';
  if(character.arms?.some(arm=>node===arm.hand))return 'hand';
 }
 return 'body';
}
export class TouchReaction {
 constructor(){this.clear();this.bases=new WeakMap();}
 trigger(kind,time){this.kind=kind;this.start=time;this.duration=kind==='pet'?2.2:1.4;}
 clear(){this.kind=null;this.start=0;this.duration=0;}
 moodAt(time){return this.kind&&time<this.start+this.duration?'happy':null;}
 apply(root,time){
  if(!this.bases.has(root))this.bases.set(root,{y:root.position.y,z:root.rotation.z});
  const base=this.bases.get(root),elapsed=Math.max(0,time-this.start),p=Math.min(1,elapsed/(this.duration||1));
  const envelope=this.kind&&p<1?Math.sin(Math.PI*p)**2:0;
  root.position.y=base.y+(this.kind==='pet'?.045:.13)*Math.abs(Math.sin(elapsed*9))*envelope;
  root.rotation.z=base.z+(this.kind==='pet'?.035:.065)*Math.sin(elapsed*11)*envelope;
 }
}

export function mountModelMenu({stage,menu,pick,act,capabilities}){
 let restoreFocus;
 const close=()=>{menu.hidden=true;restoreFocus?.focus({preventScroll:true});restoreFocus=null;};
 const open=(x,y)=>{
  if(!pick(x,y))return false;
  restoreFocus=document.activeElement;menu.hidden=false;
  menu.querySelector('[data-interaction="wave"]').disabled=!capabilities().wave;
  const host=stage.parentElement.getBoundingClientRect(),bounds=menu.getBoundingClientRect();
  menu.style.left=Math.max(8,Math.min(x-host.left+12,host.width-bounds.width-8))+'px';
  menu.style.top=Math.max(8,Math.min(y-host.top+12,host.height-bounds.height-8))+'px';
  menu.querySelector('button:not(:disabled)').focus({preventScroll:true});
  return true;
 };
 stage.addEventListener('contextmenu',event=>{if(open(event.clientX,event.clientY))event.preventDefault();});
 stage.addEventListener('keydown',event=>{
  if(event.key==='ContextMenu'||(event.shiftKey&&event.key==='F10')){
   const r=stage.getBoundingClientRect();if(open(r.left+r.width*.5,r.top+r.height*.45))event.preventDefault();
  }
 });
 for(const button of menu.querySelectorAll('[data-interaction]'))button.addEventListener('click',()=>{act(button.dataset.interaction);close();});
 for(const button of menu.querySelectorAll('[data-desktop-action]'))button.addEventListener('click',close);
 document.addEventListener('pointerdown',event=>{if(!menu.hidden&&!menu.contains(event.target))close();});
 menu.addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();close();return;}
  const buttons=[...menu.querySelectorAll('button:not(:disabled)')],index=buttons.indexOf(document.activeElement);
  if(['ArrowDown','ArrowUp','Home','End','Tab'].includes(event.key)){
   event.preventDefault();let next=event.key==='Home'?0:event.key==='End'?buttons.length-1:index+(event.key==='ArrowUp'||event.shiftKey?-1:1);
   buttons[(next+buttons.length)%buttons.length].focus();
  }
 });
 window.addEventListener('resize',close);
 return {open,close};
}

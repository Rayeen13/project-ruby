// Keep graphics-device failure local to the preview; chat and saved data survive.
export const frameRate=({busy=false,software=false,lowPower=false}={})=>software||lowPower?8:busy?15:30;
export class RenderRecovery{
 constructor(renderer,{onLost=()=>{},onStatus=()=>{},onRestored=()=>{}}={}){
  Object.assign(this,{renderer,onLost,onStatus,onRestored});this.lost=false;this.failed=false;this.lastError='';this.restoreExtension=renderer.getContext?.()?.getExtension?.('WEBGL_lose_context');
  this.handleLost=event=>{event.preventDefault();this.lost=true;this.onStatus('lost','Graphics paused. Releasing voice resources…');Promise.resolve().then(()=>this.onLost()).then(()=>{if(this.lost){this.onStatus('lost','Graphics paused. Try Restore preview.');this.retry();}}).catch(error=>{this.lastError=String(error?.message||error);this.onStatus('lost','Graphics paused: '+this.lastError);this.retry();});};
  this.handleRestored=()=>{this.restoreExtension=this.renderer.getContext?.()?.getExtension?.('WEBGL_lose_context');this.lost=false;this.failed=false;this.onRestored();this.onStatus('ready','');};
  renderer.domElement.addEventListener('webglcontextlost',this.handleLost);
  renderer.domElement.addEventListener('webglcontextrestored',this.handleRestored);
 }
 draw(paint){if(this.lost||this.failed)return false;try{paint();return true;}catch(error){this.failed=true;this.lastError=String(error?.message||error);this.onStatus('error','Preview paused: '+this.lastError);return false;}}
 retry(){if(this.lost){if(this.restoreExtension)this.restoreExtension.restoreContext();else this.renderer.forceContextRestore?.();}else{this.failed=false;this.onRestored();this.onStatus('ready','');}}
 dispose(){this.renderer.domElement.removeEventListener('webglcontextlost',this.handleLost);this.renderer.domElement.removeEventListener('webglcontextrestored',this.handleRestored);}
}

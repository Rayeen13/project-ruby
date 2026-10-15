import * as T from '../vendor/three.module.js';
import {SVGRenderer} from '../vendor/SVGRenderer.js';
export function createRenderer(){
 try{const renderer=new T.WebGLRenderer({antialias:true,alpha:true}),gl=renderer.getContext(),info=gl.getExtension('WEBGL_debug_renderer_info');const name=info?String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)):'';return {renderer,software:false,lowPower:/swiftshader|llvmpipe|software|basic render/i.test(name)};}
 catch{const renderer=new SVGRenderer();renderer.setClearColor(0x0b111b);return {renderer,software:true};}
}
// SVGRenderer cannot sample canvas textures; project the same face canvases
// onto their geometry so software fallback preserves expressions and eye tracking.
export function renderCanvasSurfaces(renderer,root,camera){
 const svg=renderer.domElement,view=svg.viewBox.baseVal,w=view.width,h=view.height;
 root.traverse(o=>{
  if(!o.isMesh||o.geometry.type!=='PlaneGeometry'||!o.material.map?.image)return;
  const p=o.geometry.parameters,normal=new T.Vector3(0,0,1).transformDirection(o.matrixWorld),center=o.getWorldPosition(new T.Vector3());
  if(normal.dot(camera.position.clone().sub(center))<=0)return;
  const corners=[[-p.width/2,p.height/2], [p.width/2,p.height/2],[-p.width/2,-p.height/2]].map(([x,y])=>new T.Vector3(x,y,0).applyMatrix4(o.matrixWorld).project(camera));
  const [a,b,c]=corners.map(v=>({x:v.x*w/2,y:-v.y*h/2}));
  const img=document.createElementNS('http://www.w3.org/2000/svg','image');
  img.setAttribute('preserveAspectRatio','none');
  img.setAttribute('href',o.material.map.image.toDataURL());img.setAttribute('width','1');img.setAttribute('height','1');
  img.setAttribute('transform',`matrix(${b.x-a.x} ${b.y-a.y} ${c.x-a.x} ${c.y-a.y} ${a.x} ${a.y})`);svg.append(img);
 });
}

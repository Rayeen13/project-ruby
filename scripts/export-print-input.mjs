import fs from 'node:fs';
import * as T from '../dist/vendor/three.module.js';
const ctx=new Proxy({}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>ctx})};
const {CHARACTER_MODELS}=await import('../dist/character-registry.js');
for(const spec of CHARACTER_MODELS.filter(m=>!process.env.RUBY_PRINT_MODEL||m.id===process.env.RUBY_PRINT_MODEL)){
 const c=spec.create();c.setProfile('ruby');c.update(0,{follow:false});
 // Physical eye relief replaces display textures, which cannot be printed.
 let face; c.head.traverse(o=>{if(o.isMesh&&o.geometry.type==='PlaneGeometry'&&o.material.map===c.faceTex)face=o;});
 for(const side of [-1,1]){
  const w=spec.id==='classic'?.25:.23,h=spec.id==='classic'?.34:.3;
  const eye=new T.Mesh(new T.BoxGeometry(w,h,.12));eye.position.set(side*.25,face.position.y+.015,face.position.z);c.head.add(eye);
 }
 c.root.updateMatrixWorld(true);const parts=[];
 c.root.traverse(o=>{if(!o.isMesh||o.geometry.type==='PlaneGeometry')return;const g=o.geometry.clone().applyMatrix4(o.matrixWorld);parts.push({type:o.geometry.type,vertices:Array.from(g.attributes.position.array),faces:g.index?Array.from(g.index.array):Array.from({length:g.attributes.position.count},(_,i)=>i)});g.dispose();});
 fs.writeFileSync(`/tmp/print-${spec.id}.json`,JSON.stringify({id:spec.id,parts}));
}
console.log('Exported all five models in neutral display poses with physical eye relief.');

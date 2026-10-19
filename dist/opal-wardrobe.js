import * as T from './vendor/three.module.js';
import {refineGarment} from './garment-mesh.js';
import {OPAL_OUTFITS} from './wardrobe.js';

// Garments are independent skinned meshes. They share the mannequin's rig,
// never its geometry/materials, and keep the artist's continuous topology.
export function createOpalWardrobe(vrm,sources){
 const entity=new T.Group();entity.name='Opal-wardrobe';entity.userData.entity='clothing';
 const outfits=new Map();
 for(const spec of OPAL_OUTFITS){
  const group=new T.Group();group.name='opal-outfit-'+spec.id;entity.add(group);outfits.set(spec.id,group);
  for(const source of sources){
   source.visible=false;
   const dress=source.clone(false);dress.visible=true;dress.name='Opal-skinned-dress';dress.userData.entity='clothing';
   dress.geometry=source.geometry.clone();dress.geometry.clearGroups();
   const p=dress.geometry.attributes.position,box=new T.Box3().setFromBufferAttribute(p),waist=box.min.y+(box.max.y-box.min.y)*.49;
   const length={classic:0,rose:-.035,evening:.30,work:.12,victorian:.31,bluebell:.015,pinstripe:.16}[spec.id];
   for(let i=0;i<p.count;i++){
    const y=p.getY(i),weight=T.MathUtils.smoothstep(waist-y,0,waist-box.min.y);
    p.setY(i,y-length*weight);
    const flare=({bluebell:.14,victorian:.07,pinstripe:.035})[spec.id]||0;
    p.setX(i,p.getX(i)*(1+flare*weight));p.setZ(i,p.getZ(i)*(1+flare*weight));
    const n=dress.geometry.attributes.normal,puff=spec.id==='bluebell'?.018*T.MathUtils.smoothstep(Math.abs(p.getX(i)),.18,.25)*(1-T.MathUtils.smoothstep(Math.abs(p.getX(i)),.34,.42)):0;p.setXYZ(i,p.getX(i)+n.getX(i)*(.004+puff),p.getY(i)+n.getY(i)*(.004+puff),p.getZ(i)+n.getZ(i)*(.004+puff));

   }
   // Preserve the artist's Bust/Sleeve/Skirt weights. Rebinding the hem to
   // hips removes the very spring chains that make fabric respond to motion.
   const ids=dress.geometry.attributes.skinIndex,weights=dress.geometry.attributes.skinWeight;
   p.needsUpdate=true;ids.needsUpdate=true;weights.needsUpdate=true;const coarse=dress.geometry;dress.geometry=refineGarment(coarse);coarse.dispose();dress.geometry.setAttribute('fabricRest',new T.Float32BufferAttribute(dress.geometry.attributes.position.array.slice(),3));
   dress.skeleton=source.skeleton;dress.bindMode=source.bindMode;dress.bindMatrix.copy(source.bindMatrix);dress.bindMatrixInverse.copy(source.bindMatrixInverse);
   dress.material=maidMaterial(spec.id,waist,box.min.y-length,box.max.y);
   dress.frustumCulled=false;dress.userData.garment='dress';group.add(dress);
   group.add(hemFrill(dress,source));
  }
 }
 return {entity,outfits};
}

export function maidMaterial(outfit,waist,hem,top){
 const material=new T.MeshStandardMaterial({roughness:.94,metalness:0,color:({classic:0x24212e,rose:0xe9a0ba,evening:0x242035,work:0x26364c,victorian:0x292735,bluebell:0x607cad,pinstripe:0x545f6c})[outfit],side:T.DoubleSide});
 material.name='Opal-'+outfit+'-maid-fabric';
 // The apron is a fabric colour region on the complete dress. No copied
 // coplanar triangles, cut-out holes or mismatched overlay skin weights.
 material.onBeforeCompile=shader=>{
  shader.uniforms.opalCut={value:new T.Vector3(waist,hem,top)};
  shader.uniforms.opalStripe={value:outfit==='pinstripe'?1:0};
  shader.vertexShader='attribute vec3 fabricRest;\nvarying vec3 opalRest;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nopalRest = fabricRest;');
  shader.fragmentShader='varying vec3 opalRest;\nuniform vec3 opalCut;\nuniform float opalStripe;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float skirt = clamp((opalCut.x-opalRest.y)/max(0.01,opalCut.x-opalCut.y),0.0,1.0);
   float bib = smoothstep(opalCut.x-0.012,opalCut.x+0.035,opalRest.y);
   float width = mix(0.10+skirt*0.14,0.082,bib);
   float panel = (1.0-smoothstep(width-0.002,width+0.002,abs(opalRest.x)))
     *(1.0-smoothstep(-0.04,-0.03,opalRest.z))
     *smoothstep(opalCut.y+0.025,opalCut.y+0.035,opalRest.y)
     *(1.0-smoothstep(opalCut.z-0.055,opalCut.z-0.04,opalRest.y));
   float collar = smoothstep(opalCut.z-0.05,opalCut.z-0.02,opalRest.y)*(1.0-smoothstep(0.09,0.13,abs(opalRest.x)));
   diffuseColor.rgb = mix(diffuseColor.rgb,vec3(1.0,0.955,0.91),max(panel,collar));
   diffuseColor.rgb *= 1.0-opalStripe*0.10*(0.5+0.5*cos(opalRest.x*240.0))*(1.0-panel);
   float weave = sin(opalRest.x*1600.0)*sin(opalRest.y*1450.0);
   float visibleWeave = 1.0-smoothstep(0.001,0.006,max(fwidth(opalRest.x),fwidth(opalRest.y)));
   diffuseColor.rgb *= 1.0+0.018*weave*visibleWeave;

  `);
 };
 material.customProgramCacheKey=()=> 'opal-woven-maid-'+outfit+'-v2';
 return material;
}

function hemFrill(dress,source){
 const rest=source.geometry.attributes.position,p=dress.geometry.attributes.position,index=source.geometry.index;
 const weld=new Map(),ids=[],edges=new Map();
 for(let i=0;i<rest.count;i++){const key=[rest.getX(i),rest.getY(i),rest.getZ(i)].map(v=>Math.round(v*1e5)).join();if(!weld.has(key))weld.set(key,weld.size);ids[i]=weld.get(key);}
 for(let i=0;i<index.count;i+=3)for(let j=0;j<3;j++){const a=index.getX(i+j),b=index.getX(i+(j+1)%3),key=[ids[a],ids[b]].sort((a,b)=>a-b).join();if(edges.has(key))edges.get(key).count++;else edges.set(key,{a,b,count:1});}
 const boundary=[...edges.values()].filter(e=>e.count===1&&rest.getY(e.a)<1.02&&rest.getY(e.b)<1.02);
 const vertices=[],skin=[],weights=[],triangles=[],attachments=[],unique=new Map(),skinId=dress.geometry.attributes.skinIndex,skinWeight=dress.geometry.attributes.skinWeight;
 const edgeSamples=new Map();
 const stitch=(a,b,t)=>{const key=a+':'+b;if(!edgeSamples.has(key)){const start=new T.Vector3().fromBufferAttribute(p,a),delta=new T.Vector3().fromBufferAttribute(p,b).sub(start),length=delta.lengthSq(),samples=[];for(let i=0;i<p.count;i++){const point=new T.Vector3().fromBufferAttribute(p,i).sub(start),v=point.dot(delta)/length;if(v>=-1e-5&&v<=1.00001&&point.addScaledVector(delta,-v).lengthSq()<1e-10)samples.push({i,t:v});}samples.sort((a,b)=>a.t-b.t);edgeSamples.set(key,samples);}const samples=edgeSamples.get(key);for(let i=1;i<samples.length;i++)if(t<=samples[i].t+1e-6){const lo=samples[i-1],hi=samples[i];return {a:lo.i,b:hi.i,t:Math.max(0,Math.min(1,(t-lo.t)/Math.max(1e-8,hi.t-lo.t)))};}return {a,b,t};};
 const vertex=(a,b,t,row)=>{
  const point=new T.Vector3().fromBufferAttribute(p,a).lerp(new T.Vector3().fromBufferAttribute(p,b),t),angle=Math.atan2(point.z,point.x),fold=Math.sin(angle*18),width=row/2,base=point.clone();
  point.x*=1+.003+width*(.025+.025*fold);point.z*=1+.003+width*(.025+.025*fold);point.y-=width*(.027+.003*fold);
  const key=point.toArray().map(v=>Math.round(v*1e6)).join();if(unique.has(key))return unique.get(key);
  const id=vertices.length/3;unique.set(key,id);vertices.push(...point.toArray());attachments.push({...stitch(a,b,t),offset:point.clone().sub(base)});
  const combined=new Map();for(const [v,factor] of [[a,1-t],[b,t]])for(let j=0;j<4;j++){const bone=skinId.getComponent(v,j);combined.set(bone,(combined.get(bone)||0)+factor*skinWeight.getComponent(v,j));}
  const top=[...combined].sort((a,b)=>b[1]-a[1]).slice(0,4),sum=top.reduce((n,v)=>n+v[1],0);for(let j=0;j<4;j++){skin.push(top[j]?.[0]||0);weights.push((top[j]?.[1]||0)/sum);}return id;
 };
 for(const {a,b} of boundary)for(let segment=0;segment<8;segment++)for(let row=0;row<2;row++){
  const q=[vertex(a,b,segment/8,row),vertex(a,b,(segment+1)/8,row),vertex(a,b,segment/8,row+1),vertex(a,b,(segment+1)/8,row+1)];triangles.push(q[0],q[2],q[1],q[1],q[2],q[3]);
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(skin,4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));geometry.setIndex(triangles);geometry.computeVertexNormals();
 const frill=dress.clone(false);frill.geometry=geometry;frill.material=new T.MeshStandardMaterial({color:0xfff3e5,roughness:.94,metalness:0,side:T.DoubleSide});frill.name='Opal-gathered-fabric-hem';frill.userData.garment='hem-trim';frill.userData.fabricAttachment=attachments;return frill;
}

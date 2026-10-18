import * as T from './vendor/three.module.js';
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
   const length={classic:0,rose:-.035,evening:.36,work:.12}[spec.id];
   for(let i=0;i<p.count;i++){
    const y=p.getY(i),weight=T.MathUtils.smoothstep(waist-y,0,waist-box.min.y);
    p.setY(i,y-length*weight);
   }
   // A smooth blend removes leg influence toward the hem without a hard
   // waist seam. Each outfit owns its weight buffers; source skin is untouched.
   const hip=source.skeleton.bones.indexOf(vrm.humanoid.getRawBoneNode('hips'));
   if(hip<0)throw Error('Opal garment is missing its pelvis binding');
   const ids=dress.geometry.attributes.skinIndex,weights=dress.geometry.attributes.skinWeight;
   for(let i=0;i<p.count;i++){
    const amount=1-T.MathUtils.smoothstep(source.geometry.attributes.position.getY(i),waist-.08,waist+.04);
    if(!amount)continue;
    const values=new Map([[hip,amount]]);
    for(let j=0;j<4;j++){const id=ids.getComponent(i,j);values.set(id,(values.get(id)||0)+weights.getComponent(i,j)*(1-amount));}
    const top=[...values].sort((a,b)=>b[1]-a[1]).slice(0,4),sum=top.reduce((n,v)=>n+v[1],0);
    for(let j=0;j<4;j++){ids.setComponent(i,j,top[j]?.[0]||0);weights.setComponent(i,j,(top[j]?.[1]||0)/sum);}
   }
   p.needsUpdate=true;ids.needsUpdate=true;weights.needsUpdate=true;dress.geometry.computeVertexNormals();
   dress.skeleton=source.skeleton;dress.bindMode=source.bindMode;dress.bindMatrix.copy(source.bindMatrix);dress.bindMatrixInverse.copy(source.bindMatrixInverse);
   dress.material=maidMaterial(spec.id,waist,box.min.y-length,box.max.y);
   dress.frustumCulled=false;group.add(dress);
  }
 }
 return {entity,outfits};
}

export function maidMaterial(outfit,waist,hem,top){
 const material=new T.MeshToonMaterial({color:({classic:0x24212e,rose:0xe9a0ba,evening:0x242035,work:0x26364c})[outfit],side:T.DoubleSide});
 material.name='Opal-'+outfit+'-maid-fabric';
 // The apron is a fabric colour region on the complete dress. No copied
 // coplanar triangles, cut-out holes or mismatched overlay skin weights.
 material.onBeforeCompile=shader=>{
  shader.uniforms.opalCut={value:new T.Vector3(waist,hem,top)};
  shader.vertexShader='varying vec3 opalRest;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nopalRest = position;');
  shader.fragmentShader='varying vec3 opalRest;\nuniform vec3 opalCut;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float skirt = clamp((opalCut.x-opalRest.y)/max(0.01,opalCut.x-opalCut.y),0.0,1.0);
   float bib = smoothstep(opalCut.x-0.012,opalCut.x+0.035,opalRest.y);
   float width = mix(0.10+skirt*0.14,0.082,bib);
   float panel = (1.0-smoothstep(width-0.002,width+0.002,abs(opalRest.x)))
     *(1.0-smoothstep(-0.04,-0.03,opalRest.z))
     *smoothstep(opalCut.y+0.025,opalCut.y+0.035,opalRest.y)
     *(1.0-smoothstep(opalCut.z-0.055,opalCut.z-0.04,opalRest.y));
   diffuseColor.rgb = mix(diffuseColor.rgb,vec3(1.0,0.955,0.91),panel);
  `);
 };
 material.customProgramCacheKey=()=> 'opal-continuous-maid-v1';
 return material;
}

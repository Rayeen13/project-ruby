import * as T from './vendor/three.module.js';
// Conforming edge subdivision keeps UV seams and transferred skin weights.
// Each marked shared edge is split in both adjacent triangles; no T-junctions.
export function refineGarment(source,maxEdge=.045,passes=4){
 const geometry=source.clone(),attributes=Object.fromEntries(Object.entries(source.attributes).map(([name,a])=>[name,{values:Array.from(a.array),size:a.itemSize,Type:a.array.constructor,normalized:a.normalized}]));let indices=Array.from(source.index.array);
 const p=attributes.position.values,skin=attributes.skinIndex,weight=attributes.skinWeight;
 const midpoint=(a,b)=>{const id=p.length/3;for(const [name,data] of Object.entries(attributes)){if(name==='skinIndex'||name==='skinWeight')continue;for(let k=0;k<data.size;k++)data.values.push((data.values[a*data.size+k]+data.values[b*data.size+k])*.5);}
  const merged=new Map();for(const v of [a,b])for(let k=0;k<4;k++){const bone=skin.values[v*4+k];merged.set(bone,(merged.get(bone)||0)+weight.values[v*4+k]*.5);}const top=[...merged].sort((a,b)=>b[1]-a[1]).slice(0,4),sum=top.reduce((s,x)=>s+x[1],0);for(let k=0;k<4;k++){skin.values.push(top[k]?.[0]||0);weight.values.push((top[k]?.[1]||0)/sum);}return id;};
 for(let pass=0;pass<passes;pass++){
  const edges=new Map(),split=(a,b)=>{const key=a<b?a+':'+b:b+':'+a;if(edges.has(key))return edges.get(key);const length=Math.hypot(p[a*3]-p[b*3],p[a*3+1]-p[b*3+1],p[a*3+2]-p[b*3+2]);const mid=length>maxEdge?midpoint(a,b):-1;edges.set(key,mid);return mid;},out=[];let changed=false;
  for(let i=0;i<indices.length;i+=3){const [a,b,c]=indices.slice(i,i+3),x=split(a,b),y=split(b,c),z=split(c,a),mask=(x>=0?1:0)|(y>=0?2:0)|(z>=0?4:0);changed||=!!mask;
   const triangles=mask===0?[[a,b,c]]:mask===1?[[a,x,c],[x,b,c]]:mask===2?[[b,y,a],[y,c,a]]:mask===4?[[c,z,b],[z,a,b]]:mask===3?[[x,b,y],[a,x,c],[x,y,c]]:mask===6?[[y,c,z],[b,y,a],[y,z,a]]:mask===5?[[z,a,x],[c,z,b],[z,x,b]]:[[a,x,z],[x,b,y],[z,y,c],[x,y,z]];
   for(const triangle of triangles)out.push(...triangle);
  }indices=out;if(!changed)break;
 }
 for(const [name,a] of Object.entries(attributes))geometry.setAttribute(name,new T.BufferAttribute(new a.Type(a.values),a.size,a.normalized));geometry.setIndex(indices);geometry.clearGroups();geometry.computeVertexNormals();geometry.userData.sourceVertexCount=source.attributes.position.count;geometry.userData.sourceIndexCount=source.index.count;return geometry;
}

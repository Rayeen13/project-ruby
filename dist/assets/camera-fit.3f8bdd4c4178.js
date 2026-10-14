import * as T from '../vendor/three.module.js';

// Fit world-space geometry before drawing. Floating zoom changes window size,
// never pushes the camera through a fixed transparent viewport.
export function fitDistance(root,aspect,yaw,pitch,{padding=.2,headroom=.45}={}){
 root.updateMatrixWorld(true);
 const box=new T.Box3().setFromObject(root).expandByScalar(padding);box.max.y+=headroom;
 const focus=new T.Vector3(0,1.45,0);
 const direction=new T.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch));
 const inverse=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().lookAt(focus.clone().add(direction),focus,new T.Vector3(0,1,0))).invert();
 const tanV=Math.tan(35*Math.PI/360),tanH=tanV*Math.max(.1,aspect);
 let distance=1;
 for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
  const point=new T.Vector3(x,y,z).sub(focus).applyQuaternion(inverse);
  distance=Math.max(distance,point.z+Math.abs(point.x)/tanH,point.z+Math.abs(point.y)/tanV);
 }
 return distance*1.04;
}

export function placeCamera(camera,distance,yaw,pitch){
 camera.position.set(Math.sin(yaw)*distance*Math.cos(pitch),1.45+Math.sin(pitch)*distance,Math.cos(yaw)*distance*Math.cos(pitch));
 camera.lookAt(0,1.45,0);camera.updateMatrixWorld(true);
}

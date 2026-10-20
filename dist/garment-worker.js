import {GarmentWorkerRuntime} from './garment-worker-runtime.js';
const runtime=new GarmentWorkerRuntime();
globalThis.onmessage=async({data})=>{
 try{
  if(data.type==='boot'){await runtime.boot();globalThis.postMessage({type:'ready'});return;}
  const frame=runtime.run(data),transfer=frame.meshes.flatMap(m=>[m.position.buffer,m.normal.buffer]);globalThis.postMessage(frame,transfer);
 }catch(error){globalThis.postMessage({type:'error',error:String(error?.message||error)});}
};

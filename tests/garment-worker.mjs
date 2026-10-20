import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {OpalCharacter} from '../dist/opal-character.js';
import {GarmentWorker} from '../dist/garment-worker-client.js';
const canvas=()=>({getContext:()=>new Proxy({}, {get:()=>()=>{},set:()=>true})}),wait=ms=>new Promise(r=>setTimeout(r,ms));
const factory=stall=>()=>{
 const worker=new Worker(new URL('./fixtures/garment-node-worker.mjs',import.meta.url),{workerData:{stall}});
 const adapter={postMessage:value=>worker.postMessage(value),terminate:()=>worker.terminate()};worker.on('message',data=>adapter.onmessage?.({data}));worker.on('error',error=>adapter.onerror?.(error));return adapter;
};
const c=new OpalCharacter({createCanvas:canvas,createGarmentPhysics:vrm=>GarmentWorker.create(vrm,{createWorker:factory(false)})});await c.ready;assert(c.fabric instanceof GarmentWorker);const f=c.fabric;
const drain=async()=>{for(let i=0;i<500&&f.busy;i++)await wait(10);if(f.error)throw f.error;assert(!f.busy,'A real Jolt request completes');};
c.update(0,{dt:1/30});await drain();assert.equal(f.state,'ready');assert(f.motion>=0);assert(c.outfits.get('classic').children[0].geometry.attributes.position.array.every(Number.isFinite));
// Large sustained drags and stale responses from quick wardrobe changes.
let heartbeat=0,maxTurn=0;const timer=setInterval(()=>heartbeat++,5);
for(let i=0;i<160;i++){
 c.root.position.x=2*Math.sin(i*1.7);c.root.position.y=.2*Math.cos(i);c.root.rotation.z=.16*Math.sin(i*2);
 if(i===30)c.setOutfit('victorian');if(i===31)c.setOutfit('bluebell');if(i===32)c.setOutfit('classic');
 const before=performance.now();c.update(i/30,{dt:1/30,follow:false});maxTurn=Math.max(maxTurn,performance.now()-before);await wait(5);
}
await drain();clearInterval(timer);assert(heartbeat>100,'UI event loop continues during actual sustained worker physics');assert(maxTurn<300,'Main-thread updates stay bounded');assert(!f.error);assert.equal(f.revision,4);assert(f.sequence<165,'No unbounded catch-up request queue');
const liveGeometry=c.outfits.get('classic').children[0].geometry;assert(liveGeometry.attributes.position.array.every(Number.isFinite));c.dispose();assert(f.disposed);
// A genuinely non-returning WASM-equivalent worker cannot freeze the parent.
const stuck=new OpalCharacter({createCanvas:canvas,createGarmentPhysics:vrm=>GarmentWorker.create(vrm,{createWorker:factory(true),stepTimeout:200})});await stuck.ready;stuck.update(0,{dt:1/30});const old=stuck.fabric;for(let i=0;i<500&&old.busy;i++)await wait(10);assert(!old.error,'Initial worker selection completes');
stuck.update(1,{dt:1/30});let responsive=0;const pulse=setInterval(()=>responsive++,5);for(let i=0;i<100&&!old.error;i++)await wait(10);clearInterval(pulse);assert(old.error,'Watchdog terminates an actually stuck worker');assert(responsive>10,'UI timers survive a non-returning solver');
stuck.update(2,{dt:1/30});assert.equal(stuck.fabric,null,'Failed worker switches to the existing lightweight cloth rig');assert(!stuck.clothRig.fabricActive);assert(stuck.loaded,'Avatar remains loaded after the solver fails');stuck.update(3,{dt:1/30});stuck.dispose();
console.log(`PASS: actual Jolt worker output, sustained large shakes, bounded requests, wardrobe races, UI heartbeats (${heartbeat}), stuck-worker termination and animated fallback.`);

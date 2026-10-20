import {parentPort,workerData} from 'node:worker_threads';
globalThis.postMessage=(message,transfer)=>parentPort.postMessage(message,transfer);
await import('../../dist/garment-worker.js');
parentPort.on('message',data=>{if(workerData?.stall&&data.type==='step'){while(true){/* deliberate stuck physics process: parent watchdog must terminate */}}else globalThis.onmessage({data});});

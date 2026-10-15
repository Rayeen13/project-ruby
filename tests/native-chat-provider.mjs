import assert from 'node:assert/strict';
import {NativeChatProvider} from '../dist/native-chat-provider.js';
let listener,request,resolveRequest,unlistened=false,cancelled=[];
const tauri={event:{async listen(name,callback){assert.equal(name,'ruby-chat-chunk');listener=callback;return ()=>{unlistened=true;};}},core:{async invoke(command,args){
 if(command==='local_ai_models')return ['qwen-local'];
 if(command==='local_ai_cancel'){cancelled.push(args.requestId);resolveRequest?.();return;}
 request=args;await new Promise(resolve=>{resolveRequest=resolve;});
}}};
const provider=new NativeChatProvider(tauri);assert.deepEqual(await provider.models(),['qwen-local']);
const controller=new AbortController(),chunks=[];
const run=(async()=>{for await(const text of provider.stream({messages:[],model:'qwen-local',signal:controller.signal}))chunks.push(text);})();
await new Promise(r=>setTimeout(r,0));
listener({payload:{requestId:request.requestId+1,text:'stale'}});listener({payload:{requestId:request.requestId,text:'Hi 💎',done:false}});
resolveRequest();await new Promise(r=>setTimeout(r,0));assert.equal(unlistened,false,'RPC completion alone must not lose queued final events');
listener({payload:{requestId:request.requestId,text:'!',done:false}});listener({payload:{requestId:request.requestId,text:'',done:true}});await run;
assert.deepEqual(chunks,['Hi 💎','!']);assert(unlistened);assert(cancelled.includes(request.requestId));
unlistened=false;const stop=new AbortController();
const stopped=(async()=>{for await(const text of provider.stream({messages:[],model:'qwen-local',signal:stop.signal})){} })();
await new Promise(r=>setTimeout(r,0));stop.abort();await assert.rejects(stopped,/Stopped/);assert(unlistened);resolveRequest();
console.log('Native chat bridge: stream completion ordering, request isolation, abort and listener cleanup passed.');

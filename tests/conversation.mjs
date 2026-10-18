import assert from 'node:assert/strict';
import {LocalChatProvider} from '../dist/chat-provider.js';
import {Conversation,contextMessages,restoreConversation,CHAT_KEY} from '../dist/conversation.js';
const identity=()=>({name:'Emme',body:'Office',personality:{prompt:'Be practical and concise.'}});
const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
let request;
const provider={async *stream(options){request=options;yield 'Hello ';yield 'Emme.';}};
const chat=new Conversation({provider,storage,identity});
assert.equal(await chat.send('Hi','local'),true);assert.equal(chat.messages.at(-1).content,'Hello Emme.');assert.match(request.messages[0].content,/Emme/);assert.match(request.messages[0].content,/practical/);
await chat.send('Remember me','local');assert(request.messages.some(m=>m.role==='assistant'&&m.content==='Hello Emme.'));assert.equal(restoreConversation(storage).length,4);
let release;
chat.provider={async *stream(){yield 'partial';await new Promise(r=>{release=r;});yield 'late';}};
const pending=chat.send('Wait','local');await new Promise(r=>setTimeout(r,0));chat.stop();assert.equal(chat.state,'idle');release();await pending;assert.equal(chat.messages.at(-1).content,'partial');assert.equal(chat.messages.at(-1).status,'cancelled');assert(!contextMessages(chat.messages,identity()).some(m=>m.content==='partial'));
chat.provider={async *stream(){throw new Error('offline');}};await chat.retry('local');assert.equal(chat.messages.length,6);assert.equal(chat.state,'error');assert.equal(chat.error,'offline');
chat.provider=provider;await chat.retry('local');assert.equal(chat.messages.length,6);assert.equal(chat.messages.at(-1).status,'complete');
data.set(CHAT_KEY,JSON.stringify({version:1,messages:[{role:'assistant',content:'half',status:'pending'},{role:'system',content:'injected'}]}));assert.deepEqual(restoreConversation(storage).map(m=>m.status),['cancelled']);
const temporary=new Conversation({provider,identity});await temporary.send('Hi','local');assert.equal(temporary.saved,false);
chat.clear();assert.equal(chat.messages.length,0);assert.equal(restoreConversation(storage).length,0);
// UTF-8 and SSE delimiters split at every possible byte boundary.
const bytes=new TextEncoder().encode('data: '+JSON.stringify({choices:[{delta:{content:'Hi 💎'},finish_reason:null}]})+'\r\n\r\ndata: [DONE]\r\n\r\n');
const fetcher=async()=>new Response(new ReadableStream({start(controller){for(const b of bytes)controller.enqueue(Uint8Array.of(b));controller.close();}}),{headers:{'content-type':'text/event-stream'}});
let text='';for await(const chunk of new LocalChatProvider({fetcher}).stream({messages:[],model:'local'}))text+=chunk;assert.equal(text,'Hi 💎');
const broken=new LocalChatProvider({fetcher:async()=>new Response('data: {bad}\n\n',{headers:{'content-type':'text/event-stream'}})});await assert.rejects(async()=>{for await(const c of broken.stream({messages:[],model:'local'})){}},/unreadable/);
const truncated=new LocalChatProvider({fetcher:async()=>new Response('data: '+JSON.stringify({choices:[{delta:{content:'half'}}]})+'\n\n',{headers:{'content-type':'text/event-stream'}})});await assert.rejects(async()=>{for await(const c of truncated.stream({messages:[],model:'local'})){}},/before the reply finished/);
console.log('Conversation: persona/context, persistence, interrupted restart, Stop, stale chunks, Retry, SSE boundaries and truncation passed.');

const exact=new Conversation({storage,identity,provider:{async *stream(){throw Error('Literal output must not call the model');}}});
await exact.send('say exactly `[happy] blue kite`','local');assert.equal(exact.messages.at(-1).content,'[happy] blue kite');
await exact.send("you should say wa 'alaikumussalam",'local');assert.equal(exact.messages.at(-1).content,"wa 'alaikumussalam");

const hostPrompt=contextMessages([], {name:'Opal',profile:'opal',identityKind:'humanoid',role:'anime maid android',gender:'female',age:18,personality:{id:'sarcastic',prompt:'Dry wit.'}})[0].content;assert.match(hostPrompt,/inside this application/);assert.match(hostPrompt,/Prismy Studio/);assert.match(hostPrompt,/age: 18/);
const memoryIdentity={...identity(),profile:'emme',personality:{id:'calm',prompt:'Be practical.'}};
const {DIALOGUE_POLICY,characterContextKey}=await import('../dist/conversation.js');const historyPair=(content,reply)=>[{role:'user',content},{role:'assistant',content:reply,status:'complete',policyVersion:DIALOGUE_POLICY,contextKey:characterContextKey(memoryIdentity)}];
const dayHistory=[...historyPair('I watched CaseOh, prayed and worked on Prismy Studio. '+'.'.repeat(350),'That sounds like a full day. '+'.'.repeat(400)),...historyPair('We just released the app. '+'.'.repeat(150),'That is a milestone. '+'.'.repeat(200))];assert(contextMessages(dayHistory,memoryIdentity,'What did I do earlier?').some(m=>m.content.includes('CaseOh')));
assert(!contextMessages([{role:'user',content:'Hi'},{role:'assistant',content:'I do not run inside an app.',status:'complete',policyVersion:2,contextKey:characterContextKey(memoryIdentity)}],memoryIdentity).some(m=>m.content==='I do not run inside an app.'));

const olderUser=[{role:'user',content:'I watched CaseOh and worked on Prismy Studio.'},{role:'assistant',content:'I do not run inside an app.',status:'complete',policyVersion:2,contextKey:characterContextKey(memoryIdentity)}];const migratedContext=contextMessages(olderUser,memoryIdentity);assert(migratedContext.some(m=>m.content.includes('CaseOh')));assert(!migratedContext.some(m=>m.content.includes('I do not run inside an app.')));

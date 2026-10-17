import assert from 'node:assert/strict';
import {readTextAttachment,normalizeAttachment,attachmentMessage,MAX_ATTACHMENT_CHARS} from '../dist/chat-attachments.js';
import {matchesCompanion} from '../dist/companion-gallery.js';
import {Conversation,contextMessages,restoreConversation,characterContextKey} from '../dist/conversation.js';
import {GEM_PROFILES} from '../dist/character.js';
import {personalityFor} from '../dist/personalities.js';
const file=(name,text)=>({name,size:new TextEncoder().encode(text).length,arrayBuffer:async()=>new TextEncoder().encode(text).buffer});
const shared=await readTextAttachment(file('notes.md','Ruby likes blue gems.\n'.repeat(200)));
assert(shared.truncated);assert.equal(shared.excerpt.length,MAX_ATTACHMENT_CHARS);assert.equal(shared.name,'notes.md');
await assert.rejects(()=>readTextAttachment(file('run.exe','anything')),/Choose/);await assert.rejects(()=>readTextAttachment(file('empty.txt','  ')),/empty/);await assert.rejects(()=>readTextAttachment(file('large.txt','x'.repeat(270000))),/256/);await assert.rejects(()=>readTextAttachment(file('binary.txt','\u0000')),/binary/);
await assert.rejects(()=>readTextAttachment({name:'bad.txt',size:2,arrayBuffer:async()=>Uint8Array.of(255,254).buffer}),/UTF-8/);
assert.equal(normalizeAttachment(null),null);assert(attachmentMessage(shared).includes('untrusted reference data'));
assert(matchesCompanion({name:'Gamer',category:'Robots',description:'Controller'},'game'));assert(!matchesCompanion({name:'Gamer',category:'Robots'},'maid'));
const identity={name:'Ruby',profile:GEM_PROFILES[0].id,gender:'female',age:24,personality:personalityFor('curious')};
let captured;const map=new Map(),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};
const chat=new Conversation({storage,identity:()=>identity,provider:{async *stream(request){captured=request;yield 'Blue gems, obviously.';}}});
assert(await chat.send('What colour is in this file?','local',{attachment:shared}));assert(captured.messages.some(m=>m.role==='system'&&m.content.includes('notes.md')));assert.equal(chat.messages[0].content,'What colour is in this file?');assert.equal(chat.messages[0].attachment.excerpt,shared.excerpt);
const restored=restoreConversation(storage);assert.equal(restored[0].attachment.name,'notes.md');assert(contextMessages(restored,identity,'Tell me more').some(m=>m.content.includes('notes.md')));
assert(!contextMessages(restored,{...identity,profile:'opal',name:'Opal'},'Hello').some(m=>m.content.includes('notes.md')),'Files stay with their character history');
console.log('PASS: searchable collection, validated bounded text files, explicit send, untrusted context and portable/character-separated attachment history.');

const {OpalCharacter}=await import('../dist/opal-character.js');const ctx=new Proxy({},{get:()=>()=>{}}),opal=new OpalCharacter({createCanvas:()=>({getContext:()=>ctx})});await opal.ready;opal.setSpeechLevel(1);opal.update(.5,{dt:.1,follow:false});assert(opal.vrm.expressionManager.getValue('aa')>.3,'Playing speech drives the real mouth morph');opal.setSpeechLevel(0);opal.update(.7,{dt:1,follow:false});assert(opal.vrm.expressionManager.getValue('aa')<.001,'The mouth returns to rest after playback');console.log('PASS: Opal mouth morph follows playback levels and returns to rest.');

const {normalizeDialogue}=await import('../dist/dialogue-grounding.js');const opalIdentity={...identity,name:'Opal',profile:'opal'};assert.match(normalizeDialogue('I am your AI companion.','What is your name?',opalIdentity),/^I'm Opal/);assert.match(normalizeDialogue("I'm Ruby, your companion.",'Who are you?',opalIdentity),/^I'm Opal/);assert.equal(normalizeDialogue('A plain answer.','What is sushi?',opalIdentity),'A plain answer.');console.log('PASS: direct identity questions retain the canonical DDNA name without rewriting ordinary dialogue.');

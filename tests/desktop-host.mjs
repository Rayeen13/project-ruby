import assert from 'node:assert/strict';
import {createDesktopHost} from '../dist/desktop-host.js';

assert.equal(createDesktopHost(undefined),null);
assert.equal(createDesktopHost({core:{invoke(){}}}),null);
const calls=[];
let receive;
const host=createDesktopHost({
 core:{invoke:async(command,args)=>{calls.push({command,args});return {floating:true};}},
 event:{listen:async(name,callback)=>{assert.equal(name,'ruby-desktop-status');receive=callback;return ()=>{};}}
});
await host.status();
await host.action('float');
await host.action('stop');
assert.deepEqual(calls,[{command:'desktop_status',args:undefined},{command:'desktop_action',args:{action:'float'}},{command:'desktop_action',args:{action:'stop'}}]);
await assert.rejects(host.action('launch_process'),/Unsupported desktop action/);
assert.equal(calls.length,3,'Unrecognized actions must never reach IPC');
let state;
await host.listen(value=>{state=value;});
receive({payload:{floating:false,clickThrough:false,stopped:true}});
assert.deepEqual(state,{floating:false,clickThrough:false,stopped:true});
console.log('PASS: browser has no desktop host, bounded IPC actions and recovery status routing.');

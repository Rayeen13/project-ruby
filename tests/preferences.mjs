import assert from 'node:assert/strict';
import {normalizePreferences,loadPreferences,savePreferences,PREFERENCES_KEY} from '../dist/preferences.js';
const options={models:['classic','cyber','chibi','office','gamer'],profiles:['ruby','saph','emme','amy'],moods:['idle','happy','listen','sleep'],gestures:['relaxed','open','point','grip','fist']};
const defaults=normalizePreferences(null,options);
const saved={...defaults,model:'office',profile:'emme',mood:'happy',animate:false,follow:false,handSide:-1,gestures:{right:'point',left:'fist'},camera:{yaw:1,pitch:.4,distance:6}};
const map=new Map(),storage={getItem:key=>map.get(key),setItem:(key,value)=>map.set(key,value)};
assert(savePreferences(storage,saved,options));assert.deepEqual(loadPreferences(storage,options).state,saved);
assert.deepEqual(normalizePreferences(JSON.parse(JSON.stringify(saved)),options),saved);
map.set(PREFERENCES_KEY,'broken-json');assert.deepEqual(loadPreferences(storage,options).state,defaults);
assert.deepEqual(normalizePreferences({...saved,version:99},options),defaults);
const bad=normalizePreferences({version:1,model:'removed',profile:'bad',mood:'bad',handSide:0,animate:'false',gestures:{right:'attack'},camera:{yaw:Infinity,pitch:100,distance:-5}},options);
assert.equal(bad.model,'gamer');assert.equal(bad.profile,'ruby');assert.equal(bad.handSide,1);assert.equal(bad.animate,true);assert.equal(bad.gestures.right,'relaxed');assert.deepEqual(bad.camera,{yaw:0,pitch:.85,distance:.01});
const blocked={getItem:()=>{throw new Error('blocked');},setItem:()=>{throw new Error('quota');}};
assert.equal(loadPreferences(blocked,options).available,false);assert.equal(savePreferences(blocked,saved,options),false);
assert.equal(savePreferences(null,saved,options),false);assert.deepEqual(loadPreferences(null,options).state,defaults);
saved.gestures.left='open';assert.equal(defaults.gestures.left,'relaxed');
console.log('PASS: saved preference round-trip, bounds, corrupt/future data and unavailable storage.');

for(const distance of [.02,.5,40,250])assert.equal(normalizePreferences({...saved,camera:{...saved.camera,distance}},options).camera.distance,distance,'Studio zoom persists without the old near/far limits');

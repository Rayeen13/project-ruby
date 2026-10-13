import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {orbitYaw,characterHit,TouchReaction} from '../dist/interactions.js';
const camera=new T.PerspectiveCamera(35,1,.1,100);
const face=new T.Vector3(0,0,.5);
function projected(yaw){camera.position.set(Math.sin(yaw)*5,0,Math.cos(yaw)*5);camera.lookAt(0,0,0);camera.updateMatrixWorld();return face.clone().project(camera).x;}
assert(projected(orbitYaw(0,30))>projected(0),'Dragging right must move the front of the model right on screen');
assert(projected(orbitYaw(0,-30))<projected(0),'Dragging left must move the front left');
const root=new T.Group(),mesh=new T.Mesh(new T.BoxGeometry(1,1,1),new T.MeshBasicMaterial());root.add(mesh);
camera.position.set(0,0,5);camera.lookAt(0,0,0);camera.updateMatrixWorld();
const rect={left:0,top:0,width:500,height:500};
assert(characterHit(root,camera,rect,250,250));assert.equal(characterHit(root,camera,rect,10,10),null);
root.visible=false;assert.equal(characterHit(root,camera,rect,250,250),null);root.visible=true;
const reaction=new TouchReaction();reaction.trigger('pet',0);
reaction.apply(root,0);assert.equal(root.position.y,0);
reaction.apply(root,.8);assert(root.position.y>0);assert.equal(reaction.moodAt(.8),'happy');
reaction.apply(root,2.2);assert.equal(root.position.y,0);assert.equal(root.rotation.z,0);assert.equal(reaction.moodAt(2.2),null);
reaction.trigger('boop',3);reaction.apply(root,3.5);reaction.clear();reaction.apply(root,3.5);assert.equal(root.position.y,0);
console.log('PASS: screen-space drag direction, visible mesh-only hit tests and transient touch restoration.');

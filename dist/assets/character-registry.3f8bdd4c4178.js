import {characterCapabilities} from './character-capabilities.3f8bdd4c4178.js';
import {RubyCharacter} from './character.3f8bdd4c4178.js';
import {ClassicCharacter} from './classic-character.3f8bdd4c4178.js';
import {CyberCharacter} from './cyber-character.3f8bdd4c4178.js';
import {OfficeCharacter} from './office-character.3f8bdd4c4178.js';
import {GamerCharacter} from './gamer-character.3f8bdd4c4178.js';
// Visual model registry: separate from gem profiles and any future AI provider selector.
export const CHARACTER_MODELS=Object.freeze([
 {id:'classic',name:'Classic EMO-style',category:'Originals',revision:'001',capabilities:characterCapabilities(),description:'The original compact robot.',create:options=>new ClassicCharacter(options)},
 {id:'cyber',name:'Cyberpunk 3090',category:'Sci-fi',revision:'002',capabilities:characterCapabilities({hands:true}),description:'Original angular armour, neon details and mechanical hands.',create:options=>new CyberCharacter(options)},
 {id:'chibi',name:'Chibi',category:'Playful',revision:'003',capabilities:characterCapabilities({hands:true}),description:'Rounded pearl shell, big eyes and playful expressions.',create:options=>new RubyCharacter(options)},
 {id:'office',name:'Office',category:'Professional',revision:'004',capabilities:characterCapabilities({hands:true}),description:'Compact desk robot with a rounded rectangular head, short limbs and subtle gem accents.',create:options=>new OfficeCharacter(options)},
 {id:'gamer',name:'Gamer',category:'Gaming',revision:'005',capabilities:characterCapabilities({hands:true,heldProp:{side:-1,kind:'controller',gesture:'grip'}}),description:'Anime-inspired gamer with headphone listening screens and a controller held in the waving right hand.',create:options=>new GamerCharacter(options)}
].map(spec=>Object.freeze({...spec,canWave:spec.capabilities.wave})));
export class CharacterSelection {
 constructor(scene,options={}){this.scene=scene;this.options=options;this.cache=new Map();this.profileId='ruby';this.mood='idle';this.select('gamer');}
 select(id){const spec=CHARACTER_MODELS.find(m=>m.id===id);if(!spec)throw new Error('Unknown character model');if(this.active)this.scene.remove(this.active.root);if(!this.cache.has(id))this.cache.set(id,spec.create(this.options));this.active=this.cache.get(id);this.spec=spec;this.active.setProfile(this.profileId);this.active.setMood(this.mood);this.scene.add(this.active.root);return this.active;}
 setProfile(id){this.profileId=id;this.active.setProfile(id);}
 setMood(mood){this.mood=mood;this.active.setMood(mood);}
 get capabilities(){return this.spec.capabilities;}
 setHandGesture(pose,side=-1){
  if(side!==-1&&side!==1)throw new RangeError('Hand side must be -1 (right) or 1 (left)');
  const caps=this.capabilities;
  if(!caps.gestures.includes(pose))return false;
  if(caps.heldProp?.side===side&&caps.heldProp.gesture!==pose)return false;
  this.active.setHandGesture(pose,side);return true;
 }
}

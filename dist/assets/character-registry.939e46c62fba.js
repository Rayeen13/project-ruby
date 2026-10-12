import {RubyCharacter} from './character.939e46c62fba.js';
import {ClassicCharacter} from './classic-character.939e46c62fba.js';
import {CyberCharacter} from './cyber-character.939e46c62fba.js';
import {OfficeCharacter} from './office-character.939e46c62fba.js';
import {GamerCharacter} from './gamer-character.939e46c62fba.js';
// Visual model registry: separate from gem profiles and any future AI provider selector.
export const CHARACTER_MODELS=Object.freeze([
 {id:'classic',name:'Classic EMO-style',category:'Originals',revision:'001',canWave:false,description:'The original compact robot.',create:options=>new ClassicCharacter(options)},
 {id:'cyber',name:'Cyberpunk 3090',category:'Sci-fi',revision:'002',canWave:true,description:'Original angular armour, neon details and mechanical hands.',create:options=>new CyberCharacter(options)},
 {id:'chibi',name:'Chibi',category:'Playful',revision:'003',canWave:true,description:'Rounded pearl shell, big eyes and playful expressions.',create:options=>new RubyCharacter(options)},
 {id:'office',name:'Office',category:'Professional',revision:'004',canWave:true,description:'Compact desk robot with a rounded rectangular head, short limbs and subtle gem accents.',create:options=>new OfficeCharacter(options)},
 {id:'gamer',name:'Gamer',category:'Gaming',revision:'005',canWave:true,description:'Anime-inspired gamer with headphone listening screens and a controller held in the waving right hand.',create:options=>new GamerCharacter(options)}
]);
export class CharacterSelection {
 constructor(scene,options={}){this.scene=scene;this.options=options;this.cache=new Map();this.profileId='ruby';this.mood='idle';this.select('gamer');}
 select(id){const spec=CHARACTER_MODELS.find(m=>m.id===id);if(!spec)throw new Error('Unknown character model');if(this.active)this.scene.remove(this.active.root);if(!this.cache.has(id))this.cache.set(id,spec.create(this.options));this.active=this.cache.get(id);this.spec=spec;this.active.setProfile(this.profileId);this.active.setMood(this.mood);this.scene.add(this.active.root);return this.active;}
 setProfile(id){this.profileId=id;this.active.setProfile(id);}
 setMood(mood){this.mood=mood;this.active.setMood(mood);}
}

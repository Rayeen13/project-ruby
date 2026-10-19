import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {VRMLoaderPlugin,VRMUtils} from './vendor/three-vrm.module.js';
import {GEM_PROFILES} from './character.js';
import {OPAL_OUTFITS} from './wardrobe.js';
import {createOpalWardrobe} from './opal-wardrobe.js';
import {configureOpalCloth,coverOpalTorso,clothPreviewOffset} from './opal-cloth-rig.js';
import {sampleHumanoidArmPose,applyHumanoidArmPose} from './humanoid-gestures.js';

// A real CC0 VRoid skinned avatar; source/provenance is in docs/OPAL_ASSET.md.
export class OpalCharacter {
 constructor({createCanvas=()=>document.createElement('canvas')}={}){
  this.humanoid=true;this.root=new T.Group();this.body=new T.Group();this.root.add(this.body);this.head=new T.Group();this.body.add(this.head);
  this.profile=GEM_PROFILES.find(p=>p.id==='opal');this.mood='idle';this.gaze=new T.Vector2();this.arms=[];this.feet=[];this.handGestures={};this.outfit='classic';this.outfits=new Map();this.iris=[];
  this.canvas=createCanvas();this.canvas.width=1024;this.canvas.height=512;this.ctx=this.canvas.getContext('2d');this.faceTex=new T.CanvasTexture(this.canvas);this.faceTex.colorSpace=T.SRGBColorSpace;this.faceTex.flipY=false;
  this.ready=this.load();this.ready.catch(error=>{this.loadError=String(error.message||error);});
 }
 async load(){
  const loader=new GLTFLoader(),node=typeof window==='undefined';
  loader.register(parser=>{if(node)parser.loadTexture=()=>Promise.resolve(new T.DataTexture(new Uint8Array([255,255,255,255]),1,1));return new VRMLoaderPlugin(parser);});
  let gltf;
  if(node){const moduleName='node:'+'fs/promises',fs=await import(moduleName),bytes=await fs.readFile(new URL('./models/opal-base.vrm',import.meta.url));gltf=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');}
  else gltf=await loader.loadAsync(new URL('models/opal-base.vrm',document.baseURI).href);
  this.vrm=gltf.userData.vrm;if(!this.vrm)throw Error('Opal’s humanoid avatar could not be loaded.');
  VRMUtils.rotateVRM0(this.vrm);VRMUtils.removeUnnecessaryVertices(gltf.scene);VRMUtils.combineSkeletons(gltf.scene);
  this.body.remove(this.head);this.body.add(this.vrm.scene);this.vrm.scene.scale.setScalar(1.85);this.clothRig=configureOpalCloth(this.vrm,1.85);this.bodyCoverage=coverOpalTorso(this.vrm);
  const bone=id=>this.vrm.humanoid.getNormalizedBoneNode(id);this.bone=bone;this.head=bone('head');
  this.arms=[['left',1],['right',-1]].map(([name,side])=>{const hand=bone(name+'Hand'),fingers=['Index','Middle','Ring','Little'].map(d=>({base:bone(name+d+'Proximal'),tip:bone(name+d+'Distal'),middle:bone(name+d+'Intermediate')}));hand.userData.digits={fingers,thumb:bone(name+'ThumbProximal'),thumbTip:bone(name+'ThumbDistal'),side};return {arm:bone(name+'UpperArm'),forearm:bone(name+'LowerArm'),hand,side};});
  this.feet=[bone('leftUpperLeg'),bone('rightUpperLeg')];this.originalMaterials=[];const clothes=[];
  gltf.scene.traverse(o=>{
   if(!o.isMesh)return;o.frustumCulled=false;o.castShadow=true;o.receiveShadow=true;
   if(/Face|Hair/i.test(o.name))o.userData.touchPart='head';
   const mats=Array.isArray(o.material)?o.material:[o.material];
   for(const m of mats){
    if(/EyeIris/i.test(m.name))this.iris.push({material:m,map:m.map});
    if(/HAIR/i.test(m.name)){m.color?.set(0x343348);m.shadeColorFactor?.set(0x242237);}
   }
   if(mats.some(m=>/Tops.*CLOTH/i.test(m.name)))clothes.push(o);
  });
  this.vrm.scene.updateMatrixWorld(true);this.makeWardrobe(clothes);this.makeHeadband();this.setOutfit(this.outfit);this.update(0,{follow:false,dt:0});this.vrm.springBoneManager.reset();this.clothRig.reset();this.loaded=true;this.update(0,{follow:false});return this;
 }
 makeWardrobe(clothes){
  this.mannequin=this.vrm.scene;this.mannequin.name='Opal-mannequin';this.mannequin.userData.entity='body';
  const wardrobe=createOpalWardrobe(this.vrm,clothes);this.wardrobe=wardrobe.entity;this.outfits=wardrobe.outfits;this.body.add(this.wardrobe);
 }
 makeHeadband(){
  const head=this.vrm.humanoid.getRawBoneNode('head'),material=new T.MeshToonMaterial({color:0xfff7f0,side:T.DoubleSide});
  const vertices=[],indices=[];
  // Folded cloth ribbon over the actual scalp; no sphere/bead replacement body.
  for(let i=0;i<=48;i++){const a=Math.PI*.12+Math.PI*.76*i/48,r=.123+.004*Math.sin(i*Math.PI/2);for(const depth of [-.008,.008])vertices.push(Math.cos(a)*r,.13+Math.sin(a)*.115,depth-.035);if(i){const n=(i-1)*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();const band=new T.Mesh(geometry,material);band.name='Opal-lace-headband';head.add(band);this.headband=band;
  this.glasses=new T.Group();this.glasses.visible=false;head.add(this.glasses);this.glasses.position.set(0,.061,-.093);
  const rim=new T.MeshBasicMaterial({color:0x353349});for(const side of [-1,1]){const ring=new T.Mesh(new T.TorusGeometry(.025,.0014,6,32),rim);ring.position.x=side*.032;ring.scale.y=.70;this.glasses.add(ring);}
 }
 setProfile(){this.profile=GEM_PROFILES.find(p=>p.id==='opal');this.eyeColor=this.profile.color;}
 setMood(mood){this.mood=mood;}
 setSpeechLevel(value){this.speechTarget=T.MathUtils.clamp(Number.isFinite(value)?value:0,0,1);}
 setHandGesture(pose,side=-1){if(!['relaxed','open','point','grip','fist'].includes(pose))throw Error('Unknown hand gesture');this.handGestures[side]=pose;}
 setOutfit(id){if(!OPAL_OUTFITS.some(o=>o.id===id))return;this.outfit=id;for(const [key,group] of this.outfits)group.visible=key===id;if(this.glasses)this.glasses.visible=id==='work';}
 update(t,{pointer={x:0,y:0},follow=true,wave=false,waveWeight=wave?1:0,dt=.016}={}){
  if(!this.vrm)return;this.gaze.lerp(new T.Vector2(follow?pointer.x:0,follow?pointer.y:0),1-Math.exp(-12*dt));
  this.body.position.y=Math.sin(t*1.8)*.006;
  this.head.rotation.set(this.gaze.y*.08,this.gaze.x*.16,Math.sin(t*.7)*.01);
  for(const side of ['left','right']){const eye=this.bone(side+'Eye');if(eye)eye.rotation.set(this.gaze.y*.07,this.gaze.x*.12,0);}
  for(const rig of this.arms)applyHumanoidArmPose(this.vrm,sampleHumanoidArmPose(t,{side:rig.side===1?'left':'right',gesture:this.handGestures[rig.side]||'relaxed',waveWeight:rig.side===-1?waveWeight:0}));
  const e=this.vrm.expressionManager;if(e){for(const name of ['happy','relaxed','sad','surprised'])e.setValue(name,0);this.speechWeight=(this.speechWeight||0)+((this.speechTarget||0)-(this.speechWeight||0))*(1-Math.exp(-22*dt));e.setValue('aa',this.speechWeight*.8);e.setValue('blink',this.mood==='sleep'?1:Math.sin(t*1.3)>.993?1:0);if(this.mood==='happy')e.setValue('happy',.65);}
  for(const item of this.iris)if(item.material.map!==item.map)item.material.map=item.map;
  this.vrm.update(Math.min(dt,.05));this.clothRig.update(Math.min(dt,.05));this.root.updateMatrixWorld(true);if(this.lastBounds===undefined||t<this.lastBounds||t-this.lastBounds>.18){this.root.traverseVisible(o=>{if(o.isSkinnedMesh)o.computeBoundingBox();});this.lastBounds=t;}
 }
 previewCloth(time){this.clothPreviewStart=time;}
 applyClothPreview(time){const p=clothPreviewOffset(time,this.clothPreviewStart);if(p){this.root.position.x+=p.x;this.root.rotation.z+=p.z;}return !!p;}
 syncPose(){this.vrm?.humanoid.update();}
 drawDizzyEyes(ms){
  if(!this.loaded)return;const c=this.ctx;c.clearRect(0,0,1024,512);c.fillStyle='#d5c6ec';c.strokeStyle='#51436d';c.lineWidth=13;
  for(const x of [256,768]){c.save();c.beginPath();c.ellipse(x,256,120,140,0,0,Math.PI*2);c.clip();c.fillRect(x-122,114,244,284);c.beginPath();for(let i=0;i<=80;i++){const a=i*.19+ms*.002,r=i/80*109,px=x+Math.cos(a)*r,py=256+Math.sin(a)*r;if(i)c.lineTo(px,py);else c.moveTo(px,py);}c.stroke();c.restore();}
  this.faceTex.needsUpdate=true;for(const item of this.iris)item.material.map=this.faceTex;
 }
 getHeadBounds(){if(!this.loaded)return new T.Box3().setFromCenterAndSize(new T.Vector3(0,2.7,0),new T.Vector3(.4,.5,.4));const p=new T.Vector3(0,.075,0).applyMatrix4(this.vrm.humanoid.getRawBoneNode('head').matrixWorld);return new T.Box3().setFromCenterAndSize(p,new T.Vector3(.46,.62,.44));}
}

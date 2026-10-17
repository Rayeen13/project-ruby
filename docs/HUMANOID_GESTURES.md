# Reusable humanoid gestures · v0.4.7

Opal uses the VRM humanoid chain: shoulder → upper arm → lower arm → hand → finger joints. Poses are local quaternion rotations relative to the normalized T-pose. Bone positions, skin weights and scale are retained; the animation does not flip or replace a hand mesh.

The wave raises the upper arm, bends the elbow, turns the forearm so the open palm faces forward, then deviates the wrist side to side. It blends through the existing greeting weight. Finger flexion uses the proximal, intermediate and distal joints; thumb opposition/flexion uses its own three joints. Pointing keeps the index extended. Missing optional finger joints are skipped.

`dist/humanoid-gestures.js` contains canonical +Z-forward pose sampling, a VRM 0/1 orientation adapter and finite Three.js quaternion animation clips. The same pose sampler drives Opal in the web and Windows app.

```js
import {createHumanoidGestureClip} from './humanoid-gestures.js';
const mixer = new THREE.AnimationMixer(vrm.humanoid.normalizedHumanBonesRoot);
const clip = createHumanoidGestureClip(vrm, {side: 'right', gesture: 'wave'});
const action = mixer.clipAction(clip).setLoop(THREE.LoopOnce, 1);
action.clampWhenFinished = true;
action.play();
// In the game's update loop, let the mixer own these arm/finger joints:
mixer.update(dt);
vrm.update(dt);
```

The clip is directly usable in a Three.js game with the supplied VRM adapter. Do not also run Opal's procedural arm update on those joints while the mixer owns them. Unity Humanoid, Unreal and other engines still need their normal rig retarget/import adapter; this pass does not claim an FBX or VRMA export. Non-VRM skeletons require a semantic bone mapping and rest-pose conversion.

Reference specifications:
- [VRM T-pose: hand/palm/finger orientation](https://github.com/vrm-c/vrm-specification/blob/master/specification/VRMC_vrm-1.0/tpose.md)
- [three-vrm normalized human bones and VRM0 orientation](https://pixiv.github.io/three-vrm/docs/documents/migration-guide-1.0.html)
- [VRM animation rest-pose compatibility](https://github.com/vrm-c/vrm-specification/blob/master/specification/VRMC_vrm_animation-1.0/how_to_transform_human_pose.md)

Validation samples both hands through the wave, checks outward palm normals, shoulder/head clearance, unit quaternions, optional joints and a real AnimationMixer playing the generated clip. Native visual captures supplement numerical checks; these are gestures, not a full locomotion/IK/physics animation system.

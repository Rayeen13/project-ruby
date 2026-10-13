# Robotic hand rig

All four armed character bodies share a palm, four independently hinged fingers (base and tip joints), and a two-joint opposing thumb. The classic armless body is unchanged.

Call `character.setHandGesture("open" | "relaxed" | "point" | "grip" | "fist", side)` where anatomical right is `-1`, left is `1`. The selection persists during ordinary updates. A wave overrides the right hand with an open palm; Gamer uses a grip for its controller.

For continuous custom animation, import `setHandPose` from `dist/wave-pose.js`, or drive the joints at `rig.hand.userData.digits`: `fingers` contains `{base, tip}`, and `thumb`/`thumbTip` are pivots. Curling rotates about local X; thumb opposition also uses Y. Apply custom angles after `character.update` because its pose layer sets the joints each frame.

These are visual animation joints, not physical grabbing. Future world interaction needs object colliders, grip targets, attachment/release rules, contact constraints and reach/IK. There is no physics solver or object pickup yet.

STL exports bake the neutral displayed pose into a single static figurine. Finger hinges are not mechanical hinges in the printed export. Review thin finger details and supports in a slicer; no physical test print has been made.

## Smooth greeting transitions

Hosts can supply `waveWeight` from 0 to 1 in `character.update`. The pose blends shoulder, wrist, fingers and head from the current idle/dance/selected gesture. `wave: true` remains a compatibility shortcut for full strength. Gamer applies the same blend while retaining its controller grip and interpolating the prop orientation/position.

The lab uses `Greeting` from `dist/greeting.js`: a four-second simulation-time action with 0.45-second entry and 0.55-second exit fades. Repeated requests extend the action from its current weight, including while fading out. Pausing animation pauses simulation time; model switching/reset cancels the greeting. A wave requested while paused begins when animation resumes. The selected hand pose returns after the fade.

Simulation time advances by elapsed visible-frame time, independently of the software/coarse-pointer rendering cap. Hidden pages stop advancing time. Character interpolation receives a bounded delta for gaze smoothing.

# Robotic hand rig

All four armed character bodies share a palm, four independently hinged fingers (base and tip joints), and a two-joint opposing thumb. The classic armless body is unchanged.

Call `character.setHandGesture("open" | "relaxed" | "point" | "grip" | "fist", side)` where anatomical right is `-1`, left is `1`. The selection persists during ordinary updates. A wave overrides the right hand with an open palm; Gamer uses a grip for its controller.

For continuous custom animation, import `setHandPose` from `dist/wave-pose.js`, or drive the joints at `rig.hand.userData.digits`: `fingers` contains `{base, tip}`, and `thumb`/`thumbTip` are pivots. Curling rotates about local X; thumb opposition also uses Y. Apply custom angles after `character.update` because its pose layer sets the joints each frame.

These are visual animation joints, not physical grabbing. Future world interaction needs object colliders, grip targets, attachment/release rules, contact constraints and reach/IK. There is no physics solver or object pickup yet.

STL exports bake the neutral displayed pose into a single static figurine. Finger hinges are not mechanical hinges in the printed export. Review thin finger details and supports in a slicer; no physical test print has been made.

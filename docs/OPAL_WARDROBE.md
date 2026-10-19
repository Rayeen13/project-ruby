# Opal mannequin, garments and secondary motion

Opal is canonically an 18-year-old female anime maid android. Wardrobe changes preserve her identity, gender, voice preferences, DDNA and memories.

## Asset workflow

The CC0 VRoid mannequin and clothing are separate skinned entities on the original humanoid skeleton. Source mesh/topology remain intact in the bundled VRM. Garments retain original vertex weights and receive conforming edge refinement, with normalized interpolated weights for new vertices. The authored bind surface is retained in `fabricRest`; runtime simulation never overwrites that reference. UV seams are welded in the simulation mesh and mapped back to the render mesh, preventing the physical seam from splitting. Every outfit has a gathered hem attached to its refined edge.

The garment uses rough, non-metallic fabric shading and stable cloth-space apron/weave colour regions. The current apron is a continuous region of the dress, sharing its deformation. All seven styles have moving stitched hems. Pinned neckline, bodice and waist regions remain fitted to the rig; sleeves and lower skirts have progressively larger movement limits. Body faces always covered by these costumes are occluded in render geometry. The full mannequin is retained for fitting, and exposed neck/hands/legs stay visible.

## Jolt cloth

JoltPhysics.js **1.1.0** (MIT) is bundled locally, loaded only when Opal needs it. Its soft-body solver supplies gravity, stretch/shear edges, dihedral bending, skinned constraints and collision handling. The adapter transfers the existing skin weights, uses a fitted-pose stretch/bend reference, supplies animated joint matrices and maps solved particles back into the skinned render geometry. Attachment-distance and backstop masks serve the same roles described in Epic's cloth-authoring documentation. An explicit final attachment envelope prevents edge corrections from pulling shoulder seams outside their painted limits.

Ten torso/limb capsules form the garment physics asset. These are fitted separately from the VRM hair colliders. Only the visible garment is simulated; outfit changes destroy the preceding soft body and rebuild its selected asset. Hem trims follow the solved edge without additional soft bodies. The solver uses bounded 1/60-second steps and at most 0.125 seconds of catch-up. Physics timing remains independent of reduced render frame rates. Cleanup releases the world, bodies and temporary native objects. A spring fallback keeps the Companion usable if cloth initialization is unavailable; native acceptance explicitly requires Jolt to be active.

This follows the separate garment/skin-weight/mask/collision workflow used in game engines. Runtime Jolt settings require an engine-specific conversion to use Chaos Cloth in Unreal. Full cloth-to-cloth/self-collision and garment-pattern authoring remain future Studio work; this release does not claim a textile finite-element model or guaranteed collision-free arbitrary poses.

## Chest and hair

Four original Bust joints have a bounded, underdamped response to actual world-space motion. Proximal/distal frequencies differ, with angular limits and zeroed velocity on resets. This restores secondary chest movement while keeping body and bodice coupled through the original weights. It is a supported soft-tissue animation approximation, not a biomechanical model. Hair retains the existing VRM spring system. The earlier spring-state rebase after avatar rotation, scaling and relaxed pose remains in place.

## Wardrobe

The seven IDs remain `classic`, `rose`, `evening`, `work`, `victorian`, `bluebell`, `pinstripe`. Existing selections, time schedules and work overrides remain compatible. **Customize → Opal's wardrobe → Preview fabric movement** runs a three-second sway; reduced-motion preferences are respected.

Generic tailoring references only; no product photos, character designs or textures are bundled:

- https://www.londonmuseum.org.uk/collections/v/object-80112/apron-work-apron/
- https://teesvalleymuseums.org/object/servants-uniform/
- https://bodylinetokyo.co.jp/en-int/collections/school_events/products/76177

Implementation references:

- https://github.com/jrouwe/JoltPhysics.js/tree/1.1.0 — MIT; the original vendor licence is in `dist/vendor/JOLT-LICENSE.txt`.
- https://jrouwe.github.io/JoltPhysics.js/soft/soft_body.html
- https://dev.epicgames.com/documentation/en-us/unreal-engine/panel-cloth-editor-overview
- https://dev.epicgames.com/documentation/en-us/unreal-engine/clothing-tool-in-unreal-engine
- https://pixiv.github.io/three-vrm/docs/documents/spring-bones-on-scaled-models.html

Validation covers real/reversed gravity with a stationary mannequin, pinned attachment accuracy, movement envelopes, original weights and retained source surface, seam continuity, stitched hems, bounded/settling chest motion at 8/30/60 FPS, outfit body-count stability and cleanup. Native captures and user-device acceptance complement numerical checks.

The Jolt adapter accumulates elapsed render time into equal 60 Hz physics ticks. It never submits a tiny remainder timestep: XPBD velocity reconstruction divided by that remainder amplified ordinary RAF jitter into severe idle flickering. Temporal tests cover uneven 60/30 FPS intervals and alternating slow/fast frames, in addition to the steady-rate shake checks.

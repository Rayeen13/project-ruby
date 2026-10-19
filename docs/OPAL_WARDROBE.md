# Opal body, wardrobe and cloth motion

Opal remains an 18-year-old female anime maid android. Outfit selection is presentation state; it does not change her name, gender, personality, DDNA or owner memories.

## Chest clipping repair

The body and wardrobe remain separate skinned entities, sharing the humanoid skeleton. The complete artist garment topology and original Bust/Sleeve/Skirt weights are retained. The earlier pelvis-weight replacement is removed: it disabled skirt secondary motion. A small fabric allowance offsets the garment along its normals. Torso and upper-arm skin/outline triangles that are always covered by these full-sleeved outfits are omitted from the render geometry; the complete source mannequin remains retained for fitting. Exposed neck, hands and legs are preserved. This outfit-occlusion step prevents underlying skin from appearing through the bodice; it does not tear or cut the garment.

VRM spring tails were initialized before rotateVRM0, display scaling and the relaxed arm pose. They are now rebased after those transforms. Scale-dependent collision radii/stiffness are calibrated, and excessive chest secondary motion is damped. Hair continues to use the VRM spring manager.

## Cloth motion

A dedicated OpalClothRig drives 16 weighted skirt/sleeve joints with world-space spring particles, damping, gravity, fixed-length constraints, angular movement limits and sphere body colliders. Unweighted end bones are not simulated. It uses bounded substeps and resets on large teleports. One shared simulation drives whichever outfit is visible; it is not a solver per costume. It runs in the shared browser/native renderer, with no new model, service or physics dependency.

This is a lightweight skeletal cloth approximation, with limited folds from skinning and modeled gathers. It is not a full woven-fabric finite-element, per-vertex self-collision or garment-construction simulator. Existing body/leg/arm colliders and bounded movement prevent the tested fabric particles from entering the body. Native visual acceptance and arbitrary extreme poses remain separate from those checks.

## Seven selectable outfits

The four existing IDs (classic, rose, evening, work) and time-of-day/work preferences remain compatible. Three new original variations add geometry and tailoring:

- **Victorian ivory:** longer, gently flared charcoal skirt, ivory gathered hem and white collar trim.
- **Bluebell café:** blue bell skirt, softly expanded upper sleeves and gathered ivory hem.
- **Pinstripe housemaid:** medium-length muted striped dress, apron and gathered hem.

New hem trims are welded strips fitted to the original hem boundary, sharing normalized skin weights and skeleton. They follow the cloth springs. Continuous apron colour regions avoid near-coplanar full-bib overlays. Subtle woven shading and modeled folds supply fabric detail without copied textures. Use **Customize → Opal’s wardrobe → Preview fabric movement** for a three-second sway; reduced-motion preferences disable it.

Reference silhouettes/tailoring only; no product photographs, brand character designs or textures are bundled:
- https://www.londonmuseum.org.uk/collections/v/object-80112/apron-work-apron/
- https://teesvalleymuseums.org/object/servants-uniform/
- https://bodylinetokyo.co.jp/en-int/collections/school_events/products/76177

Physics references:
- https://vrm.dev/en/univrm/springbone/univrm_secondary/
- https://pixiv.github.io/three-vrm/docs/documents/spring-bones-on-scaled-models.html
- https://github.com/vrm-c/vrm-specification/blob/master/specification/VRMC_springBone-1.0/README.md

Validation covers original garment indices/weights, separate body/clothes, retained exposed anatomy, three rigged hem trims, root transform covariance and finite/bounded colliding cloth motion under 8/30/60 FPS shake sequences. Windows captures all seven outfits and three movement-preview frames before AI downloads. Re-review on target hardware if adding new poses, bones or costumes.

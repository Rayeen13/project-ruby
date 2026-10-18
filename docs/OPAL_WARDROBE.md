# Opal body and clothing contract

Opal is an 18-year-old female anime maid android. Gem identity metadata is the single source of truth for age, gender and name. Loading old DDNA or importing a backup normalizes Opal's age to 18 while preserving identity UUID, creation date, personality and separate owner memories.

The mannequin and wardrobe are distinct scene entities. Each of the four outfits owns its garment geometry and material and shares the mannequin's humanoid skeleton and bind pose. Clothes do not replace the body or modify its skin weights. Switching outfit toggles the selected wardrobe group.

All artist-authored garment triangles are retained. The apron is a fabric colour region on the continuous garment surface: there are no near-coplanar copied apron triangles and no jagged triangle cutouts for outfit variants. Skirt weights blend toward the pelvis across a band rather than changing abruptly at the waist. The outfit entity follows the same carry, shake, resize and pose transforms as the mannequin. It is a skinned outfit, not a new cloth simulation.

Validation covers topology preservation, isolated weight buffers, normalized influences, transform covariance and finite wave poses. Windows screenshots review all four outfits and wave poses; the native interaction run also exercises actual grab/shake/recovery.

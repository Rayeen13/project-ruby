# Project Ruby

A desktop-companion prototype with five procedural 3D robot bodies, gem colour profiles, cursor tracking and expressive animation. Built with Three.js and browser JavaScript; a native desktop host and conversational AI are future work.

## Run locally

Requires Python 3 and Node.js (for checks). No npm installation is needed for the viewer: Three.js is vendored.

```bash
python3 -m http.server 8080 --directory dist
```

Open http://localhost:8080. Run `npm test` for animation clearance checks.

## Catalog

Classic EMO-style, Cyberpunk 3090, Chibi, Office and Gamer. Profiles: Ruby, Saph, Emme and Amy. Gamer carries a controller in its right hand and has headphone listening screens. Listening is currently a visual state, not live microphone analysis.

## Licence

Project source: GPL-2.0-only. See LICENSE. Vendored Three.js and its example renderers remain under their original MIT licence in dist/vendor/THREE-LICENSE.txt. Original procedural character designs and supplied print exports are distributed under GPL-2.0-only as part of this project. No commercial third-party character meshes are included.

## Development conventions

Default branch: main. Repository: project-ruby. Use Conventional Commits, e.g. `feat(character): add gamer model`, `fix(animation): correct wave clearance`, `docs: explain platform support`. Make focused changes and verify visible behaviour before reporting a visual fix. Append new catalog IDs instead of replacing existing designs.

## Printing and platforms

STL files and notes are in dist/prints. They are static figurines; review supports and slicer settings before printing. docs/PLATFORMS.md distinguishes shared rendering from native host/widget/overlay features, which are not implemented.

## Roadmap and architecture

See [ROADMAP.md](ROADMAP.md) for the milestones from the visual MVP through local conversation, desktop actions, voice, mobile hosts, the companion world and creator studio. The next slice is v0.2: capability contracts, gesture previews, persistent settings and animation transitions. Model selection follows measured performance and verified MIT weight licensing.

See [HAND_RIG.md](HAND_RIG.md) for jointed hands and gestures. Four finger chains and an opposing thumb support open, relaxed, point, fist and grip poses; object pickup physics is future work.

## Build and validation

`npm run build` creates versioned browser assets after source changes. `npm test` checks 1,920 sampled waving poses, head clearance, gesture joints/handedness, eye dimensions and controller attachment. Visual review is still required on real WebGL devices. The software SVG renderer is a compatibility fallback.

`npm run export:print` regenerates static STL figurines. Python dependencies: trimesh, manifold3d, numpy, scipy and scikit-image. Exported files are reloaded and checked for a connected watertight solid with positive volume. They contain no mechanical joints; inspect thin fingers and supports in your slicer.

# Project Ruby

A desktop-companion prototype with five procedural 3D robot bodies, gem colour profiles, cursor tracking and expressive animation. Built with Three.js and browser JavaScript; a first Windows desktop shell is available as a build preview; conversational AI and OS automation are future work.

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

See [ROADMAP.md](ROADMAP.md) for the milestones from the visual MVP through local conversation, desktop actions, voice, mobile hosts, the companion world and creator studio. Capability contracts, gesture previews, persistent settings and animation transitions are implemented. The current slice is the Windows floating companion shell; Model evaluation follows measured performance and verified commercial-use weight licensing without mandatory model royalties.

See [HAND_RIG.md](HAND_RIG.md) for jointed hands and gestures. Four finger chains and an opposing thumb support open, relaxed, point, fist and grip poses; object pickup physics is future work.

## Build and validation

`npm run build` creates versioned browser assets after source changes. `npm test` checks host-injected character contracts, capability-aware gesture routing and 1,920 sampled waving poses, head clearance, gesture joints/handedness, eye dimensions and controller attachment. `npm run check:assets` verifies the built browser module graph. GitHub Actions runs these checks on Windows/Linux with Node 22/24. Visual review is still required on real WebGL devices. The software SVG renderer is a compatibility fallback.

`npm run export:print` regenerates static STL figurines. Python dependencies: trimesh, manifold3d, numpy, scipy and scikit-image. Exported files are reloaded and checked for a connected watertight solid with positive volume. They contain no mechanical joints; inspect thin fingers and supports in your slicer.

## Lab preferences and gesture previews

Select either hand and preview relaxed/open/point/grip/fist poses. Classic disables hand controls; Gamer reserves its right hand for the controller. Wave temporarily overrides the right pose, then the chosen pose resumes.

The lab saves model, gem, expression, hand poses, camera, tracking and animation preferences on the current browser/device. Reset preferences restores defaults; Reset view affects only the camera. Export preferences downloads a versioned JSON snapshot. Storage errors do not prevent using the lab, and corrupt/unsupported saved values fall back to valid defaults. Preferences are not shared chat memory or an account sync service.

## Windows shell preview

See [docs/WINDOWS.md](docs/WINDOWS.md) for the Tauri host, local build instructions and the Windows CI installer artifact. The native viewer embeds the same lab assets. The Windows preview includes a transparent floating window, tray, pointer drag handle, click-through and Ctrl+Alt+Shift+R recovery. OS control and AI are not connected yet. Build validation and physical-device runtime validation are separate checks.

## Touch and model menu

Tap a robot's head/body for a pat or boop, or its hand for a greeting. Right-click the mesh or long-press on touch screens to open the interaction bubble. Menu actions include wave, dance, sleep, wake and stop. Dragging turns the model in the direction of the drag; taps and long-presses are distinct from orbit/pinch gestures. Native Windows CI exercises these actions in the packaged WebView and captures screenshots.

## Offline model gate

See [docs/OFFLINE_MODELS.md](docs/OFFLINE_MODELS.md) for the commercial-use weight/tokenizer audit, Windows CPU benchmark and raw quality probes. Phi-1.5 and Shunya baselines were rejected for basic conversation failures. Official Qwen2.5-0.5B Q4_K_M (491 MB, Apache-2.0) with an explicit Ruby persona is now an English chat integration candidate; Hindi and strict introduction formatting remain limited. No model is bundled or presented as a working Ruby chat provider yet. Use the Offline model evaluation workflow for repeatable measured candidates; November voice remains a required milestone.

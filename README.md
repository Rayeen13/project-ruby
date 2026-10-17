## v0.4.8 — Prismy Studio Voice Library

Browse matching voices in Settings → Voice & language, preview a speaker, set a default per Companion/body/language, or restore automatic personality matching. Download/repair/cancel a shared voice collection from the library. Add volume, clean/gentle robot finish and a cached once-per-launch greeting. Existing downloads, application identifiers and user data are retained.

This adds selection and playback infrastructure around the existing Kokoro/Supertonic collections. It does not ship a newly trained or audition-approved anime VoiceM; full expressive anime acting remains a separate voice/asset evaluation. See [the voice milestone](docs/PRISMY_STUDIO_BLUEPRINT.md).

## Prismy Studio — next product milestone

**Prismy Studio** is the chosen name for the upcoming Studio application in the proposed Companion Labs Ecosystem. Project Ruby remains the current companion prototype. The next milestone targets original anime and gentle robot voice presets, a Voice Library and cached launch greetings. See the [product/voice blueprint](docs/PRISMY_STUDIO_BLUEPRINT.md). These new voice features are planned; v0.4.7 is unchanged.

## v0.4.7 — available AI ports and humanoid gestures

Ruby's managed AI chooses another loopback port when 8081 is occupied, and native chat/LangM follow the chosen endpoint automatically. Other local processes remain running. Opal's wave now turns the open palm outward, with forearm twist, wrist deviation and corrected finger flexion. The shared pose sampler can produce game-playable Three.js clips; see [humanoid gestures](docs/HUMANOID_GESTURES.md).

## Offline language choices · v0.4.3

## Companion Lab v0.4.6

A focused Lab with searchable Companions, separate Style/Motion/App controls, text-file chat drafts and voice-reactive Opal mouth animation. Floating mode stays minimal. See [Lab UX and feature status](docs/LAB_UX.md) for limits and the next Studio phase.

## v0.4.5 — Opal wardrobe and integrated dizzy eyes

Opal now uses an actual skinned VRoid anime base (CC0), with humanoid bones, articulated hands, textured face/hair and facial morphs. The four adapted maid outfits are: Classic lace, Rose café, Midnight satin and Studio professional. Select Opal’s body, then open **Opal’s wardrobe** in the Studio controls. Pick a look, assign looks to morning/afternoon/evening/night, or enable the work override. The schedule uses the device’s local clock; it does not infer your job or calendar. Preferences and Companion backups include wardrobe choices. Clothing changes preserve DDNA identity and memory.

Dizzy spirals use the existing face texture and each body’s eye positions. Transparent faces and Opal’s anime eyes retain their background instead of acquiring a black rectangular screen. The original opaque EMO display remains opaque. The old procedural Opal figurine is retired; a print-ready static conversion of the new avatar is pending.


## v0.4.4 — dialogue grounding and portable character continuity

Ruby now has a persistent DDNA seed (identity root, canonical name/gender/age, original/active personality and values) independent of the LLM, body and VoiceM. Character-specific context prevents another Companion or older malformed replies from teaching its identity. Persona changes cancel active replies. This is a small JSON foundation aligned with ADICE; it is not Kurumi's canonical 1 MiB DDNA binary, a neural genome, sentience or learned emotional development.

The separate portable brain stores approved owner notes and recent dialogue. Settings → Companion → Export Companion backup exports identity roots, notes, recent dialogue and body/personality preferences. Import previews the file and merges notes/history; a pre-import recovery checkpoint can be exported. Legacy owner-note exports are accepted. Existing data is retained. The prototype supports 2,048 owner notes, 200 recent messages and retrieves up to four relevant notes plus six recent pairs for inference. It does not remember every conversation forever or silently turn web/model claims into permanent facts.

The recommended CPU pack upgrades to official Qwen2.5-1.5B-Instruct Q3_K_M: 924,455,968 bytes of weights, approximately 944 MB with the existing pinned CPU runtime. Two threads, one server slot and zero GPU layers remain the defaults. Download this new pack explicitly in Settings → LLM; existing 0.5B files and owner data are not deleted. Optional VoiceM packs add separate download/disk requirements. The installer remains small.

A real local regression script (`node scripts/dialogue-quality.mjs http://127.0.0.1:8081 report.json`) covers the supplied conversation, exact corrections/repeats, topic engagement and character switches. Exact quoted repetition is a deterministic text operation, not a test of model knowledge. A small authored input glossary normalizes two beginner romanized Japanese questions to their English meaning; it is not general Japanese fluency. Compact-model phrasing and language quality remain limited; larger existing local models can still be selected.

Internet mode now skips greetings/identity/language-practice requests, adds sourced information to factual conversations and continues honestly offline when an automatic lookup fails. Explicit search failures remain visible. Search is opt-in or explicitly requested; notes/history are not sent as search queries. All seven gem buttons share the registered-colour glow.



**LangM** is the local translation model, separate from the LLM (conversation) and VoiceM (speech). Settings → Voice & language lets you choose text and spoken languages independently, including English text with Japanese voice-over. LangM translates only each spoken phrase and leaves displayed chat untouched. It reuses the selected local LLM by default, with no extra model download or cloud API; advanced settings can select another model in a local engine. A multilingual model is required for useful translation. The compact default may translate poorly or fail language validation; it is not a professional translation guarantee.

English/Chinese speech uses the shared Kokoro pack. The original character collection uses Supertonic 3 for Japanese or English (about 154 MB including its pinned Windows CPU runtime). Choose a language/collection, accept its model terms where required, download once and preview. Japanese presets are original style presets, not copies of anime characters or actors. Voice previews use native-language sample lines without needing LangM; custom lines and cross-language replies use LangM when necessary. Voice choices are saved per Companion, language and pack.

Supertonic 3 weights and preset styles use OpenRAIL-M, which permits commercial use subject to its distribution and use conditions. The app shows those terms before download and retains the full model licence with installed files. The runtime is Sherpa-ONNX v1.13.8; component notices remain separate. Sources: [publisher model card](https://huggingface.co/Supertone/supertonic-3), [model terms](https://huggingface.co/Supertone/supertonic-3/blob/main/LICENSE), [pinned runtime](https://github.com/k2-fsa/sherpa-onnx/tree/v1.13.8). Chinese Kokoro support follows [Sherpa documentation](https://k2-fsa.github.io/sherpa/onnx/tts/all/Chinese-English/kokoro-multi-lang-v1_0.html).

Everything in this flow runs locally after explicit component downloads. Speech work is bounded to two CPU threads and one phrase of prefetch. Cross-language speech adds translation latency; matching languages skips LangM. Hardware performance and subjective voice quality still need device testing. Optional internet search remains explicitly opt-in.

## Focused fixes · v0.4.2

Opal is now an original maid android with full swept hair, a frilled headband, apron, ceramic face seams and temple hardware. Speech starts with a short opening phrase, prepares only one phrase ahead and plays every phrase in order from sample zero. Stop waits for native cancellation before another request starts; long replies are no longer silently limited to 1,500 spoken characters. First-audio latency still depends on the CPU and Kokoro cold start.

Personality now includes twelve selectable “-dere” archetypes alongside the original presets. Default speaker and pace follow the selected personality; an explicit VoiceM override is preserved. VoiceM preview accepts supported square-bracket or parenthesis delivery cues. Kokoro uses approximate interjections, pace and visual expressions; authentic emotional acting, laughter and groans require a future expressive VoiceM provider. Directions are not passed to Kokoro as spoken dialogue, and the compact LLM is not forced to generate tags.

## Setup and voice refresh · v0.4.1

Right-click the Companion to reveal shimmering Talk and Settings controls. The floating desktop stays clear until you ask for an action. Keyboard users can focus the Companion and press Shift+F10.

Settings → Setup offers Recommended (offline LLM + Kokoro VoiceM), Custom (choose your engine, loaded model and matched voice), Pro (your stronger existing local LLM + Kokoro), and Lite (text-only). Pro is a configuration preset, not a paid tier. Downloads are explicit, cancellable and checksum verified; verified complete files are reused. Recommended downloads about 827 MB on Windows. Allow approximately 1.5 GB free disk space for downloaded archives and extracted files; optional LLMs can need considerably more. The installer itself remains small.

Kokoro replaces the VCTK default. Heart, Bella, Sarah and Emma are female choices; Michael, Fenrir, Puck and George are male choices. Defaults and overrides follow the selected Companion; cross-gender voice requests are rejected by the native host. All eight voices share one approximately 316 MB pack. English and Chinese synthesis share this pack. Preview lets you audition the voice; quality and speed depend on hardware and text. No pitch-shifted device voice is silently substituted on the website.

The gem cast adds Jasper (male, gaming), Jet (male, office) and Opal (female, dry wit). Opal has an original procedural toon android body; the five accepted robot bodies remain unchanged. Identity, body, personality, LLM and VoiceM remain separate modules. Existing owner memories and conversations are preserved. Older malformed replies are excluded from LLM context.

Chat now uses a shorter natural-language identity prompt without bracketed mood instructions. Expressions still use portable host state and can parse legacy expression tags. The compact 0.5B LLM is experimental and can still produce weak answers; connect a stronger local LLM in Custom/Pro when needed.

Voice sources: [Kokoro publisher](https://huggingface.co/hexgrad/Kokoro-82M), [published voice metadata](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md), [Sherpa-ONNX](https://github.com/k2-fsa/sherpa-onnx/tree/v1.12.15). Kokoro weights and Sherpa runtime use Apache-2.0; eSpeak NG and other runtime components retain their own licences and notices. Downloaded voice components run as a separate process. No Nika character assets or dialogue are used.

# Project Ruby

A desktop-companion prototype with five procedural 3D robot bodies and a CC0-derived skinned VRoid Opal avatar, gem colour profiles, cursor tracking and expressive animation. Built with Three.js and browser JavaScript; a first Windows desktop shell is available as a build preview; Windows v0.4 downloads and runs local LLM and VoiceM packs, with optional existing-server connections, sourced internet answers and independent Companion/chat/Settings views. Microphone input and OS automation are future work.

## Run locally

Requires Python 3 and Node.js (for checks). No npm installation is needed for the viewer: Three.js is vendored.

```bash
python3 -m http.server 8080 --directory dist
```

Open http://localhost:8080. Run `npm test` for animation clearance checks.

## Companion Studio · v0.4

**Companion** means the 3D character; **LLM** means the language model; **VoiceM** means the speech model; **LangM** means the local translation model. These are independent modules. Changing an LLM does not change a Companion's identity or owner notes.

Studio uses a native Windows title bar and an orbital vector interface. The desktop Companion remains transparent and frameless. Conversation and Settings reserve separate space beside the visible Companion. LLM downloads, engine/model choices, content style, memory and VoiceM live in Settings. The mesh interaction menu has a top-right ×. Studio has gravity and a static support collider for each rigid Companion body, plus a drop test. Floating wheel zoom selects Small, Medium, Large or Extra large; the host uses body-specific bounds.

Ruby, Emme, Amy and Opal are female characters; Saph, Jasper and Jet are male. Adult profiles have fictional ages; Chibi uses age 8 and a family-friendly prompt. Personality and validated expression tags drive visual mood independently of the selected LLM. Feelings are simulated character state, not consciousness. Local owner memory records explicit “My name is…”, “Remember…” and “I feel…” statements. Notes can be disabled, reviewed, individually deleted, cleared or exported.

Online mode uses bounded search excerpts and source links (Windows: Bing RSS; browser: Wikipedia API, subject to network/CORS availability). Explicit search commands support follow-up queries. Queries go to the search service; stored owner notes and full history do not. Google AI Mode opens the question in your browser; Ruby does not scrape or import its answers. Search failures are shown explicitly. A compact LLM can still misunderstand evidence; check the sources.

VoiceM Settings offers a one-time verified ~316 MB Kokoro/Sherpa pack, matched female/male previews, per-Companion choices, personality pace, optional spoken replies and Stop. It runs locally on CPU as a separate process. Matched speech requires the Windows pack; the website does not substitute an unverified device voice. No microphone input or voice cloning is included. Content modes choose family-friendly or candid tone; they cannot disable an LLM's own restrictions.

See [docs/COMPANION_STUDIO.md](docs/COMPANION_STUDIO.md) for architecture, voice attribution, references and validation limits.

## Catalog

Bodies: Classic EMO-style, Cyberpunk 3090, Chibi, Office, Gamer and Opal. Gem profiles: Ruby, Saph, Emme, Amy, Jasper, Jet and Opal. Gamer carries a controller in its right hand and has headphone listening screens. Listening is currently a visual state, not live microphone analysis.

## Licence

Project source: GPL-2.0-only. See LICENSE. Vendored Three.js and its example renderers remain under their original MIT licence in dist/vendor/THREE-LICENSE.txt. Original procedural character designs and supplied print exports are distributed under GPL-2.0-only as part of this project. The Opal base is an adapted CC0 VRoid beta sample, separate from the GPL source licence. Its provenance and the MIT VRM runtime notice are documented in docs/OPAL_ASSET.md.

## Development conventions

Default branch: main. Repository: project-ruby. Use Conventional Commits, e.g. `feat(character): add gamer model`, `fix(animation): correct wave clearance`, `docs: explain platform support`. Make focused changes and verify visible behaviour before reporting a visual fix. Append new catalog IDs instead of replacing existing designs.

## Printing and platforms

STL files and notes are in dist/prints. They are static figurines; review supports and slicer settings before printing. docs/PLATFORMS.md distinguishes shared rendering, the implemented Windows host and planned mobile widget/overlay hosts.

## Roadmap and architecture

See [ROADMAP.md](ROADMAP.md) for the milestones from the visual MVP through local conversation, desktop actions, voice, mobile hosts, the companion world and creator studio. Capability contracts, gesture previews, persistent settings and animation transitions are implemented. The current slice adds Companion Studio, shared character state, internet evidence and optional VoiceM; Model evaluation follows measured performance and verified commercial-use weight licensing without mandatory model royalties.

See [HAND_RIG.md](HAND_RIG.md) for jointed hands and gestures. Four finger chains and an opposing thumb support open, relaxed, point, fist and grip poses; object pickup physics is future work.

## Build and validation

Release validation for v0.4.1: [Windows native UI and restart checks](https://github.com/Rayeen13/project-ruby/actions/runs/38720245485) and [Node 22/24 checks on Windows/Linux](https://github.com/Rayeen13/project-ruby/actions/runs/38720245341) passed on `main`. Native checks cover downloaded LLM/VoiceM, real introductions, sourced answers, audio preview/Stop, setup reuse, carry/shake, pin/peek, global gaze and persistence. Speech samples, screenshots and reports accompany the Windows artifact. These checks do not replace listening and visual acceptance on the target laptop.

Both the public website and Windows app now use the rendering budget introduced in v0.4.1: a 30 FPS cap, lower software-renderer limits, and reduced rendering during native synthesis to leave CPU capacity for VoiceM.

`npm run build` creates versioned browser assets after source changes. `npm test` checks host-injected character contracts, capability-aware gesture routing and 2,400 sampled waving poses, head clearance, gesture joints/handedness, eye dimensions and controller attachment. `npm run check:assets` verifies the built browser module graph. GitHub Actions runs these checks on Windows/Linux with Node 22/24. Visual review is still required on real WebGL devices. The software SVG renderer is a compatibility fallback.

`npm run export:print` regenerates static STL figurines. Python dependencies: trimesh, manifold3d, numpy, scipy and scikit-image. Exported files are reloaded and checked for a connected watertight solid with positive volume. They contain no mechanical joints; inspect thin fingers and supports in your slicer.

## Lab preferences and gesture previews

Select either hand and preview relaxed/open/point/grip/fist poses. Classic disables hand controls; Gamer reserves its right hand for the controller. Wave temporarily overrides the right pose, then the chosen pose resumes.

The lab saves model, gem, expression, hand poses, camera, tracking and animation preferences on the current browser/device. Reset preferences restores defaults; Reset view affects only the camera. Export preferences downloads a versioned JSON snapshot. Storage errors do not prevent using the lab, and corrupt/unsupported saved values fall back to valid defaults. Preferences are not shared chat memory or an account sync service.

## Windows shell preview

See [docs/WINDOWS.md](docs/WINDOWS.md) for the Tauri host, local build instructions and the Windows CI installer artifact. The native viewer embeds the same lab assets. The Windows preview includes a transparent floating window, tray, hold/drag carrying, click-through and Ctrl+Alt+Shift+R recovery. Managed local AI, sourced internet answers and VoiceM speech are connected. Mouse/keyboard automation, screen vision and microphone input remain planned. Build validation and physical-device runtime validation are separate checks.

## Touch and model menu

Tap a robot's head/body for a pat or boop, or its hand for a greeting. Right-click the mesh or long-press on touch screens to open the interaction bubble. Menu actions include wave, dance, sleep, wake and stop. Dragging turns the model in the direction of the drag; taps and long-presses are distinct from orbit/pinch gestures. Native Windows CI exercises these actions in the packaged WebView and captures screenshots.

## Offline model gate

See [docs/OFFLINE_MODELS.md](docs/OFFLINE_MODELS.md) for the commercial-use weight/tokenizer audit, Windows CPU benchmark and raw quality probes. Phi-1.5 and Shunya baselines were rejected for basic conversation failures. Official Qwen2.5-0.5B Q4_K_M (491 MB weights, Apache-2.0) is the managed Windows chat model, downloaded with its runtime through Settings. It is not embedded in the installer. Windows CI validates real conversation, natural self-introduction, sourced answers and Stop/Retry. General conversation quality and Hindi remain limited. Use the Offline model evaluation workflow to compare candidates; November two-way voice remains required.

### Companion collection and carry reactions

Browse the six bodies by category, choose gem colour and a saved personality for each body, then hold/drag the mesh to carry it. A deliberate shake produces spiral eyes and orbiting stars, with automatic recovery. Floating Windows mode is frameless and toolbar-free; right-click the companion or use its tray for desktop controls. Background or Alt-drag still orbits the lab view. See [the interaction guide](docs/COMPANION_INTERACTIONS.md). Typed chat and downloadable VoiceM speech are connected through independent provider modules.

## Local conversation

Windows v0.4.1: open **Conversation** from the tray or Studio, or right-click the Companion and choose **Talk**. For automatic setup, choose **Settings → Setup → Recommended**. For the LLM alone, choose **Settings → LLM → Download AI** for the one-time ~511 MB managed pack. Ruby verifies and starts the model; Stop / unload AI releases its process. Later starts work with the verified local cache. No Python or terminal is needed. Chat supports streaming, Stop/Retry, saved history and gem/body personalities.

The AI engine selector also connects to existing local Ollama, LM Studio, Colibri, vLLM and MoE-Infinity OpenAI-compatible servers. These optional connections do not install their frameworks or large models. The website remains a browser demo connecting to an already running local server, subject to browser local-network restrictions.

See [docs/AI_ENGINES.md](docs/AI_ENGINES.md) for the runtime review, precise integration boundaries and setup. English, Japanese and Chinese VoiceM speech, local LangM and sourced internet search are implemented. Microphone input, full-duplex interruption and PC task execution remain future work.

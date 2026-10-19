## v0.5.2 · Voice acceptance on the owner’s device

- Add a shared VoiceCheck module with injected playback, fixed language samples, explicit start/stop, first/repeat timings, actual anime worker device and a privacy-limited JSON export.
- Add Anime/Lighter Japanese shortcuts, preserving text language, gender filtering, voice defaults and explicit pack consent.
- Exercise both real local samples and cancellation in Windows CI. Physical RTX 2050 performance, thermal impact and listening acceptance remain unverified until a check is run on that hardware.
- Next: use target-device timings and listening feedback to tune defaults. Continue compact-LLM conversation evaluation; November microphone/ASR/interrupt work remains required.

## v0.5.1 · Companion reliability and expressive voice

- Separate Opal mannequin/wardrobe entities, full garment topology, smooth skirt binding and clean apron colour regions across four outfits.
- Canonical Opal age 18, including saved DDNA normalization and imports. Preserve UUIDs, creation dates, personalities and owner memories.
- Explicit Prismy Studio host awareness, more recent paired context and regression coverage using real local dialogue.
- Optional Japanese Irodori Small-MF VoiceM: original adult voice design, gender filtering, personality/emotion controls, reference consistency, GPU preference and CPU fallback, shared compute scheduling, warm reuse/cancellation and 45-second idle unload. English text/Japanese speech remains supported through local LangM.
- Acceptance: shared/native tests, actual Windows visual/interaction checks, actual WAV auditions and native VoiceM lifecycle checks. Physical RTX 2050 latency/VRAM/thermals and human-rated acting quality still require target-device/user trials. English/Chinese expressive VoiceM engines remain future work.

## Current follow-up · Setup and voice quality

- v0.4.9: implement a simpler workspace using four supplied UI concepts: beginner setup/customize routes, persistent three-theme appearance, readable navigation and local-only appearance state. Real anime voice assets, mesh editing, capture, cloud and marketplace remain separate milestones; prototype telemetry is not a shipped capability.

- v0.4.5: integrated dizzy-eye rendering for every body; real skinned VRoid Opal base (CC0), four adapted maid outfits, manual selection, configurable local-time periods and work override. Outfit choice is presentation state, separate from DDNA. Native image review and target-device visual acceptance remain distinct from functional tests.

- v0.4.4: DDNA JSON seed and separate portable brain; stable identity roots across LLM/body changes; original/active personality; versioned export/import and recovery; relevant owner-note retrieval; grounded dialogue and sourced conversational lookup. Canonical Kurumi 1 MiB binary DDNA, cryptographic lineage, neural genome and expansive episodic retrieval remain later milestones.


- v0.4.3: independent text/voice languages, local LangM reuse or selected local model, shared English/Chinese Kokoro and optional original Japanese/English Supertonic 3 collection. Downloads are pinned and verified; model terms travel with the pack. Language correctness, voice audition and first-audio timing remain acceptance gates.
- Terminology: Companion = 3D character; LLM = conversation model; VoiceM = speech model; LangM = translation model. Keep inference local by default and avoid additional LangM downloads when the selected LLM can translate.

- v0.4.2 focus: Opal hair/head correction, ordered short-phrase speech, sample-zero playback and cancellation isolation. Target-laptop audition remains required.

- v0.4.1: natural identity prompts, hidden-until-requested floating controls, Recommended/Custom/Pro/Lite setup, matched Kokoro VoiceM choices, Jasper and Jet male identities, original sarcastic Opal android.
- v0.4.1 release gate passed on Windows: download/cancel/cache reuse, real-model self-introduction, female/male synthesis and actual preview/Stop, matching voice filters, platform collision, context-menu controls, native carrying, global gaze, pin/peek and restart persistence. Shared Node 22/24 checks pass on Windows/Linux. The public website now uses the same rendering budget as the tested Windows build.
- Next quality gate: audition voices on the owner’s RTX 2050 laptop, compare stronger compact LLMs on natural conversation, measure first-audio latency, and refine Opal’s art with real screenshots. Functional WAV generation alone is not a voice-quality approval.
- November: microphone input, ASR, interruption and multilingual VoiceM remain required. Setup must keep size, hardware and individual model licences visible. Companion = character mesh; LLM = intelligence; VoiceM = voice model.

# Project Ruby roadmap

## Goal and current milestone

Project Ruby is an ADICE (Artificial Digital Intelligent Companion Entity) companion product. Its first release combines an expressive robot, conversation, and explicitly enabled desktop actions. Project Kurumi continues as a separate character/research project; shared components can be extracted when both projects need them.

Terminology: **Companion = 3D mesh character**, **LLM = intelligence model**, **VoiceM = voice synthesis model**, **LangM = local translation model**. Keep these terms in UI, plugin contracts and documentation.

The current shipped foundation is **Prismy Studio v0.5.x**: five robot shells plus the rigged Opal anime maid, independent gem identities, portable DDNA/owner memory, local text chat, sourced internet lookup and optional local VoiceM collections. Studio has a custom window frame and F11 fullscreen; floating Companion remains frameless, with pin/peek, global gaze and stable size presets. Opal is 18. A local profile, theme Prisms and free theme catalogue are available; cloud accounts, paid checkout and payouts are not connected. Google AI Mode remains a browser shortcut. Microphone input, screen vision, approved desktop actions and native mobile hosts are still open. Windows CI exercises actual WebView/process behavior; physical-device acceptance remains required.

User-requested speech output was brought forward from November. **November still requires two-way voice conversation:** microphone capture, ASR, interruption, latency/hardware tuning, multilingual packs and accessible listening feedback. Do not call text-to-speech alone completion of that milestone.

Version labels in the original long-term table below are planning labels, not claims that a shipped v0.4 already has OS control. Current shipped scope is the milestone above.

## October delivery window: 15 days, 3 hours/day

Budget: **45 hours**. This is a target for a narrow Windows desktop assistant MVP, not completion of the entire long-term roadmap. Timebox work to three hours each day. Keep unfinished work on feature branches. Focus October on the desktop foundation. Cut stretch features before cutting release validation; voice is a required November milestone.

| Day | Three-hour work block | Expected checkpoint |
| --- | --- | --- |
| 1 | GitHub baseline, CI checks and small character/host contracts | Reproducible source and checks; accepted character designs frozen. |
| 2 | Settings persistence, gesture controls and smooth wave transitions | Model/profile/gesture settings survive reload. |
| 3 | Windows Tauri host and shared renderer connection | Character runs in a native application window. |
| 4 | Floating window, tray, positioning, click-through and stop shortcut | Usable desktop companion shell. |
| 5 | Commercial-use chat/speech weight and tokenizer licence audit and CPU/model benchmarks | Select a model only if licence, quality and memory gates pass; record blockers otherwise. |
| 6 | Local model adapter and streamed text chat | First local conversation without fake responses. |
| 7 | Cancel/unload, chat history, settings and offline restart | Local conversation recovers after restart/network loss. |
| 8 | Optional internet-search provider, bounded evidence and source links | Online answers work with the selected/configured search service; failures remain explicit. |
| 9 | Native launch-app and user-targeted typing actions | Deterministic typed commands execute in a bounded scope. |
| 10 | Pointer move/click and approved keyboard shortcuts | Scoped input actions with cancellation and visible results. |
| 11 | Structured command routing, permission gates and emergency-stop checks | Model output cannot directly invoke unrestricted OS actions. |
| 12 | Integrate typed chat, gesture feedback and approved actions | One coherent typed-command user flow; voice interfaces remain prepared for November. |
| 13 | Hardware/WebGL, performance, offline/online and action-failure tests | Written test results on actual Windows hardware; blockers identified. |
| 14 | Fix blockers, build installer/default pack, verify licences and size | Application release candidate within 1 GB; default and optional pack sizes measured separately. |
| 15 | Final acceptance, release notes, tested PR merge to main and version tag | Stable release only if acceptance checks pass; otherwise keep a clearly labelled beta and documented blockers. |

Scope priority: **P0** native companion, local text conversation, cancel/stop, deterministic approved OS actions and saved settings. **P1** internet retrieval with sources. **Stretch** extra languages, screen perception and additional platforms. Model approval and working local runtime are gates; a sub-100 MB pack is an aspiration, not a shipping guarantee. Download size, latency and RAM must be measured.

Windows comes first in this 45-hour window. Keep cross-platform contracts, but Linux/macOS validation, mobile widgets/overlays, physical pickup, creator training and marketplace payments belong to later milestones. Do not advertise these as completed by day 15.

## November: voice is mandatory

After the October desktop foundation, allocate the next 15-day / 45-hour window to voice. Voice input and spoken replies are required, not optional polish.

| Days | Work | Exit condition |
| --- | --- | --- |
| 1–3 | Speech-provider contracts, licence audit and CPU/model benchmarks | Choose redistributable speech recognition/output providers; record offline and size limitations. |
| 4–6 | Microphone capture, push-to-talk, mute and real listening state | Capture starts/stops reliably; headphone indicators show actual capture. |
| 7–9 | Speech recognition integrated with chat and approved command routing | Spoken commands enter the same scoped command path as typed input. |
| 10–12 | Speech output, cancellation, emotion/gesture timing and interruption handling | Replies are spoken; stop/mute interrupt promptly; listening and speaking do not feed back into each other. |
| 13–15 | Real-device tests, error recovery, packaging, release PR and merge/tag | Tested voice release on main; known limitations documented. |

Typed input remains available. Additional languages, continuous wake-word listening, screen perception and the open world are stretch/later work. Actual speech weight/voice licensing must pass before bundling; the application's GPL-2.0-only source licence is unchanged.

## Milestones and exit criteria

| Milestone | Deliverable | Done when |
| --- | --- | --- |
| v0.1 — visual MVP | Current character catalog and rig | Freeze the accepted designs; preserve all catalog IDs; check physical-device WebGL, mobile rendering and animation transitions. |
| v0.2 — companion foundation | Character capabilities, gesture preview, persistent settings and semantic animation commands | Profiles/expressions survive reload; open/point/grip poses can be reviewed; hosts can switch characters without special-case UI code; classic gracefully reports no hands. |
| v0.3 — conversation beta | Text chat, model-provider selector, downloadable commercially licensed model packs and optional internet search | A verified commercial-use model passes the benchmark; cancellation and history work; answers show whether search was used and link sources; no network request is needed for local chat after download. |
| v0.4 — desktop assistant MVP | Windows floating companion, tray, click-through mode and bounded mouse/keyboard actions | The assistant follows typed commands such as opening an allowed app or typing into a user-selected field; an emergency stop cancels actions; permissions, action results and failures are visible; application installer meets the 1 GB target; model pack sizes and RAM needs are stated separately. |
| v0.5 — voice and emotion | Microphone, speech recognition, speech output and semantic mood/gesture mapping | Listening indicators reflect real capture; mute/cancel work; typing remains available; emotion does not interrupt active commands; every bundled voice/model has recorded redistribution terms. |
| v0.6 — platform expansion | Linux/macOS desktop hosts, mobile app and platform-specific widget/overlay hosts | Each supported host has real-device tests and a capability matrix; unsupported OS actions are disabled; mobile widgets use suitable native state snapshots rather than promising arbitrary live overlays. |
| v0.7 — companion world | Small interactive space, reach animation, prop grip/release and persistence | Objects have colliders and grip anchors; fingers follow contacts; objects attach/release predictably; saving restores the scene; this is distinct from OS automation. |
| v0.8 — creator studio | Import/preview characters, rigs, skins, personalities and task-specific configurations | Versioned packages declare capabilities and ownership/licence; packages validate before loading; user data stays portable; training is a separate opt-in workflow. |
| v1.x — marketplace | Free/premium packages, purchases and creator payouts | The free tier remains useful; restore/refund/update flows exist; the revised 2% buyer-side fee, creator listing-price payout and 80% free/20% premium split have explicit feature and settlement definitions (superseding the earlier 5% share). |

Milestones are dependency-ordered, not calendar promises. Marketplace and a large world are outside the desktop assistant MVP.

## Architecture and SOLID boundaries

Keep the existing character renderer and rig behind a `CharacterAdapter`: model identity, capabilities, profile, expression, gesture and animation update. New bodies append registry entries; skins and personalities are separate assets/configurations. A character model selector and a language-model selector are separate controls.

Use TypeScript for new shared application contracts and orchestration, retain working Three.js character modules, and use a Rust/Tauri host for desktop window and OS adapters. Avoid rewriting accepted character geometry merely to change application architecture.

Define small replaceable interfaces:

- `ModelProvider`: load/unload, stream text, cancel, report model metadata and resource use.
- `SearchProvider`: query, retrieve bounded evidence, return source links; remote text cannot directly issue OS commands.
- `AutomationHost`: declared actions, user-approved scope, cancellation and action results. The browser host does not expose desktop input control.
- `StorageAdapter`: settings, chat/session export, companion state and optional world state.
- `CharacterAdapter`: rendering/animation only; no embedded AI, microphone or OS calls.

The orchestrator depends on these contracts. Hosts supply concrete adapters. Capability declarations let armless bodies, browser-only hosts and mobile widgets omit unsupported features. Compose optional behaviours instead of adding one large character class with platform branches.

## Offline AI decision gate

Commercial-use and royalty requirements apply to the chosen model weights, not merely its inference library or a conversion script. Record the exact upstream model, weight revision, tokenizer, licence and redistribution conditions before selecting or shipping a pack. The project source remains GPL-2.0-only as requested; preserve dependency notices.

Aim for a compact default pack, with approximately 100 MB as a preferred benchmark tier rather than a promise of useful conversation on every device. Keep the desktop application within 1 GB; prefer compact default weights, and show separate sizes for default and optional packs. Model file size alone does not determine speed or runtime RAM.

Evaluate CPU inference first and available GPU acceleration second. Browser ONNX/WASM or WebGPU and native inference are candidate adapters, chosen after verifying model compatibility. Use a small local command/intent layer when a tiny conversational model is insufficient. Internet search supplements answers but does not substitute for a capable conversation model; a remote inference option must be explicit.

Measure cold load, first-token latency, tokens/second, peak RAM/VRAM, answer quality, language support, cancellation and offline recovery. Test a modest CPU/iGPU laptop and the user's Ryzen 7/RTX 2050 machine, then actual Android/browser targets. Publish measurements and hardware specs instead of claiming universal speed.

## Desktop action scope

Start with deterministic typed commands and a short action vocabulary: launch an allowed app, move/click, type, and approved shortcuts. Keep a visible stop control and global emergency shortcut. Record action intent/result without logging secrets. Treat downloaded pages and search results as untrusted content. Expand to screen understanding and multistep actions only after cancellation and scoped permissions work.

## Hands, animation and printing

The current visual hand has four finger chains and an opposing thumb. `HAND_RIG.md` documents the gesture interface. Later world interactions need reach/IK, colliders, grip targets, contact constraints and attachment/release logic; the existing visual grip is not physical object pickup.

Keep static figurine export separate from articulated printable hardware. Existing STLs are closed static solids with mesh validation; slicer review, thin details, supports and physical test prints remain necessary. Printable hinges, tolerances and assembly are a separate hardware milestone.

## Next implementation slice: v0.2

1. Freeze v0.1 source and add repeatable CI checks.
2. Add explicit character/host capability contracts without rebuilding meshes.
3. Expose open, relaxed, point, fist and grip previews in the lab.
4. Persist character, gem, expression, camera and display preferences with reset/export.
5. Add semantic animation events and smooth greeting start/end transitions.
6. Test WebGL on desktop and mobile and record actual rendering/performance limits.

Model licensing/quality evaluation has started for v0.3: the checksum-pinned Phi-1.5 baseline and smaller instruction-tuned Shunya-0.5B Windows CPU experiments both ran successfully but failed basic conversation quality. Qwen2.5-0.5B Q4_K_M with an explicit Ruby system prompt is now an English chat integration candidate under the broadened commercial-use licence policy. No production default is approved. See docs/OFFLINE_MODELS.md for the measured results and remaining gates. Kurumi work continues independently.

## Repository practices

Public repository: `Rayeen13/project-ruby`. Default branch: `main`. Stable releases are merged into main through reviewed/tested PRs, then tagged. Use release/vX.Y.Z for final integration where needed. Focused feature branches and Conventional Commits (`feat`, `fix`, `docs`, `test`, `refactor`, `chore`). Review source and licences before release; do not commit credentials, private chats or installed model weights. Model downloads belong in declared packs rather than Git history.

## Primary technical references

- Tauri capabilities and platform boundaries: https://tauri.app/security/capabilities/
- Tauri platform-specific capabilities: https://v2.tauri.app/learn/security/capabilities-for-windows-and-platforms/
- ONNX Runtime browser inference: https://onnxruntime.ai/docs/tutorials/web/
- ONNX Runtime Web execution providers/browser support: https://onnxruntime.ai/docs/get-started/with-javascript/web.html

## Optional model packs — 13 October decision

Keep Ruby's application package under 1 GB. Riyan approved optional larger model downloads outside that package; under-1 GB models remain preferred when useful. Expose pack size, RAM needs and licences before an explicit user-selected install. Model weights must allow commercial use and selling Ruby without mandatory model royalties; MIT is no longer required. Colibri is an optional existing-server connection preset (not installed or benchmarked by Ruby); Soup remains a future training/studio evaluation. Neither is a model. See `docs/OFFLINE_MODELS.md` for the audit, GPT-family options and rejected candidates.

On 13 October Riyan broadened model eligibility from MIT-only to commercially usable licences with no mandatory model royalty. MIT and Apache-2.0 are the first reviewed licence families for experiments; other licences require their exact terms to be reviewed. Keep licence/copyright notices and any required attribution. Ruby source remains GPL-2.0-only.

## Companion Lab UX · v0.4.6

Ship the focused Lab, searchable collection, review-before-send text files and audio-reactive mouth animation. Follow with the Studio creator. See [feature status and next stages](docs/LAB_UX.md); screen capture, image/document parsing, microphone recognition and timed visemes remain separate work.

## v0.4.7 stability pass

- Managed AI port allocation and native chat/LangM endpoint routing; preserve unrelated servers.
- Opal outward-palm wave, mirrored hand/finger flexion, VRM0/1 normalized pose adapter and reusable Three.js clips.
- Real Windows acceptance with a non-HTTP listener occupying 8081, plus wave captures and quaternion/clearance/mixer tests.

## Prismy Studio — next voice milestone

Studio product name: **Prismy Studio**, in the proposed Companion Labs Ecosystem. Next work: audition original anime and gentle robot voices, capability-based personality acting, a downloadable Voice Library, persistent matched defaults and a cached once-per-launch greeting. See [the product and voice blueprint](docs/PRISMY_STUDIO_BLUEPRINT.md) for acceptance criteria, revised 2% buyer fee and honest shipping/filing boundaries. This planning pass changes no app runtime or Windows build.

## v0.4.8 — Voice Library delivery

- Actual matching speaker cards, search, shared collection download/cancel/repair, previews and saved per-body defaults.
- Personality-matched Supertonic speaker selection; legacy selections migrate without deleting settings.
- Volume, optional gentle digital doubling for robot bodies and clean humanoid playback.
- Short local greeting cache (8 entries, 1.5 MB per item), once-per-launch greeting after setup, input/mute/Stop cancellation, no LLM dependency.
- Outstanding: licensed original anime assets, listening/acting quality acceptance, model comparison and target-laptop benchmarks. Existing voices are not relabeled as proven anime acting.

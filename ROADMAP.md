# Project Ruby roadmap

## Goal and current milestone

Project Ruby is an ADICE (Artificial Digital Intelligent Companion Entity) companion product. Its first release combines an expressive robot, conversation, and explicitly enabled desktop actions. Project Kurumi continues as a separate character/research project; shared components can be extracted when both projects need them.

The current milestone is a **visual MVP**, not yet a functioning AI assistant. Five character bodies, four gem profiles, expressions, gaze tracking, orbit/touch controls, dance, wave, jointed hands and static STL exports are implemented. The public browser demo is available. Conversation, microphone input, internet answers, desktop input control, native widgets and world physics are not implemented. Windows native lab and floating/tray/click-through shell builds are implemented; physical-device acceptance remains open.

## October delivery window: 15 days, 3 hours/day

Budget: **45 hours**. This is a target for a narrow Windows desktop assistant MVP, not completion of the entire long-term roadmap. Timebox work to three hours each day. Keep unfinished work on feature branches. Focus October on the desktop foundation. Cut stretch features before cutting release validation; voice is a required November milestone.

| Day | Three-hour work block | Expected checkpoint |
| --- | --- | --- |
| 1 | GitHub baseline, CI checks and small character/host contracts | Reproducible source and checks; accepted character designs frozen. |
| 2 | Settings persistence, gesture controls and smooth wave transitions | Model/profile/gesture settings survive reload. |
| 3 | Windows Tauri host and shared renderer connection | Character runs in a native application window. |
| 4 | Floating window, tray, positioning, click-through and stop shortcut | Usable desktop companion shell. |
| 5 | MIT chat/speech weight and tokenizer licence audit and CPU/model benchmarks | Select a model only if licence, quality and memory gates pass; record blockers otherwise. |
| 6 | Local model adapter and streamed text chat | First local conversation without fake responses. |
| 7 | Cancel/unload, chat history, settings and offline restart | Local conversation recovers after restart/network loss. |
| 8 | Optional internet-search provider, bounded evidence and source links | Online answers work with the selected/configured search service; failures remain explicit. |
| 9 | Native launch-app and user-targeted typing actions | Deterministic typed commands execute in a bounded scope. |
| 10 | Pointer move/click and approved keyboard shortcuts | Scoped input actions with cancellation and visible results. |
| 11 | Structured command routing, permission gates and emergency-stop checks | Model output cannot directly invoke unrestricted OS actions. |
| 12 | Integrate typed chat, gesture feedback and approved actions | One coherent typed-command user flow; voice interfaces remain prepared for November. |
| 13 | Hardware/WebGL, performance, offline/online and action-failure tests | Written test results on actual Windows hardware; blockers identified. |
| 14 | Fix blockers, build installer/default pack, verify licences and size | Release candidate within the 1 GB product target where measured. |
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
| v0.3 — conversation beta | Text chat, model-provider selector, downloadable MIT model packs and optional internet search | A verified MIT-weight model passes the benchmark; cancellation and history work; answers show whether search was used and link sources; no network request is needed for local chat after download. |
| v0.4 — desktop assistant MVP | Windows floating companion, tray, click-through mode and bounded mouse/keyboard actions | The assistant follows typed commands such as opening an allowed app or typing into a user-selected field; an emergency stop cancels actions; permissions, action results and failures are visible; installer/default pack meets the 1 GB target. |
| v0.5 — voice and emotion | Microphone, speech recognition, speech output and semantic mood/gesture mapping | Listening indicators reflect real capture; mute/cancel work; typing remains available; emotion does not interrupt active commands; every bundled voice/model has recorded redistribution terms. |
| v0.6 — platform expansion | Linux/macOS desktop hosts, mobile app and platform-specific widget/overlay hosts | Each supported host has real-device tests and a capability matrix; unsupported OS actions are disabled; mobile widgets use suitable native state snapshots rather than promising arbitrary live overlays. |
| v0.7 — companion world | Small interactive space, reach animation, prop grip/release and persistence | Objects have colliders and grip anchors; fingers follow contacts; objects attach/release predictably; saving restores the scene; this is distinct from OS automation. |
| v0.8 — creator studio | Import/preview characters, rigs, skins, personalities and task-specific configurations | Versioned packages declare capabilities and ownership/licence; packages validate before loading; user data stays portable; training is a separate opt-in workflow. |
| v1.x — marketplace | Free/premium packages, purchases and creator payouts | The free tier remains useful; restore/refund/update flows exist; the proposed 5% platform share and 80% free/20% premium split have explicit feature and payout definitions. |

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

MIT applies to the chosen model weights, not merely its inference library or a conversion script. Record the exact upstream model, weight revision, tokenizer, licence and redistribution conditions before selecting or shipping a pack. The project source remains GPL-2.0-only as requested; preserve dependency notices.

Aim for a compact default pack, with approximately 100 MB as a preferred benchmark tier rather than a promise of useful conversation on every device. Keep the desktop application/default pack within the 1 GB product target; optional downloads must show their size. Model file size alone does not determine speed or runtime RAM.

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

Model licensing/quality evaluation has started for v0.3: the first checksum-pinned Phi-1.5 Windows CPU baseline ran successfully but failed conversation quality. No default is approved. See docs/OFFLINE_MODELS.md for the measured results and remaining gates. Kurumi work continues independently.

## Repository practices

Public repository: `Rayeen13/project-ruby`. Default branch: `main`. Stable releases are merged into main through reviewed/tested PRs, then tagged. Use release/vX.Y.Z for final integration where needed. Focused feature branches and Conventional Commits (`feat`, `fix`, `docs`, `test`, `refactor`, `chore`). Review source and licences before release; do not commit credentials, private chats or installed model weights. Model downloads belong in declared packs rather than Git history.

## Primary technical references

- Tauri capabilities and platform boundaries: https://tauri.app/security/capabilities/
- Tauri platform-specific capabilities: https://v2.tauri.app/learn/security/capabilities-for-windows-and-platforms/
- ONNX Runtime browser inference: https://onnxruntime.ai/docs/tutorials/web/
- ONNX Runtime Web execution providers/browser support: https://onnxruntime.ai/docs/get-started/with-javascript/web.html

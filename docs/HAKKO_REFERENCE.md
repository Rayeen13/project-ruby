# Floating companion product direction

Research date: 14 October 2026. This is a design brief, not implemented functionality.

## Ruby's intended role

Riyan wants a persistent floating companion that converses through text and voice, understands commands, and later performs desktop tasks: searching, opening applications, typing and clicking. The mascot is the everyday entry point to that assistant. The character lab is a separate configuration surface. Project Kurumi continues independently.

Earlier changes concentrated on the robot viewer and docking effects. That is only the presentation foundation. The next product work needs to connect conversation, companion state and actual task execution to the floating experience.

## Evidence reviewed

- Official Hakko quick-start and FAQ: a full-body companion and compact circular widget; text input/subtitles near the companion; nearby voice-call controls; expandable conversation/history; tray hide/restore. The FAQ calls the full-body representation Live2D. Its edge-drag advice appears in the legacy 0.6 section, so it does not establish current edge-hover animation timing.
- Inspected three official UI screenshots: response/input bubble above the character and a small vertical control group beside it, including voice and expansion controls.
- Downloaded and visually inspected sampled frames from two official Stardew Valley clips. The longer clip was sampled every eight seconds, the shorter every three seconds. Observed a compact avatar orb beside a response bubble with Expand and stop controls, remaining over gameplay. This was frame-based review, not continuous 8x playback or a desktop interaction test.
- The official Japanese YouTube introduction stalled at 0:00 after one reload. No claim of watching that video or observing its hover/drag transitions.
- Official Universal Vision material describes selecting a game/application as the visual source. Other official pages describe search, voice, memory, proactive replies and character creation.
- GitHub search found an empty Hakkoai/Hakkoai repository, a similarly named terminal assistant with an unrelated README, and a small messaging SDK. No verified public source/README for the floating desktop product was found. None is a basis for copying its implementation.

## Product interpretation and next sequence

1. Keep the accepted Ruby bodies and rig. Improve presentation through restrained semantic states: idle, listening, thinking, speaking and working. A selected personality affects language and behaviour, not only preset reaction strings.
2. Add a small conversation surface anchored to the mascot: typed input, streamed response, cancel, retry and expand into history. It should remain reachable when pinned or docked. Appearance configuration stays in the lab.
3. Add compact mode as another presentation of the same active companion/session. Switching presentation must preserve conversation, selected model/personality and task state.
4. Integrate the evaluated offline chat provider and separate language-model selection from body selection. Show genuine loading/offline/error states. Internet retrieval adds source links when used.
5. Add the desktop worker behind the existing host boundary. Show the current task and progress on the companion. Start with explicit app opening, search and bounded typing/clicking; maintain cancellation. A visible assistant pointer is an execution indicator, not proof of a second independent operating-system mouse. Prefer application/accessibility APIs where available.
6. Add the required November voice milestone: microphone capture, speech recognition, spoken responses, interruption and real listening/speaking indicators feeding the same conversation/task session.
7. Introduce chosen-app screen context and editable local memory, then creator packages/studio. Marketplace work remains later.

The reviewed Hakko material demonstrates assistance and advice; it does not verify arbitrary autonomous desktop clicking, typing or app launching. Ruby's desktop worker is an additional product requirement. Exact edge animation/easing, shake gestures and transparent-area hit testing require direct evidence before claiming parity.

## References

- https://www.hakko.ai/blog/article/quick-start/
- https://www.hakko.ai/blog/article/common-problem/
- https://www.hakko.ai/blog/game/stardew-valley-live-demonstration/
- https://www.hakko.ai/blog/feature/universal-vision-launched/
- https://www.hakko.ai/blog/feature/roleplay-agentic-memory/
- https://www.hakko.ai/blog/feature/how-to-create-own-workshop-partner-in-hakkoai/
- https://www.hakko.ai/blog/article/desktop-ai-companion/
- https://www.youtube.com/watch?v=Zhw7BDbko1E

No competitor assets are included in this repository. The observations above are versioned evidence and our proposed product direction, not a claim of feature parity or shipped chat/voice/automation.

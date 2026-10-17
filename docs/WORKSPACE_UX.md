# Prismy workspace UX — v0.4.9

## Direction

Use a calm Obsidian workspace with ametrine accents by default, a persistent Companion preview, clear daily actions, and progressive disclosure of setup/advanced controls. Sakura light and Cyberpunk are optional workspace appearances. The workspace palette is independent of gem colour, character identity, outfit, personality and memory. Fonts/assets remain local; no CDN dependencies were added.

The owner supplied four Gemini HTML concepts. All four were reviewed as design references, not production implementations:

| Reference | Ideas retained | Deferred |
| --- | --- | --- |
| `prismy_studio_project_ruby_v0_4_8_themes_interface_suite.html` | Companion-first stage, themes through tokens, separate chat/customization areas | Multiple competing workspaces, simulated overlay/capture/cloud/store behaviour |
| `prismy_studio_brainstorm.html` | Grouped controls and a focused stage | Dense implementation jargon, pretend payment routing |
| `prismy_studio_brainstorm (1).html` | Matte surface hierarchy and optional light appearance | Premium status and paid capabilities that do not exist |
| `prismy_studio_modular_production_hub_pluggable_mesh_builder.html` | Future heavy Studio features as optional modules; clearer separation of inspect/edit/run | Full mesh editor, plugin manager, numerical telemetry, rig counts and latency/CPU claims without measurement |

Do not copy demo replies, fake cloud-ready indicators, checkout flows or performance claims into the working app. Mesh editing is a later Studio feature, not a new tab with a simulated editor in this milestone.

## User journeys

1. Explore: choose a Companion body from the real searchable collection; preview it immediately. No AI download is required to explore the avatar.
2. Customize: use the collection shortcut or navigation to change gem/personality/outfit. Existing saved identity/memory stays separate.
3. Talk: the collection's main action opens actual setup when no AI model is selected, or opens the existing conversation when one is selected. The website explains that its AI server runs locally; the Windows app offers its real setup. A selected model is not advertised as a verified healthy connection.
4. Configure: App contains existing AI/voice/internet/memory destinations and the workspace appearance selector. Language and AI engine choices remain in Settings.
5. Play: preview gestures/expressions with the real animation system. Physics, detailed hand poses and print export stay available without crowding the initial screen.

Desktop navigation uses readable labels when space permits; narrower desktops use compact labelled navigation; phones keep the existing stage plus bottom navigation/scrollable controls arrangement. During conversation/settings the Companion remains visible above the panel on narrow screens. Only the controls/history areas scroll, with thin scrollbars. The floating window retains its mesh-only presentation and existing right-click interaction flow.

## Implementation

[Prisms](PRISMS.md) provides the explicit extension lifecycle and local opt-in theme pack flow. The host receives small interfaces through the composition root; it does not import Tauri, rendering or inference. `studio-appearance.js` owns a validated three-theme catalogue, local persistence and a usable session-only fallback when storage is blocked. It is independent of DDNA and pack downloads. `studio-prisms.js` composes appearance and the Prism library; `lab-shell.js` routes beginner shortcuts to existing panels. CSS variables control the workspace palette; floating mode is explicitly excluded. Selected/hover states and keyboard focus use workspace accents, while gem identity colours remain independent.

Persistent key: `project-ruby.studio-appearance.v1`, with a small versioned `{version:1,theme}` value. Unknown/corrupt entries fall back to Obsidian. Theme changes do not download assets or call cloud services. The theme selector is reachable through App using mouse or keyboard.

## Validation and limits

Shared checks cover real theme-selector changes, persistence/reload, unknown/corrupt input and blocked storage. Windows smoke coverage cycles all three themes, captures actual native app screenshots, checks page overflow and unchanged Companion selection, follows the beginner shortcuts and checks persistence on restart. Existing speech, memory, gesture, grab/docking and conversation checks remain in the suite.

Native screenshots still require review before visual acceptance. There is no browser-control plugin in this environment, so browser/mobile visual QA must not be claimed from a static asset check. This is an implemented UX improvement, not evidence that the product is commercially launch-ready or that user testing has passed. Team acceptance should test whether a new user can choose a Companion, find setup, start a real conversation and change voice without assistance.

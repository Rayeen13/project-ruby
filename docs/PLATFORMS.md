# Shared character platform contract

Status: browser prototype implemented; native desktop/mobile hosts are not built or tested.

Character geometry and animation modules must not depend on app windows, DOM selectors, microphone permissions, storage, networking, AI providers or OS automation. Canvas creation is injected through `createCanvas`; a browser canvas remains the default. CharacterSelection accepts this host option and creates each model through the registry. WebView-capable hosts can reuse the current Three.js renderer. Native renderers would need a separate adapter or an exported asset pipeline; this code is not itself a native widget.

Common instance surface: root, setProfile(id), setMood(mood), update(seconds, {dt,pointer,follow,dance,wave}). Use monotonic simulation seconds and normalized pointer coordinates. Host maps mouse, touch, pen, voice and AI events into this surface. Do not embed platform actions in character updates. Future clips should use common semantic names and optional capability declarations (classic has no wave).

Web: current WebGL viewer, touch orbit and pinch zoom, capped pixel ratio and 30 fps on coarse-pointer devices, no rendering while page is hidden. Test on actual devices before claiming mobile compatibility. Desktop: plan Tauri/WebView host with separate Rust window/input adapters. Android: in-app renderer plus distinct widget and overlay hosts; overlays require platform permission. iOS: in-app renderer plus WidgetKit snapshots/timeline/native interactions; do not promise the live WebGL character as an arbitrary cross-app overlay or continuously animated home-screen widget.

Native widget views should consume companion-state snapshots (model/profile/mood/status/last update) and launch the main assistant for full interaction. Android and iOS widgets are distinct implementations. Floating assistant windows and OS-control capabilities must be declared per host, with unsupported features unavailable.

3D printing is a separate output: static solid STL, physical eye relief, reinforcement bridges and base. It cannot retain animation. Every new body must be appended to the registry without replacing earlier IDs and include scripts/export-print-input.mjs + scripts/build-prints.py validation output. The current printable exports are static figurines, not articulated engineering designs.

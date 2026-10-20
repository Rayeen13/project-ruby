# Voice transport and preview recovery

v0.5.4 transfers native WAV output with Tauri `ipc::Response` (binary ArrayBuffer), replacing JSON sample arrays. The frontend converts binary/typed-view/legacy inputs into one byte representation before greeting caching or playback. Native synthesis tests continue to use the internal byte-producing function.

During voice computation the preview keeps a minimum of 8 FPS on software/low-power renderers, with a 15 FPS hardware budget. Render resolution and shadow updates are reduced during computation. This prevents the previous intentional 1 FPS policy from looking frozen; synthesis latency remains dependent on the chosen VoiceM and hardware.

WebGL context loss pauses only the preview. The recovery handler cancels speech and unloads the warm voice worker off the native UI thread, then requests context restoration. Voice uses CPU fallback after an actual graphics loss for that session; healthy sessions continue preferring GPU. Restoration resets spring timing and keeps a conservative graphics budget. A Restore preview control is available if automatic recovery does not complete. Conversations and saved preferences are retained, with no page reload or data reset.

Windows acceptance exercises a real lost/restored WebGL context, binary WAV delivery, actual anime voice playback through WebView, and live UI/preview heartbeats during synthesis. Numerical/CI success does not establish the cause of every device-specific freeze. On the RTX 2050, use Settings → Voice & language → Check my voice to confirm actual device, latency and playback after installing the update.

Reference: https://v2.tauri.app/develop/calling-rust/#returning-array-buffers


## v0.5.5: sustained Opal shaking

Browser and desktop Jolt simulation now runs in a dedicated module worker. Geometry and numeric skeleton poses cross the worker boundary; rendering, chat and input remain on the UI thread. There is at most one simulation request in flight and no queue of stale frames. Accumulated simulation time is capped at 50 ms per request. Screen teleports rebase cloth instead of launching an impulse through the mannequin.

A stalled step is terminated after 1.5 seconds; initialization has its own longer budget. The avatar keeps its original skinned garment and switches to the lightweight spring rig, with chest/hair motion retained. This fallback does not reload the page, stop chat or reset saved data. Worker errors and non-finite output take the same path. No synchronous Jolt fallback runs on the browser UI thread.

The Windows global-pointer tracker also releases DesktopState before requesting window scale. Previously, with floating chat open, that background thread could hold DesktopState while waiting for the UI, while a simultaneous desktop_move command on the UI waited for DesktopState. The new scope removes this lock-order cycle.

Acceptance includes an actually stuck worker with parent event-loop heartbeats, repeated large worker-driven shakes and wardrobe switches, plus 320 real native window movements with Opal, expanded floating chat, active pointer tracking and repeated fabric previews. These checks establish bounded work and recovery paths; a specific laptop crash still needs confirmation on that device.

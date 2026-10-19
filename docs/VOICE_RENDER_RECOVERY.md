# Voice transport and preview recovery

v0.5.4 transfers native WAV output with Tauri `ipc::Response` (binary ArrayBuffer), replacing JSON sample arrays. The frontend converts binary/typed-view/legacy inputs into one byte representation before greeting caching or playback. Native synthesis tests continue to use the internal byte-producing function.

During voice computation the preview keeps a minimum of 8 FPS on software/low-power renderers, with a 15 FPS hardware budget. Render resolution and shadow updates are reduced during computation. This prevents the previous intentional 1 FPS policy from looking frozen; synthesis latency remains dependent on the chosen VoiceM and hardware.

WebGL context loss pauses only the preview. The recovery handler cancels speech and unloads the warm voice worker off the native UI thread, then requests context restoration. Voice uses CPU fallback after an actual graphics loss for that session; healthy sessions continue preferring GPU. Restoration resets spring timing and keeps a conservative graphics budget. A Restore preview control is available if automatic recovery does not complete. Conversations and saved preferences are retained, with no page reload or data reset.

Windows acceptance exercises a real lost/restored WebGL context, binary WAV delivery, actual anime voice playback through WebView, and live UI/preview heartbeats during synthesis. Numerical/CI success does not establish the cause of every device-specific freeze. On the RTX 2050, use Settings → Voice & language → Check my voice to confirm actual device, latency and playback after installing the update.

Reference: https://v2.tauri.app/develop/calling-rust/#returning-array-buffers

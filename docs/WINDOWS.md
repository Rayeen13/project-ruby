# Windows v0.4 quick start

Quit the previous tray instance before installing. Studio now has a native Windows title bar; the floating Companion remains frameless. Open **Settings → LLM → Download AI** (or Start AI for an existing download), then close Settings and choose Talk. LLM selection no longer occupies chat. Both chat and Settings leave a reserved Companion viewport visible.

**Settings → VoiceM → Download VoiceM** installs the ~100 MB English pack. Preview the matched voice, optionally enable spoken replies and use Stop voice to interrupt. **Settings → Companion** shows age/gender, content tone and owner notes. **Settings → Internet** enables sourced answers or opens a question in Google AI Mode in your browser. Online services can fail; no account or Gemini API key is bundled.

Right-click the Companion for actions, preset size selection and a corner ×. Wheel zoom uses those same four sizes. Body switches refit the native canvas. Close Studio hides to tray; Quit exits fully.

# Project Ruby Windows shell preview

The native shell runs the existing character lab in a Tauri/WebView2 window. It includes the five bodies, gem profiles, expressions, gesture controls, smooth greeting and local preferences. The packaged viewer assets are local; the viewer needs no account or server to start.

It is a desktop shell preview, not a complete AI assistant. Floating mode and tray controls are implemented as a Windows build preview. Local conversation, sourced search, owner notes and downloadable VoiceM speech are implemented. Screen understanding, microphone input and OS input actions remain later steps. Native commands are bounded to companion controls, approved downloads, local model endpoints, search and HTTPS browser links.

## Try the CI build

Download `project-ruby-windows-x64-preview` from the successful **Windows desktop build** GitHub Actions run and extract it. Use the `-setup.exe` installer for a current-user installation, or try `project-ruby.exe` directly. Requires Windows x64 and the Microsoft Edge WebView2 runtime. The build is currently unsigned; do not treat an installer build as proof of physical-device runtime QA.

The artifact includes source licence notices, Cargo.lock for its exact dependency resolution and SHA256.txt for its executables. GitHub Actions artifacts expire after 30 days. These are preview artifacts, not permanent signed release assets.

First-run checks: launch; switch all five bodies; change gem/expression; preview both hand controls; wave and return; close/reopen and check saved preferences; export JSON; reset preferences; resize the window. Report WebGL fallback, blank windows or exceptions before calling the native runtime stable.

Preferences belong to this native application's WebView storage and are separate from the public website's browser preferences. The preview identifier is `io.github.rayeen13.projectruby`.

## Floating companion and recovery

The installed app opens as a floating companion. From the lab, choose **Float companion** at the top of its controls. The same character becomes a compact transparent, window pinned above other apps by default. Carry the mesh to move it; **Lab** returns to the full controls; **Hide** hides to the tray. The tray offers Float companion, Open character lab, Stop / restore interaction, Hide companion and Quit. Closing the window hides it to the tray; choose Quit there to exit fully.

**Click-through** lets mouse input pass through the whole floating window. Restore interaction with **Ctrl+Alt+Shift+R**, or the tray's **Stop / restore interaction** item. The shortcut restores/shows and recenters the window and pauses animation, gaze tracking, dance, turning and greetings. The shortcut also cancels an active chat request. OS task execution is not connected. Resume using Animate and Eyes + head tracking in the lab. If the shortcut cannot register (for example, another app owns it), click-through is disabled and the lab reports the conflict.

Lab bounds are retained during the process. Floating position, size, pin and dock edge are saved across restarts; click-through is never restored automatically. Every launch starts with the interactive floating mascot; gem/model/gesture preferences remain saved. No autostart or desktop input control is enabled. Browser demos expose no native window controls.

Windows device acceptance still required: drag between monitors with different DPI; switch Lab/Float repeatedly; hide/show from tray; close to tray; click-through over another app; recover with the shortcut and tray; check a conflicting shortcut; quit while hidden; inspect transparent rendering in both GPU and software modes. Native build and policy tests do not substitute for these runtime checks.

## Build locally

Requires Node.js, Rust with the MSVC toolchain, Microsoft C++ Build Tools with Desktop development with C++, and WebView2. See https://v2.tauri.app/start/prerequisites/ . A normal user installing the finished preview does not need those build tools.

```bash
npm ci
npm test
npm run desktop:dev
```

```bash
npm run desktop:build -- --bundles nsis
```

Output is under `src-tauri/target/release/` and `src-tauri/target/release/bundle/nsis/`. Frontend modules build automatically before the release build. Cross-platform host structure is retained, but only the Windows build is being validated in this milestone. Native Linux/macOS/mobile hosts are not yet verified.

## Direct model interactions and Windows experiments

Drag horizontally to turn the model in the same screen direction. Tap the head to pat it, the body to boop it, or a hand to wave when supported. Touch reactions briefly show a happy face and a small, eased head nod or tilt with the feet grounded, then return to the selected expression. Right-click the visible robot mesh (not the background) for a bubble with Head pat, Boop, Wave, Gentle sway, Sleep, Wake and Stop. Touch screens use a stationary long-press. Escape dismisses the menu; arrow keys navigate it. These are real visual interactions; conversation and object physics remain future work.

Windows CI launches the packaged application with `--native-smoke-test`. It exercises all five models in the actual WebView, checks mesh taps/right-click actions and corrected drag, switches native floating/lab modes, and uses a real Ctrl+Alt+Shift+R key sequence to recover click-through. The artifact includes the resulting report and captured native menu/floating screenshots. Test reporting/checkpoint commands are rejected during normal launches. A hosted runner is an automated test machine, not an interactive VPS or proof of every physical-device behavior.

## Carry and personality preview

Floating mode shows the transparent companion without a toolbar. Right-click its body for desktop controls, or use the tray. Hold or drag the model itself to move its window; fast back-and-forth shaking triggers temporary spiral eyes and stars. Ctrl+Alt+Shift+R still stops reactions and restores interaction. Background/Alt-drag rotates the lab view.

The companion collection includes category cards and saved personality presets per body. These are visual reaction/idle presets; language-model conversation is still a separate integration step. See `COMPANION_INTERACTIONS.md` for controls and test scope.

The executable now starts directly as the frameless floating mascot. The lab also has no native title bar; use its Move/Float/Hide controls or the tray. Whole-screen cursor following works in Windows, including outside the companion window. Quick taps keep the feet grounded; holding for 420 ms or deliberate dragging carries it.

## Frameless zoom, pin and edge peeking

The transparent floating window grows/shrinks with mouse-wheel zoom. Larger/Smaller and Reset size are available in the right-click menu; double-click also resets size. Its size is bounded to the current monitor's usable work area, leaving the taskbar accessible. The camera fits the full current body, including waving hands and the gamer controller. Browser/lab zoom stays within a fitted camera view.

**Pin above windows** keeps the companion above other app windows, while **Unpin from top** lets it behave like an ordinary floating window. Pinning does not lock dragging. The choice is saved across restarts; this does not promise presence on every Windows virtual desktop or above exclusive fullscreen applications.

Choose **Peek from left/right** in the model menu or tray. Ruby docks partly beyond that screen edge and tilts its head inward. Hovering and leaving keep the robot in the same peek position; its head and eyes continue tracking the cursor. Choose **Leave edge** to undock. Releasing a carry within 36 logical pixels of a side also docks it. Ctrl+Alt+Shift+R clears docking and recenters it if needed. Normal undocked zoom never intentionally crops the body; edge peeking intentionally hides part beyond the screen boundary.

Windows tests use real wheel input, validate the native topmost flag, capture enlarged and left/right peek views, test stable hover while docked, and restart the process to verify saved pin/dock/size. Smoke-test settings use a separate file from normal desktop settings. Mixed-DPI and physical multi-monitor device acceptance remains pending.

Opening the floating companion or choosing Wake up resumes cursor tracking. Stop still pauses tracking immediately. Global gaze uses screen-wide distances so a docked companion responds to different cursor positions instead of saturating at the window edge.

## Conversation and offline AI — v0.4.0

Use the tray's **Open conversation**, the lab's **Open conversation / set up AI**, the floating **Talk** button or the robot's right-click menu. The header/lab identifies this build as v0.4.0. Close the previous installed/portable instance before testing a different executable.

Choose **Ruby offline AI → Download AI** for the one-time ~511 MB model/runtime download. Progress and Cancel are built in. Ruby verifies the pinned Qwen GGUF, runtime archive and publisher template, retains licences, starts a private loopback process and connects chat. There is no Python or manual server requirement. **Start AI** reuses verified installed assets offline; **Stop / unload AI** releases the process without deleting history. Quit also stops Ruby's owned model process; Hide keeps it available.

Saved files use `%LOCALAPPDATA%/ProjectRuby/experimental-ai`, including compatible files from the previous experimental launcher. Optional existing-server presets are available for users who already run another engine. See [AI_ENGINES.md](AI_ENGINES.md). No default large MoE or training stack is downloaded.

Full history is local display/export storage; the compact model sees bounded recent context. Search, voice and PC task execution remain future work. Model quality, Hindi and individual laptop/iGPU performance need further acceptance work.

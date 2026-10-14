# Project Ruby Windows shell preview

The native shell runs the existing character lab in a Tauri/WebView2 window. It includes the five bodies, gem profiles, expressions, gesture controls, smooth greeting and local preferences. The packaged viewer assets are local; the viewer needs no account or server to start.

It is a desktop shell preview, not a complete AI assistant. Floating mode and tray controls are implemented as a Windows build preview. Conversation, voice, screen understanding and OS input actions remain later steps. Two bounded host commands control only the local companion window; the frontend has no filesystem, shell, external-app input or shortcut-registration permissions.

## Try the CI build

Download `project-ruby-windows-x64-preview` from the successful **Windows desktop build** GitHub Actions run and extract it. Use the `-setup.exe` installer for a current-user installation, or try `project-ruby.exe` directly. Requires Windows x64 and the Microsoft Edge WebView2 runtime. The build is currently unsigned; do not treat an installer build as proof of physical-device runtime QA.

The artifact includes source licence notices, Cargo.lock for its exact dependency resolution and SHA256.txt for its executables. GitHub Actions artifacts expire after 30 days. These are preview artifacts, not permanent signed release assets.

First-run checks: launch; switch all five bodies; change gem/expression; preview both hand controls; wave and return; close/reopen and check saved preferences; export JSON; reset preferences; resize the window. Report WebGL fallback, blank windows or exceptions before calling the native runtime stable.

Preferences belong to this native application's WebView storage and are separate from the public website's browser preferences. The preview identifier is `io.github.rayeen13.projectruby`.

## Floating companion and recovery

In the installed app, choose **Float companion** at the top of the lab controls. The same character becomes a compact transparent, always-on-top window. **Move** is a pointer drag handle; **Lab** returns to the full controls; **Hide** hides to the tray. The tray offers Float companion, Open character lab, Stop / restore interaction, Hide companion and Quit. Closing the window hides it to the tray; choose Quit there to exit fully.

**Click-through** lets mouse input pass through the whole floating window. Restore interaction with **Ctrl+Alt+Shift+R**, or the tray's **Stop / restore interaction** item. The shortcut restores/shows and recenters the window and pauses animation, gaze tracking, dance, turning and greetings. This is a viewer stop, not an OS automation cancellation system. Resume using Animate and Eyes + head tracking in the lab. If the shortcut cannot register (for example, another app owns it), click-through is disabled and the lab reports the conflict.

Lab bounds and floating position are retained while this process runs. Window position and floating/click-through modes are not persisted across restart. Every launch starts with the interactive lab; gem/model/gesture preferences remain saved. No autostart or desktop input control is enabled. Browser demos expose no native window controls.

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

Drag horizontally to turn the model in the same screen direction. Tap the head to pat it, the body to boop it, or a hand to wave when supported. Touch reactions briefly show a happy face and a small bounce/tilt, then return to the selected expression. Right-click the visible robot mesh (not the background) for a bubble with Head pat, Boop, Wave, Dance, Sleep, Wake and Stop. Touch screens use a stationary long-press. Escape dismisses the menu; arrow keys navigate it. These are real visual interactions; conversation and object physics remain future work.

Windows CI launches the packaged application with `--native-smoke-test`. It exercises all five models in the actual WebView, checks mesh taps/right-click actions and corrected drag, switches native floating/lab modes, and uses a real Ctrl+Alt+Shift+R key sequence to recover click-through. The artifact includes the resulting report and captured native menu/floating screenshots. Test reporting/checkpoint commands are rejected during normal launches. A hosted runner is an automated test machine, not an interactive VPS or proof of every physical-device behavior.

## Carry and personality preview

Floating mode shows the transparent companion without a toolbar. Right-click its body for desktop controls, or use the tray. Hold or drag the model itself to move its window; fast back-and-forth shaking triggers temporary spiral eyes and stars. Ctrl+Alt+Shift+R still stops reactions and restores interaction. Background/Alt-drag rotates the lab view.

The companion collection includes category cards and saved personality presets per body. These are visual reaction/idle presets; language-model conversation is still a separate integration step. See `COMPANION_INTERACTIONS.md` for controls and test scope.

The executable now starts directly as the frameless floating mascot. The lab also has no native title bar; use its Move/Float/Hide controls or the tray. Whole-screen cursor following works in Windows, including outside the companion window. Quick taps keep the feet grounded; holding for 420 ms or deliberate dragging carries it.

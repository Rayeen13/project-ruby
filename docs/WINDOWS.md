# Project Ruby Windows shell preview

This first native shell runs the existing character lab in a Tauri/WebView2 window. It includes the five bodies, gem profiles, expressions, gesture controls, smooth greeting and local preferences. The packaged viewer assets are local; the viewer needs no account or server to start.

It is a desktop shell preview, not a complete AI assistant. Floating/tray/click-through modes, conversation, voice, screen understanding and OS input actions are later roadmap steps. The Rust host currently has no custom commands or plugins; its viewer capability grants no filesystem, shell or input permissions to the frontend.

## Try the CI build

Download `project-ruby-windows-x64-preview` from the successful **Windows desktop build** GitHub Actions run and extract it. Use the `-setup.exe` installer for a current-user installation, or try `project-ruby.exe` directly. Requires Windows x64 and the Microsoft Edge WebView2 runtime. The build is currently unsigned; do not treat an installer build as proof of physical-device runtime QA.

The artifact includes source licence notices, Cargo.lock for its exact dependency resolution and SHA256.txt for its executables. GitHub Actions artifacts expire after 30 days. These are preview artifacts, not permanent signed release assets.

First-run checks: launch; switch all five bodies; change gem/expression; preview both hand controls; wave and return; close/reopen and check saved preferences; export JSON; reset preferences; resize the window. Report WebGL fallback, blank windows or exceptions before calling the native runtime stable.

Preferences belong to this native application's WebView storage and are separate from the public website's browser preferences. The preview identifier is `io.github.rayeen13.projectruby`.

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

# Companion Lab · v0.4.6

The supplied `hakko_ai_feature_list.md` is a product reference, not verified source code or measured performance evidence. Ruby implements its own portable interactions. Specific claims such as a 132-bone rig, 180 ms startup or 0.5% capture overhead are not Ruby guarantees.

## Available in this pass

- Companions / Style / Motion / App navigation, searchable collection, keyboard navigation and a focus view.
- Quick preview actions, an interaction guide and visible routes to chat and settings. Floating mode keeps only the Companion until its context menu opens.
- App cards show the selected local LLM and actual speech/search preferences. Downloads and connection management remain in Settings.
- Multiline chat (Enter sends, Shift+Enter adds a line), copy reply, and confirmation before clearing conversation history.
- Text file sharing: attach or drop one UTF-8 `.txt`, `.md` or `.json`, up to 256 KB. Review/remove the draft before sending. At most 1,600 characters enter the compact LLM context. File excerpts remain conversation data, separate from owner memory; optional search receives the question rather than the file.
- Windows handles native file-drop events with a bounded background reader. Browser drop and the file chooser use the same draft flow. Unsupported documents/images show a clear message.
- Opal uses a real mouth morph driven by the volume of playing VoiceM audio. It returns to rest on completion/stop. This is amplitude-based animation, not timed phoneme/viseme alignment. No microphone recording is involved.

## Next implementation stages

| Area | Next concrete work |
| --- | --- |
| Studio creator | Import/validate user-owned VRM, outfit authoring, personality packaging and preview. |
| Documents and vision | Offline PDF/Office extraction, opt-in image encoder and explicit per-file context budget. |
| Voice input | Push-to-talk, microphone permission and offline recognition before background listening. |
| Facial acting | Phoneme timings/visemes when a VoiceM actually supplies them; expression blending per rig. |
| Desktop tasks | Reviewable action requests, pointer/app adapters and stop/recovery controls. |
| Screen awareness | Explicit capture controls, per-window selection and measured resource budgets. |
| Installation | Signed distribution, update/recovery flow and optional startup with measured timing. |

Existing pin, edge peek, grab/shake, bounded Studio zoom, portable DDNA/brain backups and local voice/model downloads remain in the app. The new Opal avatar still needs a separate printable-solid conversion.

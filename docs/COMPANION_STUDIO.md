# Companion Studio contracts

Companion = 3D mesh character, LLM = language model, VoiceM = speech model. Character geometry remains frozen. Rendering, state/prompt, LLM transport, search and speech use separate modules. This is the portable foundation to evaluate before extracting anything into Project Kurumi.

## Identity, memory and emotion

`companion-state.js` owns a versioned, exportable local record, independent of inference engines. Ruby (24), Emme (26), Amy (24) are female; Saph (25) is male. These are fictional ages. Chibi has age 8 and always receives a family-friendly prompt. Personality comes from the existing per-body selection. Shared owner notes persist across body, gem and LLM switches.

Learning is deliberately limited to owner-supplied declarations, not background profiling. “Remember …” and “My name is …” save notes; “I feel …” records a self-reported feeling. The owner can review/delete each note, forget all, turn memory use off, or export state. There is no fine-tuning, diagnosis or implicit claim of long-term recall of every chat. Storage failure is visible.

Any text LLM can receive the same identity/memory prompt. A leading `[happy]`, `[curious]`, `[listening]`, `[sleepy]` or `[neutral]` maps to supported mesh expressions and is removed from completed visible/spoken text. Models that omit tags use deterministic owner-message mood and thinking/speaking feedback. Character emotions are simulated; prompt compliance is not guaranteed. Mesh-specific visemes and expressive neural prosody are future work.

“Censored” requests family-friendly language. “Uncensored” requests candid tone, ordinary profanity and mature non-graphic discussion for adult profiles. It does not replace weights, unlock a provider, or guarantee removal of model restrictions. Content modes never alter Chibi's family-friendly prompt.

## Internet

Windows uses a bounded HTTPS Bing RSS search request. The web build uses the public Wikipedia API with CORS; this is encyclopedia lookup, not full web search. Neither source has an application availability guarantee. Only the explicit question is sent, never the whole history or owner notes. Follow-up “search what I just asked u” resolves the last non-search question. Search is opt-in or explicitly requested. Three excerpts at most enter a separate untrusted evidence message. Search cannot invoke tools or change character state. Links are displayed as sources, not proof that every sentence is supported. Failed search prevents a fabricated online answer; Stop prevents a late search from starting generation.

Google AI Mode is a HTTPS browser shortcut with the current question. The external service controls account/region availability. There is no hidden browser, scraping, session reuse or automatic import. A supported Gemini provider would require separate authenticated API configuration and quota handling.

## VoiceM pack and licences

English VCTK medium: https://huggingface.co/rhasspy/piper-voices/tree/c10ece1aade47bb51c153c893d14e5bf8e5b7117/en/en_GB/vctk/medium

- Weights: 76,952,753 bytes, SHA256 `4e9fc85ab9009385319fc6bae7f55577f8a2d7ee77fd9159a5500eb6531f41e6`.
- Publisher config SHA256 `7f85e6391ed0f7f46e4abd19345929a16be931a0c9945086f96692dce2087fa8`.
- Publisher repository declares MIT weights. The individual card identifies VCTK corpus CC BY 4.0 and fine-tuning from Lessac. Retain provenance and attribution; repository-level metadata alone is not enough for future packs.
- VCTK attribution: Christophe Veaux, Junichi Yamagishi and Kirsten MacDonald, University of Edinburgh. https://datashare.ed.ac.uk/handle/10283/3443 and https://creativecommons.org/licenses/by/4.0/ .
- Config maps female p225 to speaker 107 and male p226 to speaker 95. Automatic matching follows gem identity; owner can override. Body/personality changes duration scale, not the speaker's recorded identity. This is a prototype English voice, not a custom anime voice actor.
- Piper Windows runtime: https://github.com/rhasspy/piper/releases/tag/2023.11.14-2 . ZIP 22,477,236 bytes, SHA256 `f3c58906402b24f3a96d92145f58acba6d86c9b5db896d207f78dc80811efcea`.
- Archived Piper source is MIT; ONNX Runtime is MIT; eSpeak NG is GPL-3.0-or-later. Download keeps notices and corresponding-source references. Ruby talks to this separately downloaded executable over stdin/WAV, not by linking it into GPL-2.0-only Ruby. Preserve the component licences if redistributing; do not relabel the whole runtime MIT.
- No Ryan pack: its individual card identifies a CC BY-NC-SA dataset, contrary to the project's commercial-use requirement.

Executable archive, weights and config are pinned and verified before synthesis. Archive paths and total extraction size are bounded. Downloads use temporary files, real byte progress and retry. Verified completed files are reused. Voice stop cancels playback and requests cancellation of download/synthesis; a pending HTTP read is bounded by its timeout. Synthesis has a 45-second process timeout. Text never becomes a shell command. WAV files are deleted after transfer to the UI. Device speech fallback uses local-service voices only, where supported; no background cloud TTS or microphone capture.

## References and limits

Primary UX reference: https://www.hakko.ai/ and https://www.hakko.ai/blog/article/common-problem/ — desktop presence, separate model selection and conversation, emotional/voice feedback. Secondary architecture reference: https://github.com/Open-LLM-VTuber/Open-LLM-VTuber — separate character, LLM and speech adapters plus expression mapping. Secondary product reference: https://www.questie.ai/companion/apex — character identity, personality and voice. No third-party character assets/code were copied.

The supplied YouTube URL https://www.youtube.com/watch?v=qSXvDmfyies could not be retrieved; do not claim it was watched. Feature descriptions are not measured performance. Ruby does not yet provide Hakko/Questie-level screen perception, full-duplex speech or game coaching.

Validation: shared tests cover memory opt-out/delete, engine-independent identity, expression parsing, grounded prompts, persisted sources, stale-search cancellation and voice style. Windows smoke exercises actual local LLM, internet search, male/female WAV synthesis, preview playback/Stop, separate UI bounds and title-bar transitions. CI hardware does not establish performance on the owner's RTX 2050, mobile devices, or mixed-DPI monitors.

## Studio physics

A Companion is a single rigid root with gravity integrated in bounded 1/120-second substeps. A static support plane matches the platform top (-0.055 world units); a transformed mesh AABB resolves penetration after animation and grab transforms, so tilted feet cannot sink. Grab is kinematic; release resumes gravity with a settled non-bouncing landing. The drop test is visible in Studio. Floating desktop mode keeps its existing grounded animation and does not simulate falling across the OS desktop. This is one body/platform collision support, not a general rigid-body world or articulated joint physics engine. Shared tests exercise every accepted body through falls, tilt and grab release.

# Companion Studio contracts

Companion = 3D mesh character, LLM = language model, VoiceM = speech model, LangM = local translation model. Character identity remains independent of the inference engine. Rendering, state/prompt, LLM transport, search and speech use separate modules. This is the portable foundation to evaluate before extracting anything into Project Kurumi.

## Identity, memory and emotion

`companion-state.js` owns a versioned, exportable local record, independent of inference engines. Ruby (24), Emme (26), Amy (24) are female; Saph (25) is male. These are fictional ages. Chibi has age 8 and always receives a family-friendly prompt. Personality comes from the existing per-body selection. Shared owner notes persist across body, gem and LLM switches.

Learning is deliberately limited to owner-supplied declarations, not background profiling. “Remember …” and “My name is …” save notes; “I feel …” records a self-reported feeling. The owner can review/delete each note, forget all, turn memory use off, or export state. There is no fine-tuning, diagnosis or implicit claim of long-term recall of every chat. Storage failure is visible.

Any text LLM can receive the same identity/memory prompt. A leading `[happy]`, `[curious]`, `[listening]`, `[sleepy]` or `[neutral]` maps to supported mesh expressions and is removed from completed visible/spoken text. Models that omit tags use deterministic owner-message mood and thinking/speaking feedback. Character emotions are simulated; prompt compliance is not guaranteed. Mesh-specific visemes and expressive neural prosody are future work.

“Censored” requests family-friendly language. “Uncensored” requests candid tone, ordinary profanity and mature non-graphic discussion for adult profiles. It does not replace weights, unlock a provider, or guarantee removal of model restrictions. Content modes never alter Chibi's family-friendly prompt.

## Internet

Windows uses a bounded HTTPS Bing RSS search request. The web build uses the public Wikipedia API with CORS; this is encyclopedia lookup, not full web search. Neither source has an application availability guarantee. Only the explicit question is sent, never the whole history or owner notes. Follow-up “search what I just asked u” resolves the last non-search question. Search is opt-in or explicitly requested. Three excerpts at most enter a separate untrusted evidence message. Search cannot invoke tools or change character state. Links are displayed as sources, not proof that every sentence is supported. Failed search prevents a fabricated online answer; Stop prevents a late search from starting generation.

Google AI Mode is a HTTPS browser shortcut with the current question. The external service controls account/region availability. There is no hidden browser, scraping, session reuse or automatic import. A supported Gemini provider would require separate authenticated API configuration and quota handling.

## VoiceM, LangM and licences

Settings → Voice & language separates displayed text from spoken language. English text with Japanese speech uses a local LangM to translate each spoken phrase, leaving the stored/displayed reply untouched. Matching languages skip translation. By default LangM reuses the selected LLM with a separate translation-only request containing no owner history. Advanced settings select another model in a supported local engine. There is no cloud translation fallback. Compact-model translation quality is limited; wrong-script or empty output reports an error instead of pretending translation succeeded.

Kokoro-82M provides English and Chinese in the pinned Sherpa-ONNX v1.12.15 pack. All eight English and eight Chinese presets share its approximately 316 MB download. Weights and Sherpa use Apache-2.0. Runtime component licences, including eSpeak NG GPL-3.0-or-later and source references, remain in the downloaded component. The runtime runs as a separate process, not linked into GPL-2.0-only Ruby. Publisher: https://huggingface.co/hexgrad/Kokoro-82M . Runtime source: https://github.com/k2-fsa/sherpa-onnx/tree/v1.12.15 . Japanese Kokoro is not offered because this pinned runtime does not support it.

Supertonic 3 int8 provides the original Japanese/English character collection: five female and five male preset styles, shared across languages. The verified Windows runtime and model download total approximately 154 MB. Model/style weights use OpenRAIL-M; commercial use and redistribution are subject to those terms. The full publisher model licence is bundled at `docs/licenses/SUPERTONIC3-OPENRAIL-M.txt`, shown before download and retained with installed files. Sherpa-ONNX v1.13.8 is Apache-2.0 and retains component notices. Model and code licences are separate. Publisher: https://huggingface.co/Supertone/supertonic-3 . Runtime source: https://github.com/k2-fsa/sherpa-onnx/tree/v1.13.8 . These presets are not voice clones of anime actors or third-party characters. Subjective anime-style quality requires listening and acceptance.

Downloads use fixed URLs and SHA256 verification, temporary files, bounded extraction, progress and cancellation. Existing complete files are reused. Synthesis runs on CPU with two threads, a 90-second timeout and one phrase of prefetch. Speech begins with a short phrase and preserves order; Stop waits for cancellation before another native request starts. Temporary WAVs are deleted after transfer. There is no device/cloud speech substitution on the website. Language changes may add local translation latency; timings from CI do not establish performance on a user's laptop.

Personality maps to speaker defaults, pace, supported delivery cues and mesh expressions. Known `[]`/`()` directions are removed from spoken dialogue and approximated through pace, pauses and voiced interjections. These engines do not provide ElevenLabs-style emotional acting, authentic groans or laughter on command. No paid API, voice cloning or microphone capture is included.

## References and limits

Primary UX reference: https://www.hakko.ai/ and https://www.hakko.ai/blog/article/common-problem/ — desktop presence, separate model selection and conversation, emotional/voice feedback. Secondary architecture reference: https://github.com/Open-LLM-VTuber/Open-LLM-VTuber — separate character, LLM and speech adapters plus expression mapping. Secondary product reference: https://www.questie.ai/companion/apex — character identity, personality and voice. No third-party character assets/code were copied.

The supplied YouTube URL https://www.youtube.com/watch?v=qSXvDmfyies could not be retrieved; do not claim it was watched. Feature descriptions are not measured performance. Ruby does not yet provide Hakko/Questie-level screen perception, full-duplex speech or game coaching.

Validation: shared tests cover memory opt-out/delete, engine-independent identity, expression parsing, grounded prompts, persisted sources, stale-search cancellation and voice style. Windows smoke exercises actual local LLM, internet search, male/female WAV synthesis, preview playback/Stop, separate UI bounds and title-bar transitions. CI hardware does not establish performance on the owner's RTX 2050, mobile devices, or mixed-DPI monitors.

## Studio physics

A Companion is a single rigid root with gravity integrated in bounded 1/120-second substeps. A static support plane matches the platform top (-0.055 world units); a transformed mesh AABB resolves penetration after animation and grab transforms, so tilted feet cannot sink. Grab is kinematic; release resumes gravity with a settled non-bouncing landing. The drop test is visible in Studio. Floating desktop mode keeps its existing grounded animation and does not simulate falling across the OS desktop. This is one body/platform collision support, not a general rigid-body world or articulated joint physics engine. Shared tests exercise every accepted body through falls, tilt and grab release.

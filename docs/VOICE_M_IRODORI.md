# Expressive Japanese anime VoiceM

Settings → Voice & language → **Use anime voices · Japanese** keeps the text language unchanged and selects Irodori. Accept the displayed model terms, download the optional collection (~893 MB), then preview and select a voice. English text with Japanese voice uses the existing local LangM. Translation quality still depends on that LLM. English/Chinese Kokoro and lightweight Supertonic remain separate choices.

The engine is Irodori-TTS v4.1 Small-MF Q4_K through speech.cpp v0.8.10, not a pitch-shifted stock voice. Eight original caption-designed adult profiles are gender scoped. Opal is an 18-year-old female anime maid with dry wit. Character personality, expressive performance cues and Companion emotions reach the synthesis model as style instructions; supported sigh/giggle/whisper cues also use the model's emoji controls. Acting direction is probabilistic, not a promise of perfect voice acting.

On first use of a profile, the engine synthesizes a fixed original welcome line and stores a checksum-protected reference. No private conversation is used for that reference. The same reference is reused between phrases and launches to reduce voice drift. No actor, celebrity or commercial-service demo recording is shipped. Users should audition before choosing a default.

The native process uses a pinned local GGUF path and a persistent JSONL worker, with GPU-preferred device selection, two CPU threads, four sampling steps, one heavy local computation at a time, bounded audio, cancellation and CPU retry for supported GPU allocation failures. Idle workers unload after 45 seconds; application exit kills the worker. Smaller Japanese speech phrases preserve ordered playback from sample zero. The downloaded model is ~864 MB and the Vulkan runtime ~29 MB; the application installer remains separate. Runtime CPU synthesis can be substantially slower than playback. Hosted CPU auditions are not RTX 2050 benchmarks.

## Licensing and boundaries

Runtime: MIT. Small-MF weights: MIT with the upstream model-card restrictions against unconsented impersonation and deceptive/misleading synthetic speech. Codec: MIT with inherited Apache-2.0 notices. Full downloaded notices and model card are retained next to the pack, which is a separate-process optional component. These terms permit commercial use without a paid speech API, but do not establish an unlimited guarantee about all generated outputs or resemblance to real people. Do not remove the notices or the model's additional conditions.

Sources and pinned versions:
- https://github.com/nyosegawa/speech.cpp/tree/v0.8.10
- https://huggingface.co/Aratako/Irodori-TTS-v4.1-Small-MF/tree/ccc78f5d480b6e51b69b2d5042a14c4da04fea6e
- https://huggingface.co/sakasegawa/Irodori-TTS-v4.1-Small-MF-GGUF/tree/205ab071cb54e46509a84d3a48535df283bc3b0f

The pack is Japanese-only. Native VoiceM execution currently requires the Windows app; the web UI exposes the same voice preferences and catalogue, with the existing installed-app playback boundary. English/Chinese expressive engines and human-rated voice quality remain future work.

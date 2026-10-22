# Anime VoiceM: research and implementation decision

Research date: 2026-10-17 UTC. Scope: offline character acting, commercial distribution, and low-resource deployment for Project Ruby / Prismy Studio.

**Decision, updated after the owner's licensing-risk preference:** use the MIT-licensed Chatterbox family as the first integration/audition candidate, with original, explicitly consented character recordings. Multilingual Chatterbox is the candidate for English/Japanese/Chinese; Nano/Turbo are English-only options, not interchangeable multilingual upgrades. Build Ruby's performance/voice-pack layer around adapters; do not train a new foundation model. This changes the earlier Japanese-first Style-Bert-VITS2 audition order to reduce copyleft/custom-model-term complexity. It is not a guarantee of zero legal risk or a performance/quality approval. No new voice has been installed or acoustically evaluated.

## What the reference services establish

[Typecast's anime page](https://typecast.ai/voices/anime-voice-generator/) presents individual voice identities, personality descriptions, voice filtering and emotion/tone/pace controls. Its page says commercial licensing begins with Basic. [AI Dubbing](https://aidubbing.io/text-to-speech) presents a voice catalogue and emotion selector with trial credits and paid upgrades. These are useful product references, not downloadable free engines. Neither inspected page identifies its underlying model architecture, training corpus, or redistributable voice weights. No claim that we have reverse-engineered their backend or matched their sound is justified.

The product lesson is a stable character voice plus believable acting. A pitch/speed preset or a cute voice name alone does not satisfy that requirement. Anime-style voices are usually human performances; the goal is original stylized acting, not avoiding human source recordings altogether.

## Candidate shortlist

| Candidate | Verified capabilities and licensing | Decision for Ruby |
| --- | --- | --- |
| Style-Bert-VITS2 + JVNV voices | Upstream engine AGPL-3.0, with an LGPL-3.0 dictionary module. Published JVNV F1/F2/M1/M2 models use CC BY-SA 4.0 and provide seven styles: neutral plus anger, disgust, fear, happiness, sadness and surprise. JP-Extra variants exist. | First Japanese emotion baseline. Audition both genders. Not yet an approved anime roster. Preserve code and model licences separately; review distribution boundaries against Ruby's GPL-2.0 before bundling. |
| AivisSpeech Engine + selected AIVM pack | Engine LGPL-3.0; ONNX-oriented local runtime. Model licences vary. Example: Michinoku Airi lists seven styles, a named performer, ACML 1.0 and a 256.76 MB model. | Practical Japanese integration candidate. This is a separately identified publisher voice, not an exclusive Opal voice. Check character/branding permissions and exact release manifest before adoption. |
| Fun-CosyVoice3-0.5B-2512 | Official model card labels weights Apache-2.0; supports English/Japanese/Chinese among nine languages, instruction controls including emotion and streaming. | Multilingual expressive audition candidate. Use reference recordings we can commercially use and distribute. Not a low-resource default until measured on the RTX 2050 laptop. Publisher latency is not our benchmark. |
| Chatterbox Nano / Turbo | Official model cards label weights MIT. Nano is advertised as 110M; Nano/Turbo are English and support native nonverbal tags. Multilingual Chatterbox is a different model. | Optional English experiment, not a Japanese solution. Need a cleared reference voice. Size and latency must be measured before integration. |
| GPT-SoVITS | Repository code MIT; supports reference-conditioned/few-shot speech and training. Current upstream has multiple model generations. | Candidate tool for creating original voices from consented acted recordings. Audit the exact pretrained weights and auxiliary encoders separately. MIT repository code alone does not clear every downloaded asset. |
| Current Kokoro / Supertonic adapters | Already implemented in Ruby. Current speaker selection, pace changes and optional digital doubling do not establish anime acting. | Retain existing functionality while evaluating replacements. Do not relabel current stock voices as newly trained anime packs. |

Source links: [Style-Bert-VITS2 engine](https://github.com/litagin02/Style-Bert-VITS2), [model terms](https://github.com/litagin02/Style-Bert-VITS2/blob/master/docs/TERMS_OF_USE.md), [JVNV model card](https://huggingface.co/litagin/style_bert_vits2_jvnv), [Aivis engine](https://github.com/Aivis-Project/AivisSpeech-Engine), [Airi model](https://hub.aivis-project.com/aivm-models/1b2830f4-8cf1-4184-a0d9-3a1bace3a844), [CosyVoice weights](https://huggingface.co/FunAudioLLM/Fun-CosyVoice3-0.5B-2512), [Chatterbox code](https://github.com/resemble-ai/chatterbox), [Nano weights](https://huggingface.co/ResembleAI/chatterbox-nano), [Turbo weights](https://huggingface.co/ResembleAI/chatterbox-turbo), [GPT-SoVITS code](https://github.com/RVC-Boss/GPT-SoVITS), [GPT-SoVITS model repository](https://huggingface.co/lj1995/GPT-SoVITS).

## Full footprint matters

Aivis documents an initial download of approximately 250 MB for its default voice plus approximately 650 MB for a shared BERT model, before counting its engine. Additional voices can share frontend assets. Its upstream recommends CPU inference over typical iGPU inference; Windows DirectML exists but is not automatically faster.

The inspected Chatterbox Nano file tree totals approximately 3 GB, including alternative decoder files. It lists an approximately 870 MB T3 file and two approximately 1.06 GB decoder files. This is repository inventory, not a claim that every file is required. Determine the exact runtime dependency set before promising an installer size. The 110M label is not a 110 MB complete download.

Sources: [Aivis installation/runtime notes](https://github.com/Aivis-Project/AivisSpeech-Engine), [Nano file inventory](https://huggingface.co/ResembleAI/chatterbox-nano/tree/main).

Keep the base app small and voice runtimes optional, disclose total download/extracted size, and download only the chosen speaker plus shared dependencies. Nothing researched here establishes a sub-100 MB, multilingual, fully expressive anime solution. Browser/mobile feasibility is a separate benchmark, not implied by desktop CPU support.

## Commercial rights: four independent checks

1. Engine source and all shipped runtime dependencies.
2. Exact base weights, auxiliary models and derived voice checkpoint.
3. Training/reference recordings: performer consent, synthesis/training rights, commercial output, model redistribution and adaptation permissions.
4. Character identity/art/branding rights, distinct from the right to generate audio.

[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) permits commercial sharing and adaptation subject to attribution, change notices and ShareAlike for distributed adaptations. This does not make a pack exclusive or remove other rights. Do not make an unsupported blanket claim that every generated WAV, all user text, or Ruby itself automatically acquires the model's licence.

[ACML 1.0](https://github.com/Aivis-Project/ACML/blob/master/ACML-1.0.md) allows commercial model use and redistribution subject to conditions, including use restrictions and accompanying licence text. ACML-NC is a different noncommercial licence and must not enter our commercial default catalogue. ACML is not equivalent to unrestricted MIT/CC0. Do not describe every AivisHub upload as commercially approved.

For original Ruby voices, self-recorded or volunteered performances with explicit documented permission can avoid licensing fees. Hiring an actor, collecting data, training and compute may still cost money. A free runtime does not guarantee free voice production. Never use scraped anime dialogue or paid-service demos as a training/reference shortcut.

## Framework we should build

Extend the existing adapter boundary rather than embedding a specific engine into DDNA:

- DDNA supplies identity and stable personality. Dialogue supplies a short-lived performance request. A sarcastic personality does not force every sentence to sound angry.
- Keep displayed text, translated spoken text, voice identity, emotion, intensity and nonverbal events separate. Language translation must preserve the performance metadata without speaking its tags.
- Each adapter declares tested capabilities: supported languages/styles, native nonverbals, streaming, cancellation and timing output. Map only controls supported by the selected checkpoint/runtime.
- A pack manifest records voice/gender/languages, engine version, model hashes, download sizes, licence notices, provenance and allowed use. Stored defaults refer to stable pack IDs.
- Use a warm worker with bounded memory, sequential audio playback and one bounded prefetch. Cancel both generation and playback on Stop/speaker changes; reject stale results. Do not claim performance improvements until measured.
- Drive expressions from the same performance timeline. Mouth amplitude is the current baseline; phoneme visemes require actual timing support. A subtle optional robot effect comes after an already convincing voice and must retain a clean preview.

Current gap verified in source: `dist/speech-performance.js` turns several cues into pauses/interjections; `dist/speech-queue.js` primarily adjusts synthesis pace. This does not request real emotional styles from the existing native synthesizer. A new voice-library screen cannot repair that missing acoustic capability.

Suggested event shape (design only, not a shipped API):

```json
{
  "requestId": "speech-42",
  "voiceId": "opal-ja-v1",
  "language": "ja",
  "spokenText": "お帰りなさい。待っていましたよ。",
  "emotion": "warm",
  "intensity": 0.35,
  "nonverbalBefore": null
}
```

## Bounded audition and release gates

Start with one pinned official multilingual Chatterbox configuration and original, permission-cleared female/male performance references. Evaluate the same English/Japanese/Chinese scripts. Compare neutral and expressive delivery without assuming every emotional or nonverbal tag transfers between Chatterbox variants. Evaluate Nano/Turbo separately for English only if the complete footprint fits. Keep CosyVoice as the secondary comparison if necessary. Earlier JVNV/Aivis findings remain research references, not default pack approvals. Avoid downloading/training every project at once.

Use identical sentences with different requested emotions; otherwise wording can disguise absent emotion control. Include a warm greeting, excited success, dry sarcasm, gentle concern, a quiet reply, a long response and a real laugh/sigh where supported. Test neutral-to-emotional transitions and preserved voice identity. Original audition lines:

| Intent | English | Japanese | Chinese |
| --- | --- | --- | --- |
| Warm welcome | Welcome back. I saved your place. | お帰りなさい。続きはここからですよ。 | 欢迎回来，我帮你留好了位置。 |
| Excited | We did it! That was amazing! | やった！今の、すごかったね！ | 成功了！刚才真是太棒了！ |
| Dry / teasing | Another all-nighter? Excellent planning. | また徹夜？計画的ですね。 | 又要熬夜？真有计划啊。 |
| Concerned | Take a breath. We can finish this together. | ひと息つこう。一緒に終わらせよう。 | 先缓口气，我们一起完成它。 |

Record first-audio latency cold/warm, total synthesis time, generated duration and real-time factor, peak RAM/VRAM, download/extracted bytes and cancellation latency. Test both CPU-only and available GPU modes on the actual ASUS target, with the LLM loaded too. Capture full first/last sentences to catch truncation. A fast CI machine cannot certify the user's laptop.

Human listening must judge anime styling, pronunciation, emotion contrast, natural nonverbals and speaker consistency. Sarcasm/yandere/tsundere are performance goals, not promised universal engine tags. Retain generated audition WAVs and exact model hashes before choosing defaults. Only after an audible winner and rights review should we integrate automatic pack downloads and publish a new Windows build.

## Status

Completed: reference-page study, source/model licensing shortlist, size pitfalls, current-code gap analysis and an audition/framework specification.

Not completed: audio audition, target-laptop benchmarks, newly trained voices, new engine integration or an updated Windows binary. Current v0.4.8 remains unchanged.

## Selected commercial-distribution direction

The owner's priority is avoiding licensing and voice-rights trouble, rather than selecting the strongest demo regardless of terms. [Chatterbox's official code licence](https://github.com/resemble-ai/chatterbox/blob/master/LICENSE) and [official multilingual model card](https://huggingface.co/ResembleAI/chatterbox) publish MIT licensing. Retain required notices and inspect the complete pinned dependency/weight inventory before packaging. A model-card licence is evidence of the publisher's grant, not a warranty that every training-data or personality right is resolved.

Use original anime-style performances with written permission covering AI synthesis, training/adaptation, commercial output and downloadable voice/model redistribution. Do not use named anime/actor clones, scraped dialogue or paid-service demo recordings. No existing actor recording is approved by this decision. Until suitable recordings and an audible audition are available, do not ship an anime-labelled replacement or claim the voice roster is complete.

Keep AGPL Style-Bert-VITS2/JVNV and custom-restricted Aivis voices out of the default-distribution shortlist for now. This is a product simplicity choice, not a statement that those projects prohibit commercial use. CosyVoice remains a secondary permissively licensed option if the selected route fails hardware or listening checks; reassess explicitly rather than silently switching engines.

The first prototype must measure total download size, CPU/GPU memory and warm/cold first-audio latency with Ruby's LLM loaded. Chatterbox is optional and may exceed the desired voice-pack budget; it is not a promised sub-100 MB or universal low-end default. Self-recorded/volunteered voices can avoid voice-licensing royalties with appropriate permission, but production and compute still have costs. Existing v0.4.8 voices remain in place during evaluation.

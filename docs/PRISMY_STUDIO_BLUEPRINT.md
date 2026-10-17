# Prismy Studio — product and expressive voice blueprint

Accepted direction: 17 October 2026. This document records the next product milestone; it does not mark the features below as shipped.

## Names and continuity

- Studio application: **Prismy Studio**; word-mark candidate **PRISMY STUDIO**.
- Related proposed marks: PRISMY CORE, PRISMY LINK, PRISMY MOBILE.
- Ecosystem working name: **Companion Labs Ecosystem**. This is not a declaration of incorporation or trademark registration.
- Project Ruby remains the existing companion prototype/repository; Kurumi remains its separate ADICE project.
- Keep the native app identifier, saved data paths, DDNA roots, portable brain, installed LLM/VoiceM caches and user preferences during any branding migration. Do not rename/move these silently.
- Terminology: Companion = avatar/body; LLM = dialogue model; VoiceM = speech model; LangM = local translation model.

## What exists in v0.4.7

- Six bodies: five robot designs and Opal's real skinned VRoid base with adapted outfits. Opal's base is CC0, not an exclusively proprietary mesh.
- Local voice-pack downloads, installation/repair status, preview and stop; gender/language-filtered speaker selection; separate text and speech languages.
- Kokoro and Supertonic 3 adapters. Personality currently influences speaker choice, pacing and cue/expression handling. These are not verified full anime acting or emotional synthesis.
- Existing Supertonic character presets must not be marketed as custom anime voices without listening tests. All current Japanese Supertonic defaults selecting the first speaker is a known improvement target.
- No dedicated voice-library screen, reviewed anime/robot pack roster, complete acting controls or audible launch greeting has shipped in this milestone.

## Next bounded implementation sequence

| Order | Deliverable | Acceptance |
| --- | --- | --- |
| 1 | Voice engine/asset audition | Compare the installed lightweight engine with suitable free, commercially redistributable alternatives on identical English/Japanese/Chinese scripts and both genders. Measure first-audio time, synthesis time, RAM/VRAM and download/extracted size on the target laptop. Listen to the actual results; no paid-only custom-voice builder dependency. |
| 2 | Original voice presets | Human-style anime voices for Opal and future humanoids; gentle anime robot voices for EMO-style bodies. Female/male rosters; enthusiastic, warm, calm, playful, dry/picky and sarcastic audition clips. No clones of named anime characters or actors; document asset provenance and redistribution terms. |
| 3 | Personality/performance contract | DDNA supplies persistent personality; current dialogue supplies a bounded transient performance cue. VoiceM renders only supported controls. A speaker label or a speed/pitch change alone does not count as anime acting. |
| 4 | Voice Library area | Settings → Voice Library: browse cards, language/gender/body/installed filters, listen, download/cancel/retry, installed/size/license status, select, set default and restore automatic matching. Shared engine files download once; small speaker/style packs reuse them. |
| 5 | Persistent defaults and greeting | Save a default preset per Companion, body family and voice language. After setup, greeting is enabled by default for the selected Companion. Cache its short synthesized greeting and play once per real application launch when ready; do not wait for an LLM or redownload assets. Provide mute, volume and greeting toggle. |
| 6 | Validate and deliver | Tests cover persona/gender/language matching, missing/corrupt pack recovery, cue fallback, cancellation, ordered first-sentence playback, default persistence and once-only greeting. Inspect/listen in Windows; verify browser autoplay constraints and mobile compatibility separately. Publish web/app from the same stable source. |

### Performance contract

Use structured data such as `{text, emotion, intensity, delivery, nonVerbal}` rather than letting arbitrary model text control the audio engine. Examples: enthusiasm, dry/picky delivery, gentle teasing, calm reassurance, a short sigh. Persistent personality and momentary emotion are separate; a sarcastic Companion can sound excited when appropriate.

Map approved cues to verified engine capabilities; unsupported cues fall back to neutral speech. Do not read `[sigh]` aloud, fabricate a sound the engine cannot generate, or silently remove literal user-requested bracketed text. Keep display text, translation, speech text and acting metadata separate. Stop cancels pending synthesis and playback; voice changes cancel the old speaker queue. Preserve the start of every sentence.

The gentle robot profile is an optional, subtle, tested effect on an original voice, not harsh bit-crushing. Keep speech intelligible and offer a clean preview. Benchmark it before making it the robot default. Default greeting volume should be modest and obey saved mute/volume settings. The browser may need a user gesture before audio can start; report that honestly.

### Engine decision checkpoint

Supertonic 3 is already integrated and is the first audition candidate, not a pre-approved solution. Its publisher documents local ONNX inference, fixed preset styles and simple expression tags, with MIT example code and OpenRAIL-M model weights. The advertised custom voice-style builder offers purchased styles; do not assume arbitrary new anime styles can be generated free using that service. Verify the pinned local runtime/version actually supports any adopted tags. A better free engine/asset can replace it behind the same interface after audition and license checks.

Keep LLM, VoiceM, LangM, preset catalog and rendering/effect adapters pluggable. Required preset metadata: stable id/version, engine/model dependency, languages, gender, intended body family, supported cues, preview samples, transfer/extracted sizes, hashes, source/license notices and commercial redistribution status.

## Business architecture — revised direction

- Preserve an approximately **80% free / 20% premium** product split through an explicit entitlement matrix; it is not yet a measured percentage of shipped features.
- Free core: useful local runtime, local third-party model integration, bundled companion roster, supported overlay interactions, offline speech and portable identity/memory. Cross-platform intent does not imply every OS overlay API is already implemented or validated.
- The requested small installer footprint is a target. v0.4.7's validated Windows ZIP was 29,225,591 bytes; the claimed 34.4 MB extracted footprint has not been established. Optional LLM/VoiceM assets are separate downloads with honest disk requirements.
- **Creator keeps the designated listing price; buyer pays an additional 2% platform fee. This supersedes the earlier 5% creator-side share.** Example: $100 listing + $2 fee = $102 before applicable taxes/payment charges. $2 is gross platform fee, not guaranteed profit. Payment processing, FX, taxes, refunds and chargeback funding need explicit settlement rules that preserve the promised creator payout.
- Creators retain rights they own; use a limited distribution license to operate the store. Do not claim ownership of third-party meshes or automatically verify every uploader. Separate creator participation badges from verified identity/rights badges.
- Premium direction: optional cloud AI/voice/vision, increased asset transfer allowances, one-month companion/content early access, and convenience/update infrastructure. Cloud compute, premium downloads and creator rewards need explicit budgets/entitlements before launch; avoid promises of unlimited paid assets or unbounded cloud tokens.
- Creator milestone rewards: configurable, reviewable thresholds for verified downloads/followers/engagement; anti-abuse checks; auditable premium grants and bounded cloud credits. No automatic financial promises from unverified counters.
- Keep essential security fixes, user-data recovery and a usable stable free release available to all. Paid early access must not strand free users on a known unsafe version.
- Marketplace accounts, checkout, cloud services, subscription enforcement, verified badges and creator reward automation are planned, not implemented.

## Filing brief — proposed scope, not a legal protection guarantee

The supplied Class 009 brief covers downloadable desktop/laptop/tablet/mobile software, local-model orchestration, overlays/widgets/live wallpapers and avatar/voice utilities. Class 035 covers marketplace/retail services for avatar, apparel, texture, personality, voice and interface assets. Retain these as a drafting brief; exact accepted wording, territories, relevant additional service classes and name clearance require separate review before filing.

Trademark classification does not create a utility patent, protect the functional mechanism of a widget, prove the name is available or automatically lock down every app store worldwide. Proposed names are not represented as registered marks. Do not describe planned phoneme/viseme tracking, mobile hooks or cloud services as currently delivered features.

## Sources checked for this planning pass

- Supertonic publisher model card: https://huggingface.co/Supertone/supertonic-3
- USPTO trademark/patent/copyright distinction: https://www.uspto.gov/trademarks/basics/trademark-patent-copyright
- USPTO goods/services and international classes: https://www.uspto.gov/trademarks/basics/goods-and-services

## v0.4.8 implementation checkpoint

The Voice Library, body/language-scoped defaults, personality-specific Supertonic matching, volume/optional gentle robot doubling and cached launch greeting are implemented around the existing engines. The cache stores only short synthetic greetings in local IndexedDB, bounded to eight entries of at most 1.5 MB each; cache failure falls back to synthesis. Preview a greeting to warm it; subsequent launches reuse it without an LLM. Spoken replies, an installed selected pack, greeting enabled and nonzero volume are required. Physical input before automatic playback suppresses the launch greeting; Stop cancels active speech. Native pin/peek/Studio transitions do not retrigger it.

Engine/asset audition and anime performance acceptance remain outstanding. No new trained VoiceM or actor-style asset is bundled in this checkpoint. The gentle robot finish is subtle digital doubling, not a claim that a new expressive model has been trained.

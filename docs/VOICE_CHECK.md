# Check my voice

In the Windows app, open **Settings → Voice & language → Check my voice**. Install the selected voice pack first and unmute playback. **Play two samples** plays the same short built-in line twice in the chosen voice language. No translation, online requests, automatic downloads or greeting-cache playback are used by the check. It shares the normal speech queue and native compute scheduler.

- **First audio** measures from the playback request to its first audio buffer being scheduled. It includes local synthesis, model/reference preparation when needed, queue waiting and Web Audio decoding. It excludes physical output buffering. It is not a time-to-first-token metric.
- **Repeat** repeats the same line immediately. The first sample may already have been warm; these are first/repeat samples, not a guaranteed cold/warm benchmark. Long replies and LangM translation can take more time than these fixed lines.
- **Device** comes from the actual Irodori worker event. Kokoro and Supertonic currently run through the existing CPU-only adapters and are labelled accordingly. Selecting GPU preference does not prove that any layers were offloaded.
- **Stop check**, changing Companion/voice settings, muting, or starting other speech cancels the check. Completed partial measurements remain available, and late callbacks cannot overwrite a newer run. Closing the app releases the native worker as usual.
- **Save report** downloads `prismy-voice-check.json` on explicit request. The report includes application version, time, Companion name, pack/voice/language IDs, status, timing values and reported synthesis device. It has no raw text, conversation, owner memory, audio, local paths, machine IDs or account details. It is held in memory until exported; it is not uploaded or saved automatically.

**Anime · Japanese** selects Irodori's expressive model; **Lighter · Japanese** selects the smaller Supertonic collection. Both preserve text language and require their own explicit download/terms acceptance. Existing per-Companion defaults remain separate by pack, body and language. Preview both and choose the voice you prefer; a faster number does not establish better acting quality.

The website uses the same settings and report presentation but clearly disables native measurements. Browser TTS inference, microphone recognition, thermal/VRAM measurements and automatic hardware tuning are not implemented by this tool. RTX 2050 performance is unverified until measured on that device.

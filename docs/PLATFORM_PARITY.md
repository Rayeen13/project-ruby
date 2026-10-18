# Web and installed-app parity

Shared features must use the same domain contracts and UI modules on web and desktop. Browser restrictions belong in platform adapters, with an accurate explanation and a usable alternative when possible. Do not fork character identity, theme format, memory format, personality or marketplace entitlements by platform.

| Feature | Website | Installed app |
| --- | --- | --- |
| Dashboard, local profile editing and profile backup | Shared | Shared |
| Free-theme Shop discovery/review/install/download | Shared | Shared |
| Fullscreen | Browser Fullscreen API button where supported; browser F11 | Custom-frame button; F11 and Escape |
| Companion selection, outfits, animation and in-page interaction | Shared | Shared |
| Workspace palettes; custom theme editor, import/export | Shared | Shared |
| Theme Shop listing draft export | Shared; unpublished | Shared; unpublished |
| Portable identity/memory and chat UI | Shared | Shared |
| AI and voice provider contracts | Browser-compatible endpoints/engines; connection constraints apply | Managed local engines and downloads plus provider adapters |
| Floating above other apps, global cursor and OS control | Requires an installed host; explain rather than simulate | Native adapters where implemented |
| Downloaded native executables and tray integration | Requires an installed host | Native adapters |

Current parity is not universal browser-local inference: the website cannot launch the app's native AI/VoiceM executables. Both interfaces should expose the same user task wherever browser-compatible processing is available. New features must document such limits and test the shared contract plus relevant platform adapter.

## Alpha to beta acceptance

The public alpha can be demonstrated now. Beta is a reliability milestone, not a feature-count target. Before labelling a release beta, verify:

- A new user completes setup and an actual conversation on each supported platform.
- Character identity and portable memory survive restarts, model changes and backup/import.
- Voice starts promptly, does not lose the opening sentence, and can be cancelled cleanly.
- Companion interaction, docking and chat remain stable; browser-only restrictions are clear.
- Optional downloads are explicit, cancellable and recover after failure; licences are reviewed.
- Theme creation, import/export and removal round-trip without changing Companion identity.
- Installer/update/recovery paths pass on supported Windows systems; responsive web receives browser/device QA.
- Marketplace payments are not advertised as available until real fulfilment, payouts and published terms exist.

Full browser/mobile visual QA, cross-device usability trials and a live marketplace are still pending. Record measured failures and their fixes rather than claiming beta from the number of controls.

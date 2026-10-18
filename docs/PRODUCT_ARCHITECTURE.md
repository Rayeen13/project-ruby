# Prismy Studio product architecture — v0.5.0 alpha

Prismy Studio is the local-first product. A future hosted service supports it without replacing working local features. Current web hosting remains portable static assets; the native wrapper adds explicitly bounded operating-system capabilities.

| Boundary | Current implementation | Future adapter |
| --- | --- | --- |
| Companion identity | `companion-identities.js`, portable DDNA; body-independent gem personality choices | Creator character manifests with validated ownership/identity rules |
| Profile | `UserProfileStore`: bounded local display profile, import/export, atomic storage writes | Authenticated profile service; never treat a local display name as authenticated identity |
| Dashboard | `workspaceSnapshot`, selected AI, voice setting and installed Prism count | Explicit service health and account entitlements when available |
| Prisms | Validated data-only theme store and injected lifecycle | Integrity-checked download/update service; executable plugins still need isolation |
| Shop | Injected `list()` catalogue of three original free themes, licence/size review, explicit install and download | Server catalogue, authenticated uploads, moderation, checkout, fulfilment, payment webhooks and payouts |
| Window | Small host adapter, native custom frame and fullscreen; standard browser Fullscreen API | Additional supported native platform adapters |

No fake accounts, cloud sync, sales, purchases, ratings or entitlements are generated. Local profiles are not sent to a server or automatically inserted into LLM prompts. Profile backup is distinct from portable Companion memory. Optional packs are never installed merely by opening Shop or viewing a listing.

## Identity ownership

Each gem has its own name, colour, gender, adult fictional age, default personality and voice selection namespace. A robot shell changes appearance and animation, not the gem identity or age. Humanoids are complete character entities: Opal always resolves to Opal, never Ruby or Saph inside Opal's body. Her default character is a witty anime maid android. Users can select personality and voice overrides, retained per identity. Switching back restores the chosen robot gem and last robot body.

Old per-body personality preferences migrate to the active identity and preserve Opal's saved personality. Existing DDNA roots and conversation storage are retained. New context uses the corrected character identity; historical mislabeled messages are not rewritten as if Opal spoke them.

## Server and domain migration

No domain or server purchase is required for current features. When infrastructure is available: serve the same static web build over HTTPS, configure a backend base URL through a narrow service adapter, add real authentication/session management, then implement catalogue uploads and payment/payout reconciliation. Native applications can use the same versioned HTTP contracts. Keep local profile/memory separate from cloud synchronization and require explicit user opt-in before upload.

An external service must independently verify sessions, publisher rights, uploads, prices, payment state and entitlements. Client declarations and listing drafts never authorize a payment or grant ownership. Secrets and payment credentials belong on the server. Live sales remain a future milestone.

## Limits

This is a larger alpha, not an automatic beta designation. Legacy renderer/chat orchestration is not fully extracted into Prisms. Windows is the currently tested native platform; browser/mobile visual QA, cross-device usability, hosted accounts and live payments remain pending.

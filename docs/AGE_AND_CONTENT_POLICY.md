# Companion age, voice selection and content policy

Status: implementation specification and proposed product policy, version 0.1-draft, 2026-10-17 UTC. Not enforced by the current v0.4.8 binary. See TERMS_DRAFT.md for proposed customer wording.

## Product decision

Project Ruby / Prismy Studio will not provide sexual/NSFW content. Paid subscriptions, custom packs, developer mode, an adult age selection, and a proposed ownership purchase do not unlock an exception in the official product or services. Mature content means optional nonsexual mature themes; it is not a promise of an official film/game rating. Do not label the setting with a jurisdiction-specific rating such as R without appropriate classification review.

The initial account/service proposal is adults only (18+, or a higher applicable local threshold). This is a product choice pending launch review, not an assertion that checking a box proves age or satisfies every country's requirements. A service for minors needs a separately designed privacy, parental-consent and age-assurance flow before launch.

## Keep three different concepts separate

| Concept | Meaning | Rule |
| --- | --- | --- |
| User eligibility | The real user's eligibility to access an optional mature feature/service | Never inferred from Companion age. Self-attestation is not verified age. |
| Companion age | Fictional character's canonical or permitted configured age | Store in DDNA separately from voice settings. Child/teen canon cannot be overwritten to unlock mature interactions. |
| Voice presentation | Auditioned age band conveyed by a particular voice preset | A creative description, not a claim about a performer's biological age. Changing pitch is not age verification or a validated age conversion. |

Users may choose among reviewed adult presentation bands: 18–24, 25–34, 35–49 and 50+. These are initial catalogue categories, not evidence that current stock speakers have been auditioned into those bands. Only show available, reviewed combinations for the selected language, gender and Companion. Permit an exact fictional adult age only within that Companion's approved configuration bounds; display it separately from the voice presentation band.

Do not expose a voice-age slider that turns any voice into any age. A missing or unsupported band shows an unavailable state; do not silently use a childlike or incompatible pack. Preserve existing adult defaults until reviewed packs exist. The existing chibi character has child canon in source; it must remain in a family-safe context and must not inherit adult permissions from its gem's adult profile.

If the body, canonical age, voice presentation or biography depicts a minor, or age is ambiguous, apply the more restrictive family-safe policy. An adult number in a manifest cannot override an obviously child/teen character. All sexualized depictions or interactions involving minors or childlike characters are prohibited, including fictional characters and attempts to relabel them as adults.

## Proposed content settings

| Mode | Intended scope | Conditions |
| --- | --- | --- |
| General | Nonsexual everyday conversation, work, learning, gaming and companionship | Default for everyone eligible to use the product. |
| Mature themes | Nonsexual mature language/topics subject to the published policy | Optional, off by default, eligible adult users, adult-presenting Companions only. |
| Sexual / NSFW | Not offered in the official product/services | No paid bypass; no child sexualization under any circumstances. |

Both allowed modes must support legitimate medical, educational and protective discussions in appropriate, non-erotic language. Do not treat all mentions of bodies, consent or abuse as sexual entertainment. Existing `censored`/`uncensored` labels must be migrated to accurate descriptions; neither stored value should imply permission to violate this policy.

## Pack and runtime requirements

Add separate metadata for canonical age/bounds, apparent-age classification (adult/minor/ambiguous), reviewed voice presentation band, permitted content modes, review status, language, performer-rights evidence reference and manifest version. Do not expose private performer documents in public manifests; expose only the review outcome and attribution the performer permits. Uploaded claims alone are not verification.

Validate at catalogue filtering, selection/import, migration and immediately before synthesis. Enforce the same policy for typed speech, generated speech, translated text, saved greetings, batch/export and any future cloud route. Imported DDNA/memories, an LLM prompt, a paid entitlement or edited local preference must not be the source of permission. Switching to a family-safe body/voice cancels incompatible pending speech and invalidates incompatible cached greetings. Default to General for missing or invalid metadata.

Keep policy checks outside personality prompting. Use input/output checks appropriate to the feature and prevent disallowed speech before playback; evaluate streaming for partial-output leakage. Offline checks have limitations: do not market any local classifier as infallible or tamper-proof. A source-available local application cannot guarantee that modified third-party forks follow the official product's rules.

## Acceptance flow to implement

1. Show concise terms, content-policy and privacy links before first active setup; allow reading them before acceptance. Checkboxes are unselected. Declining stops optional setup/download/service actions and leaves existing user files intact.
2. Record explicit acceptance of a published version/hash and timestamp. Record policy version separately from a model's third-party licence. Re-prompt for material changes before newly affected actions, without deleting data or pretending acceptance was retroactive.
3. Keep separate opt-ins for mature themes, external internet/cloud requests, optional diagnostics and performer voice-cloning/creator agreements. Do not bundle them into a mandatory checkbox or assume terms acceptance authorizes uploading chats, memory or recordings.
4. Record only the minimum eligibility result needed. Avoid collecting exact birthdays or identity documents by default. If stronger age assurance is needed for a market/feature, define its verified method, processor, retention and privacy notice before enabling that feature. Never describe an offline checkbox as verified adult status.
5. Store local receipt `{termsVersion, termsHash, contentPolicyVersion, privacyVersion, acceptedAt, eligibilityMethod, adultEligible, matureThemesOptIn}`. No full birth date is required by this proposed receipt. Local receipts are not tamper-proof evidence; server services need their own versioned acceptance records and access controls.
6. Settings must allow reading/exporting the receipt, disabling mature themes/cloud/internet, managing local memory and stopping speech. Do not upload a local receipt without explaining the service need and privacy basis.

## Release checks

Before these controls are described as shipped, test invalid/out-of-range/imported ages, the child-canon chibi case, an adult gem on a childlike body, unknown pack metadata, family/adult switches during queued and cached speech, translation routes, direct TTS input, paid-tier bypass attempts, acceptance persistence/version changes/decline, and data preservation. Add acoustic review for every advertised voice-age band. Publish no age-filtered catalogue claim before the assets are actually reviewed.

## Legal and open-source boundaries

Customer service/marketplace rules do not amend GPL-covered software rights. Keep the repository's GPL-2.0 text and third-party grants intact; do not add a contradictory field-of-use restriction to that licence. The [GNU GPL FAQ](https://www.gnu.org/licenses/old-licenses/gpl-2.0-faq.html) explains the prohibition on additional restrictions. Services and assets we control need properly scoped separate terms. An ownership transaction cannot convey rights we do not own or remove third-party grants.

Launch review must check applicable child privacy, age-assurance, consumer, marketplace and content obligations in each distribution territory. Terms and user responsibility statements are not substitutes for compliance or technical controls. Operator identity/contact, billing/refunds, privacy/retention details and any required reporting process remain unresolved and must be finalized before public acceptance or checkout.

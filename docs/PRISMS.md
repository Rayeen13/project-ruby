# Prisms — modular extensions for Prismy Studio

Each plugin is a **Prism**, represented by a gem. Companion gem identities (Ruby, Saph, etc.) remain identity data, distinct from extension IDs.

## Included versus optional

The default bundle includes the workspace appearance capability and its eight built-in themes. Everything outside the documented default bundle is opt-in. Discovery, viewing a listing or selecting a file does not install or activate a Prism. Installation requires a visible action after review. Dependencies, transfer/extracted size, licence and permissions must be shown before any future network installation. Do not auto-download optional modules because a Companion, conversation or imported identity mentions one.

User choice does not certify a creator's rights, authorize unrelated data access or eliminate the platform's responsibilities. The official product's content/asset rules and third-party licences continue to apply. No optional pack may silently change DDNA, upload memories or override a safety policy.

## Implemented v1: local theme Prisms

App → Prisms accepts a local `.prism.json` file of at most 24 KB. It shows the creator, version, actual file size, creator-supplied licence and scope before Install. Cancel installs nothing. Install saves the pack locally without activating it. Use theme applies it; Remove deletes its installed data and restores Ametrine if it was active. Companion preferences/identity are untouched. Installed Prisms and selected appearance survive restart; storage failure leaves the previous installed set intact and reports an error.

V1 packs are data only: a fixed set of six-digit colour tokens and metadata. They cannot contain scripts, URLs, arbitrary CSS, native binaries or permission requests. Unknown fields, unsupported versions, bad colours, inadequate text/button contrast, duplicate IDs and reserved IDs are rejected. Review does not establish that the creator's stated licence or provenance is correct. Invalid saved content is not executed or silently overwritten. Maximum installed theme packs: 12.

An example, Ametrine Night, is offered as a separate explicit file download and is not preinstalled or activated. Its small JSON example is bundled as a downloadable template, not as an installed optional Prism. No marketplace, automatic downloader, billing or executable plugin installer is implemented by this milestone.

## SOLID boundaries

| Responsibility | Module / contract |
| --- | --- |
| Trusted runtime extension lifecycle | `prism-host.js`: register, start, stop, stopAll, get, list |
| Composition and dependency injection | `studio-prisms.js`: explicit registration of included implementations; test substitutions |
| Workspace appearance | `studio-appearance.js`: built-in/custom palette application and selected-theme persistence |
| Data schema and installed theme persistence | `theme-prisms.js`: validation, parsing, storage and bounded token application |
| User review/install/use/remove UI | `prism-manager.js`: explicit actions; receives the store and appearance interface |
| Lab navigation and beginner shortcuts | `lab-shell.js`: routes existing actions, independent of the extension lifecycle |

Single responsibility keeps validation, storage, presentation and lifecycle separate. Open/closed extension happens through descriptors and provider interfaces. Implementations must satisfy shared lifecycle/behaviour tests rather than relying on a particular renderer. Small APIs avoid requiring a theme to implement speech or native control. Dependency inversion keeps the host free of DOM/Tauri/Three.js/LLM imports; the composition root supplies concrete services.

The runtime host orders declared dependencies, rejects duplicate/missing/cyclic modules, serializes lifecycle changes, avoids double mounting, rolls back newly mounted modules on startup failure, blocks stopping active prerequisites and disposes in reverse order. Cleanup errors do not prevent attempting the remaining cleanup. Modules must clean their own partial effects when their mount throws before returning. This is trusted in-process code orchestration, not a security sandbox.

Only included, explicit code imports currently use this lifecycle. **The existing rendering/chat/native orchestration is not yet fully migrated into Prisms.** Do not claim a complete third-party executable-plugin ecosystem or perfect SOLID conformance across legacy files.

## Future extension contract

For future executable/mesh/AI/voice tools, retain separate validated manifests with stable IDs, API versions, publisher/provenance, licence, hashes, capabilities, permissions, dependencies, size budgets and platform requirements. Runtime interfaces should expose only the narrow services a Prism needs. Use explicit trusted adapters and least privilege; do not expose unrestricted Tauri IPC through a generic plugin context.

Untrusted executable Prisms need an isolation model, authenticated package integrity, per-capability grants/revocation, resource limits, update/rollback and compatibility rules before support is enabled. A declaration or signature alone is not a sandbox. Third-party code execution, network repositories, automatic dependency acquisition, marketplace moderation and plugin billing remain unimplemented.

Extraction order for future work: keep existing LLM/VoiceM/LangM provider interfaces, then extract conversation orchestration, rendering/animation, portable identity/memory, native overlay and creator tools behind explicit contracts. Preserve backups, cancellation and native regression coverage at each step. Optional mesh editing stays outside the default companion runtime until ready.

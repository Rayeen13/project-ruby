# Offline model evaluation — 13 October 2026

## v0.4.4 selected conversation pack

The managed pack is now Qwen2.5-1.5B-Instruct Q3_K_M (official Qwen conversion). GGUF revision `91cad51170dc346986eccefdc2dd33a9da36ead9`, model SHA256 `58cb5c05ecef48e82961f1a2be6544145ea26136f69dddda4bbbd092f0e4b993`, 924,455,968 bytes. Upstream revision `989aa7980e4cf806f80c7fef2b1adb7bc71aa306`; publisher tokenizer template SHA256 `cd8e9439f0570856fd70470bf8889ebd8b5d1107207f67a5efb46e342330527f`. Both publisher and conversion identify Apache-2.0. The full upstream licence and README are retained during download. The pinned llama.cpp b11433 CPU runtime and its licence are unchanged.

This upgrade is measured with the dialogue-grounding layer; it is not evidence that weights alone fix every instruction/language failure. Smaller 0.5B/0.6B/0.8B trials continued to drift on the supplied conversation. Exact repeats are host text operations and two romaji inputs have authored meaning normalization. Reports must distinguish those paths from free LLM generation. No Japanese fluency, general accuracy or physical-laptop speed guarantee is made. Earlier experiments below are historical.



No default model is approved. The app now includes an experimental local-server conversation adapter; a separately downloaded candidate can be tested without approving a bundled default. Current eligibility requires commercial use and selling Ruby without a mandatory model royalty; MIT is no longer mandatory. The inference runtime cannot change the weight licence. Preserve the exact upstream copyright/licence and separately inspect tokenizer and converted model provenance before redistributing a pack.

## Initial shortlist under the earlier MIT-only rule

| Candidate | Primary-source finding | Decision |
| --- | --- | --- |
| SmolLM2-135M-Instruct | Apache-2.0 weights. | Excluded by the requested MIT-only weight rule. |
| LFM2.5-350M | LFM Open License v1.0, not MIT. | Excluded by the MIT-only rule. |
| Microsoft BitNet b1.58 2B 4T official GGUF | MIT weights, but the published GGUF is approximately 1.19 GB; its card identifies a LLaMA 3 tokenizer. | Does not fit the 1 GB complete-product target as published. Do not assume the training precision is its download size; tokenizer provenance also requires review. |
| Microsoft Phi-1.5 | MIT upstream weights/repository notice. The publisher explicitly says it is not instruction fine-tuned and is primarily English. | Experimental CPU baseline only. |
| Phi-1.5 Q4_K_M conversion | mradermacher identifies the original Microsoft model and MIT; the individual file is approximately 894 MB. | Benchmark the checksum-pinned bytes. No default approval or redistribution approval implied. |

## November voice candidates — audit only

- Original OpenAI Whisper tiny: OpenAI explicitly licences both original code and model weights under MIT. Some Hugging Face Whisper conversion cards instead display Apache-2.0; retain the exact original-source notice and checkpoint provenance rather than assuming all distributions have identical metadata. Whisper tiny is a 39M-parameter ASR candidate. Actual converted pack bytes, tokenization assets, CPU latency and language accuracy remain November checks.
- MyShell MeloTTS English: the publisher's weight repository declares MIT and the MeloTTS library has an MIT notice. The card's library licence sentence alone is not proof of every auxiliary checkpoint, pronunciation dictionary or bundled runtime. Keep it as a voice-output candidate pending the complete asset/licence audit, size measurement and speech tests. No speech pack is approved or bundled.

Voice remains mandatory in November; these are candidates rather than a claim that microphone capture or spoken replies already work.

## Reproducible Windows experiment

`models/evaluation.json` records the exact GGUF SHA256, upstream and conversion repositories, runtime release, two CPU threads, zero GPU layers, 2,048 context tokens and 96 reply tokens. The job resolves and records immutable repository revisions before downloading, checks both repositories against the configured, reviewed weight licence and archives the actual upstream licence notice, archives available tokenizer evidence, and verifies the model hash. The official llama.cpp CPU release is selected from its tag's API response and checked against the published asset SHA256.

Run `python scripts/evaluate-model.py` on Windows, or use **Offline model evaluation** in GitHub Actions. This is an explicit experiment downloading approximately 894 MB of model data plus a native runtime, not an app startup operation. Python's standard library is sufficient; no Torch install or remote model code is executed. Cache/results directories are ignored by Git. The evidence artifact excludes the weights and runtime executables.

The local inference server listens only on 127.0.0.1. Once downloads finish, generation sends prompts only to that local server. This measures local inference; it is not a separately verified no-network restart test.

Reported metrics: cold process/model readiness, client-observed first non-empty streamed text, full request duration, the server's generation/prompt timing and token counts, and Windows peak process working set. Initial model load is separate from per-request latency. Seven prompts probe greeting, persona instructions, context recall, explanation, arithmetic, uncertainty and Hindi/Hinglish. Raw answers are retained for human review; a successful workflow means the experiment ran, not that the model passed product quality.

## Approval gates

- Model weights allow commercial use and selling Ruby without mandatory model royalties; upstream licence/copyright retained; tokenizer and conversion correspondence reviewed.
- Coherent short conversation, usable instruction following and context recall; no invented claim of using internet or controlling the PC.
- Ruby application package within 1,000,000,000 bytes. Prefer a compact default model tier. Optional, explicitly selected external model packs may be larger and must display their separate download/disk/RAM requirements; see the updated packaging decision below. Peak RAM is a separate measurement.
- Acceptable load/first-token/throughput on a modest CPU laptop and the user's Ryzen 7 machine. A hosted runner is not a laptop/iGPU benchmark.
- Cancellation, unload, offline restart and corrupted-download recovery verified before app integration is called ready.

The 100 MB model tier remains a preferred goal, not a guarantee of useful conversation. No tested speed value should be presented as a promise for every PC. Speech recognition/output licence and performance selection remain part of the mandatory November voice work.

## Primary sources

- https://huggingface.co/HuggingFaceTB/SmolLM2-135M-Instruct
- https://huggingface.co/LiquidAI/LFM2.5-350M
- https://huggingface.co/microsoft/bitnet-b1.58-2B-4T-gguf/tree/main
- https://huggingface.co/microsoft/bitnet-b1.58-2B-4T-gguf
- https://huggingface.co/microsoft/phi-1_5
- https://huggingface.co/microsoft/phi-1_5/blob/main/LICENSE
- https://huggingface.co/microsoft/phi-1_5/blob/main/tokenizer_config.json
- https://huggingface.co/mradermacher/phi-1_5-GGUF
- https://huggingface.co/mradermacher/phi-1_5-GGUF/blob/main/phi-1_5.Q4_K_M.gguf
- https://github.com/ggml-org/llama.cpp/releases/tag/b11433
- https://github.com/openai/whisper
- https://huggingface.co/openai/whisper-tiny
- https://huggingface.co/myshell-ai/MeloTTS-English
- https://github.com/myshell-ai/MeloTTS/blob/main/LICENSE

## Measured result and decision

Source: successful [Windows run 38395605277](https://github.com/Rayeen13/project-ruby/actions/runs/38395605277), benchmarked code commit `ee55358550f634d0514ee9f8539faf214c261ca1`. Full raw samples and exact revisions are in [benchmarks/windows-phi-1.5-20261013.json](benchmarks/windows-phi-1.5-20261013.json).

| Measurement | Observed value |
| --- | --- |
| Quantized weight file | 893,547,904 bytes (893.55 MB) |
| Runtime ZIP | 19,399,521 bytes |
| Extracted runtime EXE/DLL total | 49,477,632 bytes; includes tools not all needed by a future pack |
| Initial model/server readiness | 1.13 seconds after launch; downloads excluded |
| First streamed non-empty text | 0.251–0.407 seconds across seven short prompts |
| Server generation throughput | 25.2–28.7 tokens/sec |
| Peak process working set | 1,914,306,560 bytes (1.91 GB / 1.78 GiB) |
| Host/configuration | Windows Server 2025, AMD family 25 model 1, 4 logical CPUs; 2 inference threads, CPU only, 2,048 context tokens |

The small weights alone do not imply small RAM usage. The model plus all extracted runtime executables total 943,025,536 bytes before the application and other assets. This is a component count, not a validated complete-product size or an installer size.

**Decision: reject as Ruby's default conversation model.** The greeting and supplied-name recall probes were coherent. Identity and two-sentence explanation probes drifted into unrelated workbook exercises; the identity reply also addressed the user as Ruby. Arithmetic started correctly but continued with unrelated exercises. The uncertainty probe admitted it could not supply exact weather but then offered area-specific information without a location. The Hindi/Hinglish request received an English reply. These are seven deterministic smoke probes, not a general accuracy benchmark, but the basic instruction failures are sufficient to withhold default approval.

Upstream revision: `77aa61eeac94fbf33d492b9f2744c98b42d5b5eb`. GGUF conversion revision: `fb3f2464a557228caf113b4d6ca7bebb2dc6c08c`. Model/runtime hashes matched the configured pins. The artifact preserves actual upstream tokenizer files and the Microsoft and llama.cpp MIT notices. Cancellation, download recovery, tokenizer conversion correspondence, actual laptop/iGPU measurements and full product packaging remain open.

The first experiment attempt correctly stopped before inference because semantic release `v0.6.0` only provided a nightly-tag pointer rather than the CPU asset. The corrected configuration pins actual build `b11433` and its published CPU-archive SHA256. No failed run was used as a performance result.


## Earlier instruction-tuned experiment: Shunya-0.5B

The earlier Shunya experiment evaluated `vivekmarakana/shunya-0.5b-instruct` at revision `80dbaa0866f6177240db4bc8b27e3f21313d9345`, using the checksum-pinned mradermacher Q4_K_M conversion (approximately 315 MB). The earlier Phi configuration is retained in `models/evaluations/phi-1.5.json`. No default has changed.

Both the base and instruction-tuned publisher cards declare MIT, and the base is described as trained from scratch. However, the instruction-tuned repository does not include a full `LICENSE` copyright notice at this revision. The benchmark permits an explicit **publisher-declaration research-only** case, archives the declaration, and records `licenseNoticePresent: false` and `redistributionApproved: false`. This does not relax the product's licence/redistribution approval gates. Tokenizer provenance and training-data terms also remain review items. Do not substitute an invented copyright notice or bundle this candidate.

The runner verifies that the GGUF chat template exactly matches the archived upstream `tokenizer_config.json`, applies it through llama.cpp's `/apply-template` endpoint, and retains the rendered prompt and input messages. This avoids measuring an instruction model using the old base-model `User:/Assistant:` format. The same seven probe intents, two threads, 2,048 context and 96-token reply cap are retained. Performance comparisons are approximate across separately allocated hosted runners.

Sources:
- https://huggingface.co/vivekmarakana/shunya-0.5b-instruct
- https://huggingface.co/vivekmarakana/shunya-0.5b-base
- https://huggingface.co/vivekmarakana/shunya-0.5b-instruct/tree/80dbaa0866f6177240db4bc8b27e3f21313d9345
- https://huggingface.co/mradermacher/shunya-0.5b-instruct-GGUF/blob/main/shunya-0.5b-instruct.Q4_K_M.gguf
- https://github.com/ggml-org/llama.cpp/blob/b11433/tools/server/README.md

### Shunya measured result and decision

Source: successful [Windows run 38432260383](https://github.com/Rayeen13/project-ruby/actions/runs/38432260383), measured code commit `e9c3bd028073b8676b9095183ca31e60d5bf9d2a`. Full raw replies, messages, rendered prompts and metadata: [benchmarks/windows-shunya-0.5b-20261013.json](benchmarks/windows-shunya-0.5b-20261013.json). Both model and runtime SHA256 pins matched, and the embedded chat template matched the upstream template exactly.

| Measurement | Observed value |
| --- | --- |
| Q4_K_M weights | 314,656,736 bytes (314.66 MB) |
| Model plus all extracted runtime EXE/DLL | 364,134,368 bytes; application and other assets excluded |
| Initial model/server readiness | 0.64 seconds after launch, downloads excluded |
| First non-empty streamed text | 0.313–0.353 seconds |
| Server generation throughput | 40.0–41.2 tokens/sec |
| Peak process working set | 624,574,464 bytes (624.57 MB) |
| Host/configuration | Windows Server 2025, Intel family 6 model 207, 4 logical CPUs; 2 inference threads, CPU only, 2,048 context |

**Decision: reject as Ruby's default conversation model.** Greeting was coherent and the weather answer acknowledged the absence of live data. The identity response did not adopt Ruby's name and included an insulting, malformed continuation. The explanation confused a computer mouse with preparing a meal. The arithmetic answer repeated the question and failed to produce five. Context recall repeated the correct name but used the assistant's first person rather than identifying the user. The Hindi probe simply echoed the input. These seven deterministic probes are sufficient to withhold approval; they do not establish a general accuracy score.

The smaller model used substantially less RAM in this experiment, but the Phi and Shunya runs were allocated different CPU families. The throughput difference is not a controlled same-hardware comparison or an estimate of laptop/iGPU performance. The licence notice remains missing (`licenseNoticePresent: false`), and redistribution remains explicitly unapproved. No weights were added to the repository or app.

Conversion revision: `ba7b28eea72b5d1e3eed2484289fe5ae495bb9d7`. The benchmark artifact contains the publisher declaration, tokenizer files, server properties and runtime notice, but no model weights or runtime binaries. Complete product packaging, real laptop performance, cancellation and offline restart remain future gates after a viable candidate is found.

## Updated packaging decision and external tools

On 13 October, Riyan approved **optional larger model packs outside Ruby's application package**. The app still targets less than 1 GB; under-1 GB models remain preferred where useful. The existing 1 GB download cap applies to this small-candidate experiment, not to every future optional backend. No external download is automatic, no default model is approved, and the MIT-only model-weight requirement described at that point was subsequently broadened below.

Assuming the suggested names refer to JustVugg/colibri and bradAGI/soup:

| Tool/model | Role and source findings | Ruby decision |
| --- | --- | --- |
| Colibri | A runtime for large models that streams routed experts from disk; a small engine does not mean small weights. Its current catalogue lists chat downloads of 19 GB and larger, and its code is Apache-2.0. The local gateway exposes an OpenAI-compatible endpoint. | Candidate for an optional, separately installed local backend. Review the actual selected model's weight licence and hardware requirements; no model installed or benchmarked here. |
| Soup | A fine-tuning tool with serving/export support and an OpenAI-compatible server; code is Apache-2.0. Layer streaming reduces GPU residency during training rather than converting a large base into a tiny standalone model. | Candidate for the later assistant studio/training workflow or a separately running local server. It does not itself provide an approved chat model. |
| OpenAI gpt-oss-20b | Official model card reports a 12.8 GiB checkpoint; Apache-2.0 weights. | Now eligible for licence review under the broadened policy below, but its 12.8 GiB checkpoint remains far above the preferred small-model tier. |
| GPT-2 small | A smaller GPT-family text-generation model; the Hugging Face model card declares MIT. It is a pretrained base model rather than a ready companion chat model. | No default approval. A specific chat fine-tune and its weight/tokenizer provenance would need evaluation; do not assume the GPT name guarantees useful conversation. |

Keep inference providers pluggable behind one conversation interface. A future localhost adapter can support separately installed servers without placing training frameworks or large weights inside Ruby's application. Browser access needs a configured reachable service and explicit connection handling; web/mobile offline inference is a separate runtime requirement. This is an architecture decision, not a claim that chat or either backend is integrated today.

Sources:
- https://github.com/JustVugg/colibri
- https://github.com/JustVugg/colibri/blob/main/LICENSE
- https://github.com/bradAGI/soup
- https://deploymentsafety.openai.com/gpt-oss/a2
- https://huggingface.co/openai-community/gpt2

## Current licence policy and Qwen experiment

Riyan explicitly broadened eligibility on 13 October: models need not be MIT provided their terms allow commercial use and selling Ruby without mandatory model royalties. Prior MIT-only exclusions are historical and must be reconsidered under the current policy. No licence implies zero notice obligations or unrestricted trademark rights. MIT and Apache-2.0 are the initial reviewed families; custom licences are reviewed individually. Runtime/source licences and model licences remain separate.

The current experiment uses the **official Qwen/Qwen2.5-0.5B-Instruct-GGUF Q4_K_M**, approximately 491 MB, under Apache-2.0. The runner checks both publisher declarations against Apache-2.0 and retains the actual full upstream licence and available notice files. It explicitly loads the publisher's archived chat-template file rather than assuming an older embedded conversion template is identical; server properties must match it before generation, allowing only the trailing line endings removed by the runtime file loader. Both original template hashes are retained. The two-thread Windows CPU configuration and seven probe intents remain unchanged. No app default or redistribution approval is inferred from a successful run.

Sources:
- https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct
- https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF
- https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/blob/main/qwen2.5-0.5b-instruct-q4_k_m.gguf
- https://www.apache.org/licenses/LICENSE-2.0

The first Qwen attempt stopped before generation because the runtime removed one trailing newline from the template file. Inspection of the evidence confirmed all other bytes were identical. The comparison now ignores only final CR/LF characters and still rejects changes to indentation or Jinja instructions. No failed run is used for quality or speed claims.

### Qwen publisher-default baseline

[Run 38434286282](https://github.com/Rayeen13/project-ruby/actions/runs/38434286282), code `cb82ac0b8e3d5c427088540f382ce171bde6c689`, measured 491,400,032 bytes of weights, 52.1–55.5 tokens/sec, 0.203–0.301 seconds to first non-empty text, and 536,346,624 bytes peak working set on a Windows Server 2025 AMD family 25 model 17 host. Both checksum pins and the Apache licence-notice check passed. Raw evidence is [benchmarks/windows-qwen2.5-0.5b-20261013.json](benchmarks/windows-qwen2.5-0.5b-20261013.json).

The mouse explanation followed the two-sentence request and arithmetic answered five. The default template inserted a system instruction naming Qwen, while the identity request only named Ruby in the user message; the reply retained Qwen and ignored the one-sentence limit. Name recall incorrectly answered Qwen instead of Riyan. The Hindi probe was repetitive and reached the reply cap. The weather answer refused without inventing live data, but did not explain the missing-data issue. This baseline does not pass companion quality.

A follow-up uses an explicit **Ruby system message**, matching the intended app persona configuration and replacing the publisher's default Qwen identity. All seven user probe intents and resource settings remain unchanged. The runner records the effective messages and system configuration, so this follow-up is distinguished from the retained default-template baseline. A system prompt is not proof of reliable name recall; inspect the new raw replies before any selection decision.

### Qwen Ruby-persona result: advance to integration testing

Source: [Windows run 38434720219](https://github.com/Rayeen13/project-ruby/actions/runs/38434720219), code `fe13b82aabdeb5d6908eb0781a719c7b382caaae`. Full raw replies, effective system/user messages and measured timings: [benchmarks/windows-qwen2.5-ruby-persona-20261013.json](benchmarks/windows-qwen2.5-ruby-persona-20261013.json). The weight/runtime pins, Apache-2.0 notice check and upstream-file template check passed. The report continues to set `defaultApproved: false` and `redistributionApproved: false`.

| Measurement | Observed value |
| --- | --- |
| Q4_K_M weights | 491,400,032 bytes (491.40 MB) |
| Weights plus all extracted runtime EXE/DLL | 540,877,664 bytes; application and other assets excluded |
| Initial model/server readiness | 0.945 seconds after launch, downloads excluded |
| First non-empty streamed text | 0.630–0.777 seconds |
| Server generation throughput | 42.6–47.9 tokens/sec |
| Peak process working set | 536,694,784 bytes (536.69 MB) |
| Host/configuration | Windows Server 2025, AMD family 25 model 1, 4 logical CPUs; 2 inference threads, CPU only, 2,048 context; explicit Ruby system persona |

**Decision: advance Qwen2.5-0.5B Q4_K_M as an English chat integration candidate, not a production-approved default.** The greeting was coherent; context recall correctly answered Riyan; the mouse explanation was relevant and followed the two-sentence request; arithmetic answered five; and the weather response explicitly acknowledged missing location and live data. The introduction used the robot-companion role but omitted Ruby's name and added a greeting, so it did not completely satisfy the strict name/one-sentence criterion. Hindi remained weak and partly echoed the request. Do not claim all seven criteria passed or advertise reliable Hindi support.

The explicit Ruby system message is a required part of this evaluated configuration. The original publisher-default run failed name recall and persona behaviour and remains preserved. These seven probes do not establish general reliability, tool-use accuracy or hardware compatibility. The different hosted CPU allocations and prompt lengths mean the baseline and persona throughput/first-text numbers are not a controlled prompt-only comparison.

Next gates: implement a pluggable streamed-chat adapter with cancellation and failure handling, then verify actual local offline restart, unload, pack/tokenizer correspondence, complete packaged size, and physical laptop performance. Model output remains text; it must not execute desktop actions directly. No weights or backend were added to the current app in this change.

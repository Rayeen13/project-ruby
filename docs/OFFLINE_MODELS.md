# Offline model evaluation — 13 October 2026

No default model is approved. The app remains an interactive companion viewer while the model gate is evaluated. MIT means the model weights must actually be MIT; a permissive inference runtime cannot change a weight licence. Preserve the exact upstream copyright/licence and separately inspect tokenizer and converted model provenance before redistributing a pack.

## Initial shortlist

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

`models/evaluation.json` records the exact GGUF SHA256, upstream and conversion repositories, runtime release, two CPU threads, zero GPU layers, 2,048 context tokens and 96 reply tokens. The job resolves and records immutable repository revisions before downloading, checks both repositories' declared MIT metadata and the actual upstream MIT notice, archives available tokenizer evidence, and verifies the model hash. The official llama.cpp CPU release is selected from its tag's API response and checked against the published asset SHA256.

Run `python scripts/evaluate-model.py` on Windows, or use **Offline model evaluation** in GitHub Actions. This is an explicit experiment downloading approximately 894 MB of model data plus a native runtime, not an app startup operation. Python's standard library is sufficient; no Torch install or remote model code is executed. Cache/results directories are ignored by Git. The evidence artifact excludes the weights and runtime executables.

The local inference server listens only on 127.0.0.1. Once downloads finish, generation sends prompts only to that local server. This measures local inference; it is not a separately verified no-network restart test.

Reported metrics: cold process/model readiness, client-observed first non-empty streamed text, full request duration, the server's generation/prompt timing and token counts, and Windows peak process working set. Initial model load is separate from per-request latency. Seven prompts probe greeting, persona instructions, context recall, explanation, arithmetic, uncertainty and Hindi/Hinglish. Raw answers are retained for human review; a successful workflow means the experiment ran, not that the model passed product quality.

## Approval gates

- Model weights MIT; upstream licence/copyright retained; tokenizer and conversion correspondence reviewed.
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


## Next instruction-tuned experiment: Shunya-0.5B

The active experiment now evaluates `vivekmarakana/shunya-0.5b-instruct` at revision `80dbaa0866f6177240db4bc8b27e3f21313d9345`, using the checksum-pinned mradermacher Q4_K_M conversion (approximately 315 MB). The earlier Phi configuration is retained in `models/evaluations/phi-1.5.json`. No default has changed.

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

On 13 October, Riyan approved **optional larger model packs outside Ruby's application package**. The app still targets less than 1 GB; under-1 GB models remain preferred where useful. The existing 1 GB download cap applies to this small-candidate experiment, not to every future optional backend. No external download is automatic, no default model is approved, and the MIT-only model-weight requirement remains unchanged.

Assuming the suggested names refer to JustVugg/colibri and bradAGI/soup:

| Tool/model | Role and source findings | Ruby decision |
| --- | --- | --- |
| Colibri | A runtime for large models that streams routed experts from disk; a small engine does not mean small weights. Its current catalogue lists chat downloads of 19 GB and larger, and its code is Apache-2.0. The local gateway exposes an OpenAI-compatible endpoint. | Candidate for an optional, separately installed local backend. Review the actual selected model's weight licence and hardware requirements; no model installed or benchmarked here. |
| Soup | A fine-tuning tool with serving/export support and an OpenAI-compatible server; code is Apache-2.0. Layer streaming reduces GPU residency during training rather than converting a large base into a tiny standalone model. | Candidate for the later assistant studio/training workflow or a separately running local server. It does not itself provide an approved MIT chat model. |
| OpenAI gpt-oss-20b | Official model card reports a 12.8 GiB checkpoint; Apache-2.0 weights. | Excluded under the unchanged MIT-only weight requirement, independently of optional-pack size allowance. |
| GPT-2 small | A smaller GPT-family text-generation model; the Hugging Face model card declares MIT. It is a pretrained base model rather than a ready companion chat model. | No default approval. A specific chat fine-tune and its weight/tokenizer provenance would need evaluation; do not assume the GPT name guarantees useful conversation. |

Keep inference providers pluggable behind one conversation interface. A future localhost adapter can support separately installed servers without placing training frameworks or large weights inside Ruby's application. Browser access needs a configured reachable service and explicit connection handling; web/mobile offline inference is a separate runtime requirement. This is an architecture decision, not a claim that chat or either backend is integrated today.

Sources:
- https://github.com/JustVugg/colibri
- https://github.com/JustVugg/colibri/blob/main/LICENSE
- https://github.com/bradAGI/soup
- https://deploymentsafety.openai.com/gpt-oss/a2
- https://huggingface.co/openai-community/gpt2

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

## Reproducible Windows experiment

`models/evaluation.json` records the exact GGUF SHA256, upstream and conversion repositories, runtime release, two CPU threads, zero GPU layers, 2,048 context tokens and 96 reply tokens. The job resolves and records immutable repository revisions before downloading, checks both repositories' declared MIT metadata and the actual upstream MIT notice, archives available tokenizer evidence, and verifies the model hash. The official llama.cpp CPU release is selected from its tag's API response and checked against the published asset SHA256.

Run `python scripts/evaluate-model.py` on Windows, or use **Offline model evaluation** in GitHub Actions. This is an explicit experiment downloading approximately 894 MB of model data plus a native runtime, not an app startup operation. Python's standard library is sufficient; no Torch install or remote model code is executed. Cache/results directories are ignored by Git. The evidence artifact excludes the weights and runtime executables.

The local inference server listens only on 127.0.0.1. Once downloads finish, generation sends prompts only to that local server. This measures local inference; it is not a separately verified no-network restart test.

Reported metrics: cold process/model readiness, client-observed first non-empty streamed text, full request duration, the server's generation/prompt timing and token counts, and Windows peak process working set. Initial model load is separate from per-request latency. Seven prompts probe greeting, persona instructions, context recall, explanation, arithmetic, uncertainty and Hindi/Hinglish. Raw answers are retained for human review; a successful workflow means the experiment ran, not that the model passed product quality.

## Approval gates

- Model weights MIT; upstream licence/copyright retained; tokenizer and conversion correspondence reviewed.
- Coherent short conversation, usable instruction following and context recall; no invented claim of using internet or controlling the PC.
- Measured default application + runtime + model pack within 1,000,000,000 bytes. Peak RAM is a separate measurement.
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

Measured results and quality decisions must be added after inspecting the actual Windows artifact.

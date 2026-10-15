# AI engines and local model setup

Reviewed 15 October 2026. Runtime choice and character choice are independent. An engine's small executable or low VRAM usage does not imply small model files, low disk usage, low latency or better answers. No cross-engine speed/stability ranking is established by Ruby's current tests.

## Windows v0.3

Open **Conversation** from the tray, **Open conversation / set up AI** in the lab, the floating **Talk** button, or the robot's right-click menu. Select **Ruby offline AI**, then **Download AI**. This explicitly downloads about 511 MB: the 491 MB official Qwen2.5-0.5B Q4_K_M model plus a 19.4 MB llama.cpp CPU archive, with publisher licence/tokenizer metadata. Nothing requires Python, a terminal or a separately launched model server.

Ruby displays transferred bytes, permits cancellation/retry, verifies pinned SHA256 values, safely extracts the CPU runtime and starts its own loopback-only child process. Installed weights/runtime/template are verified on subsequent Start AI calls without downloading. **Stop / unload AI** cancels chat and terminates only Ruby's owned runtime; Quit also terminates it. Hiding Ruby to the tray leaves AI available. Chat history is preserved when AI stops.

Files use the previous launcher's `%LOCALAPPDATA%/ProjectRuby/experimental-ai` cache, so existing verified downloads can be reused. Test launches use a separate AI cache. The managed candidate remains experimental and English-first; it is not a general-quality approval or a hardware performance guarantee. The first download needs internet; subsequent Start AI can run offline. Incomplete `.part` files are removed, verified complete downloads are retained for retry, and Download / repair replaces corrupt assets. Licence notices stay beside the separate AI pack.

## Optional existing-server connections

The engine selector offers these fixed loopback presets, using `/v1/models` and streamed `/v1/chat/completions`. An advanced preset connects to a server the user has installed and started; it does not download its framework or weights. Authentication-enabled servers and custom ports are not supported yet. Colibri, vLLM and MoE-Infinity share the conventional port 8000; use the matching preset for the one actually running there. Selecting a label does not verify a server's vendor identity.

| Engine | Ruby integration | Evidence and limits |
| --- | --- | --- |
| llama.cpp | Managed Windows download/start/stop; default compact pack | Real CPU candidate benchmark and packaged Windows chat tests. CPU baseline; GPU/iGPU backend comparison remains open. |
| Ollama | Optional local API connection, port 11434 | Official OpenAI-compatible models/chat endpoints. Install/pull models in Ollama. Model processing, including any cloud routing configured in Ollama, is controlled by that external engine. Such models are not Ruby offline models. |
| LM Studio | Optional local API connection, port 1234 | Official local OpenAI-compatible server. Start it in the Developer tab and load a model. No bundling/redistribution of LM Studio. |
| Colibri | Optional advanced local API connection, port 8000 | Official `coli serve` supports models/chat/SSE. Its starter currently requires at least 22 GB disk for its smallest supported model. Not the compact default; no Ruby hardware benchmark yet. |
| vLLM | Optional advanced local API connection, port 8000 | Official OpenAI-compatible serving. GPU documentation requires Linux; Windows needs WSL/community alternatives. Not installed by Ruby or validated on the user's laptop. |
| MoE-Infinity | Optional advanced local API connection, port 8000 | Official serving API supports chat/SSE. Requires a separate compatible CUDA/PyTorch/model setup; no Ruby throughput or device benchmark yet. |
| Fiddler | Research only; no adapter shipped | Publisher calls it a proof of concept; reported setup uses unquantized Mixtral, 24 GB GPUs and high-core-count CPUs. Not a compact generic laptop default. |
| AirLLM | Research only; no adapter shipped | Layer/expert streaming Python library. Lower VRAM does not remove weight storage or I/O costs. Needs a verified serving bridge, workload benchmarks and packaging review. |
| Soup | Future creator/training workflow; not the inference engine | Fine-tuning/post-training toolkit. Training tokens/s is not interactive decode tokens/s. Evaluate separately for the future studio. |

Ruby tests its managed real model end to end. Optional presets share a protocol adapter and have endpoint/transport contract checks; this is not evidence of running every vendor's engine or of hardware/performance parity. External engines retain their own installation, licensing and model selection requirements. Their larger user-selected models remain outside the compact managed-pack target.

## Next qualification work

Compare the same model/quantization/context on each applicable runtime, recording cold load, first token, sustained decoding, peak RAM/VRAM, disk usage, cancellation, restart and instruction-following quality. Keep server provisioning and large MoE/training dependencies out of the basic mascot installer. Review each model's commercial-use terms independently of its runtime.

Primary references:

- https://github.com/ggml-org/llama.cpp/tree/b11433/tools/server
- https://docs.ollama.com/api/openai-compatibility
- https://lmstudio.ai/docs/developer/openai-compat
- https://github.com/JustVugg/colibri/blob/main/docs/api.md
- https://github.com/JustVugg/colibri
- https://docs.vllm.ai/en/latest/serving/online_serving/openai_compatible_server/
- https://docs.vllm.ai/en/latest/getting_started/installation/gpu/
- https://github.com/EfficientMoE/MoE-Infinity/blob/main/docs/serving.md
- https://github.com/efeslab/fiddler
- https://github.com/lyogavin/airllm
- https://github.com/MakazhanAlpamys/Soup

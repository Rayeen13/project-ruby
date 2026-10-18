# Balanced local GPU inference

New Windows AI installations download checksum-pinned llama.cpp b11433 Vulkan (33.3 MB) instead of the CPU-only build. The existing Qwen 1.5B weights are reused. Existing offline CPU installations still start; choose Stop AI, then Download / repair to upgrade without downloading verified model weights again.

The default is hybrid: up to 16 transformer layers on the GPU, two CPU threads, 2048-token context, batch 128 and microbatch 64, with one parallel inference slot. This is a conservative starting point for the RTX 2050 4 GB; it is not a measured VRAM or temperature guarantee. Rendering and other applications also need GPU memory.

Ready status reads actual llama.cpp offload logs. A GPU-capable runtime alone does not count as successful GPU acceleration. When accelerated startup exits, one CPU retry disables device offload. Original logs are retained per attempt. Unsupported hardware may use CPU; update the graphics driver when a supported GPU unexpectedly offloads zero layers.

Third-party Ollama, LM Studio and other external endpoints retain their own device settings. This change governs Ruby's bundled LLM runtime only; it does not claim GPU acceleration for the current sherpa VoiceM packs.

Validation: native unit tests cover truthful offload reporting, port collision handling and corrupt cached downloads. Windows CI must pass before merging. Physical RTX 2050 performance still requires a device trial.

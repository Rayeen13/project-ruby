# Gem conversation — experimental

The shared browser/desktop chat connects to a separately running OpenAI-compatible llama.cpp server at `http://127.0.0.1:8081`. It is local-only; no cloud keys, account or paid API are required. Body selection and AI model selection are independent. Connect lists models actually loaded by the server; it does not install or switch the server's underlying weights.

## Windows candidate setup

Requires Python 3.11+ and Windows x64. From the checkout:

```powershell
py scripts/start-local-ai.py
```

In the Windows preview ZIP, the command is `py start-local-ai.py`. This explicitly downloads the reviewed Qwen2.5-0.5B-Instruct Q4_K_M candidate (491,400,032 bytes) and llama.cpp b11433 CPU runtime. Downloads remain outside the installer under `%LOCALAPPDATA%/ProjectRuby/experimental-ai`. Both archives/weights are SHA256 verified; the official publisher template is verified against the prior benchmark. Apache-2.0 weight and MIT runtime notices are retained. This is an opt-in integration experiment, not approval of a bundled default or a general-quality guarantee. Hindi and instruction reliability remain weak in the prior probes.

Then open **Talk → Connect**, select the loaded AI model and send a message. The launcher stays open; Ctrl+C stops the server and unloads its model. Verified cached weights/runtime and retained template/licences permit subsequent offline starts. A corrupt model download is replaced and verified before execution. No provider download occurs from the mascot itself.

Linux/macOS can use an independently installed llama.cpp runtime and commercially licensed instruction model:

```sh
llama-server -m /path/to/model.gguf --host 127.0.0.1 --port 8081 -c 2048 -t 2 --alias ruby-local
```

The shared adapter does not establish native Linux/macOS/mobile host support. The public website can attempt the same local connection; browsers may require local-network permission or block it. The Windows app is the supported test target. Do not expose an unauthenticated inference server to the public internet or enable server OS tools. The pinned launcher enables no desktop/shell tools.

## Behaviour and limits

- Replies stream into a mascot-attached panel. Thinking and Replying reflect the real request; they are not microphone or audio states. Compact/expanded views share one conversation. Opening chat while docked explicitly brings the mascot into the work area so the panel remains visible; hover still never undocks it.
- Stop aborts the HTTP request, keeps the partial text marked incomplete, and ignores late chunks. Retry replaces the interrupted turn rather than duplicating it. Global desktop Stop also cancels the current request. Closing the chat panel keeps generation running; its Talk button shows progress.
- The system prompt uses the selected gem name, body and personality. Changes affect the next request; an already streaming reply keeps its original identity. Model output is untrusted plain text, never HTML or executable instructions.
- Up to 200 messages are retained locally, with Export and Clear controls. An interrupted application restart marks pending replies incomplete. Storage failure leaves chat usable temporarily and visibly reports that history cannot be saved. There is no cloud sync or learned long-term memory.
- Inputs are limited to 600 characters and replies to 192 tokens. Model context includes a bounded 1,000-character budget of recent completed pairs plus the current message and system prompt. Full displayed history does not imply full model recall. Compact models can still hallucinate.
- Timeout is 120 seconds per reply. Failed HTTP requests, malformed/truncated streams and empty responses show errors and permit Retry. Cancellation does not terminate an independently running inference server; close its launcher to unload it.
- Internet search, citations, selected-app vision, microphone capture, spoken replies and PC actions are not connected. No simulated answer replaces a provider failure.

## Verification

`npm test` covers stream byte boundaries, partial UTF-8, broken/truncated streams, persona/context, stale chunks after Stop, Retry, interrupted restoration and unavailable storage. Windows CI runs the real pinned CPU model through the provider, checks contextual name recall and cancellation/retry, then exercises the actual packaged WebView's Connect/Send/Stop/history and existing window/mascot behaviour. Physical laptop performance and browser-specific local-network behaviour remain separate acceptance work.

Protocol reference: https://github.com/ggml-org/llama.cpp/blob/b11433/tools/server/README.md

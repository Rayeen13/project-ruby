use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager, State, WebviewWindow};
use tokio::sync::Notify;

fn endpoint(engine: Option<&str>, ruby_port: Option<u16>) -> Result<String, String> {
    match engine.unwrap_or("ruby") {
        "ruby" => ruby_port
            .map(|port| format!("http://127.0.0.1:{port}"))
            .ok_or_else(|| "Start Ruby’s offline AI in Settings → LLM.".into()),
        "ollama" => Ok("http://127.0.0.1:11434".into()),
        "lmstudio" => Ok("http://127.0.0.1:1234".into()),
        "colibri" | "vllm" | "moeinfinity" => Ok("http://127.0.0.1:8000".into()),
        _ => Err("Unsupported AI engine".into()),
    }
}

#[derive(Default)]
pub struct AiState(Mutex<Option<(u64, Arc<Notify>)>>);

#[derive(Deserialize, Serialize)]
pub struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct Delta {
    request_id: u64,
    text: String,
    done: bool,
}

fn client(seconds: u64) -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .no_proxy()
        .redirect(reqwest::redirect::Policy::none())
        .timeout(Duration::from_secs(seconds))
        .build()
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn local_ai_models(
    app: AppHandle,
    engine: Option<String>,
) -> Result<Vec<String>, String> {
    let base = endpoint(engine.as_deref(), crate::ai_pack::active_port(&app)?)?;
    let mut response = client(10)?
        .get(format!("{base}/v1/models"))
        .send()
        .await
        .map_err(|_| "Local AI is unavailable. Start the separate model server.".to_string())?;
    if !response.status().is_success() {
        return Err(format!("Local AI is not ready ({})", response.status()));
    }
    let mut bytes = Vec::new();
    while let Some(chunk) = response.chunk().await.map_err(|error| error.to_string())? {
        bytes.extend_from_slice(&chunk);
        if bytes.len() > 65536 {
            return Err("Model list exceeds its size limit".into());
        }
    }
    let data: Value = serde_json::from_slice(&bytes).map_err(|error| error.to_string())?;
    let models: Vec<String> = data["data"]
        .as_array()
        .ok_or("Invalid local model list")?
        .iter()
        .filter_map(|item| item["id"].as_str())
        .filter(|id| !id.is_empty() && id.len() <= 300)
        .take(100)
        .map(str::to_owned)
        .collect();
    if models.is_empty() {
        return Err("No model is loaded in the local server".into());
    }
    Ok(models)
}

fn parse_line(line: &[u8]) -> Result<(Option<String>, bool), String> {
    let line = std::str::from_utf8(line).map_err(|_| "Invalid UTF-8 in model stream")?;
    let Some(payload) = line.strip_prefix("data:") else {
        return Ok((None, false));
    };
    let payload = payload.trim();
    if payload == "[DONE]" {
        return Ok((None, true));
    }
    if payload.is_empty() {
        return Ok((None, false));
    }
    let event: Value = serde_json::from_str(payload).map_err(|_| "Unreadable model stream")?;
    if event.get("error").is_some() {
        return Err("Local model reported an error".into());
    }
    let choice = &event["choices"][0];
    if choice["finish_reason"].as_str() == Some("error") {
        return Err("The AI engine could not complete the reply".into());
    }
    Ok((
        choice["delta"]["content"].as_str().map(str::to_owned),
        choice["finish_reason"].is_string(),
    ))
}

async fn stream_reply(
    window: &WebviewWindow,
    base: &str,
    request_id: u64,
    messages: Vec<ChatMessage>,
    model: String,
) -> Result<(), String> {
    let mut response = client(120)?
        .post(format!("{base}/v1/chat/completions"))
        .json(&json!({"messages": messages, "model": model, "stream": true, "max_tokens": 192, "temperature": 0.7, "frequency_penalty": 0.15, "repeat_penalty": 1.05}))
        .send()
        .await
        .map_err(|error| format!("Local AI request failed: {error}"))?;
    if !response.status().is_success() {
        return Err(format!("Local AI request failed ({})", response.status()));
    }
    if !response
        .headers()
        .get("content-type")
        .and_then(|value| value.to_str().ok())
        .is_some_and(|value| value.contains("text/event-stream"))
    {
        return Err("The local server did not return a text stream".into());
    }
    let mut buffer = Vec::new();
    let mut finished = false;
    let mut total = 0;
    while let Some(chunk) = response.chunk().await.map_err(|error| error.to_string())? {
        buffer.extend_from_slice(&chunk);
        while let Some(end) = buffer.iter().position(|byte| *byte == b'\n') {
            let (text, done) = parse_line(&buffer[..end])?;
            let terminal = buffer[..end].starts_with(b"data: [DONE]");
            buffer.drain(..=end);
            finished |= done;
            if let Some(text) = text {
                total += text.len();
                if total > 32000 {
                    return Err("Reply exceeds the compact chat limit".into());
                }
                window
                    .emit(
                        "ruby-chat-chunk",
                        Delta {
                            request_id,
                            text,
                            done: false,
                        },
                    )
                    .map_err(|error| error.to_string())?;
            }
            if terminal {
                return Ok(());
            }
        }
        if buffer.len() > 65536 {
            return Err("Model event exceeds its size limit".into());
        }
    }
    if !finished {
        return Err("Connection ended before the reply finished".into());
    }
    Ok(())
}

#[tauri::command]
pub async fn local_ai_chat(
    window: WebviewWindow,
    app: AppHandle,
    state: State<'_, AiState>,
    request_id: u64,
    messages: Vec<ChatMessage>,
    model: String,
    engine: Option<String>,
) -> Result<(), String> {
    let base = endpoint(engine.as_deref(), crate::ai_pack::active_port(&app)?)?;
    if model.is_empty() || model.len() > 300 || messages.is_empty() || messages.len() > 30 {
        return Err("Invalid compact chat request".into());
    }
    if messages
        .iter()
        .any(|message| !["system", "user", "assistant"].contains(&message.role.as_str()))
        || messages
            .iter()
            .map(|message| message.content.len())
            .sum::<usize>()
            > 12000
    {
        return Err("Conversation exceeds its context limit".into());
    }
    let cancel = Arc::new(Notify::new());
    {
        let mut active = state
            .inner()
            .0
            .lock()
            .map_err(|_| "AI state is unavailable")?;
        if active.is_some() {
            return Err("A local reply is already running".into());
        }
        *active = Some((request_id, cancel.clone()));
    }
    // Dropping the request/response future closes the HTTP stream even during prefill.
    let result = tokio::select! {
        _ = cancel.notified() => Err("Reply stopped".to_string()),
        result = stream_reply(&window, &base, request_id, messages, model) => result,
    };
    {
        let mut active = state
            .inner()
            .0
            .lock()
            .map_err(|_| "AI state is unavailable")?;
        if active.as_ref().is_some_and(|(id, _)| *id == request_id) {
            *active = None;
        }
    }
    // The UI immediately sends cancellation/cleanup after the completion event.
    // Never hold AI state while notifying a window that may re-enter the host.
    if result.is_ok() {
        window
            .emit(
                "ruby-chat-chunk",
                Delta {
                    request_id,
                    text: String::new(),
                    done: true,
                },
            )
            .map_err(|error| error.to_string())?;
    }
    result
}

pub fn stop(app: &AppHandle) {
    let state = app.state::<AiState>();
    let Ok(mut active) = state.inner().0.lock() else {
        return;
    };
    if let Some((_, cancel)) = active.take() {
        cancel.notify_one();
    }
}

#[tauri::command]
pub fn local_ai_cancel(state: State<'_, AiState>, request_id: u64) -> Result<(), String> {
    let mut active = state
        .inner()
        .0
        .lock()
        .map_err(|_| "AI state is unavailable")?;
    if active.as_ref().is_some_and(|(id, _)| *id == request_id) {
        if let Some((_, cancel)) = active.take() {
            cancel.notify_one();
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{endpoint, parse_line};

    #[test]
    fn engines_are_restricted_to_known_loopback_endpoints() {
        assert_eq!(
            endpoint(Some("ruby"), Some(49152)).unwrap(),
            "http://127.0.0.1:49152"
        );
        assert!(endpoint(Some("ruby"), None).is_err());
        assert_eq!(
            endpoint(Some("ollama"), None).unwrap(),
            "http://127.0.0.1:11434"
        );
        assert_eq!(
            endpoint(Some("lmstudio"), None).unwrap(),
            "http://127.0.0.1:1234"
        );
        assert!(endpoint(Some("https://example.com"), None).is_err());
        assert!(endpoint(Some("file:///secret"), None).is_err());
    }

    #[test]
    fn parses_unicode_delta_finish_and_rejects_invalid_stream() {
        assert_eq!(parse_line(b": heartbeat").unwrap(), (None, false));
        assert_eq!(parse_line(b"data: [DONE]\r").unwrap(), (None, true));
        let line = r#"data: {"choices":[{"delta":{"content":"Hi 💎"},"finish_reason":null}]}"#;
        assert_eq!(
            parse_line(line.as_bytes()).unwrap(),
            (Some("Hi 💎".into()), false)
        );
        assert!(parse_line(b"data: {broken}").is_err());
        assert!(parse_line(b"data: {\"error\":\"offline\"}").is_err());
    }
}

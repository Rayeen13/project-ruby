use serde::Serialize;
use sha2::{Digest, Sha256};
use std::fs::{self, File};
use std::io::{Read, Write};
use std::net::TcpListener;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, Manager, State};
use tokio::sync::Notify;

const MODEL: &str = "qwen2.5-1.5b-instruct-q3_k_m.gguf";
const MODEL_SHA: &str = "58cb5c05ecef48e82961f1a2be6544145ea26136f69dddda4bbbd092f0e4b993";
const RUNTIME_SHA: &str = "301943380e45deae3991d42dddd03fae65c6a4963a5d882328a60208b43aa9e0";
const TEMPLATE_SHA: &str = "cd8e9439f0570856fd70470bf8889ebd8b5d1107207f67a5efb46e342330527f";

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PackStatus {
    phase: String,
    installed: bool,
    downloaded: u64,
    total: u64,
    detail: String,
    endpoint: Option<String>,
}

impl Default for PackStatus {
    fn default() -> Self {
        Self {
            phase: "missing".into(),
            installed: false,
            downloaded: 0,
            total: 0,
            detail: "Download the local AI once, then use it offline.".into(),
            endpoint: None,
        }
    }
}

#[derive(Default)]
struct Inner {
    status: PackStatus,
    child: Option<Child>,
    port: Option<u16>,
    cancel: Arc<Notify>,
}

#[derive(Default)]
pub struct PackState(Mutex<Inner>);

fn root(app: &AppHandle) -> Result<PathBuf, String> {
    if !std::env::args().any(|arg| arg == "--native-smoke-test") {
        if let Some(local) = std::env::var_os("LOCALAPPDATA") {
            return Ok(PathBuf::from(local)
                .join("ProjectRuby")
                .join("companion-ai-v2"));
        }
    }
    app.path()
        .app_local_data_dir()
        .map(|path| path.join("offline-ai-smoke-v2"))
        .map_err(|error| error.to_string())
}

fn publish(app: &AppHandle, phase: &str, downloaded: u64, total: u64, detail: &str) {
    let state = app.state::<PackState>();
    if let Ok(mut inner) = state.inner().0.lock() {
        inner.status.phase = phase.into();
        inner.status.installed =
            root(app).is_ok_and(|directory| directory.join("installed").is_file());
        inner.status.downloaded = downloaded;
        inner.status.total = total;
        inner.status.detail = detail.into();
        let _ = app.emit("ruby-ai-pack", inner.status.clone());
    };
}

fn checksum(path: &Path, expected: &str) -> Result<bool, String> {
    let Ok(mut file) = File::open(path) else {
        return Ok(false);
    };
    let mut digest = Sha256::new();
    let mut buffer = [0u8; 65536];
    loop {
        let count = file.read(&mut buffer).map_err(|error| error.to_string())?;
        if count == 0 {
            break;
        }
        digest.update(&buffer[..count]);
    }
    Ok(format!("{:x}", digest.finalize()) == expected)
}

struct PartialFile(PathBuf);
impl Drop for PartialFile {
    fn drop(&mut self) {
        let _ = fs::remove_file(&self.0);
    }
}

async fn download(
    app: &AppHandle,
    client: &reqwest::Client,
    url: &str,
    path: &Path,
    expected: Option<&str>,
    limit: u64,
) -> Result<(), String> {
    if let Some(hash) = expected {
        publish(app, "verifying", 0, 0, "Verifying cached download…");
        if checksum(path, hash)? {
            return Ok(());
        }
    }
    let mut response = client
        .get(url)
        .send()
        .await
        .map_err(|error| error.to_string())?;
    if !response.status().is_success() {
        return Err(format!("Download failed ({})", response.status()));
    }
    let total = response.content_length().unwrap_or(limit);
    if total > limit {
        return Err("Download exceeds its approved size limit".into());
    }
    let partial = PartialFile(path.with_extension("part"));
    let mut file = File::create(&partial.0).map_err(|error| error.to_string())?;
    let mut digest = Sha256::new();
    let mut received = 0;
    let mut update = Instant::now();
    while let Some(chunk) = response.chunk().await.map_err(|error| error.to_string())? {
        received += chunk.len() as u64;
        if received > limit {
            return Err("Download exceeds its approved size limit".into());
        }
        file.write_all(&chunk).map_err(|error| error.to_string())?;
        digest.update(&chunk);
        if update.elapsed() > Duration::from_millis(180) {
            publish(
                app,
                "downloading",
                received,
                total,
                path.file_name().unwrap().to_str().unwrap_or("AI pack"),
            );
            update = Instant::now();
        }
    }
    if expected.is_some_and(|hash| format!("{:x}", digest.finalize()) != hash) {
        return Err("Download checksum mismatch. Retry to download a verified copy.".into());
    }
    file.sync_all().map_err(|error| error.to_string())?;
    drop(file);
    if path.exists() {
        fs::remove_file(path).map_err(|error| error.to_string())?;
    }
    fs::rename(&partial.0, path).map_err(|error| error.to_string())?;
    Ok(())
}

async fn prepare(app: &AppHandle, directory: &Path, fetch: bool) -> Result<(), String> {
    fs::create_dir_all(directory).map_err(|error| error.to_string())?;
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(1800))
        .build()
        .map_err(|error| error.to_string())?;
    let model = directory.join(MODEL);
    let archive = directory.join("llama-b11433.zip");
    if fetch {
        download(app, &client, &format!("https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/91cad51170dc346986eccefdc2dd33a9da36ead9/{MODEL}"), &model, Some(MODEL_SHA), 1_000_000_000).await?;
        download(app, &client, "https://github.com/ggml-org/llama.cpp/releases/download/b11433/llama-b11433-bin-win-cpu-x64.zip", &archive, Some(RUNTIME_SHA), 25_000_000).await?;
        let upstream = "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct/resolve/989aa7980e4cf806f80c7fef2b1adb7bc71aa306";
        for (name, url) in [
            ("Qwen-LICENSE", format!("{upstream}/LICENSE")),
            (
                "tokenizer_config.json",
                format!("{upstream}/tokenizer_config.json"),
            ),
            (
                "llama-LICENSE",
                "https://raw.githubusercontent.com/ggml-org/llama.cpp/b11433/LICENSE".into(),
            ),
        ] {
            download(app, &client, &url, &directory.join(name), None, 2_000_000).await?;
        }
    }
    publish(
        app,
        "verifying",
        0,
        0,
        "Verifying model, runtime and publisher template…",
    );
    if !checksum(&model, MODEL_SHA)? || !checksum(&archive, RUNTIME_SHA)? {
        return Err("Verified AI files are missing or corrupt. Choose Download / repair.".into());
    }
    let config: serde_json::Value = serde_json::from_slice(
        &fs::read(directory.join("tokenizer_config.json")).map_err(|error| error.to_string())?,
    )
    .map_err(|error| error.to_string())?;
    let template = config["chat_template"]
        .as_str()
        .ok_or("Publisher chat template is missing")?;
    if format!("{:x}", Sha256::digest(template.as_bytes())) != TEMPLATE_SHA {
        return Err("Publisher template failed verification. Choose Download / repair to restore its verified copy.".into());
    }
    let license =
        fs::read_to_string(directory.join("Qwen-LICENSE")).map_err(|error| error.to_string())?;
    if !license.contains("Apache License") {
        return Err("Publisher licence notice is missing".into());
    }
    fs::write(directory.join("chat-template.jinja"), template)
        .map_err(|error| error.to_string())?;
    let mut zip = zip::ZipArchive::new(File::open(archive).map_err(|error| error.to_string())?)
        .map_err(|error| error.to_string())?;
    for index in 0..zip.len() {
        let entry = zip.by_index(index).map_err(|error| error.to_string())?;
        if entry.enclosed_name().is_none() || entry.size() > 100_000_000 {
            return Err("Unexpected runtime archive entry".into());
        }
    }
    // Always restore executable bytes from the verified archive before starting.
    zip.extract(directory.join("runtime"))
        .map_err(|error| error.to_string())?;
    fs::write(directory.join("installed"), b"qwen-1.5b-b11433-v2")
        .map_err(|error| error.to_string())?;
    Ok(())
}

fn executable(directory: &Path) -> Option<PathBuf> {
    let direct = directory.join("llama-server.exe");
    if direct.is_file() {
        return Some(direct);
    }
    for entry in fs::read_dir(directory).ok()?.flatten() {
        if entry.path().is_dir() {
            if let Some(found) = executable(&entry.path()) {
                return Some(found);
            }
        }
    }
    None
}

// Keep the selected socket reserved until immediately before spawning llama.cpp.
// Never probe HTTP to decide whether an unrelated process owns a port.
fn available_listener(preferred: u16) -> Result<TcpListener, String> {
    TcpListener::bind(("127.0.0.1", preferred))
        .or_else(|_| TcpListener::bind(("127.0.0.1", 0)))
        .map_err(|error| format!("Could not allocate a local AI port: {error}"))
}

pub fn active_port(app: &AppHandle) -> Result<Option<u16>, String> {
    let state = app.state::<PackState>();
    let inner = state
        .inner()
        .0
        .lock()
        .map_err(|_| "AI manager is unavailable")?;
    Ok(inner.port)
}

async fn start(app: &AppHandle, directory: &Path) -> Result<(), String> {
    let client = reqwest::Client::builder()
        .no_proxy()
        .redirect(reqwest::redirect::Policy::none())
        .timeout(Duration::from_secs(2))
        .build()
        .map_err(|error| error.to_string())?;
    for attempt in 0..3 {
        let listener = available_listener(if attempt == 0 { 8081 } else { 0 })?;
        let port = listener
            .local_addr()
            .map_err(|error| error.to_string())?
            .port();
        let base = format!("http://127.0.0.1:{port}");
        publish(app, "starting", 0, 0, "Loading your local AI…");
        let exe = executable(&directory.join("runtime")).ok_or("CPU runtime is missing")?;
        let log = File::create(directory.join("server.log")).map_err(|error| error.to_string())?;
        let mut command = Command::new(exe);
        command
            .arg("-m")
            .arg(directory.join(MODEL))
            .args([
                "-c",
                "2048",
                "-t",
                "2",
                "-ngl",
                "0",
                "--parallel",
                "1",
                "--host",
                "127.0.0.1",
                "--port",
                &port.to_string(),
                "--alias",
                "Qwen2.5-1.5B-Ruby",
                "--jinja",
                "--chat-template-file",
            ])
            .arg(directory.join("chat-template.jinja"))
            .stdin(Stdio::null())
            .stdout(log.try_clone().map_err(|error| error.to_string())?)
            .stderr(log);
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            command.creation_flags(0x08000000);
        }
        drop(listener);
        let child = command.spawn().map_err(|error| error.to_string())?;
        {
            let state = app.state::<PackState>();
            let mut inner = state
                .inner()
                .0
                .lock()
                .map_err(|_| "AI manager is unavailable")?;
            inner.child = Some(child);
            inner.port = Some(port);
            inner.status.endpoint = Some(base.clone());
        }
        let mut retry_port = false;
        for _ in 0..150 {
            {
                let state = app.state::<PackState>();
                let mut inner = state
                    .inner()
                    .0
                    .lock()
                    .map_err(|_| "AI manager is unavailable")?;
                if inner
                    .child
                    .as_mut()
                    .and_then(|child| child.try_wait().ok())
                    .flatten()
                    .is_some()
                {
                    inner.child = None;
                    inner.port = None;
                    inner.status.endpoint = None;
                    if TcpListener::bind(("127.0.0.1", port)).is_err() {
                        retry_port = true;
                        break;
                    }
                    return Err(
                        "Local AI exited while loading. Choose Download / repair or try another CPU."
                            .into(),
                    );
                }
            }
            if client
                .get(format!("{base}/health"))
                .send()
                .await
                .is_ok_and(|response| response.status().is_success())
            {
                // A health reply is accepted only while our own child is still alive.
                let state = app.state::<PackState>();
                let mut inner = state
                    .inner()
                    .0
                    .lock()
                    .map_err(|_| "AI manager is unavailable")?;
                if inner
                    .child
                    .as_mut()
                    .is_some_and(|child| matches!(child.try_wait(), Ok(None)))
                {
                    return Ok(());
                }
            }
            tokio::time::sleep(Duration::from_millis(200)).await;
        }
        if !retry_port {
            return Err("Local AI startup timed out".into());
        }
    }
    Err("Local AI could not reserve a port after three attempts. Please try Start AI again.".into())
}

pub fn shutdown(app: &AppHandle) {
    let state = app.state::<PackState>();
    if let Ok(mut inner) = state.inner().0.lock() {
        inner.cancel.notify_one();
        inner.port = None;
        inner.status.endpoint = None;
        if let Some(mut child) = inner.child.take() {
            let _ = child.kill();
            let _ = child.wait();
        }
    };
}

#[tauri::command]
pub fn ai_pack_status(app: AppHandle, state: State<'_, PackState>) -> Result<PackStatus, String> {
    let mut inner = state
        .inner()
        .0
        .lock()
        .map_err(|_| "AI manager is unavailable")?;
    let directory = root(&app)?;
    inner.status.installed = directory.join("installed").is_file()
        || (directory.join(MODEL).is_file()
            && directory.join("llama-b11433.zip").is_file()
            && directory.join("tokenizer_config.json").is_file());
    if inner.status.phase == "missing" && inner.status.installed {
        inner.status.phase = "stopped".into();
        inner.status.detail = "Local AI is installed. Press Start AI to use it offline.".into();
    }
    if let Some(child) = inner.child.as_mut() {
        if child
            .try_wait()
            .map_err(|error| error.to_string())?
            .is_some()
        {
            inner.child = None;
            inner.port = None;
            inner.status.endpoint = None;
            inner.status.phase = "stopped".into();
        }
    }
    Ok(inner.status.clone())
}

#[tauri::command]
pub async fn ai_pack_run(
    app: AppHandle,
    state: State<'_, PackState>,
    download: bool,
) -> Result<(), String> {
    let directory = root(&app)?;
    let cancel = {
        let mut inner = state
            .inner()
            .0
            .lock()
            .map_err(|_| "AI manager is unavailable")?;
        if inner.child.is_some()
            || ["downloading", "verifying", "starting"].contains(&inner.status.phase.as_str())
        {
            return Err("Local AI is already running or being prepared".into());
        }
        inner.status.phase = "verifying".into();
        inner.cancel = Arc::new(Notify::new());
        inner.cancel.clone()
    };
    let result = tokio::select! {
        _ = cancel.notified() => Err("AI setup stopped. Verified downloads were kept; retry to continue.".to_string()),
        result = async {
            prepare(&app, &directory, download).await?;
            start(&app, &directory).await
        } => result,
    };
    match &result {
        Ok(()) => publish(
            &app,
            "ready",
            0,
            0,
            "Local AI is ready. Your conversations can work offline.",
        ),
        Err(error) => {
            shutdown(&app);
            publish(&app, "error", 0, 0, error);
        }
    }
    result
}

#[tauri::command]
pub fn ai_pack_stop(app: AppHandle) {
    crate::local_ai::stop(&app);
    shutdown(&app);
    publish(
        &app,
        "stopped",
        0,
        0,
        "Local AI stopped and unloaded. Your conversation history is kept.",
    );
}

#[cfg(test)]
mod tests {
    use super::{available_listener, checksum};

    #[test]
    fn occupied_ports_are_skipped_without_touching_the_listener() {
        let occupied = available_listener(0).unwrap();
        let port = occupied.local_addr().unwrap().port();
        let alternate = available_listener(port).unwrap();
        assert_ne!(alternate.local_addr().unwrap().port(), port);
        assert!(std::net::TcpStream::connect(("127.0.0.1", port)).is_ok());
        assert!(alternate.local_addr().unwrap().ip().is_loopback());
    }

    #[test]
    fn detects_corrupt_cached_model_bytes() {
        let path = std::env::temp_dir().join(format!("ruby-hash-{}.bin", std::process::id()));
        std::fs::write(&path, b"abc").unwrap();
        assert!(checksum(
            &path,
            "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
        )
        .unwrap());
        std::fs::write(&path, b"corrupt").unwrap();
        assert!(!checksum(
            &path,
            "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
        )
        .unwrap());
        std::fs::remove_file(path).unwrap();
    }
}

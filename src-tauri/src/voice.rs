use serde::Serialize;
use sha2::{Digest, Sha256};
use std::{
    fs::{self, File},
    io::{Read, Write},
    path::{Path, PathBuf},
    process::{Command, Stdio},
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc,
    },
    time::Duration,
};
use tauri::{AppHandle, Emitter, Manager, State};

const REV: &str = "c10ece1aade47bb51c153c893d14e5bf8e5b7117";
const MODEL: &str = "en_GB-vctk-medium.onnx";
const MODEL_SHA: &str = "4e9fc85ab9009385319fc6bae7f55577f8a2d7ee77fd9159a5500eb6531f41e6";
const ZIP_SHA: &str = "f3c58906402b24f3a96d92145f58acba6d86c9b5db896d207f78dc80811efcea";
const CONFIG_SHA: &str = "7f85e6391ed0f7f46e4abd19345929a16be931a0c9945086f96692dce2087fa8";
#[derive(Default)]
struct Inner {
    busy: AtomicBool,
    cancelled: AtomicBool,
}
#[derive(Default)]
pub struct VoiceState(Arc<Inner>);
struct Operation(Arc<Inner>);
impl Drop for Operation {
    fn drop(&mut self) {
        self.0.busy.store(false, Ordering::SeqCst);
    }
}
fn reserve(state: &VoiceState) -> Result<Operation, String> {
    if state.0.busy.swap(true, Ordering::SeqCst) {
        return Err("VoiceM is busy. Stop or wait for it to finish.".into());
    }
    state.0.cancelled.store(false, Ordering::SeqCst);
    Ok(Operation(state.0.clone()))
}
fn root(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app
        .path()
        .app_local_data_dir()
        .map_err(|e| e.to_string())?
        .join(if std::env::args().any(|a| a == "--native-smoke-test") {
            "voicem-smoke"
        } else {
            "voicem"
        }))
}
fn verified(path: &Path, hash: &str) -> bool {
    let Ok(mut file) = File::open(path) else {
        return false;
    };
    let mut digest = Sha256::new();
    let mut buffer = [0; 65536];
    loop {
        match file.read(&mut buffer) {
            Ok(0) => break,
            Ok(n) => digest.update(&buffer[..n]),
            Err(_) => return false,
        }
    }
    format!("{:x}", digest.finalize()) == hash
}
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VoiceStatus {
    installed: bool,
    busy: bool,
}
#[tauri::command]
pub fn voice_pack_status(
    app: AppHandle,
    state: State<'_, VoiceState>,
) -> Result<VoiceStatus, String> {
    let dir = root(&app)?;
    Ok(VoiceStatus {
        installed: dir.join("installed-vctk-v1").exists(),
        busy: state.0.busy.load(Ordering::SeqCst),
    })
}
#[derive(Clone, Serialize)]
struct Progress {
    downloaded: u64,
    total: u64,
    file: String,
}
struct Partial(PathBuf);
impl Drop for Partial {
    fn drop(&mut self) {
        let _ = fs::remove_file(&self.0);
    }
}
async fn download(
    app: &AppHandle,
    client: &reqwest::Client,
    url: &str,
    path: &Path,
    hash: Option<&str>,
    state: &Inner,
) -> Result<(), String> {
    if hash.is_some_and(|h| verified(path, h)) {
        return Ok(());
    }
    let mut response = client
        .get(url)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .error_for_status()
        .map_err(|e| e.to_string())?;
    let total = response.content_length().unwrap_or(100_000_000);
    if total > 100_000_000 {
        return Err("VoiceM file is larger than expected".into());
    }
    let partial = Partial(path.with_extension("part"));
    let mut file = File::create(&partial.0).map_err(|e| e.to_string())?;
    let mut received = 0;
    let mut digest = Sha256::new();
    let mut last = std::time::Instant::now();
    while let Some(chunk) = response.chunk().await.map_err(|e| e.to_string())? {
        if state.cancelled.load(Ordering::SeqCst) {
            return Err("VoiceM download stopped. Retry to continue setup.".into());
        }
        received += chunk.len() as u64;
        if received > 100_000_000 {
            return Err("VoiceM exceeds size limit".into());
        }
        digest.update(&chunk);
        file.write_all(&chunk).map_err(|e| e.to_string())?;
        if last.elapsed() > Duration::from_millis(180) {
            let _ = app.emit(
                "ruby-voice-progress",
                Progress {
                    downloaded: received,
                    total,
                    file: path.file_name().unwrap().to_string_lossy().into(),
                },
            );
            last = std::time::Instant::now();
        }
    }
    if hash.is_some_and(|h| h != format!("{:x}", digest.finalize())) {
        return Err("VoiceM checksum mismatch. Download again.".into());
    }
    file.sync_all().map_err(|e| e.to_string())?;
    drop(file);
    if path.exists() {
        fs::remove_file(path).map_err(|e| e.to_string())?;
    }
    fs::rename(&partial.0, path).map_err(|e| e.to_string())
}
#[tauri::command]
pub async fn voice_pack_download(
    app: AppHandle,
    state: State<'_, VoiceState>,
) -> Result<(), String> {
    let _operation = reserve(&state)?;
    let dir = root(&app)?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(600))
        .build()
        .map_err(|e| e.to_string())?;
    let base =
        format!("https://huggingface.co/rhasspy/piper-voices/resolve/{REV}/en/en_GB/vctk/medium");
    for (name,url,hash) in [
        ("piper.zip".to_string(),"https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_windows_amd64.zip".to_string(),Some(ZIP_SHA)),
        (MODEL.to_string(),format!("{base}/{MODEL}"),Some(MODEL_SHA)),
        (format!("{MODEL}.json"),format!("{base}/{MODEL}.json"),Some(CONFIG_SHA)),
        ("MODEL_CARD".to_string(),format!("{base}/MODEL_CARD"),Some("53ec6b1fd90d9125d5bebac55261efd27f7e8d6dc962f605a5b5f796df2ec7fb")),
        ("VOICE-MODEL-README.md".to_string(),format!("https://huggingface.co/rhasspy/piper-voices/resolve/{REV}/README.md"),None),
        ("PIPER-MIT.txt".to_string(),"https://raw.githubusercontent.com/rhasspy/piper/2023.11.14-2/LICENSE.md".to_string(),None),
        ("ESPEAK-GPL3.txt".to_string(),"https://raw.githubusercontent.com/espeak-ng/espeak-ng/1.51/COPYING".to_string(),None),
        ("ONNXRUNTIME-MIT.txt".to_string(),"https://raw.githubusercontent.com/microsoft/onnxruntime/v1.14.1/LICENSE".to_string(),None),
    ] { if state.0.cancelled.load(Ordering::SeqCst) { return Err("VoiceM download stopped".into()); } download(&app,&client,&url,&dir.join(name),hash,&state.0).await?; }
    fs::write(dir.join("ATTRIBUTION.txt"),"VCTK corpus: Christophe Veaux, Junichi Yamagishi, Kirsten MacDonald, University of Edinburgh. CC BY 4.0: https://creativecommons.org/licenses/by/4.0/\nPiper VCTK voice weights: rhasspy/piper-voices (MIT). Fine-tuned from Lessac; see publisher MODEL_CARD.\nPiper executable: rhasspy/piper 2023.11.14-2 (MIT). eSpeak NG: GPL-3.0-or-later, corresponding source https://github.com/espeak-ng/espeak-ng/tree/1.51 ; Piper phonemize source https://github.com/rhasspy/piper-phonemize ; ONNX Runtime: MIT. Includes third-party components under their own licences; retain all runtime notices. Used as a separate process.\n").map_err(|e|e.to_string())?;
    fs::write(dir.join("installed-vctk-v1"), b"1").map_err(|e| e.to_string())
}
fn extract(dir: &Path) -> Result<PathBuf, String> {
    if !verified(&dir.join("piper.zip"), ZIP_SHA)
        || !verified(&dir.join(MODEL), MODEL_SHA)
        || !verified(&dir.join(format!("{MODEL}.json")), CONFIG_SHA)
    {
        return Err("VoiceM missing or corrupt. Download / repair the voice pack.".into());
    }
    let mut archive =
        zip::ZipArchive::new(File::open(dir.join("piper.zip")).map_err(|e| e.to_string())?)
            .map_err(|e| e.to_string())?;
    let runtime = dir.join("runtime");
    let mut executable = None;
    let mut total = 0;
    for index in 0..archive.len() {
        let mut entry = archive.by_index(index).map_err(|e| e.to_string())?;
        let name = entry.enclosed_name().ok_or("Invalid VoiceM archive path")?;
        total += entry.size();
        if total > 250_000_000 {
            return Err("VoiceM archive too large".into());
        }
        let target = runtime.join(name);
        if entry.is_dir() {
            fs::create_dir_all(&target).map_err(|e| e.to_string())?;
        } else {
            if let Some(parent) = target.parent() {
                fs::create_dir_all(parent).map_err(|e| e.to_string())?;
            }
            std::io::copy(
                &mut entry,
                &mut File::create(&target).map_err(|e| e.to_string())?,
            )
            .map_err(|e| e.to_string())?;
            if target.file_name().is_some_and(|n| n == "piper.exe") {
                executable = Some(target);
            }
        }
    }
    executable.ok_or("Piper executable missing".into())
}
#[tauri::command]
pub async fn voice_synthesize(
    app: AppHandle,
    state: State<'_, VoiceState>,
    text: String,
    gender: String,
    pace: f64,
) -> Result<Vec<u8>, String> {
    if text.is_empty()
        || text.chars().count() > 1500
        || !pace.is_finite()
        || !(0.75..=1.5).contains(&pace)
        || !matches!(gender.as_str(), "male" | "female")
    {
        return Err("Invalid voice request".into());
    }
    let operation = reserve(&state)?;
    let dir = root(&app)?;
    tauri::async_runtime::spawn_blocking(move || -> Result<Vec<u8>, String> {
        let _operation = operation;
        let executable = extract(&dir)?;
        if _operation.0.cancelled.load(Ordering::SeqCst) {
            return Err("Voice stopped".into());
        }
        let output = dir.join("speech.wav");
        let _ = fs::remove_file(&output);
        let mut command = Command::new(&executable);
        command
            .current_dir(executable.parent().unwrap())
            .arg("--model")
            .arg(dir.join(MODEL))
            .arg("--speaker")
            .arg(if gender == "female" { "107" } else { "95" })
            .arg("--length_scale")
            .arg((1.4 / pace).to_string())
            .arg("--output_file")
            .arg(&output)
            .stdin(Stdio::piped())
            .stdout(Stdio::null())
            .stderr(Stdio::null());
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            command.creation_flags(0x08000000);
        }
        let mut child = command.spawn().map_err(|e| e.to_string())?;
        if let Some(mut stdin) = child.stdin.take() {
            if let Err(error) = writeln!(stdin, "{}", text.replace(['\n', '\r'], " ")) {
                let _ = child.kill();
                let _ = child.wait();
                return Err(error.to_string());
            }
        }
        let start = std::time::Instant::now();
        loop {
            if _operation.0.cancelled.load(Ordering::SeqCst)
                || start.elapsed() > Duration::from_secs(45)
            {
                let _ = child.kill();
                let _ = child.wait();
                let _ = fs::remove_file(&output);
                return Err("Voice stopped or timed out".into());
            }
            match child.try_wait() {
                Ok(Some(status)) => {
                    if !status.success() {
                        return Err("VoiceM synthesis failed. Try Download / repair.".into());
                    }
                    break;
                }
                Ok(None) => std::thread::sleep(Duration::from_millis(30)),
                Err(e) => {
                    let _ = child.kill();
                    let _ = child.wait();
                    return Err(e.to_string());
                }
            }
        }
        if fs::metadata(&output).map_err(|e| e.to_string())?.len() > 12_000_000 {
            return Err("Voice output too large".into());
        }
        let bytes = fs::read(&output).map_err(|e| e.to_string())?;
        let _ = fs::remove_file(&output);
        if !bytes.starts_with(b"RIFF") {
            return Err("VoiceM returned invalid audio".into());
        }
        Ok(bytes)
    })
    .await
    .map_err(|e| e.to_string())?
}
#[tauri::command]
pub fn voice_stop(state: State<'_, VoiceState>) {
    state.0.cancelled.store(true, Ordering::SeqCst);
}

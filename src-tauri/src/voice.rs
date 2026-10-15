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

const MODEL: &str = "model.int8.onnx";
const MODEL_SHA: &str = "4c3052abaa60943a341f193888cf6abd68787dae6ab8ae5c925a706caa247e4e";
const ZIP_SHA: &str = "58b4683dd3de08fb0445717d5a5086fa23a09f2259748b5259f50eb281d8a05e";
#[derive(Default)]
struct Inner {
    busy: AtomicBool,
    cancelled: AtomicBool,
}
#[derive(Default)]
pub struct VoiceState(Arc<Inner>);
struct Operation(Arc<Inner>);
struct VoiceRenderGuard(AppHandle);
impl Drop for VoiceRenderGuard {
    fn drop(&mut self) {
        let _ = self.0.emit("ruby-voice-compute", false);
    }
}
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
fn pack_id(pack: Option<&str>) -> Result<&'static str, String> {
    match pack {
        None | Some("kokoro") => Ok("kokoro"),
        Some("supertonic3") => Ok("supertonic3"),
        _ => Err("Unknown VoiceM pack".into()),
    }
}
fn root(app: &AppHandle, pack: &str) -> Result<PathBuf, String> {
    let smoke = std::env::args().any(|a| a == "--native-smoke-test" || a == "--voice-smoke-test");
    Ok(app
        .path()
        .app_local_data_dir()
        .map_err(|e| e.to_string())?
        .join(match (pack, smoke) {
            ("supertonic3", true) => "supertonic3-smoke-v1",
            ("supertonic3", false) => "supertonic3-v1",
            (_, true) => "kokoro-smoke-v1",
            _ => "kokoro-v1",
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
    pack: Option<String>,
) -> Result<VoiceStatus, String> {
    let pack = pack_id(pack.as_deref())?;
    let dir = root(&app, pack)?;
    Ok(VoiceStatus {
        installed: dir.join("installed-kokoro-v1").exists()
            && installed_model(&dir, pack)
            && find_file(&dir.join("runtime"), "sherpa-onnx-offline-tts.exe").is_some(),
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
    let total = response.content_length().unwrap_or(200_000_000);
    if total > 200_000_000 {
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
        if received > 200_000_000 {
            return Err("VoiceM exceeds size limit".into());
        }
        digest.update(&chunk);
        file.write_all(&chunk).map_err(|e| e.to_string())?;
        if last.elapsed() > Duration::from_millis(180) {
            if std::env::args().any(|a| a == "--voice-smoke-test") {
                let detail = format!("{}: {received}/{total} bytes", path.display());
                let _ = fs::write("ruby-native-voice-live.txt", detail);
            }
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
    pack: Option<String>,
    accept_license: Option<bool>,
) -> Result<(), String> {
    let pack = pack_id(pack.as_deref())?;
    if pack == "supertonic3" && accept_license != Some(true) {
        return Err("Accept the Supertonic OpenRAIL-M model terms before downloading".into());
    }
    let _operation = reserve(&state)?;
    let dir = root(&app, pack)?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(600))
        .build()
        .map_err(|e| e.to_string())?;
    let assets = if pack == "supertonic3" {
        [
            ("runtime.tar.bz2", "https://github.com/k2-fsa/sherpa-onnx/releases/download/v1.13.8/sherpa-onnx-v1.13.8-win-x64-shared-MT-Release.tar.bz2", "6dffdc715a4465b989446a6105265d2cb345e7101591a17d35534b6758f6e8df"),
            ("model.tar.bz2", "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/sherpa-onnx-supertonic-3-tts-int8-2026-05-11.tar.bz2", "82fa96f91c4ef8abaae3a14a3f4153facf88bed821d1f7331cec2700f432c427"),
        ]
    } else {
        [
        ("runtime.tar.bz2", "https://github.com/k2-fsa/sherpa-onnx/releases/download/v1.12.15/sherpa-onnx-v1.12.15-win-x64-static.tar.bz2", ZIP_SHA),
        ("model.tar.bz2", "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/kokoro-int8-multi-lang-v1_0.tar.bz2", MODEL_SHA),
        ]
    };
    for (name, url, hash) in assets {
        if state.0.cancelled.load(Ordering::SeqCst) {
            return Err("VoiceM download stopped".into());
        }
        download(&app, &client, url, &dir.join(name), Some(hash), &state.0).await?;
    }
    if std::env::args().any(|a| a == "--voice-smoke-test") {
        let _ = fs::write(
            "ruby-native-voice-live.txt",
            "Extracting verified VoiceM archives",
        );
    }
    let extraction_dir = dir.clone();
    let inner = state.0.clone();
    tauri::async_runtime::spawn_blocking(move || {
        unpack(
            &extraction_dir.join("runtime.tar.bz2"),
            &extraction_dir.join("runtime"),
            true,
            &inner,
        )?;
        unpack(
            &extraction_dir.join("model.tar.bz2"),
            &extraction_dir.join("model"),
            false,
            &inner,
        )
    })
    .await
    .map_err(|e| e.to_string())??;
    if !installed_model(&dir, pack)
        || find_file(&dir.join("runtime"), "sherpa-onnx-offline-tts.exe").is_none()
    {
        return Err("VoiceM archive is incomplete. Try repair.".into());
    }
    fs::write(dir.join("ATTRIBUTION.txt"), "Kokoro-82M v1.0 by hexgrad, Apache-2.0. ONNX int8 conversion: k2-fsa/sherpa-onnx. Sherpa-ONNX v1.12.15 Apache-2.0. Model and runtime archive licences and notices retained. eSpeak NG GPL-3.0-or-later: corresponding source https://github.com/espeak-ng/espeak-ng ; sherpa source https://github.com/k2-fsa/sherpa-onnx/tree/v1.12.15 ; model card https://huggingface.co/hexgrad/Kokoro-82M . Separate-process runtime. English and Chinese speech.\n").map_err(|e| e.to_string())?;
    if pack == "supertonic3" {
        fs::write(
            dir.join("MODEL-LICENSE.txt"),
            include_str!("../../docs/licenses/SUPERTONIC3-OPENRAIL-M.txt"),
        )
        .map_err(|e| e.to_string())?;
        fs::write(dir.join("ATTRIBUTION.txt"), "Supertonic 3 model and voice styles: Supertone Inc., OpenRAIL-M. Model terms are in MODEL-LICENSE.txt and apply to use and redistribution. Source: https://huggingface.co/Supertone/supertonic-3 . Sherpa-ONNX v1.13.8: Apache-2.0; runtime licences and notices retained. Original preset voices; no character or celebrity clones.\n").map_err(|e| e.to_string())?;
    }
    fs::write(dir.join("installed-kokoro-v1"), b"1").map_err(|e| e.to_string())
}
fn unpack(archive: &Path, destination: &Path, runtime: bool, state: &Inner) -> Result<(), String> {
    fs::create_dir_all(destination).map_err(|e| e.to_string())?;
    let decoder = bzip2::read::BzDecoder::new(File::open(archive).map_err(|e| e.to_string())?);
    let mut archive = tar::Archive::new(decoder);
    let mut total = 0u64;
    for entry in archive.entries().map_err(|e| e.to_string())? {
        if state.cancelled.load(Ordering::SeqCst) {
            return Err("VoiceM setup stopped".into());
        }
        let mut entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path().map_err(|e| e.to_string())?.into_owned();
        if path.components().any(|c| {
            !matches!(
                c,
                std::path::Component::Normal(_) | std::path::Component::CurDir
            )
        }) {
            return Err("Unsafe VoiceM archive path".into());
        }
        let kind = entry.header().entry_type();
        if !kind.is_file() && !kind.is_dir() {
            return Err("VoiceM links are not supported".into());
        }
        // The publisher bundles many unrelated executables and libraries. Keep TTS and notices only.
        if runtime && kind.is_file() {
            let name = path
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_lowercase();
            if name.ends_with(".exe") && name != "sherpa-onnx-offline-tts.exe" {
                continue;
            }
            if name.ends_with(".lib") || name.ends_with(".h") || name.ends_with(".hpp") {
                continue;
            }
        }
        total += entry.size();
        if total > 600_000_000 {
            return Err("VoiceM archive exceeds extraction limit".into());
        }
        if !entry.unpack_in(destination).map_err(|e| e.to_string())? {
            return Err("Unsafe VoiceM path".into());
        }
    }
    Ok(())
}
fn find_file(dir: &Path, name: &str) -> Option<PathBuf> {
    for entry in fs::read_dir(dir).ok()?.flatten() {
        let path = entry.path();
        if path.is_file() && path.file_name().is_some_and(|n| n == name) {
            return Some(path);
        }
        if path.is_dir() {
            if let Some(found) = find_file(&path, name) {
                return Some(found);
            }
        }
    }
    None
}
fn installed_model(dir: &Path, pack: &str) -> bool {
    let names: &[&str] = if pack == "supertonic3" {
        &[
            "duration_predictor.int8.onnx",
            "text_encoder.int8.onnx",
            "vector_estimator.int8.onnx",
            "vocoder.int8.onnx",
            "voice.bin",
            "unicode_indexer.bin",
            "tts.json",
        ]
    } else {
        &[
            MODEL,
            "voices.bin",
            "tokens.txt",
            "lexicon-us-en.txt",
            "lexicon-zh.txt",
        ]
    };
    names
        .iter()
        .all(|name| find_file(&dir.join("model"), name).is_some())
}
fn speaker_for(
    pack: &str,
    voice: Option<&str>,
    gender: &str,
    language: &str,
) -> Result<&'static str, String> {
    if pack == "supertonic3" {
        if !matches!(language, "en" | "ja") {
            return Err("This pack supports English and Japanese in Ruby".into());
        }
        return match (gender, voice) {
            ("female", None | Some("auto") | Some("st_f1")) => Ok("0"),
            ("female", Some("st_f2")) => Ok("1"),
            ("female", Some("st_f3")) => Ok("2"),
            ("female", Some("st_f4")) => Ok("3"),
            ("female", Some("st_f5")) => Ok("4"),
            ("male", None | Some("auto") | Some("st_m1")) => Ok("5"),
            ("male", Some("st_m2")) => Ok("6"),
            ("male", Some("st_m3")) => Ok("7"),
            ("male", Some("st_m4")) => Ok("8"),
            ("male", Some("st_m5")) => Ok("9"),
            _ => Err("Choose a voice matching this Companion".into()),
        };
    }
    if language == "en" {
        return speaker(voice, gender);
    }
    if language != "zh" {
        return Err("Choose the Japanese pack for Japanese speech".into());
    }
    match (gender, voice) {
        ("female", None | Some("auto") | Some("zf_xiaobei")) => Ok("45"),
        ("female", Some("zf_xiaoni")) => Ok("46"),
        ("female", Some("zf_xiaoxiao")) => Ok("47"),
        ("female", Some("zf_xiaoyi")) => Ok("48"),
        ("male", None | Some("auto") | Some("zm_yunjian")) => Ok("49"),
        ("male", Some("zm_yunxi")) => Ok("50"),
        ("male", Some("zm_yunxia")) => Ok("51"),
        ("male", Some("zm_yunyang")) => Ok("52"),
        _ => Err("Choose a Chinese voice matching this Companion".into()),
    }
}
fn speaker(voice: Option<&str>, gender: &str) -> Result<&'static str, String> {
    match (gender, voice) {
        ("female", None | Some("auto") | Some("af_heart")) => Ok("3"),
        ("female", Some("af_bella")) => Ok("2"),
        ("female", Some("af_sarah")) => Ok("9"),
        ("female", Some("bf_emma")) => Ok("21"),
        ("male", None | Some("auto") | Some("am_michael")) => Ok("16"),
        ("male", Some("am_fenrir")) => Ok("14"),
        ("male", Some("am_puck")) => Ok("18"),
        ("male", Some("bm_george")) => Ok("26"),
        _ => Err("Choose a voice matching this Companion".into()),
    }
}
#[tauri::command]
pub async fn voice_synthesize(
    app: AppHandle,
    state: State<'_, VoiceState>,
    text: String,
    gender: String,
    pace: f64,
    voice: Option<String>,
    pack: Option<String>,
    language: Option<String>,
) -> Result<Vec<u8>, String> {
    if text.is_empty()
        || text.chars().count() > 1500
        || !pace.is_finite()
        || !(0.75..=1.5).contains(&pace)
        || !matches!(gender.as_str(), "male" | "female")
    {
        return Err("Invalid voice request".into());
    }
    let pack = pack_id(pack.as_deref())?;
    let language = language.unwrap_or_else(|| "en".into());
    let sid = speaker_for(pack, voice.as_deref(), &gender, &language)?;
    let operation = reserve(&state)?;
    let dir = root(&app, pack)?;
    let _ = app.emit("ruby-voice-compute", true);
    let render_guard = VoiceRenderGuard(app.clone());
    tauri::async_runtime::spawn_blocking(move || -> Result<Vec<u8>, String> {
        let _render_guard = render_guard;
        let _operation = operation;
        let executable = find_file(&dir.join("runtime"), "sherpa-onnx-offline-tts.exe")
            .ok_or("Download / repair this VoiceM pack first")?;
        if _operation.0.cancelled.load(Ordering::SeqCst) {
            return Err("Voice stopped".into());
        }
        let output = dir.join("speech.wav");
        let _ = fs::remove_file(&output);
        let mut command = Command::new(&executable);
        command.current_dir(executable.parent().unwrap());
        if pack == "supertonic3" {
            for (flag, file) in [
                ("duration-predictor", "duration_predictor.int8.onnx"),
                ("text-encoder", "text_encoder.int8.onnx"),
                ("vector-estimator", "vector_estimator.int8.onnx"),
                ("vocoder", "vocoder.int8.onnx"),
                ("tts-json", "tts.json"),
                ("unicode-indexer", "unicode_indexer.bin"),
                ("voice-style", "voice.bin"),
            ] {
                let path = find_file(&dir.join("model"), file)
                    .ok_or("VoiceM component missing. Try repair.")?;
                command.arg(format!("--supertonic-{flag}={}", path.display()));
            }
            command
                .arg(format!("--lang={language}"))
                .arg("--num-steps=5")
                .arg(format!("--speed={pace}"));
            let parent = executable.parent().unwrap();
            let mut paths = vec![
                parent.to_path_buf(),
                parent.parent().unwrap_or(parent).join("lib"),
            ];
            if let Some(existing) = std::env::var_os("PATH") {
                paths.extend(std::env::split_paths(&existing));
            }
            command.env(
                "PATH",
                std::env::join_paths(paths).map_err(|e| e.to_string())?,
            );
        } else {
            let model = find_file(&dir.join("model"), MODEL)
                .ok_or("Kokoro model missing. Try repair.")?;
            let model_dir = model.parent().unwrap();
            command
                .arg(format!("--kokoro-model={}", model.display()))
                .arg(format!(
                    "--kokoro-voices={}",
                    model_dir.join("voices.bin").display()
                ))
                .arg(format!(
                    "--kokoro-tokens={}",
                    model_dir.join("tokens.txt").display()
                ))
                .arg(format!(
                    "--kokoro-data-dir={}",
                    model_dir.join("espeak-ng-data").display()
                ));
            let mut lexicons = vec![
                model_dir.join("lexicon-us-en.txt"),
                model_dir.join("lexicon-gb-en.txt"),
            ];
            if language == "zh" {
                lexicons.push(model_dir.join("lexicon-zh.txt"));
                let rules = ["date-zh.fst", "number-zh.fst", "phone-zh.fst"]
                    .map(|f| model_dir.join(f).to_string_lossy().into_owned())
                    .join(",");
                command.arg(format!("--tts-rule-fsts={rules}"));
            }
            command.arg(format!(
                "--kokoro-lexicon={}",
                lexicons
                    .iter()
                    .map(|p| p.to_string_lossy())
                    .collect::<Vec<_>>()
                    .join(",")
            ));
            command.arg(format!("--kokoro-length-scale={}", 1.0 / pace));
        }
        command
            .arg("--num-threads=2")
            .arg("--debug=0")
            .arg(format!("--sid={sid}"))
            .arg(format!("--output-filename={}", output.display()))
            .arg("--")
            .arg(text.replace(['\n', '\r'], " "))
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null());
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            command.creation_flags(0x08000000);
        }
        let mut child = command.spawn().map_err(|e| e.to_string())?;
        let start = std::time::Instant::now();
        loop {
            if _operation.0.cancelled.load(Ordering::SeqCst)
                || start.elapsed() > Duration::from_secs(90)
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

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn voices_are_gender_scoped() {
        assert_eq!(speaker(Some("af_heart"), "female").unwrap(), "3");
        assert_eq!(speaker(Some("am_puck"), "male").unwrap(), "18");
        assert!(speaker(Some("af_heart"), "male").is_err());
        assert!(speaker(Some("../anything"), "female").is_err());
        assert_eq!(
            speaker_for("kokoro", Some("zf_xiaoyi"), "female", "zh").unwrap(),
            "48"
        );
        assert_eq!(
            speaker_for("supertonic3", Some("st_m1"), "male", "ja").unwrap(),
            "5"
        );
        assert!(speaker_for("supertonic3", Some("st_f1"), "male", "ja").is_err());
        assert!(speaker_for("kokoro", None, "female", "ja").is_err());
    }
}

pub async fn smoke(app: AppHandle) -> Result<(), String> {
    fs::write(
        "ruby-native-voice-live.txt",
        "Checking and downloading VoiceM",
    )
    .map_err(|e| e.to_string())?;
    voice_pack_download(app.clone(), app.state::<VoiceState>(), None, None).await?;
    for (gender, text) in [
        ("female", "Hello, I am Ruby. Your companion is ready."),
        ("male", "Hello, I am Saph. Let us build something together."),
    ] {
        let detail = format!("Synthesizing {gender}");
        fs::write("ruby-native-voice-live.txt", detail).map_err(|e| e.to_string())?;
        let bytes = voice_synthesize(
            app.clone(),
            app.state::<VoiceState>(),
            text.into(),
            gender.into(),
            1.0,
            None,
            None,
            None,
        )
        .await?;
        fs::write(format!("ruby-native-{gender}.wav"), bytes).map_err(|e| e.to_string())?;
    }
    for (pack, language, gender, text) in [
        ("kokoro", "zh", "female", "你好，我是露比。欢迎回来。"),
        ("supertonic3", "ja", "female", "こんにちは。おかえりなさい。"),
        ("supertonic3", "ja", "male", "こんにちは。一緒に始めましょう。"),
    ] {
        if pack == "supertonic3" && gender == "female" {
            voice_pack_download(
                app.clone(),
                app.state::<VoiceState>(),
                Some(pack.into()),
                Some(true),
            )
            .await?;
        }
        fs::write(
            "ruby-native-voice-live.txt",
            format!("Synthesizing {language} {gender}"),
        )
        .map_err(|e| e.to_string())?;
        let bytes = voice_synthesize(
            app.clone(),
            app.state::<VoiceState>(),
            text.into(),
            gender.into(),
            1.0,
            None,
            Some(pack.into()),
            Some(language.into()),
        )
        .await?;
        fs::write(format!("ruby-native-{language}-{gender}.wav"), bytes)
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

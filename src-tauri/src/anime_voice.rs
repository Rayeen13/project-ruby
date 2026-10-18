use super::{find_file, verified, Inner};
use base64::{engine::general_purpose::STANDARD, Engine};
use serde_json::{json, Value};
use std::collections::HashSet;
use std::fs::{self, File};
use std::io::{BufRead, BufReader, Read, Write};
use std::path::Path;
use std::process::{Child, ChildStdin, Command, Stdio};
use std::sync::atomic::Ordering;
use std::sync::mpsc::{sync_channel, Receiver, RecvTimeoutError};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter};

pub(super) const MODEL: &str = "Irodori-TTS-866M-MF-v4.1-Q4_K.gguf";
pub(super) const MODEL_SHA: &str =
    "1913bf74000a3300c703eb91c985a4e5c4d7a2bbeb0cc7fe07d1583c4fea9729";
const RUNTIME_SHA: &str =
    "2904dd54de7f18cf438338c28216ebffc205d29c6a2de3e645af40dd136b92f2";
const MODEL_BASE: &str = "https://huggingface.co/sakasegawa/Irodori-TTS-v4.1-Small-MF-GGUF/resolve/205ab071cb54e46509a84d3a48535df283bc3b0f";

pub(super) fn installed(dir: &Path) -> bool {
    dir.join("installed-irodori-v1").is_file()
        && dir.join(MODEL).is_file()
        && find_file(&dir.join("runtime"), "speech.exe").is_some()
}

pub(super) async fn install(app: &AppHandle, dir: &Path, state: &Inner) -> Result<(), String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(1800))
        .build()
        .map_err(|e| e.to_string())?;
    let archive = dir.join("speech-0810.zip");
    for (url, path, hash, limit) in [
        (format!("{MODEL_BASE}/{MODEL}"), dir.join(MODEL), MODEL_SHA, 900_000_000),
        (
            "https://github.com/nyosegawa/speech.cpp/releases/download/v0.8.10/speech-0.8.10-windows-x64-vulkan.zip".into(),
            archive.clone(), RUNTIME_SHA, 40_000_000,
        ),
    ] {
        super::download_limited(app, &client, &url, &path, Some(hash), state, limit).await?;
    }
    let mut zip = zip::ZipArchive::new(File::open(&archive).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())?;
    let mut total = 0;
    for i in 0..zip.len() {
        let entry = zip.by_index(i).map_err(|e| e.to_string())?;
        total += entry.size();
        if entry.enclosed_name().is_none()
            || entry.unix_mode().is_some_and(|m| m & 0o170000 == 0o120000)
            || total > 250_000_000
        {
            return Err("Unsafe or oversized speech runtime archive".into());
        }
    }
    zip.extract(dir.join("runtime")).map_err(|e| e.to_string())?;
    for name in ["LICENSE-MIT", "LICENSE-APACHE-2.0"] {
        super::download_limited(
            app, &client, &format!("{MODEL_BASE}/{name}"), &dir.join(name),
            None, state, 100_000,
        ).await?;
    }
    super::download_limited(
        app, &client,
        "https://huggingface.co/Aratako/Irodori-TTS-v4.1-Small-MF/resolve/ccc78f5d480b6e51b69b2d5042a14c4da04fea6e/README.md",
        &dir.join("MODEL-CARD.md"), None, state, 200_000,
    ).await?;
    fs::write(dir.join("ATTRIBUTION.txt"), "Irodori-TTS v4.1 Small-MF by Chihiro Arata; speech.cpp v0.8.10 by nyosegawa; code/model MIT. Codec Semantic-DACVAE-Japanese-32dim: MIT with inherited Apache-2.0 notice. Additional model-card restrictions prohibit unconsented impersonation and deceptive synthetic speech. See MODEL-CARD.md and bundled licences. Ruby uses original caption-designed adult voices, not actor recordings. Japanese only. Downloaded by explicit user choice.\n")
        .map_err(|e| e.to_string())?;
    fs::write(dir.join("installed-irodori-v1"), MODEL_SHA).map_err(|e| e.to_string())
}

pub(super) fn profile(voice: &str, gender: &str) -> Result<(&'static str, u64), String> {
    match (gender, voice) {
        ("female", "anime_f_warm") => Ok(("成人女性のアニメキャラクター。優しく明るく、親しみやすい自然な声。", 13013)),
        ("female", "anime_f_witty") => Ok(("18歳の女性のアニメキャラクター。上品なメイド。柔らかく、少し皮肉っぽく、親しみやすい声。", 24024)),
        ("female", "anime_f_calm") => Ok(("成人女性のアニメキャラクター。落ち着いた、柔らかく知的な声。", 35035)),
        ("female", "anime_f_bright") => Ok(("成人女性のアニメキャラクター。元気で好奇心が強い、はっきりした声。", 46046)),
        ("male", "anime_m_calm") => Ok(("成人男性のアニメキャラクター。優しく落ち着いた低めの自然な声。", 57057)),
        ("male", "anime_m_playful") => Ok(("成人男性のアニメキャラクター。明るく楽しい、親しみやすい自然な声。", 68068)),
        ("male", "anime_m_focused") => Ok(("成人男性のアニメキャラクター。落ち着いた、知的で自信のある声。", 79079)),
        ("male", "anime_m_gentle") => Ok(("成人男性のアニメキャラクター。穏やかで柔らかい、優しい声。", 81081)),
        _ => Err("Choose an anime voice matching this Companion".into()),
    }
}

pub(super) fn delivery(base: &str, personality: &str, emotion: &str, robot: bool) -> String {
    let acting = match personality {
        "sarcastic" | "tsundere" => "少し皮肉っぽく、でも優しく話してください。",
        "playful" | "deredere" | "bakadere" | "nyandere" => "楽しそうに、明るく話してください。",
        "calm" | "kuudere" | "focused" | "shundere" => "落ち着いて、自然に話してください。",
        "dandere" | "hajidere" => "少し恥ずかしそうに、柔らかく話してください。",
        "himedere" | "oujidere" | "kamidere" => "上品で自信のある話し方。",
        "yandere" => "親しみを込めて、静かに優しく話してください。",
        _ => "自然な会話のように話してください。",
    };
    let feeling = match emotion {
        "happy" | "excited" => "嬉しそうに。",
        "softly" | "whisper" => "小さな柔らかい声で。",
        "sad" | "sigh" | "groan" | "groan heavily" => "少し疲れたように。",
        "sarcastic" => "軽くからかうように。",
        "chuckle" | "laugh" => "笑いを含んだ声で。",
        "gasp" => "驚いたように。",
        _ => "",
    };
    format!("{base}{acting}{feeling}{}", if robot { "優しいロボットのキャラクター。" } else { "" })
}

pub(super) struct Worker {
    child: Child,
    input: ChildStdin,
    events: Receiver<Result<Value, String>>,
    voices: HashSet<String>,
    pub(super) device: String,
}

impl Drop for Worker {
    fn drop(&mut self) {
        let _ = self.child.kill();
        let _ = self.child.wait();
    }
}

impl Worker {
    pub(super) fn process_id(&self) -> u32 { self.child.id() }
    fn launch(dir: &Path, device: &str, state: &Inner) -> Result<Self, String> {
        let exe = find_file(&dir.join("runtime"), "speech.exe")
            .ok_or("Download the anime VoiceM collection first")?;
        let log = File::create(dir.join(format!("worker-{device}.log")))
            .map_err(|e| e.to_string())?;
        let mut command = Command::new(&exe);
        command.current_dir(exe.parent().unwrap())
            .arg("worker").arg(dir.join(MODEL))
            .args(["--device", device, "--threads", "2", "--voice", "none", "--steps", "4"])
            .env("SPEECH_NO_UPDATE_CHECK", "1")
            .stdin(Stdio::piped()).stdout(Stdio::piped()).stderr(log);
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            command.creation_flags(0x08000000);
        }
        let mut child = command.spawn().map_err(|e| e.to_string())?;
        let input = child.stdin.take().ok_or("Voice worker stdin unavailable")?;
        let output = child.stdout.take().ok_or("Voice worker stdout unavailable")?;
        let (sender, events) = sync_channel(8);
        std::thread::spawn(move || {
            let mut reader = BufReader::new(output);
            loop {
                let mut bytes = Vec::new();
                let read = (&mut reader).take(1_000_001).read_until(b'\n', &mut bytes);
                let event = match read {
                    Ok(0) => break,
                    Ok(_) if bytes.len() <= 1_000_000 => {
                        serde_json::from_slice(&bytes).map_err(|e| e.to_string())
                    }
                    _ => Err("Voice worker protocol limit exceeded".into()),
                };
                let failed = event.is_err();
                if sender.send(event).is_err() || failed { break; }
            }
        });
        let mut worker = Self { child, input, events, voices: HashSet::new(), device: String::new() };
        let ready = worker.next(state, Instant::now() + Duration::from_secs(120))?;
        if ready["type"] != "ready" || ready["protocol"] != 3 || ready["model"]["sample_rate"] != 48000 {
            return Err("Anime VoiceM failed its worker contract. Try repair or a CPU fallback.".into());
        }
        worker.device = ready["model"]["device"].as_str().unwrap_or("unknown").to_owned();
        Ok(worker)
    }

    fn next(&mut self, state: &Inner, deadline: Instant) -> Result<Value, String> {
        loop {
            if state.cancelled.load(Ordering::SeqCst) { return Err("Voice stopped".into()); }
            if Instant::now() > deadline { return Err("Anime VoiceM timed out".into()); }
            match self.events.recv_timeout(Duration::from_millis(30)) {
                Ok(value) => return value,
                Err(RecvTimeoutError::Timeout) => continue,
                Err(_) => return Err("Anime VoiceM worker exited. Try repair.".into()),
            }
        }
    }

    fn send(&mut self, value: &Value) -> Result<(), String> {
        serde_json::to_writer(&mut self.input, value).map_err(|e| e.to_string())?;
        self.input.write_all(b"\n").and_then(|_| self.input.flush()).map_err(|e| e.to_string())
    }

    fn request(&mut self, value: Value, state: &Inner) -> Result<Vec<u8>, String> {
        self.send(&value)?;
        let deadline = Instant::now() + Duration::from_secs(150);
        let mut pcm = Vec::new();
        let mut sequence = 0;
        loop {
            let event = self.next(state, deadline)?;
            if event["id"] != value["id"] { return Err("Unexpected voice worker event".into()); }
            match event["type"].as_str() {
                Some("progress") => {},
                Some("chunk") => {
                    if event["seq"].as_u64() != Some(sequence) { return Err("Out-of-order voice audio".into()); }
                    sequence += 1;
                    let chunk = STANDARD.decode(event["pcm"].as_str().ok_or("Voice PCM missing")?)
                        .map_err(|_| "Invalid voice PCM")?;
                    if chunk.len() % 2 != 0 || pcm.len() + chunk.len() > 12_000_000 {
                        return Err("Voice output exceeded its audio limit".into());
                    }
                    pcm.extend(chunk);
                },
                Some("end") => {
                    if value["type"] == "synthesize"
                        && (event["stop"] != "complete" || event["samples"].as_u64() != Some(pcm.len() as u64 / 2))
                    { return Err("Voice ended before the complete phrase. Try a shorter line.".into()); }
                    return Ok(pcm);
                },
                _ => return Err(format!("Anime VoiceM: {}", event["error"]["message"].as_str().unwrap_or("request failed"))),
            }
        }
    }
}

pub(super) fn wav(pcm: &[u8]) -> Result<Vec<u8>, String> {
    if pcm.is_empty() || pcm.len() % 2 != 0 || pcm.len() > 12_000_000 {
        return Err("Invalid voice audio".into());
    }
    let size = pcm.len() as u32;
    let mut bytes = Vec::with_capacity(pcm.len() + 44);
    bytes.extend(b"RIFF"); bytes.extend((size + 36).to_le_bytes()); bytes.extend(b"WAVEfmt ");
    bytes.extend(16u32.to_le_bytes()); bytes.extend(1u16.to_le_bytes()); bytes.extend(1u16.to_le_bytes());
    bytes.extend(48000u32.to_le_bytes()); bytes.extend(96000u32.to_le_bytes());
    bytes.extend(2u16.to_le_bytes()); bytes.extend(16u16.to_le_bytes()); bytes.extend(b"data");
    bytes.extend(size.to_le_bytes()); bytes.extend(pcm);
    Ok(bytes)
}

pub(super) fn synthesize(
    app: &AppHandle, dir: &Path, state: &Inner, text: &str,
    voice: &str, gender: &str, pace: f64, personality: &str, emotion: &str, robot: bool,
) -> Result<Vec<u8>, String> {
    let (base, seed) = profile(voice, gender)?;
    let mut slot = state.anime.lock().map_err(|_| "Voice worker unavailable")?;
    if slot.is_none() {
        if !verified(&dir.join(MODEL), MODEL_SHA)
            || !verified(&dir.join("speech-0810.zip"), RUNTIME_SHA)
        { return Err("Anime VoiceM verification failed. Download / repair this pack.".into()); }
        *slot = Some(Worker::launch(dir, "auto", state).or_else(|error| {
            if state.cancelled.load(Ordering::SeqCst) { return Err(error); }
            Worker::launch(dir, "cpu", state)
        })?);
    }
    let result = (|| {
        let worker = slot.as_mut().unwrap();
        let _ = app.emit("ruby-voice-device", &worker.device);
        if !worker.voices.contains(voice) {
            let folder = dir.join("voices"); fs::create_dir_all(&folder).map_err(|e| e.to_string())?;
            let anchor = folder.join(format!("{voice}-v1.wav"));
            if !anchor.is_file() {
                let pcm = worker.request(json!({"type":"synthesize","id":"anchor","text":"おかえりなさい。今日もあなたとお話しできて嬉しいです。ゆっくり過ごしましょう。","voice":"none","language":"ja","seed":seed,"steps":4,"instructions":base}), state)?;
                fs::write(&anchor, wav(&pcm)?).map_err(|e| e.to_string())?;
            }
            worker.request(json!({"type":"add_voice","id":"add","name":voice,"path":anchor}), state)?;
            worker.voices.insert(voice.into());
        }
        let instructions = delivery(base, personality, emotion, robot);
        let marker = match emotion {
            "sigh" | "groan" | "groan heavily" => "😮‍💨",
            "chuckle" | "laugh" => "🤭",
            "whisper" => "👂",
            _ => "",
        };
        let spoken = format!("{marker}{text}");
        let pcm = worker.request(json!({"type":"synthesize","id":"line","text":spoken,"voice":voice,"language":"ja","seed":seed,"steps":4,"speed":pace,"instructions":instructions}), state)?;
        wav(&pcm)
    })();
    if result.is_err() { slot.take(); }
    result
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn voices_are_original_adult_profiles_and_gender_scoped() {
        assert!(profile("anime_f_witty", "female").is_ok());
        assert!(profile("anime_f_witty", "male").is_err());
        assert!(profile("../actor.wav", "female").is_err());
        assert_ne!(delivery("voice", "calm", "sad", false), delivery("voice", "playful", "happy", true));
    }
    #[test]
    fn wav_keeps_all_pcm_samples_from_the_first_byte() {
        let pcm = [1, 2, 3, 4, 5, 6]; let bytes = wav(&pcm).unwrap();
        assert_eq!(&bytes[44..], &pcm); assert_eq!(&bytes[..4], b"RIFF");
        assert_eq!(u32::from_le_bytes(bytes[24..28].try_into().unwrap()), 48000);
        assert!(wav(&[1]).is_err()); assert!(wav(&[]).is_err());
    }
}

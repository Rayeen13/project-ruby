use serde::Serialize;
use std::{fs::File, io::Read, path::Path};
use tauri::{DragDropEvent, Emitter, Window};
const MAX_BYTES: u64 = 256 * 1024;
const MAX_CHARS: usize = 1600;
#[derive(Clone, Serialize)]
struct TextFile {
    name: String,
    size: u64,
    excerpt: String,
    truncated: bool,
}
#[derive(Clone, Serialize)]
struct DropPayload {
    file: Option<TextFile>,
    error: Option<String>,
    x: f64,
    y: f64,
}
#[derive(Clone, Serialize)]
struct HoverPayload {
    active: bool,
    x: f64,
    y: f64,
}
fn read_text(path: &Path) -> Result<TextFile, String> {
    let extension = path
        .extension()
        .and_then(|s| s.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();
    if !["txt", "md", "json"].contains(&extension.as_str()) {
        return Err(
            "Choose .txt, .md or .json. Other formats need a document or vision model.".into(),
        );
    }
    let file = File::open(path).map_err(|_| "Could not open the dropped text file.")?;
    let metadata = file
        .metadata()
        .map_err(|_| "Could not inspect this file.")?;
    if !metadata.is_file() || metadata.len() > MAX_BYTES {
        return Err("Choose a text file under 256 KB.".into());
    }
    let mut bytes = Vec::new();
    file.take(MAX_BYTES + 1)
        .read_to_end(&mut bytes)
        .map_err(|_| "Could not read this text file.")?;
    if bytes.len() as u64 > MAX_BYTES {
        return Err("Choose a text file under 256 KB.".into());
    }
    let text =
        String::from_utf8(bytes).map_err(|_| "Save this file as UTF-8 text, then try again.")?;
    if text.contains('\0') {
        return Err("This looks like a binary file. Choose UTF-8 text.".into());
    }
    let text = text
        .trim_start_matches('\u{feff}')
        .replace("\r\n", "\n")
        .replace('\r', "\n");
    let text = text.trim();
    if text.is_empty() {
        return Err("This text file is empty.".into());
    }
    Ok(TextFile {
        name: path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .chars()
            .filter(|c| !c.is_control())
            .take(120)
            .collect(),
        size: metadata.len(),
        excerpt: text.chars().take(MAX_CHARS).collect(),
        truncated: text.chars().count() > MAX_CHARS,
    })
}
pub fn handle(window: &Window, event: &DragDropEvent) {
    if window.label() != "main" {
        return;
    }
    let scale = window.scale_factor().unwrap_or(1.0);
    match event {
        DragDropEvent::Enter { position, .. } | DragDropEvent::Over { position, .. } => {
            let _ = window.emit(
                "ruby-text-hover",
                HoverPayload {
                    active: true,
                    x: position.x / scale,
                    y: position.y / scale,
                },
            );
        }
        DragDropEvent::Leave => {
            let _ = window.emit(
                "ruby-text-hover",
                HoverPayload {
                    active: false,
                    x: 0.0,
                    y: 0.0,
                },
            );
        }
        DragDropEvent::Drop {
            paths, position, ..
        } => {
            let paths = paths.clone();
            let window = window.clone();
            let x = position.x / scale;
            let y = position.y / scale;
            let _ = window.emit(
                "ruby-text-hover",
                HoverPayload {
                    active: false,
                    x,
                    y,
                },
            );
            tauri::async_runtime::spawn_blocking(move || {
                let result = if paths.len() == 1 {
                    read_text(&paths[0])
                } else {
                    Err("Share one file at a time.".into())
                };
                let (file, error) = match result {
                    Ok(file) => (Some(file), None),
                    Err(error) => (None, Some(error)),
                };
                let _ = window.emit("ruby-text-drop", DropPayload { file, error, x, y });
            });
        }
        _ => {}
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn limits_text_and_never_reads_unsupported_payloads() {
        let root = std::env::temp_dir().join(format!("ruby-drop-{}", std::process::id()));
        std::fs::create_dir_all(&root).unwrap();
        let valid = root.join("notes.md");
        std::fs::write(&valid, "Ruby likes gems.\n".repeat(200)).unwrap();
        let result = read_text(&valid).unwrap();
        assert_eq!(result.name, "notes.md");
        assert!(result.truncated);
        assert_eq!(result.excerpt.chars().count(), MAX_CHARS);
        assert!(read_text(&root.join("run.exe")).is_err());
        let large = root.join("large.txt");
        std::fs::write(&large, vec![b'x'; MAX_BYTES as usize + 1]).unwrap();
        assert!(read_text(&large).is_err());
        let binary = root.join("binary.txt");
        std::fs::write(&binary, [0, 255]).unwrap();
        assert!(read_text(&binary).is_err());
        std::fs::remove_dir_all(root).unwrap();
    }
}

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod ai_pack;
mod desktop;
mod desktop_layout;
mod internet;
mod local_ai;
mod voice;

use desktop::{perform, set_shortcut_ready, DesktopAction, DesktopState, RECOVERY_SHORTCUT};
use std::sync::Mutex;
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Emitter, Manager, WindowEvent,
};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

#[tauri::command]
fn desktop_smoke_report(
    app: tauri::AppHandle,
    passed: bool,
    details: String,
) -> Result<(), String> {
    if !std::env::args().any(|arg| arg == "--native-smoke-test") {
        return Err("Smoke reporting is disabled outside the test launch".into());
    }
    std::fs::write(
        "ruby-native-smoke.txt",
        format!("passed={passed}\n{details}\n"),
    )
    .map_err(|error| error.to_string())?;
    app.exit(if passed { 0 } else { 1 });
    Ok(())
}

#[tauri::command]
async fn desktop_smoke_checkpoint(phase: String, detail: Option<String>) -> Result<(), String> {
    if !std::env::args().any(|arg| arg == "--native-smoke-test")
        || ![
            "trace",
            "menu",
            "float",
            "look",
            "click",
            "carry",
            "dizzy",
            "recovery",
            "zoom",
            "zoom_view",
            "chat",
            "chat_lab",
            "setup",
            "opal",
            "left",
            "right",
            "pin",
            "unpin",
            "gaze_far",
            "gaze_near",
        ]
        .contains(&phase.as_str())
    {
        return Err("Smoke checkpoints are disabled outside the test launch".into());
    }
    if phase == "trace" {
        let detail = detail.unwrap_or_default();
        if detail.len() > 5000 {
            return Err("Trace too large".into());
        }
        return std::fs::write("ruby-native-live.json", detail).map_err(|e| e.to_string());
    }
    std::fs::write("ruby-native-phase.txt", &phase).map_err(|error| error.to_string())?;
    if matches!(phase.as_str(), "chat" | "chat_lab" | "setup" | "opal") {
        tokio::time::sleep(std::time::Duration::from_secs(2)).await;
    }
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .manage(ai_pack::PackState::default())
        .manage(voice::VoiceState::default())
        .manage(local_ai::AiState::default())
        .manage(Mutex::new(DesktopState::default()))
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            internet::internet_search,
            internet::open_web_url,
            voice::voice_pack_status,
            voice::voice_pack_download,
            voice::voice_synthesize,
            voice::voice_stop,
            ai_pack::ai_pack_status,
            ai_pack::ai_pack_run,
            ai_pack::ai_pack_stop,
            local_ai::local_ai_models,
            local_ai::local_ai_chat,
            local_ai::local_ai_cancel,
            desktop::desktop_action,
            desktop::desktop_status,
            desktop::desktop_move,
            desktop::desktop_body,
            desktop_smoke_report,
            desktop_smoke_checkpoint
        ])
        .setup(|app| {
            let chat = MenuItem::with_id(app, "chat", "Open conversation", true, None::<&str>)?;
            let float = MenuItem::with_id(app, "float", "Float companion", true, None::<&str>)?;
            let lab = MenuItem::with_id(app, "lab", "Open character lab", true, None::<&str>)?;
            let stop = MenuItem::with_id(
                app,
                "stop",
                "Stop / restore interaction",
                true,
                None::<&str>,
            )?;
            let hide = MenuItem::with_id(app, "hide", "Hide companion", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit Project Ruby", true, None::<&str>)?;
            let pin =
                MenuItem::with_id(app, "pin", "Toggle pin above windows", true, None::<&str>)?;
            let left = MenuItem::with_id(app, "left", "Peek from left edge", true, None::<&str>)?;
            let right =
                MenuItem::with_id(app, "right", "Peek from right edge", true, None::<&str>)?;
            let undock = MenuItem::with_id(app, "undock", "Leave screen edge", true, None::<&str>)?;
            let menu = Menu::with_items(
                app,
                &[
                    &chat, &float, &lab, &pin, &left, &right, &undock, &stop, &hide, &quit,
                ],
            )?;
            let mut tray = TrayIconBuilder::with_id("ruby-tray")
                .tooltip("Project Ruby — companion controls")
                .menu(&menu)
                .on_menu_event(|app, event| {
                    if event.id.as_ref() == "chat" {
                        let _ = perform(app, DesktopAction::Float);
                        let _ = app.emit("ruby-open-chat", ());
                        return;
                    }
                    let action = match event.id.as_ref() {
                        "float" => DesktopAction::Float,
                        "lab" => DesktopAction::Lab,
                        "stop" => DesktopAction::Stop,
                        "hide" => DesktopAction::Hide,
                        "pin" => DesktopAction::TogglePin,
                        "left" => DesktopAction::SnapLeft,
                        "right" => DesktopAction::SnapRight,
                        "undock" => DesktopAction::Undock,
                        "quit" => {
                            app.exit(0);
                            return;
                        }
                        _ => return,
                    };
                    if matches!(event.id.as_ref(), "pin" | "left" | "right" | "undock") {
                        let _ = perform(app, DesktopAction::Float);
                    }
                    if let Err(error) = perform(app, action) {
                        eprintln!("Project Ruby tray action failed: {error}");
                    }
                });
            if let Some(icon) = app.default_window_icon() {
                tray = tray.icon(icon.clone());
            }
            tray.build(app)?;
            let registered =
                app.global_shortcut()
                    .on_shortcut(RECOVERY_SHORTCUT, |app, _, event| {
                        if event.state == ShortcutState::Pressed {
                            if let Err(error) = perform(app, DesktopAction::Stop) {
                                eprintln!("Project Ruby recovery failed: {error}");
                            }
                        }
                    });
            set_shortcut_ready(app.handle(), registered.is_ok());
            if let Err(error) = registered {
                eprintln!("Recovery shortcut unavailable; click-through disabled: {error}");
            }
            if std::env::args().any(|arg| arg == "--voice-smoke-test") {
                let handle = app.handle().clone();
                tauri::async_runtime::spawn(async move {
                    let result = voice::smoke(handle.clone()).await;
                    let report = match &result {
                        Ok(()) => {
                            "passed=true\nKokoro female and male WAV generated by native host"
                                .to_string()
                        }
                        Err(error) => format!("passed=false\n{error}"),
                    };
                    let _ = std::fs::write("ruby-native-voice.txt", report);
                    handle.exit(if result.is_ok() { 0 } else { 1 });
                });
            }
            desktop::load_settings(app.handle());
            desktop::start_pointer_tracking(app.handle().clone());
            Ok(())
        })
        .on_page_load(|window, payload| {
            if payload.event() == tauri::webview::PageLoadEvent::Finished {
                if std::env::args().any(|arg| arg == "--voice-smoke-test") {
                    let _ = window.hide();
                    return;
                }
                if let Err(error) = perform(window.app_handle(), DesktopAction::Float) {
                    eprintln!("Project Ruby could not open the floating companion: {error}");
                }
                if std::env::args().any(|arg| arg == "--native-smoke-test") {
                    if std::env::args().any(|arg| arg == "--native-smoke-restart") {
                        let _ = window.eval("window.__RUBY_SMOKE_RESTART__=true;");
                    }
                    let _ = window.eval(include_str!("../../scripts/native-smoke.js"));
                }
            }
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" {
                    api.prevent_close();
                    if let Err(error) = perform(window.app_handle(), DesktopAction::Hide) {
                        eprintln!("Project Ruby could not hide to tray: {error}");
                    }
                }
            }
        })
        .build(tauri::generate_context!())
        .expect("Project Ruby could not start")
        .run(|app, event| {
            if matches!(event, tauri::RunEvent::Exit) {
                ai_pack::shutdown(app);
            }
        });
}

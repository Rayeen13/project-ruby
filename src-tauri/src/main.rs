#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod desktop;

use desktop::{perform, set_shortcut_ready, DesktopAction, DesktopState, RECOVERY_SHORTCUT};
use std::sync::Mutex;
use tauri::{menu::{Menu, MenuItem}, tray::TrayIconBuilder, Manager, WindowEvent};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

fn main() {
    tauri::Builder::default()
        .manage(Mutex::new(DesktopState::default()))
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![desktop::desktop_action, desktop::desktop_status])
        .setup(|app| {
            let float = MenuItem::with_id(app, "float", "Float companion", true, None::<&str>)?;
            let lab = MenuItem::with_id(app, "lab", "Open character lab", true, None::<&str>)?;
            let stop = MenuItem::with_id(app, "stop", "Stop / restore interaction", true, None::<&str>)?;
            let hide = MenuItem::with_id(app, "hide", "Hide companion", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit Project Ruby", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&float, &lab, &stop, &hide, &quit])?;
            let mut tray = TrayIconBuilder::with_id("ruby-tray")
                .tooltip("Project Ruby — companion controls")
                .menu(&menu)
                .on_menu_event(|app, event| {
                    let action = match event.id.as_ref() {
                        "float" => DesktopAction::Float,
                        "lab" => DesktopAction::Lab,
                        "stop" => DesktopAction::Stop,
                        "hide" => DesktopAction::Hide,
                        "quit" => { app.exit(0); return; }
                        _ => return,
                    };
                    if let Err(error) = perform(app, action) {
                        eprintln!("Project Ruby tray action failed: {error}");
                    }
                });
            if let Some(icon) = app.default_window_icon() {
                tray = tray.icon(icon.clone());
            }
            tray.build(app)?;
            let registered = app.global_shortcut().on_shortcut(RECOVERY_SHORTCUT, |app, _, event| {
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
            Ok(())
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
        .run(tauri::generate_context!())
        .expect("Project Ruby could not start");
}

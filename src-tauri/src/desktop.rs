use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, LogicalSize, Manager, PhysicalPosition, PhysicalSize, WebviewWindow};

pub const RECOVERY_SHORTCUT: &str = "Ctrl+Alt+Shift+R";

#[derive(Clone, Copy, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DesktopStatus {
    floating: bool,
    click_through: bool,
    shortcut_ready: bool,
    stopped: bool,
}

#[derive(Default)]
pub struct DesktopState {
    pub status: DesktopStatus,
    lab_bounds: Option<(PhysicalPosition<i32>, PhysicalSize<u32>)>,
    float_position: Option<PhysicalPosition<i32>>,
}

#[derive(Clone, Copy, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DesktopAction {
    Float,
    Lab,
    Drag,
    ClickThrough,
    Hide,
    Stop,
}

impl DesktopStatus {
    fn allows_click_through(&self) -> bool {
        self.floating && self.shortcut_ready
    }
}

pub fn set_shortcut_ready(app: &AppHandle, ready: bool) {
    let state_handle = app.state::<Mutex<DesktopState>>();
    if let Ok(mut state) = state_handle.lock() {
        state.status.shortcut_ready = ready;
    };
}

pub fn perform(app: &AppHandle, action: DesktopAction) -> Result<DesktopStatus, String> {
    let window = app.get_webview_window("main").ok_or("Viewer is unavailable")?;
    let state_handle = app.state::<Mutex<DesktopState>>();
    let mut state = state_handle.lock().map_err(|_| "Desktop state is unavailable")?;
    if matches!(action, DesktopAction::ClickThrough) && !state.status.allows_click_through() {
        return Err("Click-through requires floating mode and the recovery shortcut".into());
    }
    state.status.stopped = false;
    let result: tauri::Result<()> = (|| {
        match action {
            DesktopAction::Float => {
                window.set_ignore_cursor_events(false)?;
                state.status.click_through = false;
                if !state.status.floating {
                    state.lab_bounds = Some((window.outer_position()?, window.inner_size()?));
                    window.unmaximize()?;
                    window.set_min_size(Some(LogicalSize::new(280.0, 340.0)))?;
                    window.set_decorations(false)?;
                    window.set_size(LogicalSize::new(340.0, 420.0))?;
                    if let Some(position) = state.float_position {
                        window.set_position(position)?;
                    } else {
                        window.center()?;
                    }
                    state.status.floating = true;
                }
                window.set_always_on_top(true)?;
                window.set_skip_taskbar(true)?;
                window.show()?;
                window.set_focus()?;
            }
            DesktopAction::Lab => {
                window.set_ignore_cursor_events(false)?;
                state.status.click_through = false;
                if state.status.floating {
                    state.float_position = Some(window.outer_position()?);
                }
                window.set_always_on_top(false)?;
                window.set_skip_taskbar(false)?;
                window.set_decorations(true)?;
                window.set_min_size(Some(LogicalSize::new(640.0, 600.0)))?;
                if let Some((position, size)) = state.lab_bounds {
                    window.set_size(size)?;
                    window.set_position(position)?;
                }
                state.status.floating = false;
                window.unminimize()?;
                window.show()?;
                window.set_focus()?;
            }
            DesktopAction::Drag => {
                if state.status.floating && !state.status.click_through {
                    window.start_dragging()?;
                }
            }
            DesktopAction::ClickThrough => {
                window.set_ignore_cursor_events(true)?;
                state.status.click_through = true;
            }
            DesktopAction::Hide => {
                window.set_ignore_cursor_events(false)?;
                state.status.click_through = false;
                window.hide()?;
            }
            DesktopAction::Stop => {
                window.set_ignore_cursor_events(false)?;
                state.status.click_through = false;
                state.status.stopped = true;
                window.show()?;
                window.unminimize()?;
                window.center()?;
                window.set_focus()?;
            }
        }
        Ok(())
    })();
    // Publish even after a partial window-operation failure, so recovery state stays visible.
    let status = state.status;
    drop(state);
    let _ = app.emit("ruby-desktop-status", status);
    result.map_err(|error| error.to_string())?;
    Ok(status)
}

#[tauri::command]
pub fn desktop_action(window: WebviewWindow, action: DesktopAction) -> Result<DesktopStatus, String> {
    if window.label() != "main" {
        return Err("Only the local viewer can control its companion window".into());
    }
    perform(window.app_handle(), action)
}

#[tauri::command]
pub fn desktop_status(window: WebviewWindow) -> Result<DesktopStatus, String> {
    if window.label() != "main" {
        return Err("Only the local viewer can read desktop state".into());
    }
    let state_handle = window.state::<Mutex<DesktopState>>();
    let state = state_handle.lock().map_err(|_| "Desktop state is unavailable")?;
    Ok(state.status)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn click_through_requires_float_mode_and_registered_recovery() {
        let mut status = DesktopStatus::default();
        assert!(!status.allows_click_through());
        status.floating = true;
        assert!(!status.allows_click_through());
        status.shortcut_ready = true;
        assert!(status.allows_click_through());
        status.floating = false;
        assert!(!status.allows_click_through());
    }
}

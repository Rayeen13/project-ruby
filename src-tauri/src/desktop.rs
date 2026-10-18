use crate::desktop_layout::{bounded_position, nearby_edge, screen_gaze, Area, Edge};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{
    AppHandle, Emitter, LogicalSize, Manager, PhysicalPosition, PhysicalSize, WebviewWindow,
};

pub const RECOVERY_SHORTCUT: &str = "Ctrl+Alt+Shift+R";

#[derive(Clone, Copy, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DesktopStatus {
    floating: bool,
    click_through: bool,
    shortcut_ready: bool,
    stopped: bool,
    pinned: bool,
    edge: Option<Edge>,
    peeking: bool,
    size: f64,
    chat_open: bool,
}

impl Default for DesktopStatus {
    fn default() -> Self {
        Self {
            floating: false,
            click_through: false,
            shortcut_ready: false,
            stopped: false,
            pinned: true,
            edge: None,
            peeking: false,
            size: 1.0,
            chat_open: false,
        }
    }
}

#[derive(Default)]
pub struct DesktopState {
    pub status: DesktopStatus,
    body_size: Option<(f64, f64)>,
    lab_bounds: Option<(PhysicalPosition<i32>, PhysicalSize<u32>)>,
    float_position: Option<PhysicalPosition<i32>>,
}

#[derive(Deserialize, Serialize)]
struct Settings {
    pinned: bool,
    edge: Option<Edge>,
    size: f64,
    position: Option<(i32, i32)>,
}

fn settings_name() -> &'static str {
    if std::env::args().any(|arg| arg == "--native-smoke-test") {
        "desktop-state.smoke.json"
    } else {
        "desktop-state.json"
    }
}

pub fn load_settings(app: &AppHandle) {
    let Ok(directory) = app.path().app_config_dir() else {
        return;
    };
    let Ok(bytes) = std::fs::read(directory.join(settings_name())) else {
        return;
    };
    let Ok(settings) = serde_json::from_slice::<Settings>(&bytes) else {
        return;
    };
    if !settings.size.is_finite() {
        return;
    }
    let state_handle = app.state::<Mutex<DesktopState>>();
    if let Ok(mut state) = state_handle.lock() {
        state.status.pinned = settings.pinned;
        state.status.edge = settings.edge;
        state.status.size = settings.size.clamp(0.7, 1.8);
        state.float_position = settings.position.map(|(x, y)| PhysicalPosition::new(x, y));
    };
}

fn save_settings(app: &AppHandle, state: &DesktopState) -> Result<(), String> {
    // Smoke tests use a separate file, leaving normal desktop placement untouched.
    let directory = app
        .path()
        .app_config_dir()
        .map_err(|error| error.to_string())?;
    std::fs::create_dir_all(&directory).map_err(|error| error.to_string())?;
    let settings = Settings {
        pinned: state.status.pinned,
        edge: state.status.edge,
        size: state.status.size,
        position: state.float_position.map(|p| (p.x, p.y)),
    };
    let bytes = serde_json::to_vec(&settings).map_err(|error| error.to_string())?;
    std::fs::write(directory.join(settings_name()), bytes).map_err(|error| error.to_string())
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
    TogglePin,
    SnapLeft,
    SnapRight,
    Undock,
    Peek,
    Reveal,
    Release,
    ZoomIn,
    ZoomOut,
    SizeReset,
    SizeSmall,
    SizeMedium,
    SizeLarge,
    SizeExtraLarge,
    ChatOpen,
    ChatClose,
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

fn work_area(window: &WebviewWindow) -> Result<Area, String> {
    let monitor = window
        .current_monitor()
        .map_err(|error| error.to_string())?
        .or(window
            .primary_monitor()
            .map_err(|error| error.to_string())?)
        .ok_or("No monitor is available")?;
    let area = monitor.work_area();
    Ok(Area {
        x: area.position.x,
        y: area.position.y,
        width: area.size.width,
        height: area.size.height,
    })
}

fn position_float(
    window: &WebviewWindow,
    state: &mut DesktopState,
    resize: bool,
    keep_center: bool,
) -> Result<(), String> {
    let area = work_area(window)?;
    let scale = window.scale_factor().map_err(|error| error.to_string())?;
    let old = window.outer_size().map_err(|error| error.to_string())?;
    let (body_width, body_height) = state.body_size.unwrap_or((360.0, 450.0));
    let maximum = (area.width as f64 / (body_width * scale))
        .min(area.height as f64 / (body_height * scale))
        .min(1.8);
    state.status.size = state.status.size.min(maximum).max(0.7_f64.min(maximum));
    if resize {
        window
            .set_size(LogicalSize::new(
                (body_width * state.status.size + if state.status.chat_open { 400.0 } else { 0.0 })
                    .min(area.width as f64 / scale),
                (body_height * state.status.size)
                    .max(if state.status.chat_open { 480.0 } else { 0.0 })
                    .min(area.height as f64 / scale),
            ))
            .map_err(|error| error.to_string())?;
    }
    let size = window.outer_size().map_err(|error| error.to_string())?;
    let mut position = state.float_position.unwrap_or(PhysicalPosition::new(
        area.x + area.width.saturating_sub(size.width) as i32 / 2,
        area.y + area.height.saturating_sub(size.height) as i32 / 2,
    ));
    if resize && keep_center && state.status.edge.is_none() {
        position.x += (old.width as i32 - size.width as i32) / 2;
        position.y += (old.height as i32 - size.height as i32) / 2;
    }
    let (x, y) = bounded_position(
        area,
        (size.width, size.height),
        (position.x, position.y),
        state.status.edge,
        state.status.peeking,
    );
    window
        .set_position(PhysicalPosition::new(x, y))
        .map_err(|error| error.to_string())?;
    state.float_position = Some(PhysicalPosition::new(x, y));
    Ok(())
}

pub fn perform(app: &AppHandle, action: DesktopAction) -> Result<DesktopStatus, String> {
    let window = app
        .get_webview_window("main")
        .ok_or("Viewer is unavailable")?;
    let state_handle = app.state::<Mutex<DesktopState>>();
    let mut state = state_handle
        .lock()
        .map_err(|_| "Desktop state is unavailable")?;
    if matches!(action, DesktopAction::ClickThrough) && !state.status.allows_click_through() {
        return Err("Click-through requires floating mode and the recovery shortcut".into());
    }
    if !state.status.floating
        && !matches!(
            action,
            DesktopAction::Float
                | DesktopAction::ChatOpen
                | DesktopAction::ChatClose
                | DesktopAction::SizeSmall
                | DesktopAction::SizeMedium
                | DesktopAction::SizeLarge
                | DesktopAction::SizeExtraLarge
                | DesktopAction::SizeReset
                | DesktopAction::Lab
                | DesktopAction::Drag
                | DesktopAction::Hide
                | DesktopAction::Stop
        )
    {
        return Err("This control requires the floating companion".into());
    }
    state.status.stopped = false;
    let result = (|| -> Result<(), String> {
        match action {
            DesktopAction::ChatOpen | DesktopAction::ChatClose => {
                state.status.chat_open = matches!(action, DesktopAction::ChatOpen);
                if state.status.floating {
                    if state.status.chat_open {
                        state.status.edge = None;
                        state.status.peeking = false;
                    }
                    position_float(&window, &mut state, true, false)?;
                }
            }
            DesktopAction::Float => {
                window
                    .set_ignore_cursor_events(false)
                    .map_err(|e| e.to_string())?;
                state.status.click_through = false;
                if !state.status.floating {
                    window.set_fullscreen(false).map_err(|e| e.to_string())?;
                    state.lab_bounds = Some((
                        window.outer_position().map_err(|e| e.to_string())?,
                        window.inner_size().map_err(|e| e.to_string())?,
                    ));
                    window.unmaximize().map_err(|e| e.to_string())?;
                    window
                        .set_min_size(Some(LogicalSize::new(220.0, 272.0)))
                        .map_err(|e| e.to_string())?;
                    window.set_decorations(false).map_err(|e| e.to_string())?;
                    window.set_resizable(false).map_err(|e| e.to_string())?;
                    if state.float_position.is_none() {
                        window.center().map_err(|e| e.to_string())?;
                    }
                    state.status.floating = true;
                    state.status.peeking = state.status.edge.is_some();
                    position_float(&window, &mut state, true, false)?;
                }
                window
                    .set_always_on_top(state.status.pinned)
                    .map_err(|e| e.to_string())?;
                window.set_skip_taskbar(true).map_err(|e| e.to_string())?;
                window.show().map_err(|e| e.to_string())?;
                window.set_focus().map_err(|e| e.to_string())?;
            }
            DesktopAction::Lab => {
                window
                    .set_ignore_cursor_events(false)
                    .map_err(|e| e.to_string())?;
                state.status.click_through = false;
                if state.status.floating {
                    state.float_position =
                        Some(window.outer_position().map_err(|e| e.to_string())?);
                }
                window.set_always_on_top(false).map_err(|e| e.to_string())?;
                window.set_skip_taskbar(false).map_err(|e| e.to_string())?;
                window.set_decorations(false).map_err(|e| e.to_string())?;
                window.set_resizable(true).map_err(|e| e.to_string())?;
                window
                    .set_min_size(Some(LogicalSize::new(640.0, 600.0)))
                    .map_err(|e| e.to_string())?;
                if let Some((position, size)) = state.lab_bounds {
                    window.set_size(size).map_err(|e| e.to_string())?;
                    window.set_position(position).map_err(|e| e.to_string())?;
                }
                // Restored custom-frame bounds must still fit the monitor.
                let area = work_area(&window)?;
                let outer = window.outer_size().map_err(|e| e.to_string())?;
                let inner = window.inner_size().map_err(|e| e.to_string())?;
                let width = area
                    .width
                    .saturating_sub(outer.width.saturating_sub(inner.width));
                let height = area
                    .height
                    .saturating_sub(outer.height.saturating_sub(inner.height));
                window
                    .set_size(PhysicalSize::new(
                        inner.width.min(width),
                        inner.height.min(height),
                    ))
                    .map_err(|e| e.to_string())?;
                let size = window.outer_size().map_err(|e| e.to_string())?;
                let position = window.outer_position().map_err(|e| e.to_string())?;
                let (x, y) = bounded_position(
                    area,
                    (size.width, size.height),
                    (position.x, position.y),
                    None,
                    false,
                );
                window
                    .set_position(PhysicalPosition::new(x, y))
                    .map_err(|e| e.to_string())?;
                state.status.floating = false;
                window.unminimize().map_err(|e| e.to_string())?;
                window.show().map_err(|e| e.to_string())?;
                window.set_focus().map_err(|e| e.to_string())?;
            }
            DesktopAction::Drag => {
                if !state.status.click_through {
                    window.start_dragging().map_err(|e| e.to_string())?;
                }
            }
            DesktopAction::ClickThrough => {
                window
                    .set_ignore_cursor_events(true)
                    .map_err(|e| e.to_string())?;
                state.status.click_through = true;
            }
            DesktopAction::Hide => {
                window
                    .set_ignore_cursor_events(false)
                    .map_err(|e| e.to_string())?;
                state.status.click_through = false;
                window.hide().map_err(|e| e.to_string())?;
            }
            DesktopAction::Stop => {
                crate::local_ai::stop(app);
                window
                    .set_ignore_cursor_events(false)
                    .map_err(|e| e.to_string())?;
                state.status.click_through = false;
                state.status.stopped = true;
                state.status.edge = None;
                state.status.peeking = false;
                window.show().map_err(|e| e.to_string())?;
                window.unminimize().map_err(|e| e.to_string())?;
                window.center().map_err(|e| e.to_string())?;
                state.float_position = Some(window.outer_position().map_err(|e| e.to_string())?);
                window.set_focus().map_err(|e| e.to_string())?;
            }
            DesktopAction::TogglePin => {
                state.status.pinned = !state.status.pinned;
                window
                    .set_always_on_top(state.status.pinned)
                    .map_err(|e| e.to_string())?;
            }
            DesktopAction::SnapLeft | DesktopAction::SnapRight => {
                state.status.edge = Some(if matches!(action, DesktopAction::SnapLeft) {
                    Edge::Left
                } else {
                    Edge::Right
                });
                state.status.peeking = true;
                position_float(&window, &mut state, false, false)?;
            }
            DesktopAction::Peek | DesktopAction::Reveal => {
                if state.status.edge.is_some() && !state.status.click_through {
                    state.status.peeking = matches!(action, DesktopAction::Peek);
                    position_float(&window, &mut state, false, false)?;
                }
            }
            DesktopAction::Undock => {
                state.status.edge = None;
                state.status.peeking = false;
                position_float(&window, &mut state, false, false)?;
            }
            DesktopAction::Release => {
                let position = window.outer_position().map_err(|e| e.to_string())?;
                let size = window.outer_size().map_err(|e| e.to_string())?;
                let scale = window.scale_factor().map_err(|e| e.to_string())?;
                state.status.edge = nearby_edge(
                    work_area(&window)?,
                    (size.width, size.height),
                    (position.x, position.y),
                    scale,
                );
                state.status.peeking = state.status.edge.is_some();
                state.float_position = Some(position);
                position_float(&window, &mut state, false, false)?;
            }
            DesktopAction::ZoomIn
            | DesktopAction::ZoomOut
            | DesktopAction::SizeReset
            | DesktopAction::SizeSmall
            | DesktopAction::SizeMedium
            | DesktopAction::SizeLarge
            | DesktopAction::SizeExtraLarge => {
                state.status.size = match action {
                    DesktopAction::ZoomIn => [0.7, 1.0, 1.35, 1.8]
                        .into_iter()
                        .find(|size| *size > state.status.size + 0.01)
                        .unwrap_or(1.8),
                    DesktopAction::ZoomOut => [1.8, 1.35, 1.0, 0.7]
                        .into_iter()
                        .find(|size| *size < state.status.size - 0.01)
                        .unwrap_or(0.7),
                    DesktopAction::SizeSmall => 0.7,
                    DesktopAction::SizeLarge => 1.35,
                    DesktopAction::SizeExtraLarge => 1.8,
                    _ => 1.0,
                };
                if state.status.floating {
                    position_float(&window, &mut state, true, true)?;
                }
            }
        }
        if !matches!(
            action,
            DesktopAction::Peek | DesktopAction::Reveal | DesktopAction::Drag
        ) {
            save_settings(app, &state)?;
        }
        Ok(())
    })();
    let status = state.status;
    drop(state);
    let _ = app.emit("ruby-desktop-status", status);
    result?;
    Ok(status)
}

#[tauri::command]
pub fn desktop_action(
    window: WebviewWindow,
    action: DesktopAction,
) -> Result<DesktopStatus, String> {
    if window.label() != "main" {
        return Err("Only the local viewer can control its companion window".into());
    }
    perform(window.app_handle(), action)
}

#[tauri::command]
pub fn desktop_move(window: WebviewWindow, dx: f64, dy: f64) -> Result<(), String> {
    if window.label() != "main"
        || !dx.is_finite()
        || !dy.is_finite()
        || dx.abs() > 240.0
        || dy.abs() > 240.0
    {
        return Err("Invalid companion movement".into());
    }
    let state_handle = window.state::<Mutex<DesktopState>>();
    let mut state = state_handle
        .lock()
        .map_err(|_| "Desktop state is unavailable")?;
    if !state.status.floating || state.status.click_through {
        return Err("Only the interactive floating companion may move".into());
    }
    let scale = window.scale_factor().map_err(|error| error.to_string())?;
    let position = window.outer_position().map_err(|error| error.to_string())?;
    let size = window.outer_size().map_err(|error| error.to_string())?;
    state.status.edge = None;
    state.status.peeking = false;
    let desired = (
        position.x.saturating_add((dx * scale).round() as i32),
        position.y.saturating_add((dy * scale).round() as i32),
    );
    let (x, y) = bounded_position(
        work_area(&window)?,
        (size.width, size.height),
        desired,
        None,
        false,
    );
    window
        .set_position(PhysicalPosition::new(x, y))
        .map_err(|error| error.to_string())?;
    state.float_position = Some(PhysicalPosition::new(x, y));
    Ok(())
}

#[tauri::command]
pub fn desktop_status(window: WebviewWindow) -> Result<DesktopStatus, String> {
    if window.label() != "main" {
        return Err("Only the local viewer can read desktop state".into());
    }
    let state_handle = window.state::<Mutex<DesktopState>>();
    let state = state_handle
        .lock()
        .map_err(|_| "Desktop state is unavailable")?;
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

#[cfg(windows)]
pub fn start_pointer_tracking(app: AppHandle) {
    #[repr(C)]
    struct Point {
        x: i32,
        y: i32,
    }
    #[link(name = "user32")]
    unsafe extern "system" {
        fn GetCursorPos(point: *mut Point) -> i32;
    }
    #[derive(Clone, Serialize)]
    struct Pointer {
        x: f64,
        y: f64,
    }
    std::thread::spawn(move || loop {
        std::thread::sleep(std::time::Duration::from_millis(50));
        let Some(window) = app.get_webview_window("main") else {
            break;
        };
        if !window.is_visible().unwrap_or(false) {
            continue;
        }
        let mut cursor = Point { x: 0, y: 0 };
        if unsafe { GetCursorPos(&mut cursor) } == 0 {
            continue;
        }
        if let (Ok(position), Ok(size)) = (window.outer_position(), window.inner_size()) {
            if size.width > 0 && size.height > 0 {
                let Ok(area) = work_area(&window) else {
                    continue;
                };
                let pointer_width = {
                    let handle = app.state::<Mutex<DesktopState>>();
                    let state = handle.lock().ok();
                    let with_chat = match state.as_ref() {
                        Some(state) => state.status.floating && state.status.chat_open,
                        None => false,
                    };
                    if with_chat {
                        let scale = window.scale_factor().unwrap_or(1.0);
                        size.width.saturating_sub((400.0 * scale).round() as u32)
                    } else {
                        size.width
                    }
                };
                let (x, y) = screen_gaze(
                    area,
                    (pointer_width, size.height),
                    (position.x, position.y),
                    (cursor.x, cursor.y),
                );
                let pointer = Pointer { x, y };
                let _ = window.emit("ruby-global-pointer", pointer);
            }
        }
    });
}

#[cfg(not(windows))]
pub fn start_pointer_tracking(_app: AppHandle) {}

#[tauri::command]
pub fn desktop_body(window: WebviewWindow, body: String) -> Result<(), String> {
    if window.label() != "main" {
        return Err("Only the local viewer may set its Companion body".into());
    }
    let dimensions = match body.as_str() {
        "classic" => (340.0, 390.0),
        "cyber" => (310.0, 430.0),
        "chibi" => (320.0, 430.0),
        "office" => (310.0, 395.0),
        "gamer" => (360.0, 450.0),
        "opal" => (320.0, 450.0),
        _ => return Err("Unknown Companion body".into()),
    };
    let state_handle = window.state::<Mutex<DesktopState>>();
    let mut state = state_handle
        .lock()
        .map_err(|_| "Desktop state is unavailable")?;
    if state.body_size == Some(dimensions) {
        return Ok(());
    }
    state.body_size = Some(dimensions);
    if state.status.floating {
        position_float(&window, &mut state, true, true)?;
    }
    Ok(())
}

#[derive(Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum StudioWindowAction {
    Status,
    Minimize,
    MaximizeToggle,
    FullscreenToggle,
    FullscreenExit,
    Close,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StudioWindowStatus {
    fullscreen: bool,
    maximized: bool,
    decorated: bool,
}

#[tauri::command]
pub fn studio_window_action(
    window: WebviewWindow,
    action: StudioWindowAction,
) -> Result<StudioWindowStatus, String> {
    if window.label() != "main" {
        return Err("Only the studio can control its window".into());
    }
    let floating = {
        let handle = window.state::<Mutex<DesktopState>>();
        let state = handle.lock().map_err(|_| "Desktop state is unavailable")?;
        state.status.floating
    };
    if floating
        && !matches!(
            action,
            StudioWindowAction::Status | StudioWindowAction::Minimize | StudioWindowAction::Close
        )
    {
        return Err("Open the studio before changing its window layout".into());
    }
    match action {
        StudioWindowAction::Status => {}
        StudioWindowAction::Minimize => window.minimize().map_err(|e| e.to_string())?,
        StudioWindowAction::MaximizeToggle => {
            if window.is_fullscreen().map_err(|e| e.to_string())? {
                window.set_fullscreen(false).map_err(|e| e.to_string())?;
            } else if window.is_maximized().map_err(|e| e.to_string())? {
                window.unmaximize().map_err(|e| e.to_string())?;
            } else {
                window.maximize().map_err(|e| e.to_string())?;
            }
        }
        StudioWindowAction::FullscreenToggle => {
            let fullscreen = window.is_fullscreen().map_err(|e| e.to_string())?;
            window
                .set_fullscreen(!fullscreen)
                .map_err(|e| e.to_string())?;
        }
        StudioWindowAction::FullscreenExit => {
            window.set_fullscreen(false).map_err(|e| e.to_string())?;
        }
        StudioWindowAction::Close => window.close().map_err(|e| e.to_string())?,
    }
    Ok(StudioWindowStatus {
        fullscreen: window.is_fullscreen().map_err(|e| e.to_string())?,
        maximized: window.is_maximized().map_err(|e| e.to_string())?,
        decorated: window.is_decorated().map_err(|e| e.to_string())?,
    })
}

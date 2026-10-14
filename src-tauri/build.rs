fn main() {
    tauri_build::try_build(tauri_build::Attributes::new().app_manifest(
        tauri_build::AppManifest::new().commands(&[
            "local_ai_models",
            "local_ai_chat",
            "local_ai_cancel",
            "desktop_action",
            "desktop_status",
            "desktop_move",
            "desktop_smoke_report",
            "desktop_smoke_checkpoint",
        ]),
    ))
    .expect("Project Ruby host permissions could not be built");
}

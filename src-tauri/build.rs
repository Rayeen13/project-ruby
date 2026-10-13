fn main() {
    tauri_build::try_build(tauri_build::Attributes::new().app_manifest(
        tauri_build::AppManifest::new().commands(&[
            "desktop_action",
            "desktop_status",
            "desktop_smoke_report",
            "desktop_smoke_checkpoint",
        ]),
    ))
    .expect("Project Ruby host permissions could not be built");
}

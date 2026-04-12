//! LogLens Tauri backend library.

pub mod commands;
pub mod indexer;
pub mod parser;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            commands::file::open_file,
            commands::file::open_folder,
            commands::file::get_lines,
            commands::file::get_file_info,
            commands::file::get_detected_fields,
            commands::search::search_logs,
            commands::search::get_log_stats,
            commands::tail::start_tail,
            commands::tail::stop_tail,
            commands::export::export_results,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

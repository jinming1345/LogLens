// Copyright (c) 2026 jinming1345
// Licensed under AGPL-3.0. See LICENSE file for details.
// https://github.com/jinming1345/LogLens

//! Tauri command modules.

pub mod export;
pub mod file;
pub mod search;
pub mod tail;

pub use export::{export_results, ExportLine};
pub use file::{
    get_detected_fields, get_file_info, get_lines, open_file, open_folder, FileInfo, LogLine,
};
pub use search::{
    get_log_stats, search_logs, FieldFilter, KeywordFilter, LogStats, MatchedLine, SearchQuery,
    SearchResult, TimeRange,
};
pub use tail::{start_tail, stop_tail};

// Copyright (c) 2026 jinming1345
// Licensed under AGPL-3.0. See LICENSE file for details.
// https://github.com/jinming1345/LogLens

//! Export search results or selections to disk.

use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::Write;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportLine {
    pub line_number: usize,
    pub content: String,
    pub level: Option<String>,
    pub timestamp: Option<String>,
    pub file_name: String,
}

#[tauri::command]
pub fn export_results(
    lines: Vec<ExportLine>,
    format: String,
    output_path: String,
) -> Result<(), String> {
    let fmt = format.to_ascii_lowercase();
    let path = Path::new(&output_path);
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    match fmt.as_str() {
        "txt" => export_txt(&lines, path),
        "csv" => export_csv(&lines, path),
        "json" => export_json(&lines, path),
        "log" => export_log(&lines, path),
        other => Err(format!("unsupported export format: {}", other)),
    }
}

fn export_txt(lines: &[ExportLine], path: &Path) -> Result<(), String> {
    let mut f = File::create(path).map_err(|e| e.to_string())?;
    for line in lines {
        writeln!(
            f,
            "[{}] [{}] L{} — {}",
            line.file_name,
            line.level.as_deref().unwrap_or("-"),
            line.line_number,
            line.content
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn export_csv(lines: &[ExportLine], path: &Path) -> Result<(), String> {
    let mut wtr = csv::Writer::from_path(path).map_err(|e| e.to_string())?;
    wtr.write_record(["line_number", "content", "level", "timestamp", "file_name"])
        .map_err(|e| e.to_string())?;
    for line in lines {
        wtr.write_record([
            line.line_number.to_string(),
            line.content.clone(),
            line.level.clone().unwrap_or_default(),
            line.timestamp.clone().unwrap_or_default(),
            line.file_name.clone(),
        ])
        .map_err(|e| e.to_string())?;
    }
    wtr.flush().map_err(|e| e.to_string())?;
    Ok(())
}

fn export_json(lines: &[ExportLine], path: &Path) -> Result<(), String> {
    let data = serde_json::to_string_pretty(lines).map_err(|e| e.to_string())?;
    std::fs::write(path, data).map_err(|e| e.to_string())?;
    Ok(())
}

fn export_log(lines: &[ExportLine], path: &Path) -> Result<(), String> {
    let mut f = File::create(path).map_err(|e| e.to_string())?;
    for line in lines {
        let ts = line
            .timestamp
            .as_deref()
            .unwrap_or_else(|| "-");
        let lv = line.level.as_deref().unwrap_or("INFO");
        writeln!(
            f,
            "{} [{}] ({}) {} — {}",
            ts,
            lv,
            line.file_name,
            line.line_number,
            line.content
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

//! File open, indexing, and line access commands.

use crate::indexer::IndexedFile;
use crate::parser::{detect_format, parse_line, LogFormat};
use parking_lot::RwLock;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};
use std::sync::{Arc, OnceLock};
use uuid::Uuid;
use walkdir::WalkDir;

const SAMPLE_MAX_LINES: usize = 64;
const JSON_FIELD_SCAN_LINES: usize = 256;

/// Global opened files keyed by opaque id.
pub(crate) fn file_store() -> &'static RwLock<HashMap<String, FileEntry>> {
    static STORE: OnceLock<RwLock<HashMap<String, FileEntry>>> = OnceLock::new();
    STORE.get_or_init(|| RwLock::new(HashMap::new()))
}

pub struct FileEntry {
    pub indexed: Arc<IndexedFile>,
    pub format: LogFormat,
    pub detected_fields: Vec<String>,
    pub path: String,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileInfo {
    pub id: String,
    pub path: String,
    pub name: String,
    pub size: u64,
    pub total_lines: usize,
    pub format: LogFormat,
    pub detected_fields: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogLine {
    pub line_number: usize,
    pub content: crate::parser::ParsedLine,
    pub level: Option<String>,
    pub timestamp: Option<String>,
    pub is_json: bool,
    pub raw: String,
}

fn is_probably_log_file(path: &Path) -> bool {
    if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
        match ext.to_ascii_lowercase().as_str() {
            "log" | "txt" | "out" | "err" | "json" | "ndjson" | "log1" | "old" => return true,
            _ => {}
        }
    }
    if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
        let n = name.to_ascii_lowercase();
        if n == "syslog" || n == "messages" || n.contains("log") {
            return true;
        }
    }
    false
}

fn sample_lines(indexed: &IndexedFile, max: usize) -> Vec<String> {
    let mut out = Vec::new();
    let n = indexed.index.total_lines.min(max);
    for ln in 1..=n {
        if let Ok(s) = indexed.line_string_lossy(ln) {
            out.push(s);
        }
    }
    out
}

fn collect_json_field_names(indexed: &IndexedFile) -> Vec<String> {
    let mut keys: HashSet<String> = HashSet::new();
    let n = indexed.index.total_lines.min(JSON_FIELD_SCAN_LINES);
    for ln in 1..=n {
        let Ok(line) = indexed.line_string_lossy(ln) else {
            continue;
        };
        let t = line.trim();
        if let Ok(val) = serde_json::from_str::<serde_json::Value>(t) {
            if let serde_json::Value::Object(map) = val {
                for k in map.keys() {
                    keys.insert(k.clone());
                }
            }
        }
    }
    let mut v: Vec<String> = keys.into_iter().collect();
    v.sort();
    v
}

fn build_file_info(
    id: String,
    path: String,
    name: String,
    indexed: &IndexedFile,
    format: LogFormat,
    detected_fields: Vec<String>,
) -> FileInfo {
    FileInfo {
        id,
        path,
        name,
        size: indexed.index.file_size,
        total_lines: indexed.index.total_lines,
        format,
        detected_fields,
    }
}

#[tauri::command]
pub fn open_file(path: String) -> Result<FileInfo, String> {
    let path_buf = PathBuf::from(&path);
    let indexed = IndexedFile::open(&path_buf).map_err(|e| e.to_string())?;
    let indexed = Arc::new(indexed);

    let sample = sample_lines(&indexed, SAMPLE_MAX_LINES);
    let sample_refs: Vec<&str> = sample.iter().map(|s| s.as_str()).collect();
    let format = detect_format(&sample_refs);

    let detected_fields = match format {
        LogFormat::JsonLines => collect_json_field_names(&indexed),
        _ => Vec::new(),
    };

    let id = Uuid::new_v4().to_string();
    let name = path_buf
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("file")
        .to_string();

    let info = build_file_info(
        id.clone(),
        path.clone(),
        name.clone(),
        &indexed,
        format,
        detected_fields.clone(),
    );

    file_store().write().insert(
        id,
        FileEntry {
            indexed,
            format,
            detected_fields,
            path,
            name,
        },
    );

    Ok(info)
}

#[tauri::command]
pub fn open_folder(path: String) -> Result<Vec<FileInfo>, String> {
    let root = PathBuf::from(&path);
    if !root.is_dir() {
        return Err("path is not a directory".to_string());
    }

    let mut out = Vec::new();
    for entry in WalkDir::new(&root).follow_links(false).into_iter().filter_map(|e| e.ok()) {
        let p = entry.path();
        if !entry.file_type().is_file() {
            continue;
        }
        if !is_probably_log_file(p) {
            continue;
        }
        let indexed = match IndexedFile::open(p) {
            Ok(i) => Arc::new(i),
            Err(_) => continue,
        };
        let sample = sample_lines(&indexed, SAMPLE_MAX_LINES);
        let sample_refs: Vec<&str> = sample.iter().map(|s| s.as_str()).collect();
        let format = detect_format(&sample_refs);
        let detected_fields = match format {
            LogFormat::JsonLines => collect_json_field_names(&indexed),
            _ => Vec::new(),
        };

        let id = Uuid::new_v4().to_string();
        let full_path = p.to_string_lossy().to_string();
        let name = p
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("file")
            .to_string();

        let info = build_file_info(
            id.clone(),
            full_path.clone(),
            name.clone(),
            &indexed,
            format,
            detected_fields.clone(),
        );

        file_store().write().insert(
            id,
            FileEntry {
                indexed,
                format,
                detected_fields,
                path: full_path,
                name,
            },
        );

        out.push(info);
    }

    Ok(out)
}

#[tauri::command]
pub fn get_lines(file_id: String, start: usize, count: usize) -> Result<Vec<LogLine>, String> {
    if start == 0 {
        return Err("start line must be >= 1".to_string());
    }
    if count == 0 {
        return Ok(Vec::new());
    }

    let store = file_store().read();
    let entry = store
        .get(&file_id)
        .ok_or_else(|| "unknown file id".to_string())?;

    let total = entry.indexed.index.total_lines;
    let mut lines = Vec::with_capacity(count);
    for i in 0..count {
        let line_number = start + i;
        if line_number > total {
            break;
        }
        let raw_bytes = entry.indexed.line_raw(line_number).map_err(|e| e.to_string())?;
        let raw = String::from_utf8_lossy(raw_bytes).into_owned();
        let parsed = parse_line(&raw, &entry.format);
        let is_json = matches!(entry.format, LogFormat::JsonLines)
            && raw.trim_start().starts_with('{');
        let level = parsed.level.clone();
        let timestamp = parsed.timestamp.clone();
        lines.push(LogLine {
            line_number,
            content: parsed,
            level,
            timestamp,
            is_json,
            raw,
        });
    }

    Ok(lines)
}

#[tauri::command]
pub fn get_file_info(file_id: String) -> Result<FileInfo, String> {
    let store = file_store().read();
    let entry = store
        .get(&file_id)
        .ok_or_else(|| "unknown file id".to_string())?;

    Ok(build_file_info(
        file_id,
        entry.path.clone(),
        entry.name.clone(),
        &entry.indexed,
        entry.format,
        entry.detected_fields.clone(),
    ))
}

#[tauri::command]
pub fn get_detected_fields(file_id: String) -> Result<Vec<String>, String> {
    let store = file_store().read();
    let entry = store
        .get(&file_id)
        .ok_or_else(|| "unknown file id".to_string())?;
    Ok(entry.detected_fields.clone())
}

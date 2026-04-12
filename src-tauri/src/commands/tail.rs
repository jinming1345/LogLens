// Copyright (c) 2026 jinming1345
// Licensed under AGPL-3.0. See LICENSE file for details.
// https://github.com/jinming1345/LogLens

//! Real-time tail using the `notify` crate and incremental reads.

use crate::commands::file::file_store;
use notify::{recommended_watcher, Event, RecursiveMode, Watcher};
use parking_lot::RwLock;
use serde::Serialize;
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc::{channel, RecvTimeoutError};
use std::sync::{Arc, OnceLock};
use std::thread::JoinHandle;
use std::time::Duration;
use tauri::Emitter;

#[derive(Serialize, Clone)]
struct TailPayload {
    file_id: String,
    lines: Vec<String>,
}

struct TailSession {
    cancel: Arc<AtomicBool>,
    join: JoinHandle<()>,
}

fn tail_store() -> &'static RwLock<HashMap<String, TailSession>> {
    static STORE: OnceLock<RwLock<HashMap<String, TailSession>>> = OnceLock::new();
    STORE.get_or_init(|| RwLock::new(HashMap::new()))
}

fn file_name_matches(event_path: &Path, target: &Path) -> bool {
    event_path
        .file_name()
        .and_then(|a| target.file_name().map(|b| a == b))
        .unwrap_or(false)
}

fn run_tail_loop(
    path: PathBuf,
    file_id: String,
    app: tauri::AppHandle,
    cancel: Arc<AtomicBool>,
) {
    let mut last_offset = match std::fs::metadata(&path).map(|m| m.len()) {
        Ok(n) => n,
        Err(_) => return,
    };
    let mut partial = String::new();

    let (tx, rx) = channel();
    let parent = match path.parent() {
        Some(p) if !p.as_os_str().is_empty() => p.to_path_buf(),
        _ => path.clone(),
    };

    let path_clone = path.clone();
    let mut watcher = match recommended_watcher(move |res: Result<Event, notify::Error>| {
        if let Ok(ev) = res {
            for p in ev.paths {
                if file_name_matches(&p, &path_clone) {
                    let _ = tx.send(());
                    break;
                }
            }
        }
    }) {
        Ok(w) => w,
        Err(_) => return,
    };

    if watcher.watch(&parent, RecursiveMode::NonRecursive).is_err() {
        let _ = watcher.watch(&path, RecursiveMode::NonRecursive);
    }

    loop {
        if cancel.load(Ordering::Relaxed) {
            break;
        }

        match rx.recv_timeout(Duration::from_millis(800)) {
            Ok(()) | Err(RecvTimeoutError::Timeout) => {}
            Err(RecvTimeoutError::Disconnected) => break,
        }

        if cancel.load(Ordering::Relaxed) {
            break;
        }

        let meta = match std::fs::metadata(&path) {
            Ok(m) => m,
            Err(_) => continue,
        };
        let len = meta.len();
        if len < last_offset {
            last_offset = 0;
            partial.clear();
        }
        if len <= last_offset {
            continue;
        }

        let mut file = match std::fs::File::open(&path) {
            Ok(f) => f,
            Err(_) => continue,
        };
        use std::io::{Read, Seek, SeekFrom};
        if file.seek(SeekFrom::Start(last_offset)).is_err() {
            continue;
        }
        let mut buf = Vec::new();
        if file.read_to_end(&mut buf).is_err() {
            continue;
        }
        last_offset = len;

        let chunk = String::from_utf8_lossy(&buf);
        partial.push_str(&chunk);

        let mut complete_lines = Vec::new();
        while let Some(pos) = partial.find('\n') {
            let mut line = partial[..pos].to_string();
            if line.ends_with('\r') {
                line.pop();
            }
            partial.drain(..=pos);
            complete_lines.push(line);
        }

        if !complete_lines.is_empty() {
            let payload = TailPayload {
                file_id: file_id.clone(),
                lines: complete_lines,
            };
            let _ = app.emit("tail-update", &payload);
        }
    }

    drop(watcher);
}

#[tauri::command]
pub fn start_tail(file_id: String, app_handle: tauri::AppHandle) -> Result<(), String> {
    stop_tail(file_id.clone())?;

    let path_str = {
        let g = file_store().read();
        let entry = g
            .get(&file_id)
            .ok_or_else(|| "unknown file id".to_string())?;
        entry.path.clone()
    };

    let path = PathBuf::from(path_str);
    if !path.is_file() {
        return Err("file no longer exists".to_string());
    }

    let cancel = Arc::new(AtomicBool::new(false));
    let cancel_thread = cancel.clone();
    let app = app_handle.clone();
    let fid = file_id.clone();

    let join = std::thread::spawn(move || {
        run_tail_loop(path, fid, app, cancel_thread);
    });

    tail_store().write().insert(
        file_id,
        TailSession {
            cancel,
            join,
        },
    );

    Ok(())
}

#[tauri::command]
pub fn stop_tail(file_id: String) -> Result<(), String> {
    let mut g = tail_store().write();
    if let Some(sess) = g.remove(&file_id) {
        sess.cancel.store(true, Ordering::SeqCst);
        let _ = sess.join.join();
    }
    Ok(())
}

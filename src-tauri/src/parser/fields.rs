// Copyright (c) 2026 jinming1345
// Licensed under AGPL-3.0. See LICENSE file for details.
// https://github.com/jinming1345/LogLens

//! Per-line parsing into structured fields.

use crate::parser::detector::LogFormat;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::LazyLock;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedLine {
    pub timestamp: Option<String>,
    pub level: Option<String>,
    pub module: Option<String>,
    pub message: String,
    pub fields: HashMap<String, String>,
    pub raw: String,
}

static LEVEL_RE: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"(?i)\b(TRACE|DEBUG|INFO|WARN|WARNING|ERROR|FATAL|CRITICAL|PANIC)\b")
        .expect("level regex")
});

static SYSLOG_HEADER_RE: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(
        r"^(?P<ts>\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+(?P<rest>.+)$",
    )
    .expect("syslog header")
});

static LOG4J_HEADER_RE: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(
        r"^(?P<ts>\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2}(?:\.\d+)?)\s*(?P<rest>.*)$",
    )
    .expect("log4j header")
});

/// Parses a single log line according to the given [`LogFormat`].
pub fn parse_line(line: &str, format: &LogFormat) -> ParsedLine {
    let raw = line.to_string();
    match format {
        LogFormat::JsonLines => parse_json_line(&raw),
        LogFormat::Syslog => parse_syslog_line(&raw),
        LogFormat::Log4j => parse_log4j_line(&raw),
        LogFormat::Csv => parse_csv_line(&raw),
        LogFormat::Custom | LogFormat::Plain => parse_plain_line(&raw),
    }
}

fn parse_json_line(raw: &str) -> ParsedLine {
    let mut fields = HashMap::new();
    let mut timestamp = None;
    let mut level = None;
    let mut module = None;
    let message;

    let trimmed = raw.trim();
    if let Ok(serde_json::Value::Object(map)) = serde_json::from_str::<serde_json::Value>(trimmed) {
        for (k, v) in map.iter() {
            let vs = json_value_to_string(v);
            fields.insert(k.clone(), vs);
        }
        timestamp = pick_field(&fields, &["timestamp", "time", "ts", "@timestamp", "date"]);
        level = pick_field(&fields, &["level", "severity", "log_level", "lvl"]);
        module = pick_field(
            &fields,
            &["module", "logger", "logger_name", "component", "source"],
        );
        message = pick_field(&fields, &["message", "msg", "text", "body"])
            .unwrap_or_default();
    } else {
        message = raw.to_string();
    }

    let level = level.or_else(|| extract_level(raw));
    ParsedLine {
        timestamp,
        level,
        module,
        message,
        fields,
        raw: raw.to_string(),
    }
}

fn json_value_to_string(v: &serde_json::Value) -> String {
    match v {
        serde_json::Value::String(s) => s.clone(),
        serde_json::Value::Null => String::new(),
        other => other.to_string(),
    }
}

fn pick_field(fields: &HashMap<String, String>, keys: &[&str]) -> Option<String> {
    for k in keys {
        if let Some(v) = fields.get(*k) {
            if !v.is_empty() {
                return Some(v.clone());
            }
        }
    }
    None
}

fn parse_syslog_line(raw: &str) -> ParsedLine {
    let mut fields = HashMap::new();
    if let Some(caps) = SYSLOG_HEADER_RE.captures(raw.trim()) {
        let ts = caps.name("ts").map(|m| m.as_str().to_string());
        let rest = caps.name("rest").map(|m| m.as_str()).unwrap_or("");
        let level = extract_level(rest);
        fields.insert("header".into(), rest.to_string());
        let message = rest.to_string();
        return ParsedLine {
            timestamp: ts,
            level,
            module: None,
            message,
            fields,
            raw: raw.to_string(),
        };
    }
    parse_plain_line(raw)
}

fn parse_log4j_line(raw: &str) -> ParsedLine {
    let mut fields = HashMap::new();
    if let Some(caps) = LOG4J_HEADER_RE.captures(raw.trim()) {
        let ts = caps.name("ts").map(|m| m.as_str().to_string());
        let rest = caps.name("rest").map(|m| m.as_str()).unwrap_or("");
        let level = extract_level(rest);
        let message = strip_leading_level_bracket(rest).to_string();
        fields.insert("after_ts".into(), rest.to_string());
        return ParsedLine {
            timestamp: ts,
            level,
            module: extract_bracket_module(rest),
            message,
            fields,
            raw: raw.to_string(),
        };
    }
    parse_plain_line(raw)
}

fn strip_leading_level_bracket(s: &str) -> &str {
    let t = s.trim_start();
    if let Some(i) = t.find(' ') {
        let tail = &t[i + 1..];
        return tail.trim_start();
    }
    t
}

fn extract_bracket_module(s: &str) -> Option<String> {
    let t = s.trim();
    if let (Some(a), Some(b)) = (t.find('['), t.rfind(']')) {
        if b > a {
            return Some(t[a + 1..b].to_string());
        }
    }
    None
}

fn parse_csv_line(raw: &str) -> ParsedLine {
    let mut fields = HashMap::new();
    let mut rdr = csv::ReaderBuilder::new()
        .has_headers(false)
        .from_reader(raw.as_bytes());
    if let Some(Ok(rec)) = rdr.records().next() {
        for (i, f) in rec.iter().enumerate() {
            fields.insert(format!("col_{}", i), f.to_string());
        }
    }
    let level = extract_level(raw);
    ParsedLine {
        timestamp: None,
        level,
        module: None,
        message: raw.to_string(),
        fields,
        raw: raw.to_string(),
    }
}

fn parse_plain_line(raw: &str) -> ParsedLine {
    let level = extract_level(raw);
    let timestamp = extract_iso_or_common_timestamp(raw);
    ParsedLine {
        timestamp,
        level,
        module: None,
        message: raw.to_string(),
        fields: HashMap::new(),
        raw: raw.to_string(),
    }
}

fn extract_level(s: &str) -> Option<String> {
    LEVEL_RE
        .captures(s)
        .and_then(|c| c.get(1))
        .map(|m| normalize_level(m.as_str()))
}

fn normalize_level(s: &str) -> String {
    let u = s.to_ascii_uppercase();
    match u.as_str() {
        "WARNING" => "WARN".to_string(),
        "CRITICAL" | "PANIC" => "FATAL".to_string(),
        _ => u,
    }
}

fn extract_iso_or_common_timestamp(s: &str) -> Option<String> {
    static ISO_RE: LazyLock<Regex> = LazyLock::new(|| {
        Regex::new(r"\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?")
            .unwrap()
    });
    ISO_RE
        .find(s)
        .map(|m| m.as_str().to_string())
}

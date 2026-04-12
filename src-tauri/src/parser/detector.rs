// Copyright (c) 2026 jinming1345
// Licensed under AGPL-3.0. See LICENSE file for details.
// https://github.com/jinming1345/LogLens

//! Heuristic log format detection from sample lines.

use regex::Regex;
use serde::{Deserialize, Serialize};
use std::sync::LazyLock;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum LogFormat {
    JsonLines,
    Syslog,
    Log4j,
    Custom,
    Plain,
    Csv,
}

static SYSLOG_RE: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"^\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}").expect("syslog regex")
});

static LOG4J_RE: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"^\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2}").expect("log4j regex")
});

static CSV_LIKE_RE: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"^[^,\n]+(,[^,\n]+){2,}").expect("csv-like regex")
});

/// Inspects sample lines and returns the best-matching [`LogFormat`].
pub fn detect_format(sample_lines: &[&str]) -> LogFormat {
    if sample_lines.is_empty() {
        return LogFormat::Plain;
    }

    let mut json_hits = 0usize;
    let mut syslog_hits = 0usize;
    let mut log4j_hits = 0usize;
    let mut csv_hits = 0usize;

    for line in sample_lines {
        let t = line.trim();
        if t.is_empty() {
            continue;
        }
        if looks_like_json_object_or_value(t) {
            json_hits += 1;
        }
        if SYSLOG_RE.is_match(t) {
            syslog_hits += 1;
        }
        if LOG4J_RE.is_match(t) {
            log4j_hits += 1;
        }
        if CSV_LIKE_RE.is_match(t) && !looks_like_json_object_or_value(t) {
            csv_hits += 1;
        }
    }

    let n = sample_lines.iter().filter(|l| !l.trim().is_empty()).count().max(1);

    if json_hits * 2 >= n {
        return LogFormat::JsonLines;
    }
    if syslog_hits * 2 >= n && syslog_hits >= log4j_hits {
        return LogFormat::Syslog;
    }
    if log4j_hits * 2 >= n {
        return LogFormat::Log4j;
    }
    if csv_hits * 2 >= n {
        return LogFormat::Csv;
    }

    LogFormat::Plain
}

fn looks_like_json_object_or_value(s: &str) -> bool {
    let t = s.trim();
    if (t.starts_with('{') && t.ends_with('}')) || (t.starts_with('[') && t.ends_with(']')) {
        return serde_json::from_str::<serde_json::Value>(t).is_ok();
    }
    false
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detects_json() {
        let lines: &[&str] = &[r#"{"level":"info","msg":"ok"}"#];
        assert_eq!(detect_format(lines), LogFormat::JsonLines);
    }
}

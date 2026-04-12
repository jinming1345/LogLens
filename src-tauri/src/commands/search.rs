// Copyright (c) 2026 jinming1345
// Licensed under AGPL-3.0. See LICENSE file for details.
// https://github.com/jinming1345/LogLens

//! Search, filter, and aggregate statistics over indexed logs.

use crate::commands::file::file_store;
use crate::parser::{parse_line, ParsedLine};
use crate::parser::LogFormat;
use chrono::{DateTime, NaiveDateTime, TimeZone, Timelike, Utc};
use rayon::prelude::*;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Instant;

const CONTEXT_LINES: usize = 3;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeywordFilter {
    pub text: String,
    pub is_regex: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FieldFilter {
    pub field: String,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeRange {
    pub start: Option<String>,
    pub end: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchQuery {
    pub keywords: Vec<KeywordFilter>,
    pub time_range: Option<TimeRange>,
    pub levels: Vec<String>,
    pub custom_fields: Vec<FieldFilter>,
    pub use_regex: bool,
    pub case_sensitive: bool,
    pub logic: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MatchedLine {
    pub file_id: String,
    pub file_name: String,
    pub line_number: usize,
    pub content: ParsedLine,
    pub context_before: Vec<String>,
    pub context_after: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub matches: Vec<MatchedLine>,
    pub total_matches: usize,
    pub search_time_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorCount {
    pub message: String,
    pub count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HourCount {
    pub hour: String,
    pub count: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogStats {
    pub total_lines: usize,
    pub level_counts: HashMap<String, usize>,
    pub top_errors: Vec<ErrorCount>,
    pub hourly_distribution: Vec<HourCount>,
}

struct CompiledSearch {
    query: SearchQuery,
    keyword_regexes: Vec<Option<Regex>>,
    keyword_literals: Vec<String>,
    level_set: Option<std::collections::HashSet<String>>,
    time_start: Option<DateTime<Utc>>,
    time_end: Option<DateTime<Utc>>,
}

fn normalize_level(s: &str) -> String {
    s.trim().to_ascii_uppercase()
}

fn parse_flexible_timestamp(s: &str) -> Option<DateTime<Utc>> {
    let t = s.trim();
    DateTime::parse_from_rfc3339(t)
        .map(|d| d.with_timezone(&Utc))
        .ok()
        .or_else(|| {
            NaiveDateTime::parse_from_str(t, "%Y-%m-%d %H:%M:%S%.f")
                .ok()
                .map(|n| Utc.from_utc_datetime(&n))
        })
        .or_else(|| {
            NaiveDateTime::parse_from_str(t, "%Y-%m-%d %H:%M:%S")
                .ok()
                .map(|n| Utc.from_utc_datetime(&n))
        })
}

fn compile_search(query: &SearchQuery) -> Result<CompiledSearch, String> {
    let mut keyword_regexes = Vec::new();
    let mut keyword_literals = Vec::new();

    for kw in &query.keywords {
        let as_regex = kw.is_regex || query.use_regex;
        if as_regex {
            let mut pat = kw.text.clone();
            if !query.case_sensitive {
                pat = format!("(?i){}", pat);
            }
            let re = Regex::new(&pat).map_err(|e| e.to_string())?;
            keyword_regexes.push(Some(re));
            keyword_literals.push(String::new());
        } else {
            keyword_regexes.push(None);
            keyword_literals.push(kw.text.clone());
        }
    }

    let level_set = if query.levels.is_empty() {
        None
    } else {
        Some(
            query
                .levels
                .iter()
                .map(|s| normalize_level(s))
                .collect(),
        )
    };

    let time_start = query
        .time_range
        .as_ref()
        .and_then(|tr| tr.start.as_ref())
        .and_then(|s| parse_flexible_timestamp(s));
    let time_end = query
        .time_range
        .as_ref()
        .and_then(|tr| tr.end.as_ref())
        .and_then(|s| parse_flexible_timestamp(s));

    Ok(CompiledSearch {
        query: query.clone(),
        keyword_regexes,
        keyword_literals,
        level_set,
        time_start,
        time_end,
    })
}

fn haystack_for_keywords(parsed: &ParsedLine, raw: &str) -> String {
    let mut s = String::with_capacity(raw.len() + 64);
    s.push_str(raw);
    s.push(' ');
    s.push_str(&parsed.message);
    for v in parsed.fields.values() {
        s.push(' ');
        s.push_str(v);
    }
    if let Some(ref ts) = parsed.timestamp {
        s.push(' ');
        s.push_str(ts);
    }
    if let Some(ref lv) = parsed.level {
        s.push(' ');
        s.push_str(lv);
    }
    s
}

fn keyword_matches(
    compiled: &CompiledSearch,
    haystack: &str,
    haystack_lower: &str,
) -> Vec<bool> {
    compiled
        .query
        .keywords
        .iter()
        .enumerate()
        .map(|(i, _kw)| {
            if let Some(ref re) = compiled.keyword_regexes[i] {
                re.is_match(haystack)
            } else {
                let lit = &compiled.keyword_literals[i];
                if compiled.query.case_sensitive {
                    haystack.contains(lit)
                } else {
                    haystack_lower.contains(&lit.to_lowercase())
                }
            }
        })
        .collect()
}

fn combine_keyword_matches(bits: &[bool], logic: &str) -> bool {
    if bits.is_empty() {
        return true;
    }
    let is_or = logic.trim().eq_ignore_ascii_case("OR");
    if is_or {
        bits.iter().any(|b| *b)
    } else {
        bits.iter().all(|b| *b)
    }
}

fn custom_fields_match(parsed: &ParsedLine, filters: &[FieldFilter]) -> bool {
    for f in filters {
        let needle = f.value.as_str();
        let hit = parsed
            .fields
            .get(&f.field)
            .map(|v| v.contains(needle))
            .unwrap_or(false)
            || parsed.message.contains(needle)
            || parsed.raw.contains(needle);
        if !hit {
            return false;
        }
    }
    true
}

fn time_ok(parsed: &ParsedLine, compiled: &CompiledSearch) -> bool {
    if compiled.time_start.is_none() && compiled.time_end.is_none() {
        return true;
    }
    let Some(ref ts) = parsed.timestamp else {
        return false;
    };
    let Some(t) = parse_flexible_timestamp(ts) else {
        return false;
    };
    if let Some(s) = compiled.time_start {
        if t < s {
            return false;
        }
    }
    if let Some(e) = compiled.time_end {
        if t > e {
            return false;
        }
    }
    true
}

fn line_matches(
    compiled: &CompiledSearch,
    parsed: &ParsedLine,
    raw: &str,
) -> bool {
    if let Some(ref set) = compiled.level_set {
        let lv = parsed
            .level
            .as_ref()
            .map(|s| normalize_level(s))
            .unwrap_or_default();
        if lv.is_empty() || !set.contains(&lv) {
            return false;
        }
    }

    if !custom_fields_match(parsed, &compiled.query.custom_fields) {
        return false;
    }

    if !time_ok(parsed, compiled) {
        return false;
    }

    let haystack = haystack_for_keywords(parsed, raw);
    let hay_lower = haystack.to_lowercase();
    let bits = keyword_matches(compiled, &haystack, &hay_lower);
    combine_keyword_matches(&bits, &compiled.query.logic)
}

fn context_strings(
    indexed: &crate::indexer::IndexedFile,
    center: usize,
    before: usize,
    after: usize,
) -> (Vec<String>, Vec<String>) {
    let mut cb = Vec::new();
    let mut ca = Vec::new();
    if center > 1 && before > 0 {
        let lo = center.saturating_sub(before).max(1);
        for ln in lo..center {
            if let Ok(s) = indexed.line_string_lossy(ln) {
                cb.push(s);
            }
        }
    }
    let total = indexed.index.total_lines;
    if center < total && after > 0 {
        let hi = (center + after).min(total);
        for ln in (center + 1)..=hi {
            if let Ok(s) = indexed.line_string_lossy(ln) {
                ca.push(s);
            }
        }
    }
    (cb, ca)
}

#[tauri::command]
pub fn search_logs(
    file_ids: Vec<String>,
    query: SearchQuery,
) -> Result<SearchResult, String> {
    let compiled = Arc::new(compile_search(&query)?);
    let started = Instant::now();

    let snapshots: Vec<(String, String, Arc<crate::indexer::IndexedFile>, LogFormat)> = {
        let g = file_store().read();
        file_ids
            .iter()
            .filter_map(|id| {
                g.get(id).map(|e| {
                    (
                        id.clone(),
                        e.name.clone(),
                        e.indexed.clone(),
                        e.format,
                    )
                })
            })
            .collect()
    };

    let matches: Vec<MatchedLine> = snapshots
        .into_par_iter()
        .flat_map(|(file_id, file_name, indexed, fmt)| {
            let compiled = compiled.clone();
            (1..=indexed.index.total_lines)
                .into_par_iter()
                .filter_map(move |line_number| {
                    let raw_bytes = indexed.line_raw(line_number).ok()?;
                    let raw = String::from_utf8_lossy(raw_bytes).into_owned();
                    let parsed = parse_line(&raw, &fmt);
                    if !line_matches(&compiled, &parsed, &raw) {
                        return None;
                    }
                    let (cb, ca) =
                        context_strings(&indexed, line_number, CONTEXT_LINES, CONTEXT_LINES);
                    Some(MatchedLine {
                        file_id: file_id.clone(),
                        file_name: file_name.clone(),
                        line_number,
                        content: parsed,
                        context_before: cb,
                        context_after: ca,
                    })
                })
        })
        .collect();

    let total_matches = matches.len();
    let search_time_ms = started.elapsed().as_millis() as u64;

    Ok(SearchResult {
        matches,
        total_matches,
        search_time_ms,
    })
}

#[tauri::command]
pub fn get_log_stats(file_ids: Vec<String>) -> Result<LogStats, String> {
    let snapshots: Vec<(Arc<crate::indexer::IndexedFile>, LogFormat)> = {
        let g = file_store().read();
        file_ids
            .iter()
            .filter_map(|id| g.get(id).map(|e| (e.indexed.clone(), e.format)))
            .collect()
    };

    let mut total_lines = 0usize;
    let mut level_counts: HashMap<String, usize> = HashMap::new();
    let mut error_messages: HashMap<String, usize> = HashMap::new();
    let mut hourly: [u64; 24] = [0; 24];

    let partial: Vec<_> = snapshots
        .into_par_iter()
        .map(|(indexed, fmt)| {
            let mut tl = 0usize;
            let mut lc: HashMap<String, usize> = HashMap::new();
            let mut em: HashMap<String, usize> = HashMap::new();
            let mut h = [0u64; 24];

            for line_number in 1..=indexed.index.total_lines {
                tl += 1;
                let Ok(raw_bytes) = indexed.line_raw(line_number) else {
                    continue;
                };
                let raw = String::from_utf8_lossy(raw_bytes);
                let parsed = parse_line(&raw, &fmt);
                if let Some(ref lv) = parsed.level {
                    let key = normalize_level(lv);
                    let is_error = key == "ERROR" || key == "FATAL";
                    *lc.entry(key).or_insert(0) += 1;
                    if is_error {
                        let msg = if parsed.message.len() > 200 {
                            format!("{}…", &parsed.message[..200])
                        } else {
                            parsed.message.clone()
                        };
                        *em.entry(msg).or_insert(0) += 1;
                    }
                }
                if let Some(ref ts) = parsed.timestamp {
                    if let Some(dt) = parse_flexible_timestamp(ts) {
                        let hour = dt.hour() as usize;
                        if hour < 24 {
                            h[hour] += 1;
                        }
                    }
                }
            }
            (tl, lc, em, h)
        })
        .collect();

    for (tl, lc, em, h) in partial {
        total_lines += tl;
        for (k, v) in lc {
            *level_counts.entry(k).or_insert(0) += v;
        }
        for (k, v) in em {
            *error_messages.entry(k).or_insert(0) += v;
        }
        for i in 0..24 {
            hourly[i] += h[i];
        }
    }

    let mut top_pairs: Vec<(String, usize)> = error_messages.into_iter().collect();
    top_pairs.sort_by(|a, b| b.1.cmp(&a.1));
    let top_errors: Vec<ErrorCount> = top_pairs
        .into_iter()
        .take(10)
        .map(|(message, count)| ErrorCount { message, count })
        .collect();

    let hourly_distribution: Vec<HourCount> = hourly
        .iter()
        .enumerate()
        .map(|(h, &c)| HourCount {
            hour: format!("{:02}:00", h),
            count: c,
        })
        .collect();

    Ok(LogStats {
        total_lines,
        level_counts,
        top_errors,
        hourly_distribution,
    })
}

// Copyright (c) 2026 jinming1345
// Licensed under AGPL-3.0. See LICENSE file for details.
// https://github.com/jinming1345/LogLens

import { invoke } from "@tauri-apps/api/tauri";

export interface FileInfo {
  id: string;
  path: string;
  name: string;
  size: number;
  total_lines: number;
  format: string;
  detected_fields: string[];
}

export interface ParsedLine {
  timestamp: string | null;
  level: string | null;
  module: string | null;
  message: string;
  fields: Record<string, string>;
  raw: string;
}

export interface LogLine {
  line_number: number;
  content: ParsedLine;
  level: string | null;
  timestamp: string | null;
  is_json: boolean;
  raw: string;
}

export interface KeywordFilter {
  text: string;
  is_regex: boolean;
}

export interface FieldFilter {
  field: string;
  value: string;
}

export interface TimeRange {
  start: string | null;
  end: string | null;
}

export interface SearchQuery {
  keywords: KeywordFilter[];
  time_range: TimeRange | null;
  levels: string[];
  custom_fields: FieldFilter[];
  use_regex: boolean;
  case_sensitive: boolean;
  logic: string;
}

export interface MatchedLine {
  file_id: string;
  file_name: string;
  line_number: number;
  content: ParsedLine;
  context_before: string[];
  context_after: string[];
}

export interface SearchResult {
  matches: MatchedLine[];
  total_matches: number;
  search_time_ms: number;
}

export interface ErrorCount {
  message: string;
  count: number;
}

export interface HourCount {
  hour: string;
  count: number;
}

export interface LogStats {
  total_lines: number;
  level_counts: Record<string, number>;
  top_errors: ErrorCount[];
  hourly_distribution: HourCount[];
}

export interface ExportLine {
  line_number: number;
  content: string;
  level: string | null;
  timestamp: string | null;
  file_name: string;
}

export async function openFile(path: string): Promise<FileInfo> {
  return invoke<FileInfo>("open_file", { path });
}

export async function openFolder(path: string): Promise<FileInfo[]> {
  return invoke<FileInfo[]>("open_folder", { path });
}

export async function getLines(
  fileId: string,
  start: number,
  count: number,
): Promise<LogLine[]> {
  return invoke<LogLine[]>("get_lines", {
    fileId,
    start,
    count,
  });
}

export async function getFileInfo(fileId: string): Promise<FileInfo> {
  return invoke<FileInfo>("get_file_info", { fileId });
}

export async function searchLogs(
  fileIds: string[],
  query: SearchQuery,
): Promise<SearchResult> {
  return invoke<SearchResult>("search_logs", {
    fileIds,
    query,
  });
}

export async function getLogStats(fileIds: string[]): Promise<LogStats> {
  return invoke<LogStats>("get_log_stats", { fileIds });
}

export async function startTail(fileId: string): Promise<void> {
  return invoke<void>("start_tail", { fileId });
}

export async function stopTail(fileId: string): Promise<void> {
  return invoke<void>("stop_tail", { fileId });
}

export async function exportResults(
  lines: ExportLine[],
  format: string,
  outputPath: string,
): Promise<void> {
  return invoke<void>("export_results", {
    lines,
    format,
    outputPath,
  });
}

export async function getDetectedFields(fileId: string): Promise<string[]> {
  return invoke<string[]>("get_detected_fields", { fileId });
}

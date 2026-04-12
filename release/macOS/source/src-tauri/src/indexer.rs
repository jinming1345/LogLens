//! Memory-mapped file indexing with parallel newline scanning.

use memmap2::Mmap;
use rayon::prelude::*;
use std::fs::File;
use std::path::{Path, PathBuf};

const PARALLEL_CHUNK: usize = 4 * 1024 * 1024;

/// Byte offset of each line's first byte (1:1 with logical lines, including a possible trailing empty line).
#[derive(Debug, Clone)]
pub struct FileIndex {
    pub path: PathBuf,
    pub file_size: u64,
    pub line_offsets: Vec<u64>,
    pub total_lines: usize,
}

/// Keeps the underlying file handle alive for the memory map.
pub struct IndexedFile {
    pub index: FileIndex,
    mmap: Mmap,
    _file: File,
}

impl IndexedFile {
    /// Opens the file, memory-maps it, and builds the line index.
    pub fn open(path: impl AsRef<Path>) -> Result<Self, std::io::Error> {
        let path = path.as_ref().to_path_buf();
        let file = File::open(&path)?;
        let meta = file.metadata()?;
        let file_size = meta.len();

        let mmap = unsafe { Mmap::map(&file)? };
        let data = &mmap[..];
        let index = FileIndex::build(path, file_size, data);

        Ok(Self {
            index,
            mmap,
            _file: file,
        })
    }

    /// Returns raw bytes for a **1-based** line number (inclusive of line ending `\n` / `\r\n` if present).
    pub fn line_raw(&self, line_number: usize) -> Result<&[u8], String> {
        if line_number == 0 || line_number > self.index.total_lines {
            return Err(format!(
                "line {} out of range (1–{})",
                line_number, self.index.total_lines
            ));
        }
        let idx = line_number - 1;
        let start = self.index.line_offsets[idx] as usize;
        let end = if idx + 1 < self.index.line_offsets.len() {
            self.index.line_offsets[idx + 1] as usize
        } else {
            self.mmap.len()
        };
        Ok(&self.mmap[start..end])
    }

    /// Returns a lossy UTF-8 string for the line (trimmed of trailing `\r\n` / `\n` for display where useful).
    pub fn line_string_lossy(&self, line_number: usize) -> Result<String, String> {
        let raw = self.line_raw(line_number)?;
        let mut s = String::from_utf8_lossy(raw).into_owned();
        while s.ends_with('\n') || s.ends_with('\r') {
            s.pop();
        }
        Ok(s)
    }
}

impl FileIndex {
    fn build(path: PathBuf, file_size: u64, data: &[u8]) -> Self {
        let newlines = newline_positions_parallel(data);
        let line_offsets = line_starts_from_newlines(data, &newlines);
        let total_lines = line_offsets.len();
        Self {
            path,
            file_size,
            line_offsets,
            total_lines,
        }
    }
}

fn sequential_newlines(data: &[u8]) -> Vec<u64> {
    let mut v = Vec::new();
    for (i, &b) in data.iter().enumerate() {
        if b == b'\n' {
            v.push(i as u64);
        }
    }
    v
}

fn newline_positions_parallel(data: &[u8]) -> Vec<u64> {
    if data.is_empty() {
        return Vec::new();
    }
    if data.len() < PARALLEL_CHUNK {
        return sequential_newlines(data);
    }

    let len = data.len();
    let num_chunks = (len + PARALLEL_CHUNK - 1) / PARALLEL_CHUNK;

    let mut chunks: Vec<Vec<u64>> = (0..num_chunks)
        .into_par_iter()
        .map(|ci| {
            let start = ci * PARALLEL_CHUNK;
            let end = ((ci + 1) * PARALLEL_CHUNK).min(len);
            let slice = &data[start..end];
            let mut local = Vec::new();
            for (i, &b) in slice.iter().enumerate() {
                if b == b'\n' {
                    local.push((start + i) as u64);
                }
            }
            local
        })
        .collect();

    let mut merged = Vec::with_capacity(
        chunks.iter().map(|c| c.len()).sum::<usize>(),
    );
    for mut c in chunks.drain(..) {
        merged.append(&mut c);
    }
    merged
}

fn line_starts_from_newlines(data: &[u8], newlines: &[u64]) -> Vec<u64> {
    if data.is_empty() {
        return Vec::new();
    }
    let len = data.len() as u64;
    let mut starts = vec![0u64];
    for &nl in newlines {
        let next = nl.saturating_add(1);
        if next <= len {
            starts.push(next);
        }
    }
    starts
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn empty_file_no_lines() {
        let data: &[u8] = b"";
        let nl = newline_positions_parallel(data);
        let starts = line_starts_from_newlines(data, &nl);
        assert!(starts.is_empty());
    }

    #[test]
    fn single_line_no_newline() {
        let data = b"hello";
        let nl = newline_positions_parallel(data);
        let starts = line_starts_from_newlines(data, &nl);
        assert_eq!(starts, vec![0]);
    }

    #[test]
    fn trailing_newline_two_lines() {
        let data = b"a\n";
        let nl = newline_positions_parallel(data);
        let starts = line_starts_from_newlines(data, &nl);
        assert_eq!(starts, vec![0, 2]);
    }
}

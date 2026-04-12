# Changelog / 更新日志

All notable changes to this project will be documented in this file.

本项目的所有重要更改都将记录在此文件中。

The format is based on [Keep a Changelog](https://keepachangelog.com/).

---

## [1.0.0] - 2026-04-12

### Added / 新增

- **Core**: High-performance log viewer with TanStack Virtual scrolling and dynamic row height measurement
- **Core**: Rust backend using `memmap2` for memory-mapped file I/O and `rayon` for parallel processing
- **Core**: Automatic log format detection (JSON, key-value, syslog, common patterns)
- **Filter**: Multi-keyword search with AND/OR logic
- **Filter**: Regular expression support (per-keyword and global)
- **Filter**: Case-sensitive / case-insensitive toggle
- **Filter**: Log level filtering (DEBUG, INFO, WARN, ERROR, FATAL)
- **Filter**: Time range filtering with flexible timestamp parsing
- **Filter**: Custom field filtering
- **Filter**: Filter preset save/load
- **Search**: Full-screen search results view with context lines (before/after)
- **Search**: Keyword highlighting in both search results and log viewer
- **Search**: One-click jump from search result to source line, with "Back to Results" floating button
- **Dashboard**: Per-file statistics with summary cards (total lines, error count, warning count)
- **Dashboard**: Color-coded log level distribution bar chart
- **Dashboard**: Hourly volume line chart
- **Dashboard**: Top error messages table
- **UI**: Resizable sidebar and filter panels with drag handles
- **UI**: Dark/Light/System theme support
- **UI**: Chinese and English bilingual interface with one-click switching
- **UI**: Clean, modern Typora-inspired design
- **UI**: System font stacks with CJK fallbacks for mixed content
- **Tail**: Real-time log tailing (tail -f) with auto-scroll
- **Bookmarks**: Mark log lines with notes, quick jump from sidebar
- **Export**: Export to JSON Lines, CSV, or plain text
- **Files**: Drag-and-drop file/folder opening
- **Files**: Multi-file tabs with file info display
- **Keyboard**: Full keyboard shortcut support (Ctrl+O, Ctrl+K, Ctrl+F, etc.)
- **Cross-platform**: Windows installer (NSIS) and portable executable
- **Cross-platform**: Linux and macOS build scripts with source packages

### Technical / 技术细节

- Tauri 2 framework (Rust + React)
- React 19 with TypeScript
- Vite build system
- Tailwind CSS + shadcn/ui design tokens
- Zustand state management
- i18next internationalization
- TanStack Virtual for virtualized scrolling

[1.0.0]: https://github.com/jinming1345/LogLens/releases/tag/v1.0.0

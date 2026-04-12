# LogLens - Log View Pro Max

<p align="center">
  <img src="public/loglens.svg" alt="LogLens Logo" width="120" />
</p>

<p align="center">
  <strong>A high-performance, cross-platform desktop log viewer and analyzer</strong><br/>
  <strong>高性能跨平台桌面日志查看与分析工具</strong>
</p>

<p align="center">
  <a href="https://github.com/jinming1345/LogLens/releases/latest"><img src="https://img.shields.io/github/v/release/jinming1345/LogLens?style=flat-square&color=blue" alt="Latest Release" /></a>
  <a href="https://github.com/jinming1345/LogLens/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/jinming1345/LogLens/ci.yml?branch=main&style=flat-square&label=CI" alt="CI Status" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/jinming1345/LogLens?style=flat-square" alt="License" /></a>
  <a href="https://github.com/jinming1345/LogLens/releases"><img src="https://img.shields.io/github/downloads/jinming1345/LogLens/total?style=flat-square&color=green" alt="Downloads" /></a>
  <img src="https://img.shields.io/badge/platform-Windows%20|%20Linux%20|%20macOS-lightgrey?style=flat-square" alt="Platform" />
  <img src="https://img.shields.io/badge/Tauri-2.0-blue?style=flat-square&logo=tauri" alt="Tauri 2" />
  <img src="https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Rust-🦀-orange?style=flat-square" alt="Rust" />
</p>

<p align="center">
  <a href="#english">English</a> · <a href="#中文">中文</a> · <a href="CHANGELOG.md">Changelog</a> · <a href="CONTRIBUTING.md">Contributing</a>
</p>

---

<a id="english"></a>

## English

### Overview

**LogLens** is a production-ready desktop application built for developers to efficiently view, search, filter, and analyze large log files. Powered by **Tauri 2** (Rust backend + React frontend), it delivers native-like performance with a modern, clean UI inspired by Typora.

### Features

- **High-Performance Log Viewing** — Virtual scrolling with dynamic row height measurement handles files with millions of lines smoothly
- **Advanced Filtering** — Multi-keyword search, regex support, log level filtering, time range filtering, and custom field matching
- **Keyword Highlighting** — Search keywords are highlighted in both search results and the log viewer for quick identification
- **Search Results View** — Dedicated full-screen search results with context lines (before/after), one-click jump to source line
- **Data Dashboard** — Per-file statistics including log level distribution (color-coded bar chart), hourly volume (line chart), top error messages, and summary cards
- **Resizable Panels** — Drag to adjust sidebar and filter panel widths
- **Dark/Light Theme** — System-following or manual toggle between dark and light modes
- **Bilingual Interface** — Full Chinese and English UI with one-click language switching
- **Real-time Tailing** — Monitor live log files (like `tail -f`) with auto-scroll to latest entries
- **Bookmarks** — Mark important log lines with notes for quick reference
- **Export** — Export filtered results as JSON Lines, CSV, or plain text
- **Cross-Platform** — Windows, Linux, and macOS support

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Rust, Tauri 2, memmap2, rayon, regex, serde |
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui design system |
| State | Zustand |
| Virtualization | TanStack Virtual |
| i18n | i18next + react-i18next |

### Installation

#### Windows

1. Download `LogLens_1.0.0_x64-setup.exe` from [Releases](https://github.com/jinming1345/LogLens/releases)
2. Run the installer and follow the prompts
3. Launch LogLens from the Start menu or desktop shortcut

> You can also download the portable `LogLens.exe` — no installation needed, just double-click to run.

#### Linux

1. Download the source from the `release/Linux/` folder
2. Install dependencies:
   ```bash
   # Ubuntu/Debian
   sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget file \
     libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
   ```
3. Run the build script:
   ```bash
   chmod +x build.sh && ./build.sh
   ```
4. Find the built packages in `src-tauri/target/release/bundle/`

#### macOS

1. Download the source from the `release/macOS/` folder
2. Ensure Xcode Command Line Tools are installed:
   ```bash
   xcode-select --install
   ```
3. Run the build script:
   ```bash
   chmod +x build.sh && ./build.sh
   ```
4. Find the `.dmg` or `.app` in `src-tauri/target/release/bundle/`

### Build from Source

```bash
# Prerequisites: Node.js 18+, Rust 1.70+, pnpm
git clone https://github.com/jinming1345/LogLens.git
cd LogLens
pnpm install
pnpm tauri build
```

### Usage Guide

#### 1. Opening Log Files

- **Menu**: Click the file open button in the sidebar
- **Drag & Drop**: Drag log files directly into the window
- **Keyboard**: `Ctrl+O` (open file) or `Ctrl+Shift+O` (open folder)
- Supports any text-based log file (.log, .txt, .jsonl, etc.)

#### 2. Browsing Logs

- Scroll through logs with virtual scrolling (smooth even with millions of lines)
- Click any line to select it — selected line is highlighted
- Line numbers are shown on the left
- Log levels are color-coded: <span style="color: blue">DEBUG</span> / <span style="color: green">INFO</span> / <span style="color: orange">WARN</span> / <span style="color: red">ERROR</span> / <span style="color: purple">FATAL</span>
- Timestamps and modules are automatically detected and displayed

#### 3. Filtering & Searching

1. Open the filter panel (click the filter icon in the title bar or press `Ctrl+K`)
2. Enter keywords (supports multiple keywords)
3. Toggle options:
   - **Regex**: Enable regular expression matching
   - **Case Sensitive**: Match exact case
   - **Logic**: AND (all keywords must match) or OR (any keyword matches)
4. Select log levels to filter (DEBUG, INFO, WARN, ERROR, FATAL)
5. Set time range (start/end timestamps)
6. Click **Apply** — results appear in the main area with keyword highlighting
7. Click **Jump to Source** on any result to return to the original log line
8. Use the floating **← Back to Results** button to return to search results

#### 4. Data Dashboard

- Switch to "Dashboard" in the sidebar
- View statistics for the currently active file:
  - **Total Lines** / **Error Count** / **Warning Count** summary cards
  - **Level Distribution** — color-coded bar chart
  - **Hourly Volume** — line chart showing log frequency over time
  - **Top Error Messages** — most frequent error messages ranked by count

#### 5. Real-time Tailing

- Click "Start Tailing" in the bottom bar
- LogLens monitors the file for new content and auto-scrolls to the latest line
- Click "Stop Tailing" to return to manual browsing

#### 6. Bookmarks

- Right-click or use the bookmark button to mark important lines
- Add notes to bookmarks for context
- Access all bookmarks from the sidebar
- Click any bookmark to jump to that line

#### 7. Export

- Open the export dialog from the filter panel
- Choose export source: current search results or visible lines
- Select format: JSON Lines (.jsonl), CSV, or plain text (.txt)
- Choose save location and export

#### 8. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+O` | Open file |
| `Ctrl+Shift+O` | Open folder |
| `Ctrl+K` | Toggle filter panel |
| `Ctrl+F` | Focus search input |
| `Ctrl+,` | Open settings |
| `Escape` | Close filter panel |

### Screenshots

> Coming soon

### License

MIT

---

<a id="中文"></a>

## 中文

### 概述

**LogLens（日志透镜）** 是一款为开发者打造的生产级桌面应用，用于高效查看、搜索、筛选和分析大型日志文件。基于 **Tauri 2**（Rust 后端 + React 前端）构建，提供原生级性能和灵感来自 Typora 的现代简洁 UI。

### 功能特性

- **高性能日志查看** — 虚拟滚动 + 动态行高测量，百万行日志流畅浏览
- **高级筛选** — 多关键词搜索、正则表达式、日志级别筛选、时间范围过滤、自定义字段匹配
- **关键词高亮** — 搜索关键词在结果和日志查看器中均高亮显示，方便快速定位
- **搜索结果视图** — 全屏展示搜索结果，带上下文行，一键跳转到原文行
- **数据看板** — 单文件统计：级别分布（彩色柱状图）、按小时分布（折线图）、高频错误信息、汇总卡片
- **可调整面板** — 拖拽调整侧边栏和筛选面板宽度
- **深色/浅色主题** — 支持跟随系统或手动切换
- **中英双语界面** — 完整的中文和英文界面，一键切换
- **实时跟踪** — 类似 `tail -f`，自动滚动到最新日志行
- **书签功能** — 标记重要日志行，添加备注，快速回看
- **导出功能** — 支持导出为 JSON Lines、CSV、纯文本
- **跨平台** — 支持 Windows、Linux、macOS

### 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Rust, Tauri 2, memmap2, rayon, regex, serde |
| 前端 | React 19, TypeScript, Vite |
| 样式 | Tailwind CSS, shadcn/ui 设计系统 |
| 状态管理 | Zustand |
| 虚拟滚动 | TanStack Virtual |
| 国际化 | i18next + react-i18next |

### 安装

#### Windows

1. 从 [Releases](https://github.com/jinming1345/LogLens/releases) 下载 `LogLens_1.0.0_x64-setup.exe`
2. 运行安装程序，按提示完成安装
3. 从开始菜单或桌面快捷方式启动 LogLens

> 也可以下载便携版 `LogLens.exe`，无需安装，双击即可运行。

#### Linux

1. 下载 `release/Linux/` 文件夹中的源码
2. 安装系统依赖：
   ```bash
   # Ubuntu/Debian
   sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget file \
     libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
   ```
3. 运行构建脚本：
   ```bash
   chmod +x build.sh && ./build.sh
   ```
4. 在 `src-tauri/target/release/bundle/` 中找到构建产物

#### macOS

1. 下载 `release/macOS/` 文件夹中的源码
2. 确保安装了 Xcode 命令行工具：
   ```bash
   xcode-select --install
   ```
3. 运行构建脚本：
   ```bash
   chmod +x build.sh && ./build.sh
   ```
4. 在 `src-tauri/target/release/bundle/` 中找到 `.dmg` 或 `.app`

### 从源码构建

```bash
# 前置要求：Node.js 18+, Rust 1.70+, pnpm
git clone https://github.com/jinming1345/LogLens.git
cd LogLens
pnpm install
pnpm tauri build
```

### 使用教程

#### 1. 打开日志文件

- **按钮**：点击侧边栏的文件打开按钮
- **拖放**：将日志文件直接拖入窗口
- **快捷键**：`Ctrl+O`（打开文件）或 `Ctrl+Shift+O`（打开文件夹）
- 支持任何文本日志文件（.log、.txt、.jsonl 等）

#### 2. 浏览日志

- 虚拟滚动浏览日志（百万行也流畅）
- 点击任意行选中，选中行高亮显示
- 左侧显示行号
- 日志级别自动着色：<span style="color: blue">DEBUG</span> / <span style="color: green">INFO</span> / <span style="color: orange">WARN</span> / <span style="color: red">ERROR</span> / <span style="color: purple">FATAL</span>
- 自动检测并显示时间戳和模块名

#### 3. 筛选与搜索

1. 打开筛选面板（点击标题栏筛选图标或按 `Ctrl+K`）
2. 输入关键词（支持多个关键词）
3. 切换选项：
   - **正则表达式**：启用正则匹配
   - **区分大小写**：精确匹配大小写
   - **组合逻辑**：AND（全部匹配）或 OR（任一匹配）
4. 选择要筛选的日志级别（DEBUG、INFO、WARN、ERROR、FATAL）
5. 设置时间范围（开始/结束时间）
6. 点击 **应用筛选** — 结果在主区域全屏展示，关键词高亮
7. 点击结果中的 **跳转到原文** 回到日志查看器中对应行
8. 使用底部浮动按钮 **← 返回搜索结果** 回到搜索结果

#### 4. 数据看板

- 在侧边栏切换到"数据看板"
- 查看当前活跃文件的统计信息：
  - **总行数** / **错误数** / **警告数** 汇总卡片
  - **级别分布** — 彩色柱状图
  - **按小时分布** — 折线图，展示日志频率随时间变化
  - **高频错误信息** — 按出现次数排列的错误消息

#### 5. 实时跟踪

- 点击底部栏的"开始跟踪"
- LogLens 监控文件新增内容，自动滚动到最新行
- 点击"停止跟踪"返回手动浏览模式

#### 6. 书签

- 使用书签按钮标记重要行
- 为书签添加备注说明
- 在侧边栏查看所有书签
- 点击书签跳转到对应行

#### 7. 导出

- 在筛选面板打开导出对话框
- 选择导出来源：当前搜索结果或可见行
- 选择格式：JSON Lines（.jsonl）、CSV、纯文本（.txt）
- 选择保存位置并导出

#### 8. 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+O` | 打开文件 |
| `Ctrl+Shift+O` | 打开文件夹 |
| `Ctrl+K` | 切换筛选面板 |
| `Ctrl+F` | 聚焦搜索输入 |
| `Ctrl+,` | 打开设置 |
| `Escape` | 关闭筛选面板 |

### 截图

> 即将添加

### 开源协议

MIT

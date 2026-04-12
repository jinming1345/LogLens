# LogLens 日志透镜

<p align="center">
  <strong>一款专为开发者设计的极简美观日志查看与调试工具</strong><br>
  <em>A beautiful, high-performance log viewer for developers</em>
</p>

---

## 功能特性 / Features

### 核心功能
- **大文件支持** — 采用内存映射（mmap）+ 行偏移索引，轻松处理 1GB+ 日志文件
- **虚拟滚动** — TanStack Virtual 驱动，百万行日志流畅滚动
- **智能过滤** — 多关键词 AND/OR 组合、正则表达式、时间范围、日志等级、自定义字段过滤
- **格式自动识别** — 自动检测 JSON Lines、Syslog、Log4j、CSV、纯文本等格式
- **实时监控** — Tail 模式实时追踪日志文件写入

### 界面与体验
- **极简设计** — 对标 Typora 风格，大量留白、优美排版、内容至上
- **浅色/深色主题** — 一键切换，丝滑过渡
- **中英双语** — 完整的中英文界面，切换即时生效
- **快捷键** — VS Code 风格快捷键，提升操作效率

### 实用功能
- **数据看板** — 日志统计、错误 Top10、时间分布图表
- **多文件标签** — 同时打开多个日志文件
- **书签系统** — 标记重要日志行，快速跳转
- **过滤器保存** — 保存常用过滤组合，一键调用
- **导出功能** — 过滤结果导出为 JSON / CSV / TXT 格式

## 技术栈 / Tech Stack

| 层级 | 技术 |
|------|------|
| 框架 | Tauri 2 (Rust + Web) |
| 前端 | React 19 + TypeScript |
| 样式 | Tailwind CSS |
| 状态 | Zustand |
| 虚拟滚动 | TanStack Virtual |
| 国际化 | i18next |
| 图表 | Recharts |
| 图标 | Lucide React |
| 文件处理 | memmap2 + rayon (Rust) |
| 搜索引擎 | regex (Rust) |
| 文件监控 | notify (Rust) |

## 快速开始 / Quick Start

### 环境要求

- **Node.js** >= 18
- **Rust** >= 1.70
- **pnpm** >= 8
- Windows: Visual Studio Build Tools (MSVC C++)
- macOS: Xcode Command Line Tools
- Linux: `build-essential`, `libwebkit2gtk-4.1-dev`, `libgtk-3-dev`

### 安装与运行

```bash
# 克隆项目
git clone <repo-url>
cd loglens

# 安装前端依赖
pnpm install

# 开发模式运行
pnpm tauri dev

# 构建生产版本
pnpm tauri build
```

## 快捷键 / Shortcuts

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+O` | 打开文件 |
| `Ctrl+Shift+O` | 打开文件夹 |
| `Ctrl+K` | 切换过滤面板 |
| `Ctrl+F` | 聚焦搜索 |
| `Ctrl+,` | 打开设置 |
| `Escape` | 关闭过滤面板 |

## 支持的日志格式

- **JSON Lines** — 每行一个 JSON 对象，自动提取所有字段
- **Syslog** — 标准 syslog 格式
- **Log4j / Logback** — `2024-01-01 12:00:00 [LEVEL] message` 格式
- **CSV** — 逗号分隔值
- **纯文本** — 任意文本文件，自动识别日志等级和时间戳

## 项目结构 / Project Structure

```
loglens/
├── src/                    # React 前端
│   ├── components/         # UI 组件
│   │   ├── TitleBar.tsx    # 顶部标题栏
│   │   ├── Sidebar.tsx     # 侧边栏导航
│   │   ├── LogViewer.tsx   # 主日志查看器
│   │   ├── FilterPanel.tsx # 智能过滤面板
│   │   ├── Dashboard.tsx   # 数据看板
│   │   ├── SettingsPanel.tsx # 设置面板
│   │   └── ExportDialog.tsx  # 导出对话框
│   ├── stores/             # Zustand 状态管理
│   ├── i18n/               # 中英文语言包
│   ├── lib/                # 工具函数 + Tauri API
│   └── styles/             # 全局样式
├── src-tauri/              # Rust 后端
│   └── src/
│       ├── commands/       # Tauri IPC 命令
│       │   ├── file.rs     # 文件操作
│       │   ├── search.rs   # 搜索过滤
│       │   ├── tail.rs     # 实时监控
│       │   └── export.rs   # 导出
│       ├── parser/         # 日志解析
│       │   ├── detector.rs # 格式检测
│       │   └── fields.rs   # 字段提取
│       └── indexer.rs      # 行索引
├── package.json
├── tailwind.config.ts
└── vite.config.ts
```

## License

MIT

# Contributing to LogLens / 贡献指南

Thank you for your interest in contributing to LogLens! 感谢你对 LogLens 项目的关注！

## How to Contribute / 如何贡献

### Reporting Bugs / 报告 Bug

1. Check [existing issues](https://github.com/jinming1345/LogLens/issues) first / 先检查是否已有相关 issue
2. Use the **Bug Report** issue template / 使用 Bug 报告模板
3. Include:
   - OS and version / 操作系统和版本
   - Steps to reproduce / 复现步骤
   - Expected vs actual behavior / 预期 vs 实际行为
   - Log file sample (if relevant) / 相关日志样本

### Suggesting Features / 建议功能

1. Use the **Feature Request** issue template / 使用功能请求模板
2. Describe the use case / 描述使用场景
3. Explain why it would be useful / 解释为什么有用

### Submitting Code / 提交代码

1. Fork the repository / Fork 仓库
2. Create a feature branch / 创建功能分支
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes / 进行修改
4. Test your changes / 测试修改
5. Commit with a clear message / 提交清晰的 commit 消息
   ```bash
   git commit -m "feat: add your feature description"
   ```
6. Push and create a Pull Request / 推送并创建 PR

### Commit Message Convention / 提交消息规范

We follow [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Description |
|--------|-------------|
| `feat:` | New feature / 新功能 |
| `fix:` | Bug fix / 修复 Bug |
| `docs:` | Documentation / 文档 |
| `style:` | Code style (no logic change) / 代码风格 |
| `refactor:` | Refactoring / 重构 |
| `perf:` | Performance improvement / 性能优化 |
| `test:` | Tests / 测试 |
| `chore:` | Build/tooling / 构建工具 |

## Development Setup / 开发环境搭建

### Prerequisites / 前置要求

- **Node.js** 18+
- **Rust** 1.70+ (via [rustup](https://rustup.rs/))
- **pnpm** (`npm install -g pnpm`)
- **Platform-specific dependencies**:
  - Windows: WebView2 (pre-installed on Windows 11)
  - Linux: `libwebkit2gtk-4.1-dev`, `libgtk-3-dev`, etc.
  - macOS: Xcode Command Line Tools

### Getting Started / 快速开始

```bash
git clone https://github.com/jinming1345/LogLens.git
cd LogLens
pnpm install
pnpm tauri dev
```

### Project Structure / 项目结构

```
LogLens/
├── src/                    # React frontend / React 前端
│   ├── components/         # UI components / UI 组件
│   ├── stores/             # Zustand stores / 状态管理
│   ├── lib/                # Utilities / 工具函数
│   ├── i18n/               # Translations / 翻译文件
│   └── styles/             # Global styles / 全局样式
├── src-tauri/              # Rust backend / Rust 后端
│   └── src/
│       ├── commands/       # Tauri commands / Tauri 命令
│       ├── parser/         # Log parser / 日志解析器
│       └── indexer.rs      # File indexer / 文件索引器
├── release/                # Platform packages / 平台发布包
│   ├── Windows/
│   ├── Linux/
│   └── macOS/
└── public/                 # Static assets / 静态资源
```

### Running Tests / 运行测试

```bash
# Frontend
pnpm test

# Backend (Rust)
cd src-tauri && cargo test
```

## Code of Conduct / 行为准则

Please be respectful and constructive in all interactions. 请在所有互动中保持尊重和建设性。

## License / 许可

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

通过贡献代码，你同意你的贡献将在 [MIT 许可证](LICENSE) 下发布。

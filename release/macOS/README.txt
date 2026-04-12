╔══════════════════════════════════════╗
║    LogLens 日志透镜 - macOS 版      ║
║         版本 1.0.0 (源码构建)       ║
╚══════════════════════════════════════╝

本文件夹包含完整源码，在 macOS 机器上一键构建即可。

=== 环境要求 ===

  1. Xcode Command Line Tools
     xcode-select --install

  2. Node.js >= 18
     brew install node
     或访问 https://nodejs.org 下载

  3. Rust >= 1.70
     curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

  4. pnpm
     npm install -g pnpm

=== 构建步骤 ===

  方式一：一键构建脚本
    chmod +x build.sh
    ./build.sh

  方式二：手动构建
    cd source
    pnpm install
    pnpm tauri build

=== 构建产物 ===

  构建完成后，安装包位于 source/src-tauri/target/release/bundle/ 下：
    - dmg/   → .dmg 安装镜像
    - macos/ → .app 应用包

  打开 .dmg 文件，将 LogLens.app 拖入 Applications 文件夹即可完成安装。

=== 支持架构 ===

  - Intel Mac (x86_64): 直接构建
  - Apple Silicon (aarch64): 直接构建
  - Universal Binary: rustup target add x86_64-apple-darwin && pnpm tauri build --target universal-apple-darwin

=== 功能简介 ===

  - 高性能日志查看器，支持百万行虚拟滚动
  - 智能过滤：多关键词、正则、时间范围、日志等级
  - 支持格式：.log .txt .json .csv .xml 等
  - 浅色/深色主题、中英双语
  - 实时监控 Tail 模式
  - 数据看板、书签、导出

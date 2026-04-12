╔══════════════════════════════════════╗
║    LogLens 日志透镜 - Linux 版      ║
║         版本 1.0.0 (源码构建)       ║
╚══════════════════════════════════════╝

本文件夹包含完整源码，在 Linux 机器上一键构建即可。

=== 环境要求 ===

  1. Node.js >= 18
     curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
     sudo apt-get install -y nodejs

  2. Rust >= 1.70
     curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

  3. pnpm
     npm install -g pnpm

  4. Linux 系统依赖 (Ubuntu/Debian):
     sudo apt-get install -y \
       libwebkit2gtk-4.1-dev \
       libgtk-3-dev \
       libayatana-appindicator3-dev \
       librsvg2-dev \
       patchelf

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
    - deb/     → .deb 安装包（Debian/Ubuntu）
    - appimage/ → .AppImage 便携版
    - rpm/     → .rpm 安装包（Fedora/RHEL）

=== 功能简介 ===

  - 高性能日志查看器，支持百万行虚拟滚动
  - 智能过滤：多关键词、正则、时间范围、日志等级
  - 支持格式：.log .txt .json .csv .xml 等
  - 浅色/深色主题、中英双语
  - 实时监控 Tail 模式
  - 数据看板、书签、导出

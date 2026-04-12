#!/bin/bash
set -e

echo "╔══════════════════════════════════════╗"
echo "║  LogLens 日志透镜 - Linux 构建脚本   ║"
echo "╚══════════════════════════════════════╝"

# 检查依赖
check_cmd() {
    if ! command -v "$1" &> /dev/null; then
        echo "❌ 缺少 $1，请先安装"
        return 1
    fi
    echo "✅ $1 已安装: $($1 --version 2>&1 | head -n1)"
}

echo ""
echo "=== 检查环境 ==="
check_cmd node
check_cmd rustc
check_cmd cargo
check_cmd pnpm || { echo "尝试安装 pnpm..."; npm install -g pnpm; }

echo ""
echo "=== 安装系统依赖（Ubuntu/Debian）==="
echo "如果您使用其他发行版，请手动安装对应的包"
if command -v apt-get &> /dev/null; then
    sudo apt-get update
    sudo apt-get install -y \
        libwebkit2gtk-4.1-dev \
        libgtk-3-dev \
        libayatana-appindicator3-dev \
        librsvg2-dev \
        patchelf
fi

echo ""
echo "=== 安装前端依赖 ==="
cd "$(dirname "$0")/source"
pnpm install

echo ""
echo "=== 开始构建 ==="
pnpm tauri build

echo ""
echo "=== 构建完成！==="
echo "安装包位于："
echo "  .deb:      src-tauri/target/release/bundle/deb/"
echo "  .AppImage: src-tauri/target/release/bundle/appimage/"
echo "  .rpm:      src-tauri/target/release/bundle/rpm/"
echo ""
echo "可执行文件: src-tauri/target/release/loglens"

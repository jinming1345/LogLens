#!/bin/bash
set -e

echo "╔══════════════════════════════════════╗"
echo "║  LogLens 日志透镜 - macOS 构建脚本   ║"
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
echo "=== 检查 Xcode Command Line Tools ==="
if ! xcode-select -p &> /dev/null; then
    echo "安装 Xcode Command Line Tools..."
    xcode-select --install
    echo "请等待安装完成后重新运行此脚本"
    exit 1
fi
echo "✅ Xcode CLT 已安装"

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
echo "  .dmg: src-tauri/target/release/bundle/dmg/"
echo "  .app: src-tauri/target/release/bundle/macos/"
echo ""
echo "直接打开 .dmg 文件，将 LogLens.app 拖入 Applications 即可"

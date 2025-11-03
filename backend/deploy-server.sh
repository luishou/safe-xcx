#!/bin/bash

# 智慧安全隐患举报系统后端部署脚本 - 服务器版本
# 适配路径: /home/ubuntu/safe-xcx/backend
# 使用方法: ./deploy-server.sh [production|development]

set -e

ENV=${1:-production}
PROJECT_DIR="/home/ubuntu/safe-xcx/backend"
LOG_DIR="/home/ubuntu/safe-xcx/backend/Log"

echo "🚀 开始部署 Safe Backend ($ENV 环境)..."
echo "📍 项目路径: $PROJECT_DIR"
echo "📁 日志路径: $LOG_DIR"

# 确保在正确的目录
cd $PROJECT_DIR

# 创建日志目录
echo "📁 创建日志目录..."
mkdir -p $LOG_DIR

# 拉取最新代码 (如果使用Git)
if [ -d ".git" ]; then
    echo "📥 拉取最新代码..."
    git pull origin main
fi

# 安装/更新依赖
echo "📦 安装依赖..."
npm install --production

# 复制环境配置文件
if [ "$ENV" = "production" ]; then
    echo "⚙️  配置生产环境..."
    if [ -f ".env.production" ]; then
        cp .env.production .env
        echo "✅ 已复制生产环境配置"
    else
        echo "⚠️  .env.production 文件不存在，请手动配置 .env 文件"
    fi
else
    echo "⚙️  配置开发环境..."
    if [ ! -f ".env" ]; then
        echo "⚠️  .env 文件不存在，请手动创建"
    fi
fi

# 检查必要文件
echo "🔍 检查必要文件..."
if [ ! -f "app.js" ]; then
    echo "❌ app.js 文件不存在！"
    exit 1
fi

if [ ! -f "ecosystem.config.js" ]; then
    echo "❌ ecosystem.config.js 文件不存在！"
    exit 1
fi

# 停止现有进程
echo "🛑 停止现有进程..."
pm2 stop safe-backend 2>/dev/null || echo "ℹ️  没有运行中的进程"

# 启动应用
echo "🎯 启动应用..."
if [ "$ENV" = "production" ]; then
    pm2 start ecosystem.config.js --env production
else
    pm2 start ecosystem.config.js
fi

# 保存PM2配置
echo "💾 保存PM2配置..."
pm2 save

# 显示状态
echo "📊 应用状态:"
pm2 status

# 健康检查
echo "🏥 执行健康检查..."
sleep 3
if curl -f -s http://localhost:3300/health > /dev/null; then
    echo "✅ 健康检查通过"
else
    echo "⚠️  健康检查失败，请检查应用状态"
fi

echo ""
echo "✅ 部署完成!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 查看应用状态: pm2 status"
echo "📋 查看日志: pm2 logs safe-backend"
echo "🔄 重启应用: pm2 restart safe-backend"
echo "🌐 健康检查: curl http://localhost:3300/health"
echo "📁 日志目录: $LOG_DIR"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
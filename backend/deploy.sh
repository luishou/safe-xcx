#!/bin/bash

# 智慧安全隐患举报系统后端部署脚本
# 使用方法: ./deploy.sh [production|development]

set -e

ENV=${1:-production}
PROJECT_DIR="/home/ubuntu/safe-xcx/backend"
LOG_DIR="/home/ubuntu/safe-xcx/backend/Log"

echo "🚀 开始部署 Safe Backend ($ENV 环境)..."

# 创建日志目录
echo "📁 创建日志目录..."
sudo mkdir -p $LOG_DIR
sudo chown $USER:$USER $LOG_DIR

# 进入项目目录
cd $PROJECT_DIR

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
    cp .env.production .env
else
    echo "⚙️  配置开发环境..."
    cp .env.development .env 2>/dev/null || cp .env .env
fi

# 数据库初始化 (如果需要)
echo "🗄️  检查数据库..."
# 这里可以添加数据库迁移脚本

# 停止现有进程
echo "🛑 停止现有进程..."
pm2 stop safe-backend 2>/dev/null || true

# 启动应用
echo "🎯 启动应用..."
if [ "$ENV" = "production" ]; then
    pm2 start ecosystem.config.js --env production
else
    pm2 start ecosystem.config.js
fi

# 保存PM2配置
pm2 save

# 设置PM2开机自启
pm2 startup

echo "✅ 部署完成!"
echo "📊 查看应用状态: pm2 status"
echo "📋 查看日志: pm2 logs safe-backend"
echo "🌐 健康检查: curl http://localhost:3300/health"
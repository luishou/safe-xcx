#!/bin/bash

echo "🔍 检查PM2应用状态..."
echo "================================"

# 显示PM2状态
echo "📊 PM2状态:"
pm2 status

echo ""
echo "📋 PM2详细信息:"
pm2 show safe-backend

echo ""
echo "📝 最近的错误日志:"
pm2 logs safe-backend --lines 20 --err

echo ""
echo "📄 最近的输出日志:"
pm2 logs safe-backend --lines 10 --out

echo ""
echo "🔄 PM2进程信息:"
pm2 monit --no-daemon | head -20

echo ""
echo "💾 检查日志文件是否存在:"
ls -la /home/ubuntu/safe-xcx/backend/Log/ 2>/dev/null || echo "日志目录不存在"

echo ""
echo "🌐 检查端口占用:"
netstat -tlnp | grep :3300 || echo "端口3300未被占用"

echo ""
echo "📦 检查Node.js和npm版本:"
node --version
npm --version

echo ""
echo "🔧 检查应用文件:"
ls -la /home/ubuntu/safe-xcx/backend/app.js 2>/dev/null || echo "app.js文件不存在"

echo ""
echo "🗂️ 检查package.json:"
ls -la /home/ubuntu/safe-xcx/backend/package.json 2>/dev/null || echo "package.json文件不存在"
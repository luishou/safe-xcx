#!/bin/bash

# 清理和重新部署PM2应用脚本
echo "🧹 开始清理PM2进程..."

# 1. 停止所有safe-backend进程
echo "停止所有safe-backend进程..."
pm2 stop safe-backend 2>/dev/null || echo "没有运行中的safe-backend进程"

# 2. 删除所有safe-backend进程
echo "删除所有safe-backend进程..."
pm2 delete safe-backend 2>/dev/null || echo "没有safe-backend进程需要删除"

# 3. 清理PM2进程列表
echo "清理PM2进程列表..."
pm2 kill 2>/dev/null || echo "PM2守护进程已停止"

# 4. 等待一下确保清理完成
sleep 2

echo "✅ PM2进程清理完成"
echo ""

# 5. 重新启动单个实例（避免集群模式问题）
echo "🚀 重新启动应用（单实例模式）..."

# 直接启动单个实例，不使用集群模式
pm2 start app.js --name "safe-backend" --env production --instances 1 --exec-mode fork

# 6. 检查状态
echo ""
echo "📊 检查PM2状态..."
pm2 status

# 7. 查看日志（最后几行）
echo ""
echo "📝 最新日志："
pm2 logs safe-backend --lines 10 --nostream

echo ""
echo "✅ 部署完成！"
echo "💡 如果需要集群模式，请确保服务器有足够资源后再启用"
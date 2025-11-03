#!/bin/bash

# Safe Backend 监控脚本
# 可以设置为 cron 任务定期执行

LOG_FILE="/var/log/safe-backend/monitor.log"
APP_NAME="safe-backend"
HEALTH_URL="http://localhost:3300/health"

# 记录日志函数
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> $LOG_FILE
}

# 检查应用是否运行
check_app_status() {
    if pm2 list | grep -q "$APP_NAME.*online"; then
        log_message "✅ $APP_NAME is running"
        return 0
    else
        log_message "❌ $APP_NAME is not running"
        return 1
    fi
}

# 检查健康端点
check_health_endpoint() {
    if curl -f -s $HEALTH_URL > /dev/null; then
        log_message "✅ Health endpoint is responding"
        return 0
    else
        log_message "❌ Health endpoint is not responding"
        return 1
    fi
}

# 检查磁盘空间
check_disk_space() {
    DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $DISK_USAGE -gt 80 ]; then
        log_message "⚠️  Disk usage is high: ${DISK_USAGE}%"
        return 1
    else
        log_message "✅ Disk usage is normal: ${DISK_USAGE}%"
        return 0
    fi
}

# 检查内存使用
check_memory_usage() {
    MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [ $MEMORY_USAGE -gt 80 ]; then
        log_message "⚠️  Memory usage is high: ${MEMORY_USAGE}%"
        return 1
    else
        log_message "✅ Memory usage is normal: ${MEMORY_USAGE}%"
        return 0
    fi
}

# 重启应用
restart_app() {
    log_message "🔄 Restarting $APP_NAME..."
    pm2 restart $APP_NAME
    sleep 5
    if check_app_status && check_health_endpoint; then
        log_message "✅ $APP_NAME restarted successfully"
        return 0
    else
        log_message "❌ Failed to restart $APP_NAME"
        return 1
    fi
}

# 主监控逻辑
main() {
    log_message "🔍 Starting monitoring check..."
    
    # 检查应用状态
    if ! check_app_status; then
        log_message "🚨 Application is down, attempting to restart..."
        restart_app
    fi
    
    # 检查健康端点
    if ! check_health_endpoint; then
        log_message "🚨 Health endpoint failed, attempting to restart..."
        restart_app
    fi
    
    # 检查系统资源
    check_disk_space
    check_memory_usage
    
    log_message "✅ Monitoring check completed"
}

# 执行监控
main
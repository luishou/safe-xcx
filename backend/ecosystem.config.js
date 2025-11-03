module.exports = {
  apps: [{
    name: 'safe-backend',
    script: 'app.js',
    instances: 1, // 改为单实例，避免资源不足
    exec_mode: 'fork', // 改为fork模式，更稳定
    env: {
      NODE_ENV: 'development',
      PORT: 3300
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3300
    },
    // 日志配置
    log_file: '/home/ubuntu/safe-xcx/backend/Log/combined.log',
    out_file: '/home/ubuntu/safe-xcx/backend/Log/out.log',
    error_file: '/home/ubuntu/safe-xcx/backend/Log/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // 自动重启配置
    watch: false, // 生产环境不建议开启文件监听
    ignore_watch: ['node_modules', 'logs'],
    max_memory_restart: '1G',
    
    // 进程管理
    min_uptime: '10s',
    max_restarts: 10,
    autorestart: true,
    
    // 其他配置
    merge_logs: true,
    time: true
  }]
};
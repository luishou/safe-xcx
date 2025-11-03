# 智慧安全隐患举报系统 - 后端部署指南

## 📋 部署清单

### 1. 服务器要求
- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **内存**: 最少 2GB RAM (推荐 4GB+)
- **存储**: 最少 20GB 可用空间
- **网络**: 公网 IP 和域名 (可选)

### 2. 软件依赖
- Node.js 18.x+
- PM2 (进程管理器)
- Nginx (反向代理)
- MySQL 8.0+ (数据库)
- Git (代码管理)

## 🚀 快速部署

### 步骤 1: 准备服务器环境
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PM2
sudo npm install -g pm2

# 安装其他依赖
sudo apt install git nginx mysql-server -y
```

### 步骤 2: 部署代码
```bash
# 创建项目目录 (如果不存在)
sudo mkdir -p /home/ubuntu/safe-xcx/backend
sudo chown ubuntu:ubuntu /home/ubuntu/safe-xcx/backend

# 进入项目目录
cd /home/ubuntu/safe-xcx/backend

# 克隆代码 (如果使用Git)
git clone <your-repository-url> .

# 安装依赖
npm install --production

# 创建日志目录
mkdir -p Log

# 设置执行权限
chmod +x deploy.sh monitor.sh
```

### 步骤 3: 配置环境
```bash
# 复制并编辑生产环境配置
cp .env.production .env
nano .env

# 配置数据库连接信息
# 配置微信小程序 AppID 和 Secret
# 设置强密码的 JWT Secret
```

### 步骤 4: 数据库初始化
```bash
# 登录 MySQL
sudo mysql -u root -p

# 创建数据库和用户
CREATE DATABASE xcx CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'xcx'@'localhost' IDENTIFIED BY 'your-secure-password';
GRANT ALL PRIVILEGES ON xcx.* TO 'xcx'@'localhost';
FLUSH PRIVILEGES;

# 导入数据库结构
mysql -u xcx -p xcx < init.sql
```

### 步骤 5: 启动应用
```bash
# 使用部署脚本
./deploy.sh production

# 或手动启动
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 步骤 6: 配置 Nginx
```bash
# 复制 Nginx 配置
sudo cp nginx.conf /etc/nginx/sites-available/safe-backend

# 编辑配置文件，替换域名
sudo nano /etc/nginx/sites-available/safe-backend

# 启用站点
sudo ln -s /etc/nginx/sites-available/safe-backend /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 步骤 7: 配置 SSL (可选但推荐)
```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 设置自动续期
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 监控和维护

### 设置监控
```bash
# 设置监控脚本定时执行
crontab -e
# 添加: */5 * * * * /home/ubuntu/safe-xcx/backend/monitor.sh
```

### 常用命令
```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs safe-backend

# 重启应用
pm2 restart safe-backend

# 查看系统资源
pm2 monit

# 健康检查
curl http://localhost:3300/health
```

### 日志位置
- 应用日志: `/home/ubuntu/safe-xcx/backend/Log/`
- Nginx 日志: `/var/log/nginx/`
- PM2 日志: `~/.pm2/logs/`

## 🔧 故障排除

### 常见问题

1. **应用无法启动**
   - 检查环境变量配置
   - 确认数据库连接
   - 查看 PM2 错误日志

2. **数据库连接失败**
   - 检查数据库服务状态
   - 验证连接参数
   - 确认防火墙设置

3. **Nginx 502 错误**
   - 确认后端应用运行正常
   - 检查端口配置
   - 查看 Nginx 错误日志

### 性能优化

1. **启用 Gzip 压缩**
2. **配置缓存策略**
3. **使用 CDN 加速静态资源**
4. **数据库索引优化**
5. **启用 PM2 集群模式**

## 🔒 安全建议

1. **定期更新系统和依赖**
2. **使用强密码和密钥**
3. **配置防火墙规则**
4. **启用 HTTPS**
5. **定期备份数据库**
6. **监控异常访问**

## 📞 支持

如有问题，请查看：
- 应用日志文件
- PM2 监控面板
- Nginx 访问和错误日志

或联系技术支持团队。
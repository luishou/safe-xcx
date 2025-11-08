# 安全隐患系统后端部署文档（PM2）

> 目标：在 Linux 服务器上用 PM2 部署后端，并通过 Nginx 反代为 `https://safe.sulei.xyz/api` 提供服务。文档包含环境配置、进程管理、反向代理、COS 存储及验证排查。

## 概览
- 后端目录：`/home/ubuntu/safe-xcx/backend`
- 进程管理：`PM2`
- 监听端口：`3300`（内部端口）
- 外部入口：`https://safe.sulei.xyz/api`
- 前端基址：小程序 `app.js` 中的 `baseUrl` 指向 `https://safe.sulei.xyz/api`

## 前提条件
- 已安装 Node.js（建议 18/20 LTS）、PM2、Git、Nginx。
- 服务器上已有代码目录：`/home/ubuntu/safe-xcx`，后端在其下的 `backend` 目录。
- 数据库已创建，账户有读写权限。

## 环境变量配置
后端会根据 `NODE_ENV` 加载：
- 生产：`backend/.env.production`
- 开发：`backend/.env`

请在服务器创建 `backend/.env.production`，示例：
```
NODE_ENV=production
PORT=3300

# 数据库
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=<你的数据库密码>
DB_NAME=xcx

# JWT
JWT_SECRET=<随机长字符串>
JWT_EXPIRES_IN=7d

# 微信小程序
WECHAT_APPID=<appid>
WECHAT_SECRET=<secret>

# COS（腾讯云对象存储）
COS_SECRET_ID=<Cos SecretId>
COS_SECRET_KEY=<Cos SecretKey>
COS_BUCKET=<bucket，如 safe-1259052648>
COS_REGION=ap-shanghai

# 其他（可选）
BASE_URL=https://safe.sulei.xyz
```

也可在服务器创建 `backend/cos.env`（不提交到仓库），内容：
```
SECRET_ID=<Cos SecretId>
SECRET_KEY=<Cos SecretKey>
BUCKET=<bucket>
REGION=ap-shanghai
```
COS 加载优先级：环境变量 > `backend/cos.env` > 仓库根 `cos.env`。

## 使用 PM2 启动后端
1. 进入后端目录：
   ```
   cd /home/ubuntu/safe-xcx/backend
   ```
2. 安装依赖（如未安装）：
   ```
   npm install
   ```
3. 启动（生产环境）：
   ```
   pm2 start ecosystem.config.js --env production
   pm2 save
   ```
4. 开机自启：
   ```
   pm2 startup systemd
   # 按提示执行返回的命令
   ```
5. 常用命令：
   - 查看状态：`pm2 list`
   - 查看日志：`pm2 logs safe-backend`
   - 平滑重启：`pm2 reload safe-backend`
   - 停止/删除：`pm2 stop safe-backend` / `pm2 delete safe-backend`

> 说明：`ecosystem.config.js` 已设置 `env_production` 的 `NODE_ENV=production` 和日志路径（`/home/ubuntu/safe-xcx/backend/Log`）。如需把 COS/DB 等变量写进 PM2，也可在 `env_production` 中补充对应键。

## 配置 Nginx 反向代理
目标：把外部 `https://safe.sulei.xyz/api` 代理到本机 `http://127.0.0.1:3300`。

1. 新建站点配置：`/etc/nginx/sites-available/safe-xcx`
```
server {
  listen 80;
  server_name safe.sulei.xyz;
  client_max_body_size 20M;  # 允许较大的文件上传

  location /api {
    proxy_pass http://127.0.0.1:3300;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location / {
    return 200 'Safe System Backend';
    add_header Content-Type text/plain;
  }
}
```
2. 启用并重载：
```
sudo ln -s /etc/nginx/sites-available/safe-xcx /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```
3. HTTPS（推荐）：
```
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d safe.sulei.xyz
```
证书续期由 `certbot.timer` 自动处理。

## 数据库初始化（首次）
- 导入 `backend/init.sql` 及增量脚本（如有）。
- 确保 `.env.production` 中的数据库连接信息正确。

## 文件上传与 COS 验证
- 后端启动时会打印一次 COS 配置概览日志（隐藏密钥）：
  - 形如：`[COS配置] { bucket: 'safe-1259052648', region: 'ap-shanghai', host: 'https://safe-1259052648.cos.ap-shanghai.myqcloud.com' }`
- 若日志提示 `SecretId/SecretKey not configured.`，说明生产环境未读取到 `COS_SECRET_ID/COS_SECRET_KEY` 或 `cos.env`。
- 上传接口：`POST /api/upload/document`（Word/PDF），返回 `filePath/url` 指向 COS。
- 删除接口：`DELETE /api/upload/file`，body `{ fileUrl }`。

## 功能验证清单
- 进程与健康：
  - `curl http://127.0.0.1:3300/health` 应返回 `status: ok`。
  - `curl -I https://safe.sulei.xyz/api/health` 应返回 200。
- 登录：
  - 若报 “未获取到openid或session_key”，检查 `WECHAT_APPID/WECHAT_SECRET` 与小程序 code 是否匹配。
- 上传：
  - 成功返回 COS URL，后端不再出现 “COS客户端未配置”。
- 控制台日志：
  - 观察 `[COS配置]`、接口错误堆栈，确认无异常。

## 运维与日志
- 日志目录：`/home/ubuntu/safe-xcx/backend/Log`
- 查看日志：`pm2 logs safe-backend`
- 监控：`pm2 monit`

## 常见问题排查
- 仍提示 COS 未配置：
  - 确认 `.env.production` 已包含 `COS_SECRET_ID/COS_SECRET_KEY/COS_BUCKET/COS_REGION`，或 `backend/cos.env` 填写正确。
  - 重启 PM2：`pm2 reload safe-backend`。
- “Bind parameters must not contain undefined”：
  - 微信登录未拿到 `openid`；检查 `WECHAT_APPID/WECHAT_SECRET` 和小程序端的 `code` 是否与生产一致。
- 上传返回 “COS上传失败，未返回URL”：
  - COS 权限或网络异常；检查 COS 控制台与服务器网络。

## 安全建议
- 密钥只在服务器 `.env.production` 或 `backend/cos.env` 保存，严禁入库。
- 若密钥曾被提交到 Git，请在腾讯云旋转新密钥，并清理仓库历史（可用 `git filter-repo`）后再推送。
- 限制服务器入站端口，仅开放 `80/443` 对外；后端 `3300` 仅本机访问。

—— 完 ——
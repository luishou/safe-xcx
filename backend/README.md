# 智慧安全隐患举报系统后端接口

## 安装和运行

1. 安装依赖
```bash
npm install
```

2. 配置环境变量
修改 `.env` 文件中的配置信息

3. 创建数据库
执行 `init.sql` 文件创建数据库表结构

4. 启动服务
```bash
npm start
```

开发环境：
```bash
npm run dev
```

## API接口文档

### 认证接口

#### 微信登录
```
POST /api/auth/login
```

请求参数：
```json
{
  "code": "微信登录code",
  "userInfo": {
    "nickName": "用户昵称",
    "avatarUrl": "头像URL",
    "gender": 1,
    "city": "城市",
    "province": "省份",
    "country": "国家",
    "language": "语言"
  }
}
```

#### 刷新Token
```
POST /api/auth/refresh
```

#### 验证Token
```
POST /api/auth/verify
```

### 用户接口

#### 获取用户信息
```
GET /api/user/profile
```
Headers: `Authorization: Bearer <token>`

#### 更新用户信息
```
PUT /api/user/profile
```

### 举报接口

#### 提交举报
```
POST /api/report/submit
```

#### 获取举报列表
```
GET /api/report/list
```

#### 获取举报详情
```
GET /api/report/:id
```

#### 更新举报状态
```
PUT /api/report/:id/status
```

## 微信小程序配置

在小程序的 `app.js` 中配置后端接口地址：

```javascript
const BASE_URL = 'http://localhost:3000/api';

// 在登录方法中调用
wx.login({
  success: res => {
    if (res.code) {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: userRes => {
          // 调用后端登录接口
          wx.request({
            url: BASE_URL + '/auth/login',
            method: 'POST',
            data: {
              code: res.code,
              userInfo: userRes.userInfo
            },
            success: loginRes => {
              // 保存token
              wx.setStorageSync('token', loginRes.data.data.token);
            }
          });
        }
      });
    }
  }
});
```
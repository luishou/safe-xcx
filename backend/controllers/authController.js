const axios = require('axios');
const jwt = require('jsonwebtoken');
const { User } = require('../models/database');

class AuthController {
  // 微信小程序登录
  async wechatLogin(req, res) {
    try {
      const { code, userInfo } = req.body;

      console.log('收到登录请求 - code:', code);
      console.log('收到登录请求 - userInfo:', userInfo);

      if (!code) {
        return res.status(400).json({
          success: false,
          message: 'code不能为空'
        });
      }

      let openid, session_key;

      // 调用微信code2session接口
      const wechatResponse = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
        params: {
          appid: process.env.WECHAT_APPID,
          secret: process.env.WECHAT_SECRET,
          js_code: code,
          grant_type: 'authorization_code'
        }
      });

      const data = wechatResponse.data;
      console.log('微信API响应:', data);

      if (data.errcode) {
        console.error('微信API调用失败:', {
          errcode: data.errcode,
          errmsg: data.errmsg,
          appid: process.env.WECHAT_APPID,
          code: code
        });
        return res.status(400).json({
          success: false,
          message: '微信登录失败',
          error: data.errmsg,
          details: {
            errcode: data.errcode,
            errmsg: data.errmsg,
            appid: process.env.WECHAT_APPID
          }
        });
      }

      openid = data.openid;
      session_key = data.session_key;

      // 查找或创建用户
      let user = await User.findByOpenid(openid);

      if (!user) {
        // 新用户注册
        if (userInfo) {
          user = await User.create({
            openid,
            nickName: userInfo.nickName || '微信用户',
            avatarUrl: userInfo.avatarUrl || '',
            gender: userInfo.gender || 0,
            city: userInfo.city || '',
            province: userInfo.province || '',
            country: userInfo.country || '',
            language: userInfo.language || 'zh_CN',
            role: 'employee', // 默认角色为员工
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          });
        } else {
          // 如果没有用户信息，创建基础用户记录
          user = await User.create({
            openid,
            nickName: '微信用户',
            role: 'employee',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      } else {
        // 更新用户信息（如果提供了新的用户信息）
        if (userInfo) {
          await User.update(user.id, {
            nickName: userInfo.nickName || user.nickName,
            avatarUrl: userInfo.avatarUrl || user.avatarUrl,
            gender: userInfo.gender !== undefined ? userInfo.gender : user.gender,
            city: userInfo.city || user.city,
            province: userInfo.province || user.province,
            country: userInfo.country || user.country,
            language: userInfo.language || user.language,
            updatedAt: new Date()
          });
        }
      }

      // 生成JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          openid: user.openid,
          role: user.role,
          nickName: user.nickName,
          avatarUrl: user.avatarUrl
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        success: true,
        message: '登录成功',
        data: {
          token,
          user: {
            id: user.id,
            openid: user.openid,
            nickName: user.nickName,
            avatarUrl: user.avatarUrl,
            role: user.role,
            status: user.status
          }
        }
      });

    } catch (error) {
      console.error('登录失败:', error);
      res.status(500).json({
        success: false,
        message: '登录失败',
        error: error.message
      });
    }
  }

  // 刷新token
  async refreshToken(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'token不能为空'
        });
      }

      // 验证token（忽略过期）
      const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });

      // 获取用户信息
      const user = await User.findById(decoded.userId);

      if (!user || user.status !== 'active') {
        return res.status(401).json({
          success: false,
          message: '用户不存在或已被禁用'
        });
      }

      // 生成新token
      const newToken = jwt.sign(
        {
          userId: user.id,
          openid: user.openid,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        success: true,
        message: 'Token刷新成功',
        data: {
          token: newToken,
          user: {
            id: user.id,
            nickName: user.nickName,
            avatarUrl: user.avatarUrl,
            role: user.role
          }
        }
      });

    } catch (error) {
      console.error('Token刷新失败:', error);
      res.status(401).json({
        success: false,
        message: 'Token无效或已过期',
        error: error.message
      });
    }
  }

  // 验证token
  async verifyToken(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'token不能为空'
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.userId);

      if (!user || user.status !== 'active') {
        return res.status(401).json({
          success: false,
          message: '用户不存在或已被禁用'
        });
      }

      // 打印用户信息
      console.log('=== 用户信息 (verifyToken) ===');
      console.log('用户ID:', user.id);
      console.log('OpenID:', user.openid);
      console.log('昵称:', user.nickName);
      console.log('角色:', user.role);
      console.log('状态:', user.status);
      console.log('头像:', user.avatarUrl);
      console.log('性别:', user.gender);
      console.log('城市:', user.city);
      console.log('省份:', user.province);
      console.log('国家:', user.country);
      console.log('创建时间:', user.createdAt);
      console.log('更新时间:', user.updatedAt);
      console.log('===========================');

      res.json({
        success: true,
        message: 'Token有效',
        data: {
          user: {
            id: user.id,
            nickName: user.nickName,
            avatarUrl: user.avatarUrl,
            role: user.role
          }
        }
      });

    } catch (error) {
      console.error('Token验证失败:', error);
      res.status(401).json({
        success: false,
        message: 'Token无效或已过期',
        error: error.message
      });
    }
  }
}

module.exports = new AuthController();
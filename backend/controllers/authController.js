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

      // 额外校验：若未获取到 openid 或 session_key，直接返回错误，避免数据库绑定 undefined
      if (!openid || !session_key) {
        console.error('微信登录返回缺少openid或session_key:', { openid, session_key, raw: data });
        return res.status(400).json({
          success: false,
          message: '微信登录失败',
          error: '未获取到openid或session_key',
          details: {
            appid: process.env.WECHAT_APPID,
            hasOpenid: !!openid,
            hasSessionKey: !!session_key
          }
        });
      }

      // 查找或创建用户
      let user = await User.findByOpenid(openid);

      if (!user) {
        // 新用户注册
        if (userInfo) {
          user = await User.create({
            openid,
            nickName: userInfo.nickName || '微信用户',
            avatarUrl: userInfo.avatarUrl || '',
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
            nick_name: userInfo.nickName || user.nick_name,
            avatar_url: userInfo.avatarUrl || user.avatar_url,
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

      console.log('=== 登录成功返回用户信息 ===');
      console.log('is_verified:', user.is_verified);
      console.log('verification_status:', user.verification_status);
      console.log('完整用户数据:', JSON.stringify(user, null, 2));

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
            status: user.status,
            managed_sections: user.managed_sections,
            is_verified: user.is_verified,
            verification_status: user.verification_status
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
            role: user.role,
            managed_sections: user.managed_sections
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
      console.log('=== Token验证用户信息 ===');
      console.log('用户ID:', user.id);
      console.log('昵称:', user.nickName);
      console.log('角色:', user.role);
      console.log('状态:', user.status);
      console.log('管理标段:', user.managed_sections);
      console.log('===========================');

      res.json({
        success: true,
        message: 'Token有效',
        data: {
          user: {
            id: user.id,
            nickName: user.nickName,
            avatarUrl: user.avatarUrl,
            role: user.role,
            managed_sections: user.managed_sections,
            is_verified: user.is_verified,
            verification_status: user.verification_status
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
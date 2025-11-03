const jwt = require('jsonwebtoken');
const { User } = require('../models/database');

// JWT认证中间件
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '访问令牌缺失'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 从数据库获取最新的用户信息
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(403).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 设置完整的用户信息到req.user
    req.user = {
      userId: user.id,
      openid: user.openid,
      role: user.role,
      nickName: user.nickName,
      avatarUrl: user.avatarUrl
    };
    
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: '访问令牌无效或已过期'
    });
  }
};

// 角色权限检查中间件
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole
};
const { User, Section } = require('../models/database');

class VerificationController {
  // 获取待认证用户列表（管理员）
  async getUnverifiedUsers(req, res) {
    try {
      const adminUser = await User.findById(req.user.userId);

      // 验证管理员权限
      if (adminUser.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: '权限不足，仅管理员可查看'
        });
      }

      // 获取管理员管理的标段
      let managedSectionIds = adminUser.managed_sections || [];

      // 如果 managed_sections 是 JSON 字符串，解析为数组
      if (typeof managedSectionIds === 'string') {
        try {
          managedSectionIds = JSON.parse(managedSectionIds);
        } catch (e) {
          console.error('解析 managed_sections 失败:', e);
          managedSectionIds = [];
        }
      }

      // 如果管理员没有管理任何标段，返回空列表
      if (!Array.isArray(managedSectionIds) || managedSectionIds.length === 0) {
        return res.json({
          success: true,
          data: {
            users: []
          }
        });
      }

      // 获取未认证用户列表
      const users = await User.findUnverifiedBySection(managedSectionIds);

      // 格式化用户数据
      const formattedUsers = users.map(user => ({
        id: user.id,
        nickName: user.nickName,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt
      }));

      res.json({
        success: true,
        data: {
          users: formattedUsers
        }
      });
    } catch (error) {
      console.error('获取待认证用户列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取待认证用户列表失败',
        error: error.message
      });
    }
  }

  // 获取已认证用户列表（管理员）
  async getVerifiedUsers(req, res) {
    try {
      const adminUser = await User.findById(req.user.userId);

      // 验证管理员权限
      if (adminUser.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: '权限不足，仅管理员可查看'
        });
      }

      // 获取管理员管理的标段
      let managedSectionIds = adminUser.managed_sections || [];

      // 如果 managed_sections 是 JSON 字符串，解析为数组
      if (typeof managedSectionIds === 'string') {
        try {
          managedSectionIds = JSON.parse(managedSectionIds);
        } catch (e) {
          console.error('解析 managed_sections 失败:', e);
          managedSectionIds = [];
        }
      }

      // 如果管理员没有管理任何标段，返回空列表
      if (!Array.isArray(managedSectionIds) || managedSectionIds.length === 0) {
        return res.json({
          success: true,
          data: {
            users: []
          }
        });
      }

      // 获取已认证用户列表
      const users = await User.findVerifiedBySection(managedSectionIds);

      // 格式化用户数据
      const formattedUsers = users.map(user => ({
        id: user.id,
        nickName: user.nickName,
        avatarUrl: user.avatarUrl,
        realName: user.realName,
        createdAt: user.createdAt
      }));

      res.json({
        success: true,
        data: {
          users: formattedUsers
        }
      });
    } catch (error) {
      console.error('获取已认证用户列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取已认证用户列表失败',
        error: error.message
      });
    }
  }

  // 确认认证（管理员）
  async confirmVerification(req, res) {
    try {
      const { userId, realName } = req.body;
      const adminUser = await User.findById(req.user.userId);

      // 验证管理员权限
      if (adminUser.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: '权限不足，仅管理员可操作'
        });
      }

      // 验证必填字段
      if (!userId || !realName) {
        return res.status(400).json({
          success: false,
          message: '用户ID和真实姓名不能为空'
        });
      }

      // 验证真实姓名格式（2-10个中文字符）
      if (!/^[\u4e00-\u9fa5]{2,10}$/.test(realName)) {
        return res.status(400).json({
          success: false,
          message: '真实姓名格式不正确（2-10个中文字符）'
        });
      }

      // 获取要认证的用户
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      // 检查用户是否已认证
      if (targetUser.is_verified === 1 || targetUser.is_verified === true) {
        return res.status(400).json({
          success: false,
          message: '该用户已认证，无需重复操作'
        });
      }

      // 确认认证
      const updatedUser = await User.verifyUser(userId, realName);

      res.json({
        success: true,
        message: '认证成功',
        data: {
          userId: updatedUser.id,
          realName: realName,
          isVerified: updatedUser.is_verified
        }
      });
    } catch (error) {
      console.error('确认认证失败:', error);
      res.status(500).json({
        success: false,
        message: '确认认证失败',
        error: error.message
      });
    }
  }
}

module.exports = new VerificationController();

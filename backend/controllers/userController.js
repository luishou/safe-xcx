const { User } = require('../models/database');

class UserController {
  // 获取用户信息
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          nickName: user.nickName,
          avatarUrl: user.avatarUrl,
          role: user.role,
          status: user.status,
          managed_sections: user.managed_sections,
          createdAt: user.created_at
        }
      });
    } catch (error) {
      console.error('获取用户信息失败:', error);
      res.status(500).json({
        success: false,
        message: '获取用户信息失败',
        error: error.message
      });
    }
  }

  // 更新用户信息
  async updateProfile(req, res) {
    try {
      const { nickName, avatarUrl } = req.body;
      const updateData = {};

      if (nickName !== undefined) updateData.nick_name = nickName;
      if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl;

      updateData.updatedAt = new Date();

      const user = await User.update(req.user.userId, updateData);

      res.json({
        success: true,
        message: '用户信息更新成功',
        data: {
          id: user.id,
          nickName: user.nickName,
          avatarUrl: user.avatarUrl,
          role: user.role,
          managed_sections: user.managed_sections,
          updatedAt: user.updated_at
        }
      });
    } catch (error) {
      console.error('更新用户信息失败:', error);
      res.status(500).json({
        success: false,
        message: '更新用户信息失败',
        error: error.message
      });
    }
  }

  // 获取用户统计信息
  async getStats(req, res) {
    try {
      // 这里可以添加用户相关的统计信息
      // 比如举报数量、参与的安全知识学习等
      res.json({
        success: true,
        data: {
          reportsCount: 0,
          knowledgeLearned: 0,
          achievements: []
        }
      });
    } catch (error) {
      console.error('获取用户统计信息失败:', error);
      res.status(500).json({
        success: false,
        message: '获取用户统计信息失败',
        error: error.message
      });
    }
  }
}

module.exports = new UserController();
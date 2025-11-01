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
          gender: user.gender,
          city: user.city,
          province: user.province,
          country: user.country,
          language: user.language,
          role: user.role,
          status: user.status,
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
      const { nickName, avatarUrl, gender, city, province, country, language } = req.body;
      const updateData = {};

      if (nickName !== undefined) updateData.nickName = nickName;
      if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
      if (gender !== undefined) updateData.gender = gender;
      if (city !== undefined) updateData.city = city;
      if (province !== undefined) updateData.province = province;
      if (country !== undefined) updateData.country = country;
      if (language !== undefined) updateData.language = language;

      updateData.updatedAt = new Date();

      const user = await User.update(req.user.userId, updateData);

      res.json({
        success: true,
        message: '用户信息更新成功',
        data: {
          id: user.id,
          nickName: user.nickName,
          avatarUrl: user.avatarUrl,
          gender: user.gender,
          city: user.city,
          province: user.province,
          country: user.country,
          language: user.language,
          role: user.role,
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
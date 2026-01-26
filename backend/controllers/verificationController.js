const { User, UserVerification, UserSectionRole, Section } = require('../models/database');

class VerificationController {
  // 提交认证申请（用户）
  async submitVerification(req, res) {
    try {
      const userId = req.user.userId;
      const { sectionCode, realName } = req.body;

      // 验证标段是否存在
      if (!sectionCode) {
        return res.status(400).json({
          success: false,
          message: '请选择标段'
        });
      }

      // 验证真实姓名
      if (!realName || !realName.trim()) {
        return res.status(400).json({
          success: false,
          message: '请填写真实姓名'
        });
      }

      // 验证真实姓名格式（2-10个中文字符）
      if (!/^[\u4e00-\u9fa5]{2,10}$/.test(realName.trim())) {
        return res.status(400).json({
          success: false,
          message: '真实姓名格式不正确（2-10个中文字符）'
        });
      }

      const section = await Section.findByCode(sectionCode);
      if (!section) {
        return res.status(400).json({
          success: false,
          message: '标段不存在'
        });
      }

      // 检查是否已有认证记录
      const existing = await UserVerification.getStatus(userId, sectionCode);
      if (existing && existing.status === 'approved') {
        return res.status(400).json({
          success: false,
          message: '您在该标段已认证通过，无需重复提交'
        });
      }

      // 提交认证申请（带真实姓名）
      await UserVerification.submitWithName(userId, sectionCode, realName.trim());

      res.json({
        success: true,
        message: '认证申请已提交，请等待管理员审核'
      });
    } catch (error) {
      console.error('提交认证申请失败:', error);
      res.status(500).json({
        success: false,
        message: '提交认证申请失败',
        error: error.message
      });
    }
  }

  // 获取当前用户的认证状态
  async getMyVerification(req, res) {
    try {
      const userId = req.user.userId;
      const { sectionCode } = req.query;

      if (sectionCode) {
        // 获取指定标段的认证状态
        const verification = await UserVerification.getStatus(userId, sectionCode);
        res.json({
          success: true,
          data: {
            verification,
            isVerified: verification && verification.status === 'approved'
          }
        });
      } else {
        // 获取所有标段的认证状态
        const verifications = await UserVerification.getAllStatusByUser(userId);
        res.json({
          success: true,
          data: {
            verifications,
            // 返回已认证的标段列表
            verifiedSections: verifications
              .filter(v => v.status === 'approved')
              .map(v => v.sectionCode)
          }
        });
      }
    } catch (error) {
      console.error('获取认证状态失败:', error);
      res.status(500).json({
        success: false,
        message: '获取认证状态失败',
        error: error.message
      });
    }
  }

  // 获取待认证用户列表（管理员）
  async getUnverifiedUsers(req, res) {
    try {
      const adminUser = await User.findById(req.user.userId);
      const { section } = req.query;  // 支持按指定标段过滤

      // 获取管理员管理的标段
      const managedSections = await User.getManagedSections(req.user.userId);

      let sectionCodes = [];

      if (managedSections.length === 0) {
        // 向后兼容：检查旧的 managed_sections 字段
        let legacySections = adminUser.managed_sections || [];
        if (typeof legacySections === 'string') {
          try {
            legacySections = JSON.parse(legacySections);
          } catch (e) {
            legacySections = [];
          }
        }
        sectionCodes = legacySections;
      } else {
        // 使用新的角色系统
        sectionCodes = managedSections.map(s => s.sectionCode);
      }

      if (sectionCodes.length === 0) {
        return res.json({
          success: true,
          data: { users: [] }
        });
      }

      // 如果指定了标段参数，只查询该标段（且必须在管理范围内）
      if (section) {
        if (!sectionCodes.includes(section)) {
          return res.status(403).json({
            success: false,
            message: '您没有该标段的管理权限'
          });
        }
        sectionCodes = [section];
      }

      const users = await UserVerification.findPendingBySections(sectionCodes);

      res.json({
        success: true,
        data: {
          users: users.map(u => ({
            id: u.userId,
            verificationId: u.id,
            nickName: u.nickName,
            avatarUrl: u.avatarUrl,
            realName: u.realName,
            sectionCode: u.sectionCode,
            sectionName: u.sectionName,
            submittedAt: u.submittedAt
          }))
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
      const { section } = req.query;  // 支持按指定标段过滤

      // 获取管理员管理的标段
      const managedSections = await User.getManagedSections(req.user.userId);

      let sectionCodes = [];

      if (managedSections.length === 0) {
        // 向后兼容：检查旧的 managed_sections 字段
        let legacySections = adminUser.managed_sections || [];
        if (typeof legacySections === 'string') {
          try {
            legacySections = JSON.parse(legacySections);
          } catch (e) {
            legacySections = [];
          }
        }
        sectionCodes = legacySections;
      } else {
        // 使用新的角色系统
        sectionCodes = managedSections.map(s => s.sectionCode);
      }

      if (sectionCodes.length === 0) {
        return res.json({
          success: true,
          data: { users: [] }
        });
      }

      // 如果指定了标段参数，只查询该标段（且必须在管理范围内）
      if (section) {
        if (!sectionCodes.includes(section)) {
          return res.status(403).json({
            success: false,
            message: '您没有该标段的管理权限'
          });
        }
        sectionCodes = [section];
      }

      const users = await UserVerification.findApprovedBySections(sectionCodes);

      res.json({
        success: true,
        data: {
          users: users.map(u => ({
            id: u.userId,
            verificationId: u.id,
            nickName: u.nickName,
            avatarUrl: u.avatarUrl,
            realName: u.realName,
            sectionCode: u.sectionCode,
            sectionName: u.sectionName,
            reviewedAt: u.reviewedAt
          }))
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
      const { verificationId, userId, realName, sectionCode } = req.body;
      const reviewerId = req.user.userId;

      // 验证必填字段
      if (!realName) {
        return res.status(400).json({
          success: false,
          message: '真实姓名不能为空'
        });
      }

      // 验证真实姓名格式（2-10个中文字符）
      if (!/^[\u4e00-\u9fa5]{2,10}$/.test(realName)) {
        return res.status(400).json({
          success: false,
          message: '真实姓名格式不正确（2-10个中文字符）'
        });
      }

      let verification;

      if (verificationId) {
        // 新方式：使用 verificationId
        verification = await UserVerification.findById(verificationId);
      } else if (userId && sectionCode) {
        // 兼容方式：使用 userId + sectionCode
        verification = await UserVerification.findByUserAndSection(userId, sectionCode);
      } else if (userId) {
        // 旧方式：直接使用 userId（向后兼容）
        const targetUser = await User.findById(userId);
        if (!targetUser) {
          return res.status(404).json({
            success: false,
            message: '用户不存在'
          });
        }

        // 使用旧的确认方法
        const updatedUser = await User.verifyUser(userId, realName);
        return res.json({
          success: true,
          message: '认证成功',
          data: {
            userId: updatedUser.id,
            realName: realName,
            isVerified: updatedUser.is_verified
          }
        });
      } else {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数'
        });
      }

      if (!verification) {
        return res.status(404).json({
          success: false,
          message: '认证记录不存在'
        });
      }

      if (verification.status === 'approved') {
        return res.status(400).json({
          success: false,
          message: '该用户已认证，无需重复操作'
        });
      }

      // 通过认证
      await UserVerification.approve(verification.id, reviewerId, realName);

      res.json({
        success: true,
        message: '认证成功',
        data: {
          verificationId: verification.id,
          userId: verification.userId,
          realName: realName,
          sectionCode: verification.sectionCode
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

  // 驳回认证（管理员）
  async rejectVerification(req, res) {
    try {
      const { verificationId, reason } = req.body;
      const reviewerId = req.user.userId;

      if (!verificationId) {
        return res.status(400).json({
          success: false,
          message: '认证记录ID不能为空'
        });
      }

      const verification = await UserVerification.findById(verificationId);
      if (!verification) {
        return res.status(404).json({
          success: false,
          message: '认证记录不存在'
        });
      }

      if (verification.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: '只能驳回待审核的认证申请'
        });
      }

      // 驳回认证
      await UserVerification.reject(verificationId, reviewerId, reason || '');

      res.json({
        success: true,
        message: '已驳回认证申请'
      });
    } catch (error) {
      console.error('驳回认证失败:', error);
      res.status(500).json({
        success: false,
        message: '驳回认证失败',
        error: error.message
      });
    }
  }

  // 检查用户在指定标段是否可以提交举报
  async checkCanReport(req, res) {
    try {
      const userId = req.user.userId;
      const { sectionCode } = req.query;

      if (!sectionCode) {
        return res.status(400).json({
          success: false,
          message: '请选择标段'
        });
      }

      const isVerified = await UserVerification.isVerified(userId, sectionCode);
      const verification = await UserVerification.getStatus(userId, sectionCode);

      res.json({
        success: true,
        data: {
          canReport: isVerified,
          isVerified,
          verificationStatus: verification ? verification.status : 'none',
          message: isVerified ? '' : '请先完成该标段的认证'
        }
      });
    } catch (error) {
      console.error('检查举报权限失败:', error);
      res.status(500).json({
        success: false,
        message: '检查举报权限失败',
        error: error.message
      });
    }
  }
}

module.exports = new VerificationController();

const { User, UserVerification } = require('../models/database');

class VerificationController {
  // 提交认证申请
  async submitApplication(req, res) {
    try {
      const { name, idCard, phone, sectionId } = req.body;
      const userId = req.user.userId;

      // 验证必填字段
      if (!name || !idCard || !phone || !sectionId) {
        return res.status(400).json({
          success: false,
          message: '请填写完整的认证信息'
        });
      }

      // 验证身份证号格式
      const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
      if (!idCardRegex.test(idCard)) {
        return res.status(400).json({
          success: false,
          message: '身份证号格式不正确'
        });
      }

      // 验证手机号格式
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          message: '手机号格式不正确'
        });
      }

      // 检查是否已有待审核的申请
      const hasPending = await UserVerification.hasPendingApplication(userId);
      if (hasPending) {
        return res.status(400).json({
          success: false,
          message: '您已有待审核的认证申请，请等待审核结果'
        });
      }

      // 创建认证申请
      const verification = await UserVerification.create({
        userId,
        name,
        idCard,
        phone,
        sectionId,
        status: 'pending',
        createdAt: new Date()
      });

      // 同步更新用户表状态为pending
      await User.update(userId, {
        verification_status: 'pending'
      });

      res.json({
        success: true,
        message: '认证申请提交成功，请等待管理员审核',
        data: {
          id: verification.id,
          status: verification.status,
          createdAt: verification.createdAt
        }
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

  // 获取我的认证状态
  async getMyVerification(req, res) {
    try {
      const userId = req.user.userId;

      // 获取最新的认证申请
      const verification = await UserVerification.findByUserId(userId);

      // 获取用户信息
      const user = await User.findById(userId);

      if (!verification) {
        return res.json({
          success: true,
          data: {
            status: 'none',
            isVerified: false,
            verification: null
          }
        });
      }

      res.json({
        success: true,
        data: {
          status: verification.status,
          isVerified: verification.status === 'approved',
          verification: {
            id: verification.id,
            name: verification.name,
            idCard: VerificationController.maskIdCard(verification.idCard),
            phone: VerificationController.maskPhone(verification.phone),
            sectionId: verification.sectionId,
            status: verification.status,
            createdAt: verification.createdAt,
            reviewedAt: verification.reviewedAt,
            reviewComment: verification.reviewComment
          }
        }
      });
    } catch (error) {
      console.error('获取认证状态失败:', error);
      res.status(500).json({
        success: false,
        message: '获取认证状态失败',
        error: error.message
      });
    }
  }

  // 获取认证申请列表（管理员）
  async getVerifications(req, res) {
    try {
      const { status, page = 1, limit = 20, sectionId } = req.query;
      const adminUser = await User.findById(req.user.userId);

      // 验证管理员权限
      if (adminUser.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: '权限不足，仅管理员可查看认证申请'
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
            verifications: [],
            total: 0,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: 0
          }
        });
      }

      console.log('管理员管理的标段ID:', managedSectionIds);
      console.log('前端传递的标段ID:', sectionId);

      // 如果前端传递了标段ID，则只查询该标段的认证申请（能点击就有权限，无需再次校验）
      const targetSectionId = sectionId ? parseInt(sectionId) : null;

      // 获取认证申请列表
      const result = await UserVerification.findAll(
        targetSectionId, // 如果指定了标段ID，则只查询该标段
        status,
        parseInt(page),
        parseInt(limit)
      );

      // 如果没有指定标段ID，则需要过滤出管理员管理的标段的申请
      let filteredVerifications = result.verifications;
      if (!targetSectionId) {
        // 统一类型进行比较
        const managedSectionIdsStr = managedSectionIds.map(id => String(id));
        filteredVerifications = result.verifications.filter(v =>
          managedSectionIdsStr.includes(String(v.sectionId))
        );
      }

      res.json({
        success: true,
        data: {
          verifications: filteredVerifications,
          total: filteredVerifications.length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(filteredVerifications.length / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('获取认证申请列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取认证申请列表失败',
        error: error.message
      });
    }
  }

  // 通过认证（能点击就有权限，不做标段权限校验）
  async approveVerification(req, res) {
    try {
      const { id } = req.params;
      const adminUser = await User.findById(req.user.userId);

      // 获取认证申请
      const verification = await UserVerification.findById(id);
      if (!verification) {
        return res.status(404).json({
          success: false,
          message: '认证申请不存在'
        });
      }

      // 更新认证申请状态
      await UserVerification.update(id, {
        status: 'approved',
        reviewedBy: adminUser.id,
        reviewedAt: new Date(),
        reviewComment: null
      });

      // 同步更新用户表状态
      await User.update(verification.userId, {
        is_verified: 1,
        verification_status: 'approved'
      });

      res.json({
        success: true,
        message: '认证已通过'
      });
    } catch (error) {
      console.error('通过认证失败:', error);
      res.status(500).json({
        success: false,
        message: '通过认证失败',
        error: error.message
      });
    }
  }

  // 拒绝认证（能点击就有权限，不做标段权限校验）
  async rejectVerification(req, res) {
    try {
      const { id } = req.params;
      const { comment } = req.body;
      const adminUser = await User.findById(req.user.userId);

      // 获取认证申请
      const verification = await UserVerification.findById(id);
      if (!verification) {
        return res.status(404).json({
          success: false,
          message: '认证申请不存在'
        });
      }

      // 更新认证申请状态
      await UserVerification.update(id, {
        status: 'rejected',
        reviewedBy: adminUser.id,
        reviewedAt: new Date(),
        reviewComment: comment || '认证未通过'
      });

      // 同步更新用户表状态
      await User.update(verification.userId, {
        is_verified: 0,
        verification_status: 'rejected'
      });

      res.json({
        success: true,
        message: '认证已拒绝'
      });
    } catch (error) {
      console.error('拒绝认证失败:', error);
      res.status(500).json({
        success: false,
        message: '拒绝认证失败',
        error: error.message
      });
    }
  }

  // 身份证号脱敏
  static maskIdCard(idCard) {
    if (!idCard || idCard.length < 18) return idCard;
    return idCard.substring(0, 6) + '********' + idCard.substring(14);
  }

  // 手机号脱敏
  static maskPhone(phone) {
    if (!phone || phone.length < 11) return phone;
    return phone.substring(0, 3) + '****' + phone.substring(7);
  }
}

module.exports = new VerificationController();












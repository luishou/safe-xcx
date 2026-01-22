const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const verificationController = require('../controllers/verificationController');

// 所有认证路由都需要认证
router.use(authenticateToken);

// ============== 用户端接口 ==============

// 提交认证申请
router.post('/submit', verificationController.submitVerification);

// 获取当前用户的认证状态
router.get('/my', verificationController.getMyVerification);

// 检查用户在指定标段是否可以提交举报
router.get('/can-report', verificationController.checkCanReport);

// ============== 管理员接口 ==============

// 获取待认证用户列表（管理员）
router.get('/unverified', verificationController.getUnverifiedUsers);

// 获取已认证用户列表（管理员）
router.get('/verified', verificationController.getVerifiedUsers);

// 确认认证（管理员）
router.post('/confirm', verificationController.confirmVerification);

// 驳回认证（管理员）
router.post('/reject', verificationController.rejectVerification);

module.exports = router;

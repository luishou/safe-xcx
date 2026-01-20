const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const verificationController = require('../controllers/verificationController');

// 所有认证路由都需要认证
router.use(authenticateToken);

// 获取待认证用户列表（管理员）
router.get('/unverified', verificationController.getUnverifiedUsers);

// 获取已认证用户列表（管理员）
router.get('/verified', verificationController.getVerifiedUsers);

// 确认认证（管理员）
router.post('/confirm', verificationController.confirmVerification);

module.exports = router;

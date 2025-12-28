const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const verificationController = require('../controllers/verificationController');

// 所有认证路由都需要认证
router.use(authenticateToken);

// 提交认证申请
router.post('/', verificationController.submitApplication);

// 获取我的认证状态
router.get('/my', verificationController.getMyVerification);

// 获取认证申请列表（管理员）
router.get('/', verificationController.getVerifications);

// 通过认证（管理员）
router.put('/:id/approve', verificationController.approveVerification);

// 拒绝认证（管理员）
router.put('/:id/reject', verificationController.rejectVerification);

module.exports = router;

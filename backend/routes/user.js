const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const userController = require('../controllers/userController');

// 所有用户路由都需要认证
router.use(authenticateToken);

// 获取用户信息
router.get('/profile', userController.getProfile);

// 更新用户信息
router.put('/profile', userController.updateProfile);

// 获取用户统计信息
router.get('/stats', userController.getStats);

module.exports = router;
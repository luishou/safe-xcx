const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 微信小程序登录
router.post('/login', authController.wechatLogin);

// 刷新token
router.post('/refresh', authController.refreshToken);

// 验证token
router.post('/verify', authController.verifyToken);

module.exports = router;
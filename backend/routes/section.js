const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const sectionController = require('../controllers/sectionController');

// 获取标段列表（无需认证，用于选择标段）
router.get('/list', sectionController.getSections);

// 其他标段管理路由需要认证
router.use(authenticateToken);

// 获取标段详情
router.get('/:id', sectionController.getSectionDetail);

module.exports = router;
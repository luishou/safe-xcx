const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

// 所有举报路由都需要认证
router.use(authenticateToken);

// 提交举报
router.post('/submit', reportController.submitReport);

// 获取举报列表
router.get('/list', reportController.getReports);

// 获取举报详情
router.get('/:id', reportController.getReportDetail);

// 更新举报状态
router.put('/:id/status', reportController.updateReportStatus);

// 完成办结
router.post('/:id/complete', reportController.completeReport);

// 上传整改图片
router.post('/:id/images', reportController.uploadRectificationImages);

// 添加举报历史
router.post('/:id/history', reportController.addReportHistory);

module.exports = router;
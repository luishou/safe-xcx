const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

// 临时修复图片数据（仅用于修复，生产环境应移除）- 不需要认证
router.post('/fix-images', reportController.fixImageData);

// 其他举报路由都需要认证
router.use(authenticateToken);

// 提交举报
router.post('/submit', reportController.submitReport);

// 获取举报列表（安全管理部使用）
router.get('/list', reportController.getManagementReports);

// 获取个人中心举报列表（个人中心使用）
router.get('/personal-reports', reportController.getPersonalReports);

// 获取个人举报列表（员工使用）
router.get('/my-reports', reportController.getMyReports);

// 获取公示举报列表（隐藏举报人信息）
router.get('/public-reports', reportController.getPublicReports);

// 获取统计数据
router.get('/stats', reportController.getStats);

// 导出当前标段隐患为Excel
router.get('/export', reportController.exportReportsExcel);

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
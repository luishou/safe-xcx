const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/safetyController');

// 所有接口需要登录
router.use(authenticateToken);

// 分类 - 获取（所有用户可读）
router.get('/categories', ctrl.listCategories);

// 分类 - 新增/更新/删除（管理员）
router.post('/categories', requireRole(['admin']), ctrl.createCategory);
router.put('/categories/:id', requireRole(['admin']), ctrl.updateCategory);
router.delete('/categories/:id', requireRole(['admin']), ctrl.deleteCategory);

// 文章 - 获取（所有用户可读）
router.get('/articles', ctrl.listArticles);

// 文章 - 新增/更新/删除（管理员）
router.post('/articles', requireRole(['admin']), ctrl.createArticle);
router.put('/articles/:id', requireRole(['admin']), ctrl.updateArticle);
router.delete('/articles/:id', requireRole(['admin']), ctrl.deleteArticle);

module.exports = router;
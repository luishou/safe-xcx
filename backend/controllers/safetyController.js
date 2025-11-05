const pool = require('../config/database');

// 分类相关
exports.listCategories = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, name, description, status, sort_order AS sortOrder,
              created_at AS createdAt, updated_at AS updatedAt
       FROM safety_categories
       WHERE status = 'active'
       ORDER BY sort_order ASC, id ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('listCategories error:', err);
    res.status(500).json({ success: false, message: '获取分类列表失败' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description = '', status = 'active', sortOrder = 0 } = req.body;
    if (!name) return res.status(400).json({ success: false, message: '分类名称必填' });
    await pool.execute(
      `INSERT INTO safety_categories (name, description, status, sort_order)
       VALUES (?, ?, ?, ?)`,
      [name, description, status, sortOrder]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('createCategory error:', err);
    res.status(500).json({ success: false, message: '新增分类失败' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status, sortOrder } = req.body;
    const fields = [];
    const values = [];
    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (status !== undefined) { fields.push('status = ?'); values.push(status); }
    if (sortOrder !== undefined) { fields.push('sort_order = ?'); values.push(sortOrder); }
    if (!fields.length) return res.status(400).json({ success: false, message: '无更新字段' });
    values.push(id);
    await pool.execute(`UPDATE safety_categories SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ success: true });
  } catch (err) {
    console.error('updateCategory error:', err);
    res.status(500).json({ success: false, message: '更新分类失败' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM safety_categories WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('deleteCategory error:', err);
    res.status(500).json({ success: false, message: '删除分类失败' });
  }
};

// 文章相关
exports.listArticles = async (req, res) => {
  try {
    const { categoryId } = req.query;
    if (!categoryId) return res.status(400).json({ success: false, message: '缺少分类ID' });
    const [rows] = await pool.execute(
      `SELECT a.id, a.category_id AS categoryId, a.title, a.content,
              u.nick_name AS uploadedBy,
              DATE_FORMAT(a.created_at, '%Y-%m-%d') AS uploadTime,
              a.created_at AS createdAt, a.updated_at AS updatedAt
       FROM safety_articles a
       LEFT JOIN users u ON u.id = a.uploaded_by
       WHERE a.category_id = ?
       ORDER BY a.created_at DESC`,
      [categoryId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('listArticles error:', err);
    res.status(500).json({ success: false, message: '获取文章列表失败' });
  }
};

exports.createArticle = async (req, res) => {
  try {
    const { categoryId, title, content } = req.body;
    const uploadedBy = req.user?.userId || null;
    if (!categoryId || !title || !content) {
      return res.status(400).json({ success: false, message: '分类、标题、内容必填' });
    }
    await pool.execute(
      `INSERT INTO safety_articles (category_id, title, content, uploaded_by)
       VALUES (?, ?, ?, ?)`,
      [categoryId, title, content, uploadedBy]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('createArticle error:', err);
    res.status(500).json({ success: false, message: '新增文章失败' });
  }
};

exports.updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, categoryId } = req.body;
    const fields = [];
    const values = [];
    if (title !== undefined) { fields.push('title = ?'); values.push(title); }
    if (content !== undefined) { fields.push('content = ?'); values.push(content); }
    if (categoryId !== undefined) { fields.push('category_id = ?'); values.push(categoryId); }
    if (!fields.length) return res.status(400).json({ success: false, message: '无更新字段' });
    values.push(id);
    await pool.execute(`UPDATE safety_articles SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ success: true });
  } catch (err) {
    console.error('updateArticle error:', err);
    res.status(500).json({ success: false, message: '更新文章失败' });
  }
};

exports.deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM safety_articles WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('deleteArticle error:', err);
    res.status(500).json({ success: false, message: '删除文章失败' });
  }
};
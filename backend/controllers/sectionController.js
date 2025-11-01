const { Section } = require('../models/database');

class SectionController {
  // 获取标段列表
  async getSections(req, res) {
    try {
      const sections = await Section.findAllActive();

      res.json({
        success: true,
        message: '获取标段列表成功',
        data: sections
      });
    } catch (error) {
      console.error('获取标段列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取标段列表失败',
        error: error.message
      });
    }
  }

  // 获取标段详情
  async getSectionDetail(req, res) {
    try {
      const { id } = req.params;

      const section = await Section.findById(id);

      if (!section) {
        return res.status(404).json({
          success: false,
          message: '标段不存在'
        });
      }

      res.json({
        success: true,
        message: '获取标段详情成功',
        data: section
      });
    } catch (error) {
      console.error('获取标段详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取标段详情失败',
        error: error.message
      });
    }
  }
}

module.exports = new SectionController();
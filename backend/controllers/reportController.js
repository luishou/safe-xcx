const pool = require('../config/database');

class ReportController {
  // 提交举报
  async submitReport(req, res) {
    try {
      const {
        description,
        hazardType,
        severity,
        location,
        section,
        initialImages
      } = req.body;

      // 验证必填字段
      if (!description || !hazardType || !severity || !location) {
        return res.status(400).json({
          success: false,
          message: '缺少必填字段'
        });
      }

      // 验证标段是否存在
      if (!section) {
        return res.status(400).json({
          success: false,
          message: '请选择标段'
        });
      }

      const [result] = await pool.execute(`
        INSERT INTO reports (
          reporter_id, reporter_name, description, hazard_type,
          severity, location, section, initial_images, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        req.user.userId,
        req.user.nickName || '微信用户',
        description,
        hazardType,
        severity,
        location,
        section || 'TJ01',
        JSON.stringify(initialImages || []),
        new Date(),
        new Date()
      ]);

      // 添加历史记录
      await pool.execute(`
        INSERT INTO report_history (report_id, user_id, action, description, created_at)
        VALUES (?, ?, ?, ?, ?)
      `, [
        result.insertId,
        req.user.userId,
        '提交举报',
        `用户${req.user.nickName || '微信用户'}提交了举报`,
        new Date()
      ]);

      res.status(201).json({
        success: true,
        message: '举报提交成功',
        data: {
          id: result.insertId
        }
      });
    } catch (error) {
      console.error('提交举报失败:', error);
      res.status(500).json({
        success: false,
        message: '提交举报失败',
        error: error.message
      });
    }
  }

  // 获取举报列表
  async getReports(req, res) {
    try {
      const { page = 1, limit = 20, status, section, severity, ownOnly } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE 1=1';
      const params = [];

      if (status) {
        whereClause += ' AND status = ?';
        params.push(status);
      }

      if (section) {
        whereClause += ' AND section = ?';
        params.push(section);
      }

      if (severity) {
        whereClause += ' AND severity = ?';
        params.push(severity);
      }

      // 普通用户只能看自己的举报
      if (req.user.role === 'employee') {
        whereClause += ' AND reporter_id = ?';
        params.push(req.user.userId);
      }

      // 若指定仅查看本人，强制过滤，无论角色
      if (ownOnly === 'true') {
        whereClause += ' AND reporter_id = ?';
        params.push(req.user.userId);
      }

      // 如果指定了标段，按标段过滤
      if (req.query.section) {
        whereClause += ' AND section = ?';
        params.push(req.query.section);
      }

      const [rows] = await pool.execute(`
        SELECT
          id, reporter_name, description, hazard_type, severity,
          location, section, status, assigned_to, created_at, updated_at
        FROM reports
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), offset]);

      const [countRows] = await pool.execute(`
        SELECT COUNT(*) as total
        FROM reports
        ${whereClause}
      `, params);

      res.json({
        success: true,
        data: {
          reports: rows,
          pagination: {
            total: countRows[0].total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(countRows[0].total / limit)
          }
        }
      });
    } catch (error) {
      console.error('获取举报列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取举报列表失败',
        error: error.message
      });
    }
  }

  // 获取举报详情
  async getReportDetail(req, res) {
    try {
      const { id } = req.params;

      const [rows] = await pool.execute(`
        SELECT * FROM reports WHERE id = ?
      `, [id]);

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '举报记录不存在'
        });
      }

      const report = rows[0];

      // 检查权限
      if (req.user.role === 'employee' && report.reporter_id !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: '无权查看此举报记录'
        });
      }

      // 获取历史记录
      const [historyRows] = await pool.execute(`
        SELECT rh.*, u.nick_name
        FROM report_history rh
        LEFT JOIN users u ON rh.user_id = u.id
        WHERE rh.report_id = ?
        ORDER BY rh.created_at ASC
      `, [id]);

      // 安全解析JSON数据
      const safeParseJSON = (jsonString) => {
        try {
          if (!jsonString) return [];
          
          // 如果是字符串，先尝试直接解析
          let cleanedString = jsonString;
          
          // 如果包含反引号，尝试清理数据
          if (typeof jsonString === 'string' && jsonString.includes('`')) {
            console.log('检测到包含反引号的数据，尝试清理:', jsonString);
            
            // 移除反引号并清理空格
            cleanedString = jsonString
              .replace(/`/g, '"')  // 将反引号替换为双引号
              .replace(/\s+/g, ' ') // 规范化空格
              .trim();
            
            // 如果数据看起来像是数组格式但格式不正确，尝试修复
            if (cleanedString.startsWith('[') && cleanedString.endsWith(']')) {
              // 尝试提取URL并重新构建数组
              const urlMatch = cleanedString.match(/https?:\/\/[^\s"'`]+/g);
              if (urlMatch) {
                cleanedString = JSON.stringify(urlMatch);
                console.log('修复后的数据:', cleanedString);
              }
            }
          }
          
          const parsed = JSON.parse(cleanedString);
          return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
          console.error('JSON解析失败:', error, '原始数据:', jsonString);
          
          // 最后的尝试：如果数据看起来包含URL，尝试提取URL
          if (typeof jsonString === 'string') {
            const urlMatch = jsonString.match(/https?:\/\/[^\s"'`\]]+/g);
            if (urlMatch) {
              console.log('从错误数据中提取到URL:', urlMatch);
              return urlMatch;
            }
          }
          
          return [];
        }
      };

      res.json({
        success: true,
        data: {
          ...report,
          history: historyRows,
          initial_images: safeParseJSON(report.initial_images),
          rectified_images: safeParseJSON(report.rectified_images)
        }
      });
    } catch (error) {
      console.error('获取举报详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取举报详情失败',
        error: error.message
      });
    }
  }

  // 更新举报状态
  async updateReportStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, assignedTo, plan, feedback } = req.body;

      console.log('更新举报状态 - 用户信息:', req.user);
      console.log('更新举报状态 - 用户角色:', req.user.role);

      // 检查权限 - 只有admin角色可以操作
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '请先登录'
        });
      }

      // 如果不是admin角色，不允许操作
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: '权限不足，只有安全管理部可以操作'
        });
      }

      const [result] = await pool.execute(`
        UPDATE reports
        SET status = ?, assigned_to = ?, plan = ?, feedback = ?, updated_at = ?
        WHERE id = ?
      `, [
        status,
        assignedTo || null,
        plan || null,
        feedback || null,
        new Date(),
        id
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: '举报记录不存在'
        });
      }

      // 添加历史记录
      let actionText = '';
      let descriptionText = '';

      switch (status) {
        case 'processing':
          actionText = '确认处理';
          descriptionText = '已确认接收任务，正在处理中';
          break;
        case 'completed':
          actionText = '完成办结';
          descriptionText = '隐患已整改完成，确认办结';
          break;
        case 'rejected':
          actionText = '驳回办结';
          descriptionText = '确认为非隐患，直接办结';
          break;
        default:
          actionText = '更新状态';
          descriptionText = `将状态更新为: ${status}`;
      }

      await pool.execute(`
        INSERT INTO report_history (report_id, user_id, action, description, created_at)
        VALUES (?, ?, ?, ?, ?)
      `, [
        id,
        req.user.userId,
        actionText,
        descriptionText,
        new Date()
      ]);

      res.json({
        success: true,
        message: '举报状态更新成功'
      });
    } catch (error) {
      console.error('更新举报状态失败:', error);
      res.status(500).json({
        success: false,
        message: '更新举报状态失败',
        error: error.message
      });
    }
  }

  // 完成办结
  async completeReport(req, res) {
    try {
      const { id } = req.params;
      const { rectified_images } = req.body;

      if (!rectified_images || rectified_images.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供整改图片'
        });
      }

      // 检查权限 - 只有admin角色可以操作
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '请先登录'
        });
      }

      // 如果不是admin角色，不允许操作
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: '权限不足，只有安全管理部可以操作'
        });
      }

      // 开始事务
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // 1. 更新举报状态为已完成
        const [result] = await connection.execute(`
          UPDATE reports
          SET status = 'completed',
              rectified_images = ?,
              updated_at = ?
          WHERE id = ?
        `, [
          JSON.stringify(rectified_images),
          new Date(),
          id
        ]);

        if (result.affectedRows === 0) {
          await connection.rollback();
          return res.status(404).json({
            success: false,
            message: '举报记录不存在'
          });
        }

        // 2. 添加处理历史记录
        await connection.execute(`
          INSERT INTO report_history (report_id, user_id, action, description, created_at)
          VALUES (?, ?, ?, ?, ?)
        `, [
          id,
          req.user.userId,
          '完成办结',
          '隐患已整改完成',
          new Date()
        ]);

        // 提交事务
        await connection.commit();

        res.json({
          success: true,
          message: '举报处理完成'
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('完成办结失败:', error);
      res.status(500).json({
        success: false,
        message: '完成办结失败',
        error: error.message
      });
    }
  }

  // 上传整改图片
  async uploadRectificationImages(req, res) {
    try {
      const { id } = req.params;
      const { images } = req.body;

      if (!images || images.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供整改图片'
        });
      }

      // 检查权限 - 只有admin角色可以操作
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '请先登录'
        });
      }

      // 如果不是admin角色，不允许操作
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: '权限不足，只有安全管理部可以操作'
        });
      }

      const [result] = await pool.execute(`
        UPDATE reports
        SET rectified_images = ?, updated_at = ?
        WHERE id = ?
      `, [
        JSON.stringify(images),
        new Date(),
        id
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: '举报记录不存在'
        });
      }

      res.json({
        success: true,
        message: '整改图片上传成功'
      });
    } catch (error) {
      console.error('上传整改图片失败:', error);
      res.status(500).json({
        success: false,
        message: '上传整改图片失败',
        error: error.message
      });
    }
  }

  // 添加举报历史
  async addReportHistory(req, res) {
    try {
      const { id } = req.params;
      const { action, description } = req.body;

      if (!action) {
        return res.status(400).json({
          success: false,
          message: '操作类型不能为空'
        });
      }

      // 检查举报是否存在
      const [reportRows] = await pool.execute('SELECT id FROM reports WHERE id = ?', [id]);
      if (reportRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '举报记录不存在'
        });
      }

      await pool.execute(`
        INSERT INTO report_history (report_id, user_id, action, description, created_at)
        VALUES (?, ?, ?, ?, ?)
      `, [
        id,
        req.user.userId,
        action,
        description || '',
        new Date()
      ]);

      res.json({
        success: true,
        message: '历史记录添加成功'
      });
    } catch (error) {
      console.error('添加举报历史失败:', error);
      res.status(500).json({
        success: false,
        message: '添加举报历史失败',
        error: error.message
      });
    }
  }

  // 统计接口：按标段与时间范围返回状态数量与隐患类型分布
  async getStats(req, res) {
    try {
      const { section, startDate, endDate } = req.query;

      // 权限检查：仅管理员可访问
      if (!req.user) {
        return res.status(401).json({ success: false, message: '请先登录' });
      }
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: '权限不足，只有安全管理部可以访问统计数据' });
      }

      if (!section) {
        return res.status(400).json({ success: false, message: '请提供标段代码 section' });
      }

      // 时间范围处理：默认近一月
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

      // 规范化为 MySQL DATETIME 格式
      const toMySQLDateTime = (d) => new Date(d).toISOString().slice(0, 19).replace('T', ' ');
      const startStr = toMySQLDateTime(start);
      const endStr = toMySQLDateTime(end);

      // 状态数量汇总
      const [statusRows] = await pool.execute(
        `SELECT status, COUNT(*) AS count
         FROM reports
         WHERE section = ? AND created_at BETWEEN ? AND ?
         GROUP BY status`,
        [section, startStr, endStr]
      );

      // 隐患类型分布
      const [hazardRows] = await pool.execute(
        `SELECT hazard_type AS type, COUNT(*) AS count
         FROM reports
         WHERE section = ? AND created_at BETWEEN ? AND ?
         GROUP BY hazard_type`,
        [section, startStr, endStr]
      );

      const [totalRows] = await pool.execute(
        `SELECT COUNT(*) AS total
         FROM reports
         WHERE section = ? AND created_at BETWEEN ? AND ?`,
        [section, startStr, endStr]
      );

      const total = (totalRows && totalRows[0] && totalRows[0].total) ? totalRows[0].total : 0;

      const statusCounts = {
        submitted: 0,
        pending: 0,
        assigned: 0,
        processing: 0,
        completed: 0,
        rejected: 0
      };
      statusRows.forEach(row => {
        if (statusCounts.hasOwnProperty(row.status)) {
          statusCounts[row.status] = row.count;
        }
      });

      const hazardDistribution = hazardRows.map(row => ({ type: row.type || 'other', count: row.count }));

      const completedOrRejected = statusCounts.completed + statusCounts.rejected;
      const resolutionRate = total > 0 ? Math.round((completedOrRejected / total) * 100) : 0;

      res.json({
        success: true,
        data: {
          statusCounts,
          hazardDistribution,
          totalReports: total,
          resolutionRate,
          range: { start: startStr, end: endStr }
        }
      });
    } catch (error) {
      console.error('获取统计数据失败:', error);
      res.status(500).json({ success: false, message: '获取统计数据失败', error: error.message });
    }
  }
}

module.exports = new ReportController();
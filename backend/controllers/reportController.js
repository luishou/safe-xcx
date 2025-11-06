const pool = require('../config/database');
const { formatDateTimeBeijing } = require('../utils/time');

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
        ORDER BY updated_at DESC
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), offset]);

      const [countRows] = await pool.execute(`
        SELECT COUNT(*) as total
        FROM reports
        ${whereClause}
      `, params);

      const formattedRows = rows.map((r) => ({
        ...r,
        created_at: formatDateTimeBeijing(r.created_at),
        updated_at: formatDateTimeBeijing(r.updated_at)
      }));

      res.json({
        success: true,
        data: {
          reports: formattedRows,
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

          // 如果已经是数组，直接返回
          if (Array.isArray(jsonString)) {
            return jsonString;
          }

          console.log('尝试解析JSON数据:', jsonString);

          // 如果是字符串，先尝试直接解析
          let cleanedString = jsonString;

          // 处理JavaScript数组格式（单引号问题）
          if (typeof jsonString === 'string') {
            // 如果包含反引号，尝试清理数据
            if (jsonString.includes('`')) {
              console.log('检测到包含反引号的数据，尝试清理:', jsonString);

              // 移除反引号并清理空格
              cleanedString = jsonString
                .replace(/`/g, '"')  // 将反引号替换为双引号
                .replace(/\s+/g, ' ') // 规范化空格
                .trim();
            }

            // 处理JavaScript数组的单引号问题 [ 'url' ] -> [ "url" ]
            if (cleanedString.startsWith('[') && cleanedString.endsWith(']')) {
              console.log('检测到JavaScript数组格式，尝试修复:', cleanedString);

              // 先尝试简单的单引号替换
              try {
                cleanedString = cleanedString.replace(/'/g, '"');
                const testParsed = JSON.parse(cleanedString);
                console.log('通过单引号替换成功解析:', testParsed);
                return Array.isArray(testParsed) ? testParsed : [];
              } catch (e) {
                console.log('单引号替换失败，尝试更复杂的修复');
              }

              // 如果简单替换失败，尝试提取URL并重新构建有效的JSON数组
              const urlMatch = cleanedString.match(/https?:\/\/[^\s"'\]]+/g);
              if (urlMatch && urlMatch.length > 0) {
                cleanedString = JSON.stringify(urlMatch);
                console.log('通过URL提取修复后的JSON数据:', cleanedString);
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

      // 格式化时间字段为北京时间
      const formattedReport = {
        ...report,
        created_at: formatDateTimeBeijing(report.created_at),
        updated_at: formatDateTimeBeijing(report.updated_at)
      };

      const formattedHistory = (historyRows || []).map(h => ({
        ...h,
        created_at: formatDateTimeBeijing(h.created_at)
      }));

      res.json({
        success: true,
        data: {
          ...formattedReport,
          history: formattedHistory,
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
      const { rectified_images, plan } = req.body;

      if (!rectified_images || rectified_images.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供整改图片'
        });
      }

      if (!plan || plan.trim() === '') {
        return res.status(400).json({
          success: false,
          message: '请提供处理方案'
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
              plan = ?,
              updated_at = ?
          WHERE id = ?
        `, [
          JSON.stringify(rectified_images),
          plan,
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

      // 时间范围处理
      let whereClause = 'WHERE section = ?';
      const params = [section];
      let start, end; // 声明在外面以便后续使用

      console.log('统计接口请求参数:', { section, startDate, endDate });

      if (startDate && endDate) {
        // 如果提供了时间范围，则添加时间条件
        end = new Date(endDate);
        start = new Date(startDate);

        // 规范化为 MySQL DATETIME 格式（用于查询范围）
        const toMySQLDateTime = (d) => new Date(d).toISOString().slice(0, 19).replace('T', ' ');
        const startStr = toMySQLDateTime(start);
        const endStr = toMySQLDateTime(end);

        whereClause += ' AND created_at BETWEEN ? AND ?';
        params.push(startStr, endStr);

        console.log('使用时间范围:', { start: startStr, end: endStr });
      } else {
        // 如果没有提供时间范围，使用当前时间作为范围显示
        end = new Date();
        start = new Date(2020, 0, 1); // 2020年1月1日作为起始时间
        console.log('使用默认时间范围（全部数据）');
      }

      // 状态数量汇总
      const statusQuery = `SELECT status, COUNT(*) AS count FROM reports ${whereClause} GROUP BY status`;
      console.log('状态查询SQL:', statusQuery);
      console.log('查询参数:', params);
      const [statusRows] = await pool.execute(statusQuery, params);

      // 隐患类型分布
      const hazardQuery = `SELECT hazard_type AS type, COUNT(*) AS count FROM reports ${whereClause} GROUP BY hazard_type`;
      const [hazardRows] = await pool.execute(hazardQuery, params);

      const totalQuery = `SELECT COUNT(*) AS total FROM reports ${whereClause}`;
      const [totalRows] = await pool.execute(totalQuery, params);

      console.log('查询结果:', {
        状态统计: statusRows,
        类型统计: hazardRows,
        总数: totalRows[0]?.total
      });

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

      // 返回北京时间格式的范围
      const range = {
        start: formatDateTimeBeijing(start),
        end: formatDateTimeBeijing(end)
      };

      res.json({
        success: true,
        data: {
          statusCounts,
          hazardDistribution,
          totalReports: total,
          resolutionRate,
          range
        }
      });
    } catch (error) {
      console.error('获取统计数据失败:', error);
      res.status(500).json({ success: false, message: '获取统计数据失败', error: error.message });
    }
  }
}

module.exports = new ReportController();

// 临时修复数据的方法
module.exports.fixImageData = async (req, res) => {
  try {
    console.log('开始修复图片数据...');

    // 获取所有包含initial_images的记录
    const [rows] = await pool.execute(`
      SELECT id, initial_images, rectified_images
      FROM reports
      WHERE initial_images IS NOT NULL OR rectified_images IS NOT NULL
    `);

    console.log(`找到 ${rows.length} 条记录需要检查`);

    let fixedCount = 0;

    for (const row of rows) {
      console.log(`处理记录 ID: ${row.id}`);

      let needUpdate = false;
      let newInitialImages = row.initial_images;
      let newRectifiedImages = row.rectified_images;

      // 修复initial_images
      if (row.initial_images) {
        const fixedImages = fixImageArray(row.initial_images);
        if (fixedImages !== row.initial_images) {
          newInitialImages = fixedImages;
          needUpdate = true;
          console.log(`修复 initial_images: ${row.initial_images} -> ${fixedImages}`);
        }
      }

      // 修复rectified_images
      if (row.rectified_images) {
        const fixedImages = fixImageArray(row.rectified_images);
        if (fixedImages !== row.rectified_images) {
          newRectifiedImages = fixedImages;
          needUpdate = true;
          console.log(`修复 rectified_images: ${row.rectified_images} -> ${fixedImages}`);
        }
      }

      // 如果需要更新，执行更新
      if (needUpdate) {
        await pool.execute(`
          UPDATE reports
          SET initial_images = ?, rectified_images = ?
          WHERE id = ?
        `, [newInitialImages, newRectifiedImages, row.id]);

        fixedCount++;
        console.log(`✓ 更新记录 ID: ${row.id}`);
      }
    }

    console.log(`✅ 修复完成！共修复 ${fixedCount} 条记录`);

    res.json({
      success: true,
      message: `修复完成！共检查 ${rows.length} 条记录，修复 ${fixedCount} 条记录`
    });

  } catch (error) {
    console.error('修复失败:', error);
    res.status(500).json({
      success: false,
      message: '修复失败',
      error: error.message
    });
  }
};

function fixImageArray(data) {
  if (!data) return null;

  // 如果已经是数组，转换为JSON字符串
  if (Array.isArray(data)) {
    return JSON.stringify(data);
  }

  // 如果是字符串
  if (typeof data === 'string') {
    try {
      // 尝试直接解析JSON
      JSON.parse(data);
      return data; // 如果解析成功，说明已经是有效JSON
    } catch (e) {
      // 解析失败，尝试修复

      // 处理JavaScript数组格式 [ 'url' ] -> ["url"]
      if (data.startsWith('[') && data.endsWith(']')) {
        // 将单引号替换为双引号
        let fixed = data.replace(/'/g, '"');

        try {
          JSON.parse(fixed); // 验证修复后的数据
          return fixed;
        } catch (e2) {
          // 如果还是失败，尝试提取URL
          const urlMatch = data.match(/https?:\/\/[^\s"'\]]+/g);
          if (urlMatch && urlMatch.length > 0) {
            return JSON.stringify(urlMatch);
          }
        }
      }
    }
  }

  return data; // 如果无法修复，返回原数据
}
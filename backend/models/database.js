const pool = require('../config/database');

class User {
  // 根据openid查找用户
  static async findByOpenid(openid) {
    try {
      const [rows] = await pool.execute(
        'SELECT id, openid, nick_name as nickName, avatar_url as avatarUrl, managed_sections, role, status, is_verified, verification_status, created_at, updated_at FROM users WHERE openid = ?',
        [openid]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('根据openid查找用户失败:', error);
      throw error;
    }
  }

  // 根据ID查找用户
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT id, openid, nick_name as nickName, avatar_url as avatarUrl, managed_sections, role, status, is_verified, verification_status, created_at, updated_at FROM users WHERE id = ?',
        [id]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('根据ID查找用户失败:', error);
      throw error;
    }
  }

  // 创建用户
  static async create(userData) {
    try {
      const [result] = await pool.execute(`
        INSERT INTO users (
          openid, nick_name, avatar_url, role, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        userData.openid,
        userData.nickName,
        userData.avatarUrl,
        userData.role,
        userData.status,
        userData.createdAt,
        userData.updatedAt
      ]);

      const newUser = await this.findById(result.insertId);
      console.log('创建用户成功:', newUser);
      return newUser;
    } catch (error) {
      console.error('创建用户失败:', error);
      throw error;
    }
  }

  // 更新用户信息
  static async update(id, updateData) {
    try {
      const setClause = [];
      const values = [];

      Object.keys(updateData).forEach(key => {
        const dbKey = key === 'nickName' ? 'nick_name' :
          key === 'avatarUrl' ? 'avatar_url' :
            key === 'updatedAt' ? 'updated_at' : key;
        setClause.push(`${dbKey} = ?`);
        values.push(updateData[key]);
      });

      values.push(id);

      await pool.execute(
        `UPDATE users SET ${setClause.join(', ')} WHERE id = ?`,
        values
      );

      return await this.findById(id);
    } catch (error) {
      console.error('更新用户失败:', error);
      throw error;
    }
  }

  // 获取所有用户（管理员功能）
  static async findAll(page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      const [rows] = await pool.execute(`
        SELECT id, openid, nick_name as nickName, avatar_url as avatarUrl, role, status, created_at, updated_at
        FROM users
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `, [limit, offset]);

      const [countRows] = await pool.execute('SELECT COUNT(*) as total FROM users');

      return {
        users: rows,
        total: countRows[0].total,
        page,
        limit,
        totalPages: Math.ceil(countRows[0].total / limit)
      };
    } catch (error) {
      console.error('获取用户列表失败:', error);
      throw error;
    }
  }
}

class Section {
  // 获取所有激活的标段
  static async findAllActive() {
    try {
      const [rows] = await pool.execute(`
        SELECT id, section_code, section_name, description, sort_order
        FROM sections
        WHERE status = 'active'
        ORDER BY sort_order ASC, section_code ASC
      `);
      return rows;
    } catch (error) {
      console.error('获取标段列表失败:', error);
      throw error;
    }
  }

  // 根据标段代码查找标段
  static async findByCode(sectionCode) {
    try {
      const [rows] = await pool.execute(`
        SELECT id, section_code, section_name, description, status, sort_order
        FROM sections
        WHERE section_code = ? AND status = 'active'
      `, [sectionCode]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('根据代码查找标段失败:', error);
      throw error;
    }
  }

  // 根据ID查找标段
  static async findById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT id, section_code, section_name, description, status, sort_order
        FROM sections
        WHERE id = ?
      `, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('根据ID查找标段失败:', error);
      throw error;
    }
  }
}

class UserVerification {
  // 创建认证申请
  static async create(verificationData) {
    try {
      const [result] = await pool.execute(`
        INSERT INTO user_verifications (
          user_id, name, id_card, phone, section_id, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        verificationData.userId,
        verificationData.name,
        verificationData.idCard,
        verificationData.phone,
        verificationData.sectionId,
        verificationData.status || 'pending',
        verificationData.createdAt || new Date()
      ]);

      return await this.findById(result.insertId);
    } catch (error) {
      console.error('创建认证申请失败:', error);
      throw error;
    }
  }

  // 根据ID查找认证申请
  static async findById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT id, user_id as userId, name, id_card as idCard, phone, section_id as sectionId,
               status, created_at as createdAt, reviewed_by as reviewedBy, reviewed_at as reviewedAt,
               review_comment as reviewComment
        FROM user_verifications
        WHERE id = ?
      `, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('根据ID查找认证申请失败:', error);
      throw error;
    }
  }

  // 根据用户ID查找认证申请
  static async findByUserId(userId) {
    try {
      const [rows] = await pool.execute(`
        SELECT id, user_id as userId, name, id_card as idCard, phone, section_id as sectionId,
               status, created_at as createdAt, reviewed_by as reviewedBy, reviewed_at as reviewedAt,
               review_comment as reviewComment
        FROM user_verifications
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      `, [userId]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('根据用户ID查找认证申请失败:', error);
      throw error;
    }
  }

  // 获取认证申请列表（管理员）
  static async findAll(sectionId, status, page = 1, limit = 20) {
    try {
      // 确保参数是有效的数字
      page = parseInt(page) || 1;
      limit = parseInt(limit) || 20;

      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      const params = [];

      if (sectionId) {
        whereClause += ' AND uv.section_id = ?';
        params.push(sectionId);
      }

      if (status) {
        whereClause += ' AND uv.status = ?';
        params.push(status);
      }

      // 确保 limit 和 offset 是数字类型
      params.push(Number(limit), Number(offset));

      console.log('UserVerification.findAll - params:', params);
      console.log('UserVerification.findAll - SQL params count:', params.length);

      const sql = `
        SELECT uv.id, uv.user_id as userId, uv.name, uv.id_card as idCard, uv.phone,
               uv.section_id as sectionId, uv.status, uv.created_at as createdAt,
               uv.reviewed_by as reviewedBy, uv.reviewed_at as reviewedAt,
               uv.review_comment as reviewComment,
               u.nick_name as nickName, u.avatar_url as avatarUrl,
               s.section_name as sectionName
        FROM user_verifications uv
        LEFT JOIN users u ON uv.user_id = u.id
        LEFT JOIN sections s ON uv.section_id = s.id
        ${whereClause}
        ORDER BY uv.created_at DESC
        LIMIT ? OFFSET ?
      `;

      // 拼接完整SQL用于调试
      let fullSql = sql;
      params.forEach(param => {
        if (typeof param === 'string') {
          fullSql = fullSql.replace('?', `'${param}'`);
        } else {
          fullSql = fullSql.replace('?', param);
        }
      });

      console.log('========== 认证申请查询 SQL ==========');
      console.log(fullSql);
      console.log('=====================================');

      // 使用 pool.query 代替 pool.execute，因为 mysql2 的预处理语句在 LIMIT/OFFSET 参数上有问题
      const [rows] = await pool.query(sql, params);

      // 获取总数
      const countParams = params.slice(0, -2);
      const [countRows] = await pool.query(`
        SELECT COUNT(*) as total
        FROM user_verifications uv
        ${whereClause}
      `, countParams.length > 0 ? countParams : undefined);

      return {
        verifications: rows,
        total: countRows[0].total,
        page,
        limit,
        totalPages: Math.ceil(countRows[0].total / limit)
      };
    } catch (error) {
      console.error('获取认证申请列表失败:', error);
      throw error;
    }
  }

  // 更新认证申请
  static async update(id, updateData) {
    try {
      const setClause = [];
      const values = [];

      Object.keys(updateData).forEach(key => {
        const dbKey = key === 'userId' ? 'user_id' :
          key === 'idCard' ? 'id_card' :
            key === 'sectionId' ? 'section_id' :
              key === 'createdAt' ? 'created_at' :
                key === 'reviewedBy' ? 'reviewed_by' :
                  key === 'reviewedAt' ? 'reviewed_at' :
                    key === 'reviewComment' ? 'review_comment' : key;
        setClause.push(`${dbKey} = ?`);
        values.push(updateData[key]);
      });

      values.push(id);

      await pool.execute(
        `UPDATE user_verifications SET ${setClause.join(', ')} WHERE id = ?`,
        values
      );

      return await this.findById(id);
    } catch (error) {
      console.error('更新认证申请失败:', error);
      throw error;
    }
  }

  // 检查用户是否有待审核的申请
  static async hasPendingApplication(userId) {
    try {
      const [rows] = await pool.execute(`
        SELECT id FROM user_verifications
        WHERE user_id = ? AND status = 'pending'
        LIMIT 1
      `, [userId]);
      return rows.length > 0;
    } catch (error) {
      console.error('检查待审核申请失败:', error);
      throw error;
    }
  }
}

module.exports = {
  User,
  Section,
  UserVerification
};
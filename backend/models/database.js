const pool = require('../config/database');

class User {
  // 根据openid查找用户
  static async findByOpenid(openid) {
    try {
      const [rows] = await pool.execute(
        'SELECT id, openid, nick_name as nickName, avatar_url as avatarUrl, managed_sections, role, status, is_verified, verification_status, is_supervisor, is_admin, created_at, updated_at FROM users WHERE openid = ?',
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
        'SELECT id, openid, nick_name as nickName, avatar_url as avatarUrl, managed_sections, role, status, is_verified, verification_status, is_supervisor, is_admin, created_at, updated_at FROM users WHERE id = ?',
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

  // [已废弃] 获取未认证用户列表（按标段过滤）- 旧实现，使用 UserVerification 替代
  static async findUnverifiedBySection(managedSectionIds) {
    try {
      if (!Array.isArray(managedSectionIds) || managedSectionIds.length === 0) {
        return [];
      }

      // 构建 IN 子句的占位符
      const placeholders = managedSectionIds.map(() => 'JSON_CONTAINS(managed_sections, ?)').join(' OR ');

      const [rows] = await pool.execute(`
        SELECT u.id, u.openid, u.nick_name as nickName, u.avatar_url as avatarUrl, 
               u.managed_sections as managedSections, u.role, u.is_verified as isVerified,
               u.created_at as createdAt
        FROM users u
        WHERE u.is_verified = 0
          AND (${placeholders})
        ORDER BY u.created_at DESC
      `, managedSectionIds.map(id => JSON.stringify(id)));

      return rows;
    } catch (error) {
      console.error('获取未认证用户列表失败:', error);
      throw error;
    }
  }

  // [已废弃] 获取已认证用户列表（按标段过滤）- 旧实现，使用 UserVerification 替代
  static async findVerifiedBySection(managedSectionIds) {
    try {
      if (!Array.isArray(managedSectionIds) || managedSectionIds.length === 0) {
        return [];
      }

      // 构建 IN 子句的占位符
      const placeholders = managedSectionIds.map(() => 'JSON_CONTAINS(managed_sections, ?)').join(' OR ');

      const [rows] = await pool.execute(`
        SELECT u.id, u.openid, u.nick_name as nickName, u.avatar_url as avatarUrl, 
               u.managed_sections as managedSections, u.role, u.is_verified as isVerified,
               u.real_name as realName, u.created_at as createdAt
        FROM users u
        WHERE u.is_verified = 1
          AND (${placeholders})
        ORDER BY u.created_at DESC
      `, managedSectionIds.map(id => JSON.stringify(id)));

      return rows;
    } catch (error) {
      console.error('获取已认证用户列表失败:', error);
      throw error;
    }
  }

  // [已废弃] 确认用户认证 - 旧实现，使用 UserVerification.approve 替代
  static async verifyUser(userId, realName) {
    try {
      await pool.execute(`
        UPDATE users 
        SET is_verified = 1, real_name = ?, verification_status = 'approved'
        WHERE id = ?
      `, [realName, userId]);

      return await this.findById(userId);
    } catch (error) {
      console.error('确认用户认证失败:', error);
      throw error;
    }
  }

  // 获取用户在指定标段的角色列表
  static async getSectionRoles(userId, sectionCode = null) {
    try {
      let query = `
        SELECT usr.id, usr.section_code as sectionCode, usr.role_type as roleType, 
               s.section_name as sectionName
        FROM user_section_roles usr
        LEFT JOIN sections s ON s.section_code = usr.section_code
        WHERE usr.user_id = ?
      `;
      const params = [userId];

      if (sectionCode) {
        query += ' AND usr.section_code = ?';
        params.push(sectionCode);
      }

      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      console.error('获取用户标段角色失败:', error);
      throw error;
    }
  }

  // 检查用户是否拥有指定标段的指定角色
  static async hasRole(userId, sectionCode, roleType) {
    try {
      const [rows] = await pool.execute(`
        SELECT 1 FROM user_section_roles 
        WHERE user_id = ? AND section_code = ? AND role_type = ?
      `, [userId, sectionCode, roleType]);
      return rows.length > 0;
    } catch (error) {
      console.error('检查用户角色失败:', error);
      throw error;
    }
  }

  // 获取用户管理的标段列表（根据 section_admin 角色）
  static async getManagedSections(userId) {
    try {
      const [rows] = await pool.execute(`
        SELECT DISTINCT usr.section_code as sectionCode, s.section_name as sectionName
        FROM user_section_roles usr
        LEFT JOIN sections s ON s.section_code = usr.section_code
        WHERE usr.user_id = ? AND usr.role_type = 'section_admin'
        ORDER BY s.sort_order ASC
      `, [userId]);
      return rows;
    } catch (error) {
      console.error('获取用户管理的标段失败:', error);
      throw error;
    }
  }
}

// 用户标段角色模型
class UserSectionRole {
  // 创建角色
  static async create(userId, sectionCode, roleType) {
    try {
      const [result] = await pool.execute(`
        INSERT INTO user_section_roles (user_id, section_code, role_type)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP
      `, [userId, sectionCode, roleType]);
      return result;
    } catch (error) {
      console.error('创建用户标段角色失败:', error);
      throw error;
    }
  }

  // 删除角色
  static async delete(userId, sectionCode, roleType) {
    try {
      const [result] = await pool.execute(`
        DELETE FROM user_section_roles 
        WHERE user_id = ? AND section_code = ? AND role_type = ?
      `, [userId, sectionCode, roleType]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('删除用户标段角色失败:', error);
      throw error;
    }
  }

  // 根据标段和角色类型获取用户列表
  static async findUsersByRole(sectionCode, roleType) {
    try {
      const [rows] = await pool.execute(`
        SELECT u.id, u.nick_name as nickName, u.avatar_url as avatarUrl,
               usr.role_type as roleType, usr.created_at as roleCreatedAt
        FROM user_section_roles usr
        INNER JOIN users u ON u.id = usr.user_id
        WHERE usr.section_code = ? AND usr.role_type = ?
        ORDER BY usr.created_at DESC
      `, [sectionCode, roleType]);
      return rows;
    } catch (error) {
      console.error('获取标段角色用户列表失败:', error);
      throw error;
    }
  }

  // 获取用户拥有指定角色的标段列表
  static async getSectionsByRole(userId, roleType) {
    try {
      const [rows] = await pool.execute(`
        SELECT usr.section_code as sectionCode, s.section_name as sectionName
        FROM user_section_roles usr
        LEFT JOIN sections s ON s.section_code = usr.section_code
        WHERE usr.user_id = ? AND usr.role_type = ?
        ORDER BY s.sort_order ASC
      `, [userId, roleType]);
      return rows;
    } catch (error) {
      console.error('获取用户角色标段列表失败:', error);
      throw error;
    }
  }
}

// 用户认证模型
class UserVerification {
  // 提交认证申请（不带姓名，保留向后兼容）
  static async submit(userId, sectionCode) {
    try {
      const [result] = await pool.execute(`
        INSERT INTO user_verifications (user_id, section_code, status)
        VALUES (?, ?, 'pending')
        ON DUPLICATE KEY UPDATE 
          status = 'pending', 
          submitted_at = CURRENT_TIMESTAMP,
          reject_reason = NULL,
          updated_at = CURRENT_TIMESTAMP
      `, [userId, sectionCode]);
      return result;
    } catch (error) {
      console.error('提交认证申请失败:', error);
      throw error;
    }
  }

  // 提交认证申请（带真实姓名）
  static async submitWithName(userId, sectionCode, realName) {
    try {
      // 先检查是否已有记录
      const [existing] = await pool.execute(`
        SELECT id FROM user_verifications WHERE user_id = ? AND section_code = ?
      `, [userId, sectionCode]);

      if (existing.length > 0) {
        // 更新已有记录
        await pool.execute(`
          UPDATE user_verifications 
          SET real_name = ?, status = 'pending', submitted_at = CURRENT_TIMESTAMP,
              reject_reason = NULL, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ? AND section_code = ?
        `, [realName, userId, sectionCode]);
      } else {
        // 插入新记录
        await pool.execute(`
          INSERT INTO user_verifications (user_id, section_code, real_name, status)
          VALUES (?, ?, ?, 'pending')
        `, [userId, sectionCode, realName]);
      }
      return { success: true };
    } catch (error) {
      console.error('提交认证申请（带姓名）失败:', error);
      throw error;
    }
  }

  // 获取用户在指定标段的认证状态
  static async getStatus(userId, sectionCode) {
    try {
      const [rows] = await pool.execute(`
        SELECT id, user_id as userId, section_code as sectionCode, 
               real_name as realName, status, submitted_at as submittedAt,
               reviewed_at as reviewedAt, reviewed_by as reviewedBy,
               reject_reason as rejectReason
        FROM user_verifications
        WHERE user_id = ? AND section_code = ?
      `, [userId, sectionCode]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('获取认证状态失败:', error);
      throw error;
    }
  }

  // 获取用户所有标段的认证状态
  static async getAllStatusByUser(userId) {
    try {
      const [rows] = await pool.execute(`
        SELECT uv.id, uv.user_id as userId, uv.section_code as sectionCode,
               uv.real_name as realName, uv.status, uv.submitted_at as submittedAt,
               uv.reviewed_at as reviewedAt, uv.reject_reason as rejectReason,
               s.section_name as sectionName
        FROM user_verifications uv
        LEFT JOIN sections s ON s.section_code = uv.section_code
        WHERE uv.user_id = ?
        ORDER BY s.sort_order ASC
      `, [userId]);
      return rows;
    } catch (error) {
      console.error('获取用户所有认证状态失败:', error);
      throw error;
    }
  }

  // 检查用户是否在指定标段已认证
  static async isVerified(userId, sectionCode) {
    try {
      const [rows] = await pool.execute(`
        SELECT 1 FROM user_verifications 
        WHERE user_id = ? AND section_code = ? AND status = 'approved'
      `, [userId, sectionCode]);
      return rows.length > 0;
    } catch (error) {
      console.error('检查用户认证状态失败:', error);
      throw error;
    }
  }

  // 获取待认证用户列表（按标段）
  static async findPendingBySection(sectionCode) {
    try {
      const [rows] = await pool.execute(`
        SELECT uv.id, uv.user_id as userId, uv.section_code as sectionCode,
               uv.status, uv.submitted_at as submittedAt,
               u.nick_name as nickName, u.avatar_url as avatarUrl
        FROM user_verifications uv
        INNER JOIN users u ON u.id = uv.user_id
        WHERE uv.section_code = ? AND uv.status = 'pending'
        ORDER BY uv.submitted_at ASC
      `, [sectionCode]);
      return rows;
    } catch (error) {
      console.error('获取待认证用户列表失败:', error);
      throw error;
    }
  }

  // 获取多个标段的待认证用户列表
  static async findPendingBySections(sectionCodes) {
    try {
      if (!Array.isArray(sectionCodes) || sectionCodes.length === 0) {
        return [];
      }

      const placeholders = sectionCodes.map(() => '?').join(',');
      const [rows] = await pool.execute(`
        SELECT uv.id, uv.user_id as userId, uv.section_code as sectionCode,
               uv.real_name as realName, uv.status, uv.submitted_at as submittedAt,
               u.nick_name as nickName, u.avatar_url as avatarUrl,
               s.section_name as sectionName
        FROM user_verifications uv
        INNER JOIN users u ON u.id = uv.user_id
        LEFT JOIN sections s ON s.section_code = uv.section_code
        WHERE uv.section_code IN (${placeholders}) AND uv.status = 'pending'
        ORDER BY uv.submitted_at ASC
      `, sectionCodes);
      return rows;
    } catch (error) {
      console.error('获取多标段待认证用户列表失败:', error);
      throw error;
    }
  }

  // 获取已认证用户列表（按标段）
  static async findApprovedBySection(sectionCode) {
    try {
      const [rows] = await pool.execute(`
        SELECT uv.id, uv.user_id as userId, uv.section_code as sectionCode,
               uv.real_name as realName, uv.status, uv.submitted_at as submittedAt,
               uv.reviewed_at as reviewedAt,
               u.nick_name as nickName, u.avatar_url as avatarUrl
        FROM user_verifications uv
        INNER JOIN users u ON u.id = uv.user_id
        WHERE uv.section_code = ? AND uv.status = 'approved'
        ORDER BY uv.reviewed_at DESC
      `, [sectionCode]);
      return rows;
    } catch (error) {
      console.error('获取已认证用户列表失败:', error);
      throw error;
    }
  }

  // 获取多个标段的已认证用户列表
  static async findApprovedBySections(sectionCodes) {
    try {
      if (!Array.isArray(sectionCodes) || sectionCodes.length === 0) {
        return [];
      }

      const placeholders = sectionCodes.map(() => '?').join(',');
      const [rows] = await pool.execute(`
        SELECT uv.id, uv.user_id as userId, uv.section_code as sectionCode,
               uv.real_name as realName, uv.status, uv.submitted_at as submittedAt,
               uv.reviewed_at as reviewedAt,
               u.nick_name as nickName, u.avatar_url as avatarUrl,
               s.section_name as sectionName
        FROM user_verifications uv
        INNER JOIN users u ON u.id = uv.user_id
        LEFT JOIN sections s ON s.section_code = uv.section_code
        WHERE uv.section_code IN (${placeholders}) AND uv.status = 'approved'
        ORDER BY uv.reviewed_at DESC
      `, sectionCodes);
      return rows;
    } catch (error) {
      console.error('获取多标段已认证用户列表失败:', error);
      throw error;
    }
  }

  // 通过认证
  static async approve(id, reviewerId, realName) {
    try {
      await pool.execute(`
        UPDATE user_verifications 
        SET status = 'approved', real_name = ?, reviewed_at = CURRENT_TIMESTAMP, 
            reviewed_by = ?, reject_reason = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [realName, reviewerId, id]);

      // 同时更新 users 表的旧字段以保持兼容
      const [rows] = await pool.execute(`
        SELECT user_id FROM user_verifications WHERE id = ?
      `, [id]);

      if (rows.length > 0) {
        await pool.execute(`
          UPDATE users SET is_verified = 1, real_name = ?, verification_status = 'approved'
          WHERE id = ?
        `, [realName, rows[0].user_id]);
      }

      return this.findById(id);
    } catch (error) {
      console.error('通过认证失败:', error);
      throw error;
    }
  }

  // 驳回认证
  static async reject(id, reviewerId, reason) {
    try {
      await pool.execute(`
        UPDATE user_verifications 
        SET status = 'rejected', reviewed_at = CURRENT_TIMESTAMP, 
            reviewed_by = ?, reject_reason = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [reviewerId, reason, id]);
      return this.findById(id);
    } catch (error) {
      console.error('驳回认证失败:', error);
      throw error;
    }
  }

  // 根据ID查找认证记录
  static async findById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT id, user_id as userId, section_code as sectionCode,
               real_name as realName, status, submitted_at as submittedAt,
               reviewed_at as reviewedAt, reviewed_by as reviewedBy,
               reject_reason as rejectReason
        FROM user_verifications
        WHERE id = ?
      `, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('根据ID查找认证记录失败:', error);
      throw error;
    }
  }

  // 根据用户ID和标段查找认证记录
  static async findByUserAndSection(userId, sectionCode) {
    try {
      const [rows] = await pool.execute(`
        SELECT id, user_id as userId, section_code as sectionCode,
               real_name as realName, status, submitted_at as submittedAt,
               reviewed_at as reviewedAt, reviewed_by as reviewedBy,
               reject_reason as rejectReason
        FROM user_verifications
        WHERE user_id = ? AND section_code = ?
      `, [userId, sectionCode]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('根据用户和标段查找认证记录失败:', error);
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

module.exports = {
  User,
  UserSectionRole,
  UserVerification,
  Section
};
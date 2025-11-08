const pool = require('../config/database');

class User {
  // 根据openid查找用户
  static async findByOpenid(openid) {
    try {
      const [rows] = await pool.execute(
        'SELECT id, openid, nick_name as nickName, avatar_url as avatarUrl, managed_sections, role, status, created_at, updated_at FROM users WHERE openid = ?',
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
        'SELECT id, openid, nick_name as nickName, avatar_url as avatarUrl, managed_sections, role, status, created_at, updated_at FROM users WHERE id = ?',
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

module.exports = {
  User,
  Section
};
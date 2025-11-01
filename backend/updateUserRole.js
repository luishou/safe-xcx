const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'xcx',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+08:00'
});

async function updateUserRole() {
  try {
    console.log('开始执行数据库操作...');

    // 首先检查role字段是否存在
    const [columns] = await pool.execute('DESCRIBE users');
    const hasRoleField = columns.some(col => col.Field === 'role');

    if (!hasRoleField) {
      console.log('添加role字段到users表...');
      await pool.execute('ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT "employee" AFTER status');
      console.log('role字段添加成功');
    } else {
      console.log('role字段已存在');
    }

    // 更新用户ID=6的角色为admin
    console.log('更新用户ID=6的角色为admin...');
    const [result] = await pool.execute('UPDATE users SET role = "admin" WHERE id = 6');

    if (result.affectedRows > 0) {
      console.log('用户ID=6的角色已更新为admin');
    } else {
      console.log('未找到用户ID=6或更新失败');
    }

    // 查看所有用户信息
    console.log('\n=== 所有用户信息 ===');
    const [users] = await pool.execute('SELECT id, openid, nickName, role, status, createdAt FROM users ORDER BY id');
    users.forEach(user => {
      console.log(`ID: ${user.id}, 昵称: ${user.nickName}, 角色: ${user.role}, 状态: ${user.status}`);
    });

    console.log('\n数据库操作完成！');
    process.exit(0);
  } catch (error) {
    console.error('操作失败:', error);
    process.exit(1);
  }
}

updateUserRole();
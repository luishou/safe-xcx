-- 用户表结构定义（清理后版本）
-- 移除了无用字段：gender, city, province, country, language

USE xcx;

-- 创建用户表（如果不存在）
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openid VARCHAR(100) NOT NULL UNIQUE COMMENT '微信OpenID',
  nick_name VARCHAR(100) COMMENT '用户昵称',
  avatar_url VARCHAR(500) COMMENT '头像URL',
  managed_sections TEXT COMMENT '管理员可管理的标段，JSON格式存储',
  role ENUM('admin', 'employee') DEFAULT 'employee' COMMENT '用户角色',
  status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '用户状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  INDEX idx_openid (openid),
  INDEX idx_role (role),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入测试管理员用户（如果不存在）
INSERT IGNORE INTO users (
  openid, nick_name, avatar_url, managed_sections, role, status
) VALUES (
  'test_admin_openid_12345',
  '测试管理员',
  'https://example.com/admin-avatar.jpg',
  '["TJ01", "TJ02"]',
  'admin',
  'active'
);

-- 插入测试普通用户（如果不存在）
INSERT IGNORE INTO users (
  openid, nick_name, avatar_url, role, status
) VALUES (
  'test_employee_openid_67890',
  '测试员工',
  'https://example.com/employee-avatar.jpg',
  'employee',
  'active'
);

-- 显示表结构
DESCRIBE users;

-- 显示用户数据样例
SELECT
    id,
    openid as 'OpenID',
    nick_name as '昵称',
    avatar_url as '头像',
    managed_sections as '管理标段',
    role as '角色',
    status as '状态',
    created_at as '创建时间',
    updated_at as '更新时间'
FROM users;

-- 显示统计信息
SELECT
    '用户统计' as info,
    COUNT(*) as 总用户数,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as 管理员数量,
    COUNT(CASE WHEN role = 'employee' THEN 1 END) as 员工数量,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as 活跃用户数,
    COUNT(CASE WHEN managed_sections IS NOT NULL AND managed_sections != '[]' THEN 1 END) as 有管理权限的用户数
FROM users;

SELECT '用户表结构定义完成！' as message;
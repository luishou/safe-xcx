-- 添加 role 字段到 users 表（如果不存在）
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'employee' AFTER status;

-- 更新用户ID=6的角色为admin
UPDATE users SET role = 'admin' WHERE id = 6;

-- 查看所有用户信息
SELECT
    id,
    openid,
    nickName,
    role,
    status,
    createdAt,
    updatedAt
FROM users
ORDER BY id;

-- 验证用户ID=6的更新结果
SELECT * FROM users WHERE id = 6;
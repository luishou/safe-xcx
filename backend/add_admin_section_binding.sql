-- 为用户表添加管理员绑定的标段字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS managed_sections TEXT COMMENT '管理员可管理的标段，JSON格式存储';

-- 为现有管理员设置可管理的标段（示例：管理员ID=6可以管理TJ01和TJ02标段）
UPDATE users
SET managed_sections = JSON_ARRAY('TJ01', 'TJ02')
WHERE role = 'admin' AND id = 6;

-- 查看更新后的用户信息
SELECT
    id,
    openid,
    nickName,
    role,
    managed_sections,
    status,
    createdAt,
    updatedAt
FROM users
WHERE role = 'admin';
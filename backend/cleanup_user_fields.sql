-- 清理用户表中的无用字段
-- 删除 gender, city, province, country, language 字段

USE xcx;

-- 显示当前表结构
DESCRIBE users;

-- 显示无用字段的数据分布（如果需要备份）
SELECT
    '无用字段数据预览' as info,
    COUNT(*) as 总用户数,
    COUNT(CASE WHEN gender IS NOT NULL THEN 1 END) as 有性别数据的用户数,
    COUNT(CASE WHEN city IS NOT NULL THEN 1 END) as 有城市数据的用户数,
    COUNT(CASE WHEN province IS NOT NULL THEN 1 END) as 有省份数据的用户数,
    COUNT(CASE WHEN country IS NOT NULL THEN 1 END) as 有国家数据的用户数,
    COUNT(CASE WHEN language IS NOT NULL THEN 1 END) as 有语言数据的用户数
FROM users;

-- 删除无用字段
ALTER TABLE users
DROP COLUMN IF EXISTS gender,
DROP COLUMN IF EXISTS city,
DROP COLUMN IF EXISTS province,
DROP COLUMN IF EXISTS country,
DROP COLUMN IF EXISTS language;

-- 显示清理后的表结构
DESCRIBE users;

-- 显示清理后的用户数据样例
SELECT
    '清理后的用户数据样例' as info,
    id, openid, nick_name, avatar_url, managed_sections, role, status, created_at, updated_at
FROM users
LIMIT 3;

-- 验证表结构
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
FROM users
WHERE role IS NOT NULL
LIMIT 5;

SELECT '用户表字段清理完成！已删除 gender, city, province, country, language 字段' as message;
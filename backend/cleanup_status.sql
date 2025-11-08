-- 统一举报状态为三状态：submitted(待处理)、processing(处理中)、completed(已办结)
-- 清理脚本：将旧状态映射到新的三状态系统

USE xcx;

-- 将旧状态映射为新状态
UPDATE reports
SET status = 'submitted'
WHERE status IN ('pending');

UPDATE reports
SET status = 'processing'
WHERE status IN ('assigned');

UPDATE reports
SET status = 'completed'
WHERE status IN ('rejected');

-- 显示状态分布统计
SELECT
    status,
    COUNT(*) as count,
    CASE status
        WHEN 'submitted' THEN '待处理'
        WHEN 'processing' THEN '处理中'
        WHEN 'completed' THEN '已办结'
        ELSE status
    END as status_name
FROM reports
GROUP BY status
ORDER BY status;

-- 验证没有其他无效状态
SELECT DISTINCT status FROM reports WHERE status NOT IN ('submitted', 'processing', 'completed');

-- 更新举报历史表中的状态描述
UPDATE report_history
SET description = REPLACE(description, '提交了重大隐患举报', '提交了举报')
WHERE description LIKE '%提交了重大隐患举报%';

UPDATE report_history
SET description = REPLACE(description, '提交了其他隐患举报', '提交了举报')
WHERE description LIKE '%提交了其他隐患举报%';

-- 显示更新结果
SELECT '状态清理完成！' as message;
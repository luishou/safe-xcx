-- 测试状态查询逻辑
-- 验证数据库中的状态分布和查询结果

USE xcx;

-- 查看当前数据库中的状态分布
SELECT
    '当前状态分布' as info,
    status as 状态代码,
    CASE status
        WHEN 'submitted' THEN '待处理'
        WHEN 'processing' THEN '处理中'
        WHEN 'completed' THEN '已办结'
        ELSE '未知状态'
    END as 状态名称,
    COUNT(*) as 数量
FROM reports
GROUP BY status
ORDER BY status;

-- 测试查询 submitted 状态
SELECT
    '查询submitted状态' as info,
    COUNT(*) as 数量
FROM reports
WHERE status = 'submitted';

-- 测试查询 processing 状态
SELECT
    '查询processing状态' as info,
    COUNT(*) as 数量
FROM reports
WHERE status = 'processing';

-- 测试查询 completed 状态
SELECT
    '查询completed状态' as info,
    COUNT(*) as 数量
FROM reports
WHERE status = 'completed';

-- 测试模拟前端查询：status = 'submitted'
-- 这对应前端请求：?status=submitted
SELECT
    '模拟前端查询status=submitted' as info,
    COUNT(*) as 数量
FROM reports
WHERE status = 'submitted';

-- 测试模拟前端查询：status = 'submitted,processing'
-- 这对应前端请求：?status=submitted,processing
SELECT
    '模拟前端查询status=submitted,processing' as info,
    COUNT(*) as 数量
FROM reports
WHERE status IN ('submitted', 'processing');

-- 检查是否有旧状态数据
SELECT
    '检查旧状态数据' as info,
    status as 状态代码,
    COUNT(*) as 数量
FROM reports
WHERE status NOT IN ('submitted', 'processing', 'completed')
GROUP BY status;

-- 如果有旧状态数据，显示需要执行的清理语句
SELECT
    '清理建议' as info,
    '如需清理旧状态，请执行：cleanup_status.sql' as action;
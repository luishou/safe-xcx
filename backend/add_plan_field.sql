-- 为reports表添加plan字段
ALTER TABLE reports ADD COLUMN plan TEXT COMMENT '处理方案';

-- 检查字段是否添加成功
DESCRIBE reports;
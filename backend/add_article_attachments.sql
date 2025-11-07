-- 为安全知识文章表添加附件字段
ALTER TABLE safety_articles ADD COLUMN IF NOT EXISTS attachments TEXT COMMENT '附件信息，JSON格式存储文件路径和文件名';

-- 查看表结构确认字段添加成功
DESCRIBE safety_articles;
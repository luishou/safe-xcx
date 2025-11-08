-- 举报记录表结构定义
-- 状态统一为三状态：submitted(待处理)、processing(处理中)、completed(已办结)

USE xcx;

-- 如果表存在则删除重建（注意：会丢失数据，仅用于开发环境）
-- DROP TABLE IF EXISTS reports;

-- 创建举报记录表
CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reporter_id INT NOT NULL COMMENT '举报人ID',
  reporter_name VARCHAR(100) NOT NULL COMMENT '举报人姓名',
  description TEXT NOT NULL COMMENT '隐患描述',
  hazard_type ENUM('fire', 'electric', 'chemical', 'mechanical', 'height', 'traffic', 'environment', 'other') NOT NULL COMMENT '隐患类型',
  severity ENUM('low', 'medium', 'high', 'critical') NOT NULL COMMENT '严重程度',
  location VARCHAR(255) NOT NULL COMMENT '隐患位置',
  section VARCHAR(20) NOT NULL COMMENT '标段代码',
  status ENUM('submitted', 'processing', 'completed') NOT NULL DEFAULT 'submitted' COMMENT '处理状态：submitted-待处理，processing-处理中，completed-已办结',
  assigned_to VARCHAR(100) COMMENT '指派给谁处理',
  plan TEXT COMMENT '整改计划',
  feedback TEXT COMMENT '处理反馈',
  initial_images JSON COMMENT '初始隐患图片',
  rectified_images JSON COMMENT '整改后图片',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  INDEX idx_reporter_id (reporter_id),
  INDEX idx_section (section),
  INDEX idx_status (status),
  INDEX idx_hazard_type (hazard_type),
  INDEX idx_severity (severity),
  INDEX idx_created_at (created_at),
  INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建举报历史记录表
CREATE TABLE IF NOT EXISTS report_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_id INT NOT NULL COMMENT '举报ID',
  user_id INT COMMENT '操作用户ID',
  action VARCHAR(50) NOT NULL COMMENT '操作类型',
  description TEXT COMMENT '操作描述',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  INDEX idx_report_id (report_id),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入示例数据（仅用于测试）
INSERT INTO reports (
  reporter_id, reporter_name, description, hazard_type, severity,
  location, section, status, initial_images
) VALUES
(1, '张三', '发现消防安全隐患，灭火器过期', 'fire', 'high',
 'A区仓库', 'TJ01', 'submitted',
 '["https://example.com/fire1.jpg", "https://example.com/fire2.jpg"]'),
(1, '李四', '电线裸露，存在触电风险', 'electric', 'critical',
 'B区车间', 'TJ01', 'processing',
 '["https://example.com/electric1.jpg"]'),
(2, '王五', '化学品存放不规范', 'chemical', 'medium',
 'C区仓库', 'TJ02', 'completed',
 '["https://example.com/chemical1.jpg"]');

-- 显示表结构
DESCRIBE reports;
DESCRIBE report_history;

-- 显示状态分布
SELECT
  status as '状态代码',
  CASE status
    WHEN 'submitted' THEN '待处理'
    WHEN 'processing' THEN '处理中'
    WHEN 'completed' THEN '已办结'
  END as '状态名称',
  COUNT(*) as '数量'
FROM reports
GROUP BY status;

SELECT '举报记录表结构定义完成！' as message;
-- 安全知识初始化SQL（仅安全分类与文章）
  CREATE DATABASE IF NOT EXISTS xcx DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

  USE xcx;

  -- 仅清理安全知识相关表
  DROP TABLE IF EXISTS safety_articles;
  DROP TABLE IF EXISTS safety_categories;

  -- 安全知识分类表
  CREATE TABLE IF NOT EXISTS safety_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    status ENUM('active','inactive') DEFAULT 'active',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_sort (sort_order)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  -- 安全知识文章表（不依赖外键，uploaded_by可为空）
  CREATE TABLE IF NOT EXISTS safety_articles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    uploaded_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category_id (category_id),
    INDEX idx_uploaded_by (uploaded_by)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  -- 初始化分类（来自现有静态内容与项目说明）
  INSERT INTO safety_categories (name, description, status, sort_order) VALUES
  ('消防安全', '消防安全相关知识', 'active', 1),
  ('用电安全', '用电安全相关知识', 'active', 2),
  ('临边防护', '临边防护相关知识', 'active', 3),
  ('个人防护装备', '个人防护装备相关知识', 'active', 4),
  ('机械安全', '机械设备安全相关知识', 'active', 5);

  -- 初始化文章（依据现有静态文本）
  INSERT INTO safety_articles (category_id, title, content, uploaded_by)
  VALUES
  ((SELECT id FROM safety_categories WHERE name='消防安全'), '消防安全基础知识', '1. 火灾预防：定期检查电气线路，不超负荷用电，易燃物品远离火源。\n2. 灭火器使用：拔掉保险销，对准火源根部，按下压把进行灭火。\n3. 疏散逃生：熟悉安全出口位置，低姿势沿墙壁逃生，不乘坐电梯。', NULL),
  ((SELECT id FROM safety_categories WHERE name='用电安全'), '用电安全操作规程', '1. 湿手不接触电器，防止触电事故。\n2. 定期检查电缆线路，发现破损立即更换。\n3. 使用合格的电气设备，不使用三无产品。\n4. 电气设备要有良好的接地保护。', NULL),
  ((SELECT id FROM safety_categories WHERE name='消防安全'), '消防安全提示', '消防安全：发现火情立即拨打119，使用灭火器时拔掉保险销，对准火焰根部喷射。', NULL),
  ((SELECT id FROM safety_categories WHERE name='用电安全'), '用电安全提示', '用电安全：禁止私拉乱接电线，发现漏电立即断电。', NULL),
  ((SELECT id FROM safety_categories WHERE name='机械安全'), '机械安全提示', '机械安全：操作设备前检查防护装置，严禁违章操作。', NULL);
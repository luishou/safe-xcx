-- 创建数据库
CREATE DATABASE IF NOT EXISTS xcx DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE xcx;

-- 删除现有表（如果存在）
DROP TABLE IF EXISTS report_history;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS safety_documents;
DROP TABLE IF EXISTS safety_knowledge;
DROP TABLE IF EXISTS sections;
DROP TABLE IF EXISTS users;

-- 用户表
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openid VARCHAR(100) NOT NULL UNIQUE,
  nick_name VARCHAR(100) DEFAULT '微信用户',
  avatar_url TEXT,
  gender TINYINT DEFAULT 0 COMMENT '0:未知, 1:男, 2:女',
  city VARCHAR(50),
  province VARCHAR(50),
  country VARCHAR(50),
  language VARCHAR(20) DEFAULT 'zh_CN',
  role ENUM('employee', 'manager', 'admin') DEFAULT 'employee',
  status ENUM('active', 'inactive', 'banned') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_openid (openid),
  INDEX idx_role (role),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 安全知识表
CREATE TABLE IF NOT EXISTS safety_knowledge (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  category ENUM('fire', 'electric', 'chemical', 'mechanical', 'other') DEFAULT 'other',
  file_type ENUM('text', 'image', 'video', 'document') DEFAULT 'text',
  file_url TEXT,
  uploaded_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_uploaded_by (uploaded_by),
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 安全文档表
CREATE TABLE IF NOT EXISTS safety_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INT DEFAULT 0,
  file_type VARCHAR(50) NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_by INT,
  upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_uploaded_by (uploaded_by),
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 举报记录表
CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reporter_id INT NOT NULL,
  reporter_name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  hazard_type ENUM('fire', 'electric', 'chemical', 'mechanical', 'other') NOT NULL,
  severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
  location VARCHAR(200) NOT NULL,
  section VARCHAR(20) NOT NULL DEFAULT 'TJ01',
  status ENUM('submitted', 'assigned', 'processing', 'completed', 'rejected') DEFAULT 'submitted',
  assigned_to INT,
  assigned_time TIMESTAMP NULL,
  plan TEXT,
  initial_images JSON,
  rectified_images JSON,
  feedback TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_reporter (reporter_id),
  INDEX idx_status (status),
  INDEX idx_section (section),
  INDEX idx_severity (severity),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 举报历史记录表
CREATE TABLE IF NOT EXISTS report_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_id INT NOT NULL,
  user_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_report_id (report_id),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 标段管理表
CREATE TABLE IF NOT EXISTS sections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  section_code VARCHAR(20) NOT NULL UNIQUE COMMENT '标段代码',
  section_name VARCHAR(100) NOT NULL COMMENT '标段名称',
  description TEXT COMMENT '标段描述',
  status ENUM('active', 'inactive') DEFAULT 'active',
  sort_order INT DEFAULT 0 COMMENT '排序顺序',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_section_code (section_code),
  INDEX idx_status (status),
  INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入标段初始数据
INSERT INTO sections (section_code, section_name, description, sort_order) VALUES
('TJ01', '第TJ01标段', '320国道余杭中泰段工程项目 - 第TJ01标段', 1),
('TJ02', '第TJ02标段', '320国道余杭中泰段工程项目 - 第TJ02标段', 2);

-- 插入默认管理员用户
INSERT IGNORE INTO users (openid, nick_name, role, status) VALUES
('admin_openid_placeholder', '系统管理员', 'admin', 'active');
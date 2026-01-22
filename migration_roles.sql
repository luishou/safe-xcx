-- =============================================
-- 标段级别角色权限系统 - 数据库迁移脚本
-- 执行时间: 2026-01-21
-- =============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- 1. 用户标段角色表（新建）
-- 用于存储用户在各标段的角色配置
-- ----------------------------
DROP TABLE IF EXISTS `user_section_roles`;
CREATE TABLE `user_section_roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `section_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '标段代码，如TJ01',
  `role_type` enum('safety_admin', 'supervisor', 'section_admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '角色类型：安全环保部/监理/标段管理员',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uk_user_section_role` (`user_id`, `section_code`, `role_type`) USING BTREE,
  INDEX `idx_user_id` (`user_id`) USING BTREE,
  INDEX `idx_section_code` (`section_code`) USING BTREE,
  INDEX `idx_role_type` (`role_type`) USING BTREE,
  CONSTRAINT `fk_usr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_usr_section` FOREIGN KEY (`section_code`) REFERENCES `sections` (`section_code`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '用户标段角色配置表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- 2. 用户认证表（新建）
-- 用于存储用户在各标段的认证状态
-- ----------------------------
DROP TABLE IF EXISTS `user_verifications`;
CREATE TABLE `user_verifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `section_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '认证所属标段',
  `real_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '真实姓名（认证通过后填写）',
  `status` enum('pending', 'approved', 'rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending' COMMENT '认证状态',
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '提交时间',
  `reviewed_at` timestamp NULL DEFAULT NULL COMMENT '审核时间',
  `reviewed_by` int(11) DEFAULT NULL COMMENT '审核人ID',
  `reject_reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '驳回原因',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uk_user_section` (`user_id`, `section_code`) USING BTREE,
  INDEX `idx_user_id` (`user_id`) USING BTREE,
  INDEX `idx_section_code` (`section_code`) USING BTREE,
  INDEX `idx_status` (`status`) USING BTREE,
  CONSTRAINT `fk_uv_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_uv_section` FOREIGN KEY (`section_code`) REFERENCES `sections` (`section_code`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_uv_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '用户标段认证表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- 3. 数据迁移 - 将现有用户角色数据迁移到新表
-- ----------------------------

-- 3.1 迁移安全环保部（role = 'admin' 且有 managed_sections 的用户）
INSERT INTO `user_section_roles` (`user_id`, `section_code`, `role_type`)
SELECT 
  u.id,
  TRIM(BOTH '"' FROM JSON_UNQUOTE(sec.section_code)) as section_code,
  'safety_admin' as role_type
FROM users u
CROSS JOIN JSON_TABLE(
  u.managed_sections,
  '$[*]' COLUMNS(section_code VARCHAR(20) PATH '$')
) AS sec
WHERE u.role = 'admin' 
  AND u.managed_sections IS NOT NULL 
  AND JSON_LENGTH(u.managed_sections) > 0
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- 3.2 迁移监理（is_supervisor = 1 的用户）
INSERT INTO `user_section_roles` (`user_id`, `section_code`, `role_type`)
SELECT 
  u.id,
  TRIM(BOTH '"' FROM JSON_UNQUOTE(sec.section_code)) as section_code,
  'supervisor' as role_type
FROM users u
CROSS JOIN JSON_TABLE(
  u.managed_sections,
  '$[*]' COLUMNS(section_code VARCHAR(20) PATH '$')
) AS sec
WHERE u.is_supervisor = 1 
  AND u.managed_sections IS NOT NULL 
  AND JSON_LENGTH(u.managed_sections) > 0
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- 3.3 迁移标段管理员（is_admin = 1 的用户）
INSERT INTO `user_section_roles` (`user_id`, `section_code`, `role_type`)
SELECT 
  u.id,
  TRIM(BOTH '"' FROM JSON_UNQUOTE(sec.section_code)) as section_code,
  'section_admin' as role_type
FROM users u
CROSS JOIN JSON_TABLE(
  u.managed_sections,
  '$[*]' COLUMNS(section_code VARCHAR(20) PATH '$')
) AS sec
WHERE u.is_admin = 1 
  AND u.managed_sections IS NOT NULL 
  AND JSON_LENGTH(u.managed_sections) > 0
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- 3.4 迁移已认证用户（is_verified = 1 的用户）
-- 对于已认证用户，需要关联到他们曾经提交过举报的标段
INSERT INTO `user_verifications` (`user_id`, `section_code`, `real_name`, `status`, `submitted_at`, `reviewed_at`)
SELECT DISTINCT
  u.id,
  r.section as section_code,
  u.real_name,
  'approved' as status,
  u.created_at as submitted_at,
  u.updated_at as reviewed_at
FROM users u
INNER JOIN reports r ON r.reporter_id = u.id
WHERE u.is_verified = 1
ON DUPLICATE KEY UPDATE 
  real_name = VALUES(real_name),
  status = 'approved',
  updated_at = CURRENT_TIMESTAMP;

-- 对于已认证但没有提交过举报的用户，默认添加 TJ01 标段
INSERT INTO `user_verifications` (`user_id`, `section_code`, `real_name`, `status`, `submitted_at`, `reviewed_at`)
SELECT 
  u.id,
  'TJ01' as section_code,
  u.real_name,
  'approved' as status,
  u.created_at as submitted_at,
  u.updated_at as reviewed_at
FROM users u
WHERE u.is_verified = 1 
  AND NOT EXISTS (
    SELECT 1 FROM user_verifications uv WHERE uv.user_id = u.id
  )
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================
-- 迁移完成提示
-- =============================================
SELECT '数据迁移完成！' as message;
SELECT 'user_section_roles 表记录数:' as info, COUNT(*) as count FROM user_section_roles;
SELECT 'user_verifications 表记录数:' as info, COUNT(*) as count FROM user_verifications;

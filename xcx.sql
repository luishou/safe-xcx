/*
 Navicat Premium Data Transfer

 Source Server         : safe
 Source Server Type    : MySQL
 Source Server Version : 50737 (5.7.37-log)
 Source Host           : 124.223.187.95:3306
 Source Schema         : xcx

 Target Server Type    : MySQL
 Target Server Version : 50737 (5.7.37-log)
 File Encoding         : 65001

 Date: 21/01/2026 21:02:19
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for report_history
-- ----------------------------
DROP TABLE IF EXISTS `report_history`;
CREATE TABLE `report_history`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `report_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `action` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_report_id`(`report_id`) USING BTREE,
  INDEX `idx_user_id`(`user_id`) USING BTREE,
  INDEX `idx_created_at`(`created_at`) USING BTREE,
  CONSTRAINT `report_history_ibfk_1` FOREIGN KEY (`report_id`) REFERENCES `reports` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `report_history_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 161 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of report_history
-- ----------------------------
INSERT INTO `report_history` VALUES (43, 19, 18, '提交举报', '用户SuV提交了举报', '2025-11-10 09:04:33');
INSERT INTO `report_history` VALUES (44, 19, 12, '确认处理', '已确认接收任务，正在处理中', '2025-11-10 18:47:56');
INSERT INTO `report_history` VALUES (45, 20, 12, '提交举报', '用户郭红里提交了举报', '2025-11-10 18:54:04');
INSERT INTO `report_history` VALUES (46, 20, 12, '确认处理', '已确认接收任务，正在处理中', '2025-11-10 18:54:32');
INSERT INTO `report_history` VALUES (47, 20, 12, '完成办结', '隐患已整改完成', '2025-11-10 18:55:34');
INSERT INTO `report_history` VALUES (48, 21, 12, '提交举报', '用户郭红里提交了举报', '2025-11-11 16:34:15');
INSERT INTO `report_history` VALUES (49, 21, 12, '确认处理', '已确认接收任务，正在处理中', '2025-11-11 16:34:23');
INSERT INTO `report_history` VALUES (50, 19, 12, '完成办结', '隐患已整改完成', '2025-11-11 16:35:34');
INSERT INTO `report_history` VALUES (51, 21, 12, '完成办结', '隐患已整改完成', '2025-11-11 16:36:15');
INSERT INTO `report_history` VALUES (52, 22, 16, '提交举报', '用户ongY提交了举报', '2025-11-15 10:08:32');
INSERT INTO `report_history` VALUES (53, 22, 15, '确认处理', '已确认接收任务，正在处理中', '2025-11-15 10:28:29');
INSERT INTO `report_history` VALUES (54, 22, 15, '完成办结', '隐患已整改完成', '2025-11-15 10:29:02');
INSERT INTO `report_history` VALUES (55, 23, 41, '提交举报', '用户张提交了举报', '2025-11-18 08:41:14');
INSERT INTO `report_history` VALUES (56, 23, 12, '确认处理', '已确认接收任务，正在处理中', '2025-11-18 08:49:12');
INSERT INTO `report_history` VALUES (57, 24, 42, '提交举报', '用户张志远提交了举报', '2025-11-18 08:54:31');
INSERT INTO `report_history` VALUES (58, 23, 12, '完成办结', '隐患已整改完成', '2025-11-18 11:54:29');
INSERT INTO `report_history` VALUES (59, 24, 12, '确认处理', '已确认接收任务，正在处理中', '2025-11-19 10:13:42');
INSERT INTO `report_history` VALUES (60, 24, 12, '完成办结', '隐患已整改完成', '2025-11-19 10:20:04');
INSERT INTO `report_history` VALUES (61, 25, 18, '提交举报', '用户SUV提交了举报', '2025-12-01 10:19:28');
INSERT INTO `report_history` VALUES (62, 25, 12, '确认处理', '已确认接收任务，正在处理中', '2025-12-01 14:15:41');
INSERT INTO `report_history` VALUES (63, 25, 12, '完成办结', '隐患已整改完成', '2025-12-01 14:20:43');
INSERT INTO `report_history` VALUES (64, 26, 52, '提交举报', '用户张腾飞提交了举报', '2025-12-04 16:04:10');
INSERT INTO `report_history` VALUES (65, 26, 14, '确认处理', '已确认接收任务，正在处理中', '2025-12-04 16:08:19');
INSERT INTO `report_history` VALUES (66, 26, 14, '完成办结', '隐患已整改完成', '2025-12-04 16:09:51');
INSERT INTO `report_history` VALUES (67, 27, 41, '提交举报', '用户张甫提交了举报', '2025-12-06 14:56:38');
INSERT INTO `report_history` VALUES (68, 27, 14, '确认处理', '已确认接收任务，正在处理中', '2025-12-06 14:56:57');
INSERT INTO `report_history` VALUES (69, 27, 14, '完成办结', '隐患已整改完成', '2025-12-06 14:58:51');
INSERT INTO `report_history` VALUES (70, 28, 55, '提交举报', '用户李斌提交了举报', '2025-12-06 18:52:59');
INSERT INTO `report_history` VALUES (71, 28, 14, '确认处理', '已确认接收任务，正在处理中', '2025-12-06 18:53:19');
INSERT INTO `report_history` VALUES (72, 28, 14, '完成办结', '隐患已整改完成', '2025-12-06 18:55:05');
INSERT INTO `report_history` VALUES (73, 29, 41, '提交举报', '用户张甫提交了举报', '2025-12-10 16:37:15');
INSERT INTO `report_history` VALUES (74, 29, 14, '确认处理', '已确认接收任务，正在处理中', '2025-12-10 16:37:39');
INSERT INTO `report_history` VALUES (75, 29, 14, '完成办结', '隐患已整改完成', '2025-12-10 16:38:53');
INSERT INTO `report_history` VALUES (76, 30, 56, '提交举报', '用户秋林提交了举报', '2025-12-10 16:47:20');
INSERT INTO `report_history` VALUES (77, 31, 41, '提交举报', '用户张甫提交了举报', '2025-12-11 10:58:32');
INSERT INTO `report_history` VALUES (78, 30, 14, '确认处理', '已确认接收任务，正在处理中', '2025-12-11 10:59:40');
INSERT INTO `report_history` VALUES (79, 31, 14, '确认处理', '已确认接收任务，正在处理中', '2025-12-11 10:59:47');
INSERT INTO `report_history` VALUES (80, 30, 14, '完成办结', '隐患已整改完成', '2025-12-11 11:00:48');
INSERT INTO `report_history` VALUES (81, 31, 14, '完成办结', '隐患已整改完成', '2025-12-11 11:02:16');
INSERT INTO `report_history` VALUES (82, 32, 55, '提交举报', '用户李斌提交了举报', '2025-12-12 15:20:56');
INSERT INTO `report_history` VALUES (83, 32, 12, '确认处理', '已确认接收任务，正在处理中', '2025-12-12 15:30:58');
INSERT INTO `report_history` VALUES (84, 32, 12, '完成办结', '隐患已整改完成', '2025-12-12 15:32:32');
INSERT INTO `report_history` VALUES (85, 33, 15, '提交举报', '用户占兵提交了举报', '2025-12-15 09:36:15');
INSERT INTO `report_history` VALUES (86, 34, 15, '提交举报', '用户占兵提交了举报', '2025-12-15 09:37:34');
INSERT INTO `report_history` VALUES (87, 35, 15, '提交举报', '用户占兵提交了举报', '2025-12-15 09:38:35');
INSERT INTO `report_history` VALUES (88, 36, 57, '提交举报', '用户夜来香烧烤店提交了举报', '2025-12-15 10:20:53');
INSERT INTO `report_history` VALUES (89, 35, 15, '确认处理', '已确认接收任务，正在处理中', '2025-12-15 13:54:08');
INSERT INTO `report_history` VALUES (90, 35, 15, '完成办结', '隐患已整改完成', '2025-12-15 13:54:42');
INSERT INTO `report_history` VALUES (91, 34, 15, '确认处理', '已确认接收任务，正在处理中', '2025-12-15 13:54:49');
INSERT INTO `report_history` VALUES (92, 33, 15, '确认处理', '已确认接收任务，正在处理中', '2025-12-15 13:54:55');
INSERT INTO `report_history` VALUES (93, 34, 15, '完成办结', '隐患已整改完成', '2025-12-15 13:55:12');
INSERT INTO `report_history` VALUES (94, 33, 15, '完成办结', '隐患已整改完成', '2025-12-15 13:56:04');
INSERT INTO `report_history` VALUES (95, 36, 12, '确认处理', '已确认接收任务，正在处理中', '2025-12-15 14:14:04');
INSERT INTO `report_history` VALUES (96, 36, 12, '完成办结', '隐患已整改完成', '2025-12-15 14:15:31');
INSERT INTO `report_history` VALUES (97, 37, 15, '提交举报', '用户占兵提交了举报', '2025-12-16 09:15:29');
INSERT INTO `report_history` VALUES (98, 37, 15, '确认处理', '已确认接收任务，正在处理中', '2025-12-16 09:15:52');
INSERT INTO `report_history` VALUES (99, 37, 15, '完成办结', '隐患已整改完成', '2025-12-16 09:16:12');
INSERT INTO `report_history` VALUES (100, 38, 15, '提交举报', '用户占兵提交了举报', '2025-12-16 09:17:42');
INSERT INTO `report_history` VALUES (101, 38, 15, '确认处理', '已确认接收任务，正在处理中', '2025-12-16 09:17:59');
INSERT INTO `report_history` VALUES (102, 38, 15, '完成办结', '隐患已整改完成', '2025-12-16 09:18:18');
INSERT INTO `report_history` VALUES (103, 39, 15, '提交举报', '用户占兵提交了举报', '2025-12-16 09:20:31');
INSERT INTO `report_history` VALUES (104, 40, 15, '提交举报', '用户占兵提交了举报', '2025-12-16 09:21:35');
INSERT INTO `report_history` VALUES (105, 40, 15, '确认处理', '已确认接收任务，正在处理中', '2025-12-16 09:21:42');
INSERT INTO `report_history` VALUES (106, 39, 15, '确认处理', '已确认接收任务，正在处理中', '2025-12-16 09:21:48');
INSERT INTO `report_history` VALUES (107, 39, 15, '完成办结', '隐患已整改完成', '2025-12-16 09:22:10');
INSERT INTO `report_history` VALUES (108, 40, 15, '完成办结', '隐患已整改完成', '2025-12-16 09:22:26');
INSERT INTO `report_history` VALUES (109, 41, 15, '提交举报', '用户占兵提交了举报', '2025-12-17 13:58:24');
INSERT INTO `report_history` VALUES (110, 41, 15, '确认处理', '已确认接收任务，正在处理中', '2025-12-17 13:58:32');
INSERT INTO `report_history` VALUES (111, 41, 15, '完成办结', '隐患已整改完成', '2025-12-17 13:58:53');
INSERT INTO `report_history` VALUES (112, 42, 60, '提交举报', '用户逸飞提交了举报', '2025-12-18 16:20:06');
INSERT INTO `report_history` VALUES (113, 42, 12, '确认处理', '已确认接收任务，正在处理中', '2025-12-18 16:33:50');
INSERT INTO `report_history` VALUES (114, 42, 12, '完成办结', '隐患已整改完成', '2025-12-18 16:35:48');
INSERT INTO `report_history` VALUES (115, 43, 52, '提交举报', '用户张腾飞提交了举报', '2025-12-25 14:47:52');
INSERT INTO `report_history` VALUES (116, 43, 12, '确认处理', '已确认接收任务，正在处理中', '2025-12-25 14:59:58');
INSERT INTO `report_history` VALUES (117, 43, 12, '完成办结', '隐患已整改完成', '2025-12-26 10:37:39');
INSERT INTO `report_history` VALUES (118, 44, 51, '提交举报', '用户111提交了举报', '2025-12-26 11:40:28');
INSERT INTO `report_history` VALUES (119, 44, 12, '驳回办结', '已驳回，无须处理', '2025-12-26 11:42:52');
INSERT INTO `report_history` VALUES (120, 45, 6, '提交举报', '用户侯大脸提交了举报', '2025-12-28 13:13:14');
INSERT INTO `report_history` VALUES (121, 45, 6, '确认处理', '已确认接收任务，正在处理中', '2025-12-28 13:14:59');
INSERT INTO `report_history` VALUES (122, 45, 6, '完成办结', '隐患已整改完成', '2025-12-28 13:17:29');
INSERT INTO `report_history` VALUES (123, 46, 65, '提交举报', '用户吴开均提交了举报', '2026-01-01 15:05:15');
INSERT INTO `report_history` VALUES (124, 47, 64, '提交举报', '用户刘万东提交了举报', '2026-01-01 15:10:34');
INSERT INTO `report_history` VALUES (125, 48, 64, '提交举报', '用户刘万东提交了举报', '2026-01-01 15:10:46');
INSERT INTO `report_history` VALUES (126, 49, 64, '提交举报', '用户刘万东提交了举报', '2026-01-01 15:11:00');
INSERT INTO `report_history` VALUES (127, 48, 12, '驳回办结', '已驳回，无须处理', '2026-01-01 15:15:41');
INSERT INTO `report_history` VALUES (128, 49, 12, '驳回办结', '已驳回，无须处理', '2026-01-01 15:16:20');
INSERT INTO `report_history` VALUES (129, 46, 12, '确认处理', '已确认接收任务，正在处理中', '2026-01-01 15:16:36');
INSERT INTO `report_history` VALUES (130, 46, 12, '完成办结', '隐患已整改完成', '2026-01-01 15:18:46');
INSERT INTO `report_history` VALUES (131, 47, 12, '确认处理', '已确认接收任务，正在处理中', '2026-01-01 15:22:41');
INSERT INTO `report_history` VALUES (132, 47, 12, '完成办结', '隐患已整改完成', '2026-01-01 15:24:36');
INSERT INTO `report_history` VALUES (133, 50, 47, '提交举报', '用户卢湘龙提交了举报', '2026-01-04 15:36:25');
INSERT INTO `report_history` VALUES (134, 50, 12, '确认处理', '已确认接收任务，正在处理中', '2026-01-05 09:59:52');
INSERT INTO `report_history` VALUES (135, 50, 12, '完成办结', '隐患已整改完成', '2026-01-05 10:02:24');
INSERT INTO `report_history` VALUES (136, 51, 6, '提交举报', '用户侯大脸提交了举报', '2026-01-10 21:42:39');
INSERT INTO `report_history` VALUES (137, 51, 6, '安全部确认', '处理意见：测试，奖金：100元', '2026-01-10 23:14:11');
INSERT INTO `report_history` VALUES (138, 51, 6, '监理确认', 'OK', '2026-01-10 23:49:13');
INSERT INTO `report_history` VALUES (139, 51, 6, '上传处理照片', '已上传整改后照片', '2026-01-10 23:49:33');
INSERT INTO `report_history` VALUES (140, 51, 6, '完成办结', '已上传奖金发放截图，流程完结', '2026-01-11 00:01:21');
INSERT INTO `report_history` VALUES (141, 52, 6, '提交举报', '用户侯大脸提交了举报', '2026-01-11 11:18:13');
INSERT INTO `report_history` VALUES (142, 52, 6, '驳回办结', '安全部驳回，无须处理', '2026-01-11 11:18:24');
INSERT INTO `report_history` VALUES (143, 53, 6, '提交举报', '用户侯大脸提交了举报', '2026-01-11 11:20:11');
INSERT INTO `report_history` VALUES (144, 53, 6, '安全部确认', '处理意见：好的，奖金：1000元', '2026-01-11 11:55:01');
INSERT INTO `report_history` VALUES (145, 53, 6, '监理驳回', '没问题', '2026-01-11 11:57:10');
INSERT INTO `report_history` VALUES (146, 53, 6, '安全部确认', '处理意见：好的，奖金：200元', '2026-01-11 11:57:26');
INSERT INTO `report_history` VALUES (147, 53, 6, '监理确认', '监理已确认', '2026-01-11 12:01:43');
INSERT INTO `report_history` VALUES (148, 54, 6, '提交举报', '用户侯大脸提交了举报', '2026-01-11 12:02:52');
INSERT INTO `report_history` VALUES (149, 54, 6, '安全部确认', '处理意见：测试，奖金：12元', '2026-01-11 12:03:50');
INSERT INTO `report_history` VALUES (150, 54, 6, '监理驳回', '监理驳回，退回安全部重新处理', '2026-01-11 12:09:29');
INSERT INTO `report_history` VALUES (151, 54, 6, '安全部确认', '处理意见：请处理，奖金：1200元', '2026-01-11 12:14:22');
INSERT INTO `report_history` VALUES (152, 54, 6, '监理驳回', '不对啊', '2026-01-11 12:14:31');
INSERT INTO `report_history` VALUES (153, 54, 6, '安全部确认', '处理意见：测试-1，奖金：200元', '2026-01-11 12:19:36');
INSERT INTO `report_history` VALUES (154, 54, 6, '监理驳回', '驳回一下啊', '2026-01-11 12:39:32');
INSERT INTO `report_history` VALUES (155, 54, 6, '安全部确认', '处理意见：测试-2，奖金：20000元', '2026-01-11 12:42:30');
INSERT INTO `report_history` VALUES (156, 54, 6, '监理驳回', '驳回测试', '2026-01-11 12:42:43');
INSERT INTO `report_history` VALUES (157, 54, 6, '安全部确认', '处理意见：没问题了，奖金：10000元', '2026-01-11 12:43:00');
INSERT INTO `report_history` VALUES (158, 54, 6, '监理确认', 'OK', '2026-01-11 12:44:43');
INSERT INTO `report_history` VALUES (159, 54, 6, '上传处理照片', '已上传整改后照片', '2026-01-11 12:48:00');
INSERT INTO `report_history` VALUES (160, 54, 6, '完成办结', '已上传奖金发放截图，流程完结', '2026-01-11 13:00:32');

-- ----------------------------
-- Table structure for reports
-- ----------------------------
DROP TABLE IF EXISTS `reports`;
CREATE TABLE `reports`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `reporter_id` int(11) NOT NULL,
  `reporter_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `hazard_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `severity` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `location` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `section` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'TJ01',
  `status` enum('submitted','confirmed','supervisor_confirmed','photo_uploaded','completed','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'submitted',
  `assigned_to` int(11) NULL DEFAULT NULL,
  `assigned_time` timestamp NULL DEFAULT NULL,
  `plan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `initial_images` json NULL,
  `rectified_images` json NULL,
  `feedback` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `processing_opinion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '处理意见',
  `reward_amount` decimal(10, 2) NULL DEFAULT NULL COMMENT '奖金金额（元）',
  `supervisor_id` int(11) NULL DEFAULT NULL COMMENT '监理用户ID',
  `supervisor_comment` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '监理确认意见',
  `supervisor_confirmed_at` datetime NULL DEFAULT NULL COMMENT '监理确认时间',
  `reward_images` json NULL COMMENT '奖金发放截图',
  `reward_paid_at` datetime NULL DEFAULT NULL COMMENT '奖金发放时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_reporter`(`reporter_id`) USING BTREE,
  INDEX `idx_status`(`status`) USING BTREE,
  INDEX `idx_section`(`section`) USING BTREE,
  INDEX `idx_severity`(`severity`) USING BTREE,
  INDEX `idx_created_at`(`created_at`) USING BTREE,
  INDEX `assigned_to`(`assigned_to`) USING BTREE,
  INDEX `fk_supervisor`(`supervisor_id`) USING BTREE,
  CONSTRAINT `fk_supervisor` FOREIGN KEY (`supervisor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `reports_ibfk_2` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 55 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of reports
-- ----------------------------
INSERT INTO `reports` VALUES (19, 18, 'SuV', '龙门吊工雨棚轨道止挡措施措施欠牢靠，防撞块尺寸偏小', 'mechanical', 'medium', '梁场', 'TJ01', 'completed', NULL, NULL, '已加固防止挡措施，更换防撞块。', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/uploads/doc-1762736553611-220473501.jpg\"]', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/images/doc-1762850130891-622290569.jpg\", \"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/images/doc-1762850131619-371982025.jpg\"]', NULL, '2025-11-10 09:04:33', '2025-11-11 16:35:34', NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `reports` VALUES (20, 12, '郭红里', '个别螺纹钢锯床传动链条未设置防护罩，存在安全隐患', 'mechanical', 'medium', '1#钢筋棚', 'TJ01', 'completed', NULL, NULL, '已对锯床链条加装防护罩。', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/uploads/doc-1762772036361-681912129.jpg\"]', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/images/doc-1762772130542-903038825.jpg\"]', NULL, '2025-11-10 18:54:04', '2025-11-10 18:55:34', NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `reports` VALUES (21, 12, '郭红里', '梁场工胎架工雨棚轨道防止挡措施欠牢固', 'other', 'medium', '梁场', 'TJ01', 'completed', NULL, NULL, '已加固轨道防止挡措施', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/uploads/doc-1762850041247-346484368.jpg\"]', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/images/doc-1762850174017-696776252.jpg\"]', NULL, '2025-11-11 16:34:15', '2025-11-11 16:36:15', NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `reports` VALUES (22, 16, 'ongY', '标准化场地位置三级电箱未进行接地保护。', 'electric', 'medium', '骆家岭隧道余杭端洞口', 'TJ02', 'completed', NULL, NULL, '已接地', '[]', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/images/doc-1763173739756-282925879.jpg\"]', NULL, '2025-11-15 10:08:32', '2025-11-15 10:29:02', NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `reports` VALUES (23, 41, '张', '龙门吊轨道接缝处连接线断裂失效', 'electric', 'medium', '梁场', 'TJ01', 'completed', NULL, NULL, '已做有效连接，并对其他位置进行了排查整改。', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/uploads/doc-1763426467614-880072454.jpg\"]', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/images/doc-1763438067236-337305480.jpg\"]', NULL, '2025-11-18 08:41:14', '2025-11-18 11:54:29', NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `reports` VALUES (24, 42, '张志远', '电箱一闸多机', 'electric', 'medium', '桥桩施工区', 'TJ01', 'completed', NULL, NULL, '现场电工已整改好，严格规范用电，加强临时用电巡查。', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/uploads/doc-1763427133584-910899942.jpg\"]', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/images/doc-1763518801544-270380924.jpg\"]', NULL, '2025-11-18 08:54:31', '2025-11-19 10:20:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `reports` VALUES (25, 18, 'SUV', '临时蓄水池缺少安全防护措施（救生圈）', 'other', 'medium', '隧道工区2、3仓便道出入口左侧', 'TJ01', 'completed', NULL, NULL, '临时蓄水池已增加救生圈', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/uploads/doc-1764555554073-725556043.jpg\"]', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/images/doc-1764570038789-575578166.jpg\"]', NULL, '2025-12-01 10:19:28', '2025-12-01 14:20:43', NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `reports` VALUES (26, 52, '张腾飞', '33仓个别开关箱一闸多机，箱门跨接线断裂', 'electric', 'medium', '隧道工区33仓', 'TJ01', 'completed', NULL, NULL, '已安排电工整改完毕，并排查其他电箱', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/uploads/doc-1764835445445-616132139.jpg\"]', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/images/doc-1764835789419-756414722.jpg\"]', NULL, '2025-12-04 16:04:10', '2025-12-04 16:09:51', NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `reports` VALUES (27, 41, '张甫', '灭火器箱子破损', 'other', 'medium', '生活区', 'TJ01', 'completed', NULL, NULL, '已经整改并换新，安全环保科加强管理，并仔细检查所有箱子', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/uploads/doc-1765004128921-443959744.jpg\"]', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/images/doc-1765004327333-709855817.jpg\"]', NULL, '2025-12-06 14:56:38', '2025-12-06 14:58:51', NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `reports` VALUES (28, 55, '李斌', '临边防护栏倒了', 'edge', 'medium', '钢筋加工厂临边防护', 'TJ01', 'completed', NULL, NULL, '已经安排专人整改完毕，每天安排专人检查，确保防护措施完好', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/uploads/doc-1765018366204-318234388.jpg\"]', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/images/doc-1765018498937-427453768.jpg\"]', NULL, '2025-12-06 18:52:59', '2025-12-06 18:55:05', NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `reports` VALUES (29, 41, '张甫', '吊车支腿不符合要求', 'mechanical', 'medium', '桥梁区', 'TJ01', 'completed', NULL, NULL, '已经按照规范要求，整改完毕，要求班组给吊车司机再教育', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/uploads/doc-1765355817245-466644132.jpg\"]', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/images/doc-1765355929754-347814166.jpg\"]', NULL, '2025-12-10 16:37:15', '2025-12-10 16:38:53', NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `reports` VALUES (30, 56, '秋林', '便道临边防护破损失效', 'edge', 'medium', '三集中场地临时便道', 'TJ01', 'completed', NULL, NULL, '安排专人负责整改，并全线检查所有防护栏杆', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/uploads/doc-1765356393855-458277459.jpg\"]', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/images/doc-1765422043932-571308000.jpg\"]', NULL, '2025-12-10 16:47:20', '2025-12-11 11:00:48', NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `reports` VALUES (31, 41, '张甫', '违规使用木梯', 'height', 'medium', '生活区', 'TJ01', 'completed', NULL, NULL, '已安排工人撤离木梯，并给工人批评教育', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/uploads/doc-1765421900753-84641394.jpg\"]', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/images/doc-1765422132490-623121537.jpg\"]', NULL, '2025-12-11 10:58:32', '2025-12-11 11:02:16', NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `reports` VALUES (32, 55, '李斌', '吊车违规使用铁链吊装钢筋', 'mechanical', 'medium', '50仓', 'TJ01', 'completed', NULL, NULL, '已更换为钢丝绳，加强安全巡查。', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/uploads/doc-1765524032733-817397633.jpg\"]', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/images/doc-1765524748290-771935677.jpg\"]', NULL, '2025-12-12 15:20:56', '2025-12-12 15:32:32', NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `reports` VALUES (33, 15, '占兵', '余杭侧左洞台车刷油漆未配备灭火器', 'fire', 'medium', '余杭侧左洞', 'TJ02', 'completed', NULL, NULL, '已整改', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/uploads/doc-1765762570564-831897114.jpg\"]', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/images/doc-1765778163016-962258283.jpg\"]', NULL, '2025-12-15 09:36:15', '2025-12-15 13:56:04', NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `reports` VALUES (34, 15, '占兵', '切割机把柄无绝缘措施', 'mechanical', 'medium', '富阳侧洞口', 'TJ02', 'completed', NULL, NULL, '已整改', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/uploads/doc-1765762645222-549934722.jpg\"]', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/images/doc-1765778110369-807780499.jpg\"]', NULL, '2025-12-15 09:37:34', '2025-12-15 13:55:12', NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `reports` VALUES (35, 15, '占兵', '下台阶开挖临边防护缺失', 'edge', 'medium', '富阳侧右洞', 'TJ02', 'completed', NULL, NULL, '已整改', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/uploads/doc-1765762687506-695933478.jpg\"]', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/images/doc-1765778080600-942368290.jpg\"]', NULL, '2025-12-15 09:38:35', '2025-12-15 13:54:42', NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `reports` VALUES (36, 57, '夜来香烧烤店', '孔口成桩保护围护缺失', 'edge', 'medium', '桥梁工区16号桩', 'TJ01', 'completed', NULL, NULL, '已补充完善桥桩16号桩位成桩围护', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/uploads/doc-1765765172805-842020449.jpg\"]', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/images/doc-1765779328668-215802681.jpg\"]', NULL, '2025-12-15 10:20:53', '2025-12-15 14:15:31', NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `reports` VALUES (37, 15, '占兵', '二衬台车未配备灭火器', 'fire', 'medium', '骆家岭隧道余杭侧右洞', 'TJ02', 'completed', NULL, NULL, '已整改', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/uploads/doc-1765847724994-969200583.jpg\"]', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/images/doc-1765847770498-919194571.jpg\"]', NULL, '2025-12-16 09:15:29', '2025-12-16 09:16:12', NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `reports` VALUES (38, 15, '占兵', '逃生管道设置不规范', 'other', 'medium', '骆家岭隧道余杭侧左洞', 'TJ02', 'completed', NULL, NULL, '已整改', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/uploads/doc-1765847849196-706684299.jpg\"]', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/images/doc-1765847897331-70149321.jpg\"]', NULL, '2025-12-16 09:17:42', '2025-12-16 09:18:18', NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `reports` VALUES (39, 15, '占兵', '仰拱栈桥限速牌缺失', 'other', 'medium', '骆家岭隧道余杭侧左洞', 'TJ02', 'completed', NULL, NULL, '已整改', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/uploads/doc-1765848026820-26126460.jpg\"]', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/images/doc-1765848128860-247893657.jpg\"]', NULL, '2025-12-16 09:20:31', '2025-12-16 09:22:10', NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `reports` VALUES (40, 15, '占兵', '气瓶无防倾倒措施', 'other', 'medium', '骆家岭隧道余杭侧左洞', 'TJ02', 'completed', NULL, NULL, '已整改', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/uploads/doc-1765848072023-444235927.jpg\"]', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/images/doc-1765848145264-908411001.jpg\"]', NULL, '2025-12-16 09:21:35', '2025-12-16 09:22:26', NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `reports` VALUES (41, 15, '占兵', '仰拱栈桥防护损坏未修复', 'edge', 'medium', '骆家岭隧道富阳侧右洞', 'TJ02', 'completed', NULL, NULL, '已整改', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/uploads/doc-1765951095506-358731613.jpg\"]', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/images/doc-1765951130348-236141358.jpg\"]', NULL, '2025-12-17 13:58:24', '2025-12-17 13:58:53', NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `reports` VALUES (42, 60, '逸飞', '隧道工区50仓施工区域上下通道设置不规范', 'other', 'medium', '隧道工区50仓', 'TJ01', 'completed', NULL, NULL, '隧道50仓施工区域已按照要求设置成品梯上下安全通道。', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/uploads/doc-1766045995371-709352287.jpg\"]', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/images/doc-1766046944998-201070385.jpg\"]', NULL, '2025-12-18 16:20:06', '2025-12-18 16:35:48', NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `reports` VALUES (43, 52, '张腾飞', '边坡坡脚处喷浆有裂缝', 'edge', 'medium', '隧道4仓与5仓交接处', 'TJ01', 'completed', NULL, NULL, '裂缝已处理，后期加强安全巡查', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/uploads/doc-1766645218629-625346999.jpg\"]', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/images/doc-1766716656244-843665567.jpg\"]', NULL, '2025-12-25 14:47:52', '2025-12-26 10:37:39', NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `reports` VALUES (44, 51, '111', '3仓中墙脚手架搭设顶部内侧临边防护不到位', 'edge', 'medium', '藏兵山隧道3仓', 'TJ01', 'completed', NULL, NULL, '已驳回，无须处理', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/uploads/doc-1766720417231-144833099.jpg\"]', NULL, NULL, '2025-12-26 11:40:28', '2025-12-26 11:42:52', NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `reports` VALUES (45, 6, '侯大脸', '1228', 'fire', 'medium', '测试-1228', 'TJ01', 'completed', NULL, NULL, '测试', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/uploads/doc-1766898759285-349060247.jpg\", \"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/uploads/doc-1766898766655-436300330.png\", \"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/uploads/doc-1766898770976-441562195.jpg\"]', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/images/doc-1766899048355-763094704.jpg\", \"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/images/doc-1766899048377-772000794.png\", \"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/images/doc-1766899048391-522400209.png\"]', NULL, '2025-12-28 13:13:13', '2025-12-28 13:17:29', NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `reports` VALUES (46, 65, '吴开均', '缆风绳夹设置不规范', 'other', 'medium', '左21号墩', 'TJ01', 'completed', NULL, NULL, '已按照规范要求设置好缆风绳夹。', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/uploads/doc-1767251097014-978415340.jpg\"]', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/images/doc-1767251921772-54096861.jpg\"]', NULL, '2026-01-01 15:05:15', '2026-01-01 15:18:46', NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `reports` VALUES (47, 64, '刘万东', '混凝土结构挤压安全通道梯笼', 'other', 'medium', '左17号墩', 'TJ01', 'completed', NULL, NULL, '已把混凝土结构移走。', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/uploads/doc-1767251416733-540935161.jpg\"]', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/images/doc-1767252272741-617141656.jpg\"]', NULL, '2026-01-01 15:10:34', '2026-01-01 15:24:36', NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `reports` VALUES (48, 64, '刘万东', '混凝土结构挤压安全通道梯笼', 'other', 'medium', '左17号墩', 'TJ01', 'completed', NULL, NULL, '已驳回，无须处理', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/uploads/doc-1767251416733-540935161.jpg\"]', NULL, NULL, '2026-01-01 15:10:46', '2026-01-01 15:15:41', NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `reports` VALUES (49, 64, '刘万东', '混凝土结构挤压安全通道梯笼', 'other', 'medium', '左17号墩', 'TJ01', 'completed', NULL, NULL, '已驳回，无须处理', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/uploads/doc-1767251416733-540935161.jpg\"]', NULL, NULL, '2026-01-01 15:11:00', '2026-01-01 15:16:20', NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `reports` VALUES (50, 47, '卢湘龙', '一名作业人员未戴安全帽', 'ppe', 'medium', '桥梁施工区', 'TJ01', 'completed', NULL, NULL, '现场已要求其佩戴安全帽，并口头批评教育。', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/uploads/doc-1767512158848-620212456.jpg\"]', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/images/doc-1767578541507-807382781.jpg\"]', NULL, '2026-01-04 15:36:25', '2026-01-05 10:02:24', NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `reports` VALUES (51, 6, '侯大脸', '测试', 'ppe', 'medium', '测试', 'TJ01', 'completed', NULL, NULL, NULL, '[]', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/images/doc-1768060171432-234338281.jpg\"]', NULL, '2026-01-10 21:42:38', '2026-01-11 00:01:20', '测试', 100.00, 6, 'OK', '2026-01-10 23:49:12', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/images/doc-1768060878940-310965055.jpg\"]', '2026-01-11 00:01:20');
INSERT INTO `reports` VALUES (52, 6, '侯大脸', '测试', 'fire', 'medium', '测试-01-11-1', 'TJ01', 'completed', NULL, NULL, NULL, '[]', NULL, NULL, '2026-01-11 11:18:13', '2026-01-11 11:18:24', '已驳回，无须处理', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO `reports` VALUES (53, 6, '侯大脸', '测试', 'electric', 'medium', '测试-01-11-02', 'TJ01', 'supervisor_confirmed', NULL, NULL, NULL, '[]', NULL, NULL, '2026-01-11 11:20:11', '2026-01-11 12:01:43', '好的', 200.00, 6, '', '2026-01-11 12:01:43', NULL, NULL);
INSERT INTO `reports` VALUES (54, 6, '侯大脸', '测试测试测试', 'electric', 'medium', '测试-01-11-03', 'TJ01', 'completed', NULL, NULL, NULL, '[]', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/images/doc-1768106879200-372397090.jpg\", \"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/images/doc-1768106879210-478685551.png\"]', NULL, '2026-01-11 12:02:51', '2026-01-11 13:00:32', '没问题了', 10000.00, 6, 'OK', '2026-01-11 12:44:43', '[\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/images/doc-1768107631524-915167951.png\"]', '2026-01-11 13:00:32');

-- ----------------------------
-- Table structure for safety_articles
-- ----------------------------
DROP TABLE IF EXISTS `safety_articles`;
CREATE TABLE `safety_articles`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` int(11) NOT NULL,
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `uploaded_by` int(11) NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `attachments` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '附件信息，JSON格式存储文件路径和文件名',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_category_id`(`category_id`) USING BTREE,
  INDEX `idx_uploaded_by`(`uploaded_by`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of safety_articles
-- ----------------------------
INSERT INTO `safety_articles` VALUES (2, 2, '用电安全操作规程', '1. 湿手不接触电器，防止触电事故。\n2. 定期检查电缆线路，发现破损立即更换。\n3. 使用合格的电气设备，不使用三无产品。\n4. 电气设备要有良好的接地保护。', NULL, '2025-11-05 11:43:21', '2025-11-05 11:43:21', NULL);
INSERT INTO `safety_articles` VALUES (3, 1, '安全知识', '1111', NULL, '2025-11-05 11:43:21', '2025-11-10 16:26:47', NULL);
INSERT INTO `safety_articles` VALUES (4, 2, '用电安全提示', '用电安全：禁止私拉乱接电线，发现漏电立即断电。', NULL, '2025-11-05 11:43:21', '2025-11-05 11:43:21', NULL);
INSERT INTO `safety_articles` VALUES (5, 5, '安全知识', '机械安全：操作设备前检查防护装置，严禁违章操作。', NULL, '2025-11-05 11:43:21', '2025-11-10 16:14:07', NULL);
INSERT INTO `safety_articles` VALUES (7, 6, '安全知识', '1. 火灾预防：定期检查电气线路，不超负荷用电，易燃物品远离火源。\n2. 灭火器使用：拔掉保险销，对准火源根部，按下压把进行灭火。\n3. 疏散逃生：熟悉安全出口位置，低姿势沿墙壁逃生，不乘坐电梯。', NULL, '2025-11-08 11:47:45', '2025-12-15 08:43:47', '[{\"name\":\"JT+T+1499—2024公路水运工程临时用电技术规程.pdf\",\"path\":\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/documents/doc-1763383936746-218453239.pdf\",\"size\":2011455,\"type\":\"pdf\"},{\"name\":\"中华人民共和国安全生产法_1748413692547.pdf\",\"path\":\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/documents/doc-1763383936167-688698193.pdf\",\"size\":414683,\"type\":\"pdf\"},{\"name\":\"公路水运工程施工安全标准化技术要求JTT1514-2024.pdf\",\"path\":\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/documents/doc-1763383936706-715096667.pdf\",\"size\":1523244,\"type\":\"pdf\"},{\"name\":\"建筑与市政工程施工现场临时用电安全技术标准.pdf\",\"path\":\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/documents/doc-1765759418347-610353236.pdf\",\"size\":7211727,\"type\":\"pdf\"}]');
INSERT INTO `safety_articles` VALUES (8, 8, '安全知识', '各级主管部门下发的相关安全管理的制度文件', 12, '2025-11-11 08:30:23', '2025-11-17 20:51:52', '[{\"name\":\"省交通工程管理中心关于印发《浙江省交通建设工程安全生产治本攻坚三年行动实施方案（2024-2026年）》的通知.pdf\",\"path\":\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/documents/doc-1763383831189-456992619.pdf\",\"size\":388356,\"type\":\"pdf\"},{\"name\":\"关于印发《杭州市交通建设工程安全生产治本攻坚三年行动方案（2024-2026年）》的通知.pdf\",\"path\":\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/documents/doc-1763383830384-265947085.pdf\",\"size\":58527,\"type\":\"pdf\"},{\"name\":\"杭安委关于印发杭州市安全生产治本攻坚三年行动实施方案（2024—2026年）的通知.pdf\",\"path\":\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/documents/doc-1763383831083-538213612.pdf\",\"size\":564535,\"type\":\"pdf\"},{\"name\":\"厅便签77号-省交通运输厅关于加快推进全省交通建设工程视频监控系统安装工作的通知.pdf\",\"path\":\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/documents/doc-1763383849905-162501522.pdf\",\"size\":362370,\"type\":\"pdf\"},{\"name\":\"杭州市交通建设工程施工现场作业人员安全生产“应知应会”三问实施方案(试行).pdf\",\"path\":\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/documents/doc-1763383850429-853507981.pdf\",\"size\":973038,\"type\":\"pdf\"},{\"name\":\"(归档)省交通工程管理中心关于深刻汲取事故教训切实做好我省交通建设工程中秋国庆假期和第四季度安全生产工作的通知（2025.9）.pdf\",\"path\":\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/documents/doc-1763383849763-518415426.pdf\",\"size\":296473,\"type\":\"pdf\"},{\"name\":\"(归档)省交通工程管理中心关于印发《浙江省交通建设工程重要节假日和重点时段安全生产管控操作手册（第一版）》的通知（2025.9）.pdf\",\"path\":\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/documents/doc-1763383850213-345636242.pdf\",\"size\":347398,\"type\":\"pdf\"},{\"name\":\"(归档)省交通工程管理中心关于印发《浙江省交通建设工程施工驻地选址“十条”负面清单》的通知(4).pdf\",\"path\":\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/documents/doc-1763383887264-308209729.pdf\",\"size\":306009,\"type\":\"pdf\"},{\"name\":\"关于强化交通建设工程施工驻地防灾专项治理工作的通知.pdf\",\"path\":\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/documents/doc-1763383887281-739395778.pdf\",\"size\":285276,\"type\":\"pdf\"},{\"name\":\"(归档)省交通工程管理中心关于进一步加强全省交通建设工程高处作业安全生产管理的通知（浙交工管202428号）_1748413520553.pdf\",\"path\":\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/documents/doc-1763383886819-773268946.pdf\",\"size\":288919,\"type\":\"pdf\"},{\"name\":\"(归档)省交通工程管理中心关于组织开展全省交通建设工程专项施工方案编审、落实专项整治行动的通知.pdf\",\"path\":\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/documents/doc-1763383887306-11476770.pdf\",\"size\":319196,\"type\":\"pdf\"},{\"name\":\"浙交工管202514号--省交通工程管理中心关于印发关于加强交通建设工程钢管贝雷结构质量安全管理十条规定的通知(1)_1748413687129.pdf\",\"path\":\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/documents/doc-1763383887820-359550288.pdf\",\"size\":3106206,\"type\":\"pdf\"},{\"name\":\"(归档)省交通工程管理中心关于组织开展全省交通建设工程“两个一公里”专项整治行动的通知.pdf\",\"path\":\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/documents/doc-1763383887416-71155231.pdf\",\"size\":360342,\"type\":\"pdf\"},{\"name\":\"交办安监202528号--交通运输部办公厅关于印发公路水运工程生产安全重大事故隐患判定标准的通知.pdf\",\"path\":\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/documents/doc-1763383887813-909274285.pdf\",\"size\":5891934,\"type\":\"pdf\"},{\"name\":\"(归档)省交通工程管理中心关于印发《关于进一步强化交通建设工程建设单位质量安全首要责任落实的若干意见（试行）》的通知(1).pdf\",\"path\":\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/documents/doc-1763383886893-892441554.pdf\",\"size\":340416,\"type\":\"pdf\"},{\"name\":\"(归档)省交通工程管理中心关于印发《交通建设工程高处作业“八必须”清单》的通知.pdf\",\"path\":\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/documents/doc-1763383907000-361264462.pdf\",\"size\":324507,\"type\":\"pdf\"},{\"name\":\"(归档)省交通工程管理中心关于组织开展全省交通建设工程施工车辆和工程机械安全管理专项整治行动的通知.pdf\",\"path\":\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/documents/doc-1763383907189-124446761.pdf\",\"size\":566151,\"type\":\"pdf\"},{\"name\":\"(归档)省交通工程管理中心关于印发《浙江省交通建设工程安全生产治本攻坚三年行动实施方案（2024-2026年）》的通知.pdf\",\"path\":\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/documents/doc-1763383907629-326128944.pdf\",\"size\":388356,\"type\":\"pdf\"},{\"name\":\"(归档)省交通运输厅关于印发《浙江省交通建设工程风险分级管控和事故隐患排查治理管理办法（试行）》的通知.pdf\",\"path\":\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/documents/doc-1763383907004-714239648.pdf\",\"size\":307153,\"type\":\"pdf\"},{\"name\":\"浙交〔2023〕89 号--省交通运输厅关于印发《浙江省交通建设工程应对极端天气灾害“停工”工作指引》的通知.pdf\",\"path\":\"https://safe-1259052648.cos.ap-shanghai.myqcloud.com/documents/doc-1763383907029-99317904.pdf\",\"size\":267227,\"type\":\"pdf\"}]');

-- ----------------------------
-- Table structure for safety_categories
-- ----------------------------
DROP TABLE IF EXISTS `safety_categories`;
CREATE TABLE `safety_categories`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'active',
  `sort_order` int(11) NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `name`(`name`) USING BTREE,
  INDEX `idx_status`(`status`) USING BTREE,
  INDEX `idx_sort`(`sort_order`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 14 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of safety_categories
-- ----------------------------
INSERT INTO `safety_categories` VALUES (1, '消防安全', '消防安全相关知识', 'active', 1, '2025-11-05 11:43:21', '2025-11-06 09:29:34');
INSERT INTO `safety_categories` VALUES (2, '用电安全', '用电安全相关知识', 'active', 2, '2025-11-05 11:43:21', '2025-11-05 11:43:21');
INSERT INTO `safety_categories` VALUES (3, '临边防护', '临边防护相关知识', 'active', 3, '2025-11-05 11:43:21', '2025-11-05 11:43:21');
INSERT INTO `safety_categories` VALUES (4, '个人防护装备', '个人防护装备相关知识', 'active', 4, '2025-11-05 11:43:21', '2025-11-05 11:43:21');
INSERT INTO `safety_categories` VALUES (5, '机械设备管理', '机械设备安全相关知识', 'active', 5, '2025-11-05 11:43:21', '2025-11-10 16:14:07');
INSERT INTO `safety_categories` VALUES (6, '法律规范文件', '详情看附件', 'active', 0, '2025-11-06 09:32:54', '2025-11-13 17:09:13');
INSERT INTO `safety_categories` VALUES (8, '安全管理制度文件', '', 'active', 0, '2025-11-10 22:13:16', '2025-11-11 08:30:22');

-- ----------------------------
-- Table structure for safety_documents
-- ----------------------------
DROP TABLE IF EXISTS `safety_documents`;
CREATE TABLE `safety_documents`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` int(11) NULL DEFAULT 0,
  `file_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_url` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `uploaded_by` int(11) NULL DEFAULT NULL,
  `upload_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_uploaded_by`(`uploaded_by`) USING BTREE,
  CONSTRAINT `safety_documents_ibfk_1` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of safety_documents
-- ----------------------------

-- ----------------------------
-- Table structure for safety_knowledge
-- ----------------------------
DROP TABLE IF EXISTS `safety_knowledge`;
CREATE TABLE `safety_knowledge`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` enum('fire','electric','chemical','mechanical','other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'other',
  `file_type` enum('text','image','video','document') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'text',
  `file_url` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `uploaded_by` int(11) NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_category`(`category`) USING BTREE,
  INDEX `idx_uploaded_by`(`uploaded_by`) USING BTREE,
  CONSTRAINT `safety_knowledge_ibfk_1` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of safety_knowledge
-- ----------------------------

-- ----------------------------
-- Table structure for sections
-- ----------------------------
DROP TABLE IF EXISTS `sections`;
CREATE TABLE `sections`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `section_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '标段代码',
  `section_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '标段名称',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '标段描述',
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'active',
  `sort_order` int(11) NULL DEFAULT 0 COMMENT '排序顺序',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `section_code`(`section_code`) USING BTREE,
  INDEX `idx_section_code`(`section_code`) USING BTREE,
  INDEX `idx_status`(`status`) USING BTREE,
  INDEX `idx_sort_order`(`sort_order`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of sections
-- ----------------------------
INSERT INTO `sections` VALUES (1, 'TJ01', '第TJ01标段', '320国道余杭中泰段工程项目 - 第TJ01标段', 'active', 1, '2025-10-31 16:37:20', '2025-10-31 16:37:20');
INSERT INTO `sections` VALUES (2, 'TJ02', '第TJ02标段', '320国道余杭中泰段工程项目 - 第TJ02标段', 'active', 2, '2025-10-31 16:37:20', '2025-10-31 16:37:20');

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `openid` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nick_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '微信用户',
  `avatar_url` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `managed_sections` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `role` enum('employee','manager','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'employee',
  `status` enum('active','inactive','banned') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_verified` tinyint(1) NULL DEFAULT 0 COMMENT '是否已认证',
  `verification_status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'none' COMMENT '认证状态：none/pending/approved/rejected',
  `is_supervisor` tinyint(1) NULL DEFAULT 0 COMMENT '是否为监理用户，1=监理',
  `is_admin` tinyint(1) NULL DEFAULT 0 COMMENT '是否为管理员，1=可删除任何举报',
  `real_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '真实姓名',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `openid`(`openid`) USING BTREE,
  INDEX `idx_openid`(`openid`) USING BTREE,
  INDEX `idx_role`(`role`) USING BTREE,
  INDEX `idx_status`(`status`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 68 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES (1, 'admin_openid_placeholder', '系统管理员', NULL, '[\"TJ01\", \"TJ02\"]', 'admin', 'active', '2025-10-31 15:32:33', '2025-11-07 23:02:38', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (6, 'oy1sY0bORfHRrSJ3nLiBGdlVDqFg', '侯大脸', 'http://tmp/FKiQ9EnoOK8wae886725b24a65d674db37de4dae1ab0.jpeg', '[\"TJ01\", \"TJ02\"]', 'admin', 'active', '2025-10-31 15:55:30', '2026-01-21 20:50:43', 1, 'approved', 1, 1, '侯苏磊');
INSERT INTO `users` VALUES (8, 'oy1sY0dkYVK1CpUuuu8Ng6ELEhEI', '675455677', '/images/user.png', '[\"TJ01\", \"TJ02\"]', 'admin', 'active', '2025-11-03 21:27:10', '2026-01-11 10:42:31', 1, 'approved', 0, 0, NULL);
INSERT INTO `users` VALUES (9, 'oy1sY0ciG52SQ3mo6zbsCbc3VPug', 'wxid_psfphb1e8gi812', 'wxfile://tmp_cbefbe7610563d2bb47f7a4034879c0c354c9cb2de299cb4.png', NULL, 'employee', 'active', '2025-11-05 21:18:23', '2025-11-05 21:18:23', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (10, 'oy1sY0T5DTgwGL00NvQKgq7qPY6Y', 'wxid_yolqz19zer0d12', 'wxfile://tmp_594575fb79b494eaf8d7c5455b483b60303aff708d14d06d.png', NULL, 'employee', 'active', '2025-11-05 23:47:51', '2025-11-05 23:47:51', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (11, 'oy1sY0Wiri_UX-ERrVS6XAyupHBs', 'wxid_n76jcyjv8stq12', 'wxfile://tmp_99fd3aff6a0648c93a1833cbd763000ca6d747d00d8d3d81.png', NULL, 'employee', 'active', '2025-11-06 01:06:25', '2025-11-06 01:06:25', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (12, 'oy1sY0WR5xAcPPZZkm1RAnqLqbjA', '郭红里', '/images/user.png', '[\"TJ01\"]', 'admin', 'active', '2025-11-06 07:50:44', '2026-01-08 14:29:51', 1, 'approved', 0, 0, NULL);
INSERT INTO `users` VALUES (13, 'oy1sY0SxD_VaHt64PeZsQDdMrwAk', '陈日涛', '/images/user.png', '[\"TJ01\"]', 'admin', 'active', '2025-11-06 08:31:47', '2026-01-05 14:27:48', 1, 'approved', 0, 0, NULL);
INSERT INTO `users` VALUES (14, 'oy1sY0UR9ga024sV2Z9qkTWx8LZQ', '魏奇', '/images/user.png', '[\"TJ01\", \"TJ02\"]', 'employee', 'active', '2025-11-06 10:18:06', '2025-12-11 17:07:54', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (15, 'oy1sY0aKcgPUp_CV97bIVmkUIoHs', '占兵', '/images/user.png', '[\"TJ02\"]', 'admin', 'active', '2025-11-06 17:14:28', '2026-01-01 10:30:13', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (16, 'oy1sY0SmotLKKJBQDDTNPVapBaCc', 'ongY', '/images/user.png', NULL, 'admin', 'active', '2025-11-06 17:23:31', '2025-12-19 15:59:43', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (17, 'oy1sY0b1wuwuswy5r36GADplHKOE', 'wxid_ecwk44qq8w4x12', 'wxfile://tmp_faea0be554d6380a5dab4c61f088a554882a3df93d5f74da.png', NULL, 'employee', 'active', '2025-11-06 21:56:02', '2025-11-06 21:56:02', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (18, 'oy1sY0V_GUno1QXt01PifwQR4kiw', 'SuV', '/images/user.png', NULL, 'employee', 'active', '2025-11-10 09:01:51', '2025-12-15 14:26:17', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (19, 'oy1sY0V1fKqNc-k_oBbR2B2g4WcU', '大大', '/images/user.png', NULL, 'employee', 'active', '2025-11-10 15:39:02', '2025-11-10 15:39:02', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (20, 'oy1sY0VnSFjUb1KfsLVgVci94A5c', 'wxid_i2082q7xp5mf12', 'wxfile://tmp_093fd2f1c692de6196bf25178006dc02e92c85a4b85155f0.png', NULL, 'employee', 'active', '2025-11-10 22:19:33', '2025-11-10 22:19:33', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (21, 'oy1sY0eLB9I5MtBiZmIr2GtBXeoY', '乐', 'wxfile://tmp_54c3909c5ed3578bd103717e645cbbe5.jpg', '[\"TJ01\", \"TJ02\"]', 'employee', 'active', '2025-11-13 14:38:57', '2025-12-26 08:49:44', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (22, 'oy1sY0b11vC8Dt3AKW3PxsnBB_zc', '梁明文', 'wxfile://tmp_c2d29e736fa1334d0a337e42ac27f10d9cc5c59a16ab9b88459182a380c6d882.jpeg', NULL, 'employee', 'active', '2025-11-13 14:42:44', '2026-01-01 15:08:18', 1, 'approved', 0, 0, NULL);
INSERT INTO `users` VALUES (23, 'oy1sY0aBHUHteLEuzbgAFJwfMiwI', '蒙', 'wxfile://tmp_f9b8cb7934cf86c13dbbf0f9dd287db1b27692e8f512d3246d3655e3781734f8.jpeg', NULL, 'employee', 'active', '2025-11-14 14:16:52', '2025-11-14 14:16:52', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (24, 'oy1sY0RUTa3F9__8WPh1dFT9pAtE', '苏荣', '/images/user.png', NULL, 'employee', 'active', '2025-11-14 14:58:30', '2025-11-14 14:58:30', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (25, 'oy1sY0T8qdJxVdykSrhPWBzKqgDQ', 'wxid_969x2sn9g7zg12', 'wxfile://tmp_3443e932645b1dcf39fdb021a75d723bbb945b4b99284858.png', NULL, 'employee', 'active', '2025-11-14 15:46:03', '2025-11-14 15:46:03', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (26, 'oy1sY0RybJfm7zdEhS84WJi7_2H4', '余万波', '/images/user.png', NULL, 'employee', 'active', '2025-11-14 16:11:00', '2025-11-14 16:11:00', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (27, 'oy1sY0VMO_DKt7eRTbxyLviavpzk', '无语急', 'wxfile://tmp_4c40ae38c3e51f042049c0b65bcce61829f3553d201fc02a.jpg', NULL, 'employee', 'active', '2025-11-14 17:47:01', '2025-11-14 17:47:01', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (28, 'oy1sY0U8EWRXblmjJrQgKlQFBLcU', '张宁', '/images/user.png', NULL, 'employee', 'active', '2025-11-14 21:58:15', '2025-11-14 21:58:15', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (29, 'oy1sY0bCp5mx2Ec1LFNCXJADqTEU', '亏克利', 'wxfile://tmp_b061798251659e036b2bd8315192f55751ec3e4bef9ba7ad.jpg', NULL, 'employee', 'active', '2025-11-15 09:45:27', '2025-11-15 09:45:27', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (30, 'oy1sY0e4tVwGnGGe1bXGmzHptQq8', '小安', 'wxfile://tmp_a3210806616491bc02e3fdcc7d220aa6752681eab742573a.jpeg', NULL, 'employee', 'active', '2025-11-15 09:46:24', '2025-11-22 13:05:28', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (31, 'oy1sY0dOw270l0FWcby4eGmGhn_E', '陈鑫宇', '/images/user.png', NULL, 'employee', 'active', '2025-11-15 09:53:33', '2025-11-15 09:53:33', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (32, 'oy1sY0cDx0RYyz8qHm0ajsEYYu-4', '杜桥桥', 'wxfile://tmp_d24c76df89b544696d22c0aa4784dbcdecbca0d229fc7b86.jpeg', NULL, 'employee', 'active', '2025-11-15 10:01:02', '2025-11-15 10:01:02', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (33, 'oy1sY0RoYzpJRxYDvGsLkdBjgrcM', '464', 'wxfile://tmp_a0dbb782d586d1d8a5453c6fb52b4696ecd9df5f5f69a23f.png', NULL, 'employee', 'active', '2025-11-16 10:11:17', '2025-11-16 10:11:17', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (34, 'oy1sY0ZKm485e9ny5iJmkWu_XWDE', 'YFTL', '/images/user.png', NULL, 'employee', 'active', '2025-11-17 17:04:09', '2025-11-17 17:04:09', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (35, 'oy1sY0aBOmWcyKGIZK3XcjkludIE', '陈军锋', 'wxfile://tmp_39fbf53b81131d9c303a45f1122651f7fbade4da51a63da7.jpeg', NULL, 'employee', 'active', '2025-11-17 17:06:17', '2025-11-17 17:06:17', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (36, 'oy1sY0TLWSUlz8hSAtApcT6j7ZiE', '陈宗勇', 'wxfile://tmp_072205975f82b49ee05f556343eb244b089c9cb64e526285b6a91540f0f6f75a.jpeg', NULL, 'employee', 'active', '2025-11-17 17:22:27', '2025-11-17 17:22:27', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (37, 'oy1sY0VSmJJevM2retvMhPp8XMDA', '呦', 'wxfile://tmp_8857df8f210d7287c9165b7515d10153191ffb0ee51c7991fee29031585a7e69.jpeg', NULL, 'employee', 'active', '2025-11-17 17:24:19', '2025-11-17 17:24:19', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (38, 'oy1sY0Y8V7MxMNLxqhR8okHwahsE', '海纳百川', '/images/user.png', NULL, 'employee', 'active', '2025-11-17 17:27:27', '2025-11-17 17:27:27', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (39, 'oy1sY0SqMv6ObsHpxpiIQAf21HYo', '百味人生', 'wxfile://tmp_6180f3dae4efe5f731ba819039376e4f540c50fb5f8e4bb6f20e254f773aca6c.jpeg', NULL, 'employee', 'active', '2025-11-17 17:44:51', '2025-11-17 17:44:51', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (40, 'oy1sY0W4I5ypc-kB1PZaa_YXE0-o', '不慕古', 'wxfile://tmp_7cdb52bb516b45f08758b8fb7c3889825f151deb0d0a449445dd350f5561ffdc.jpeg', NULL, 'employee', 'active', '2025-11-18 08:05:01', '2025-11-18 08:05:01', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (41, 'oy1sY0TlSvmW2vh4X-2UHSC2Qjcw', '张甫', '/images/user.png', NULL, 'employee', 'active', '2025-11-18 08:39:14', '2025-12-06 14:54:03', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (42, 'oy1sY0RvTaCq1dLrX4uBFMjzJ4gc', '张志远', '/images/user.png', NULL, 'employee', 'active', '2025-11-18 08:49:16', '2025-11-18 08:49:16', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (43, 'oy1sY0fSyiavBxyh8vqYYqy_Gr6o', '唐虎13545698343', '/images/user.png', NULL, 'employee', 'active', '2025-11-18 09:12:49', '2025-11-18 09:12:49', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (44, 'oy1sY0Y2_xbN3x2xFBnzPRZdH4E8', '王晗', 'wxfile://tmp_bcd162ba54a05a65e635f33b65814b20211a7964b9f2ef74.jpg', NULL, 'employee', 'active', '2025-11-18 17:09:12', '2025-11-18 17:09:12', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (45, 'oy1sY0b5e9Yxhn1euYOBawV9K8mg', '画家', '/images/user.png', NULL, 'employee', 'active', '2025-11-20 15:12:43', '2025-11-20 15:12:43', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (46, 'oy1sY0drYvkIVFL_2XRkkHj2_2yw', '廖录斌', '/images/user.png', NULL, 'employee', 'active', '2025-11-20 17:33:31', '2025-11-20 17:33:31', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (47, 'oy1sY0e7ZXSFVlLzmDh-m0_K5EPY', '卢湘龙', 'wxfile://tmp_a5423da7097e5c1a6206078f0c097f33.jpg', NULL, 'employee', 'active', '2025-11-21 11:13:12', '2026-01-04 15:33:20', 1, 'approved', 0, 0, NULL);
INSERT INTO `users` VALUES (48, 'oy1sY0T1_VFDf_VH4MVdheP7dVgg', '操群', '/images/user.png', NULL, 'employee', 'active', '2025-11-21 15:44:03', '2025-11-21 15:44:03', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (49, 'oy1sY0UIIXI8MiSgBrCm9IJw4lGs', '哈喽', '/images/user.png', NULL, 'employee', 'active', '2025-11-24 08:04:45', '2025-11-24 08:04:45', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (50, 'oy1sY0ZPYftgFyBY5yPy7zCIE0vc', '马涛', '/images/user.png', NULL, 'employee', 'active', '2025-11-24 08:25:52', '2025-11-24 08:25:52', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (51, 'oy1sY0ZwJmFngPB7z79g6gWOvyKI', '111', '/images/user.png', NULL, 'employee', 'active', '2025-11-26 11:53:19', '2026-01-01 15:08:21', 1, 'approved', 0, 0, NULL);
INSERT INTO `users` VALUES (52, 'oy1sY0fG67baYGNCePPJtBqKgno8', '张腾飞', '/images/user.png', NULL, 'employee', 'active', '2025-12-04 16:03:14', '2025-12-25 14:45:53', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (53, 'oy1sY0cdfnlzb-ApUxnv362TnXzk', '王旭东', '/images/user.png', NULL, 'employee', 'active', '2025-12-05 15:22:10', '2025-12-05 15:22:10', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (54, 'oy1sY0Sk_qWmU4bYcet8LQ6XN5eg', '周同志的微信', 'wxfile://tmp_00038e7ed37ad20b3a56a30da76818a4a5c32c81e72048f72ea548fcb50c3d9e.jpeg', NULL, 'employee', 'active', '2025-12-06 08:57:15', '2025-12-06 08:57:15', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (55, 'oy1sY0dmf9PnFD1FXDvOGoGoGWpY', '李斌', '/images/user.png', NULL, 'employee', 'active', '2025-12-06 18:50:27', '2025-12-06 18:50:27', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (56, 'oy1sY0cUgHBmunSfVBooeFPtPZkA', '秋林', '/images/user.png', NULL, 'employee', 'active', '2025-12-10 16:46:03', '2025-12-10 16:46:03', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (57, 'oy1sY0Xn4F6yjuTNVPOeRIBCpRd4', '夜来香烧烤店', '/images/user.png', NULL, 'employee', 'active', '2025-12-15 10:19:07', '2025-12-15 10:19:07', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (58, 'oy1sY0RtRgjMDs-xXkjSu40SyQ1U', '关佳浪A++A', 'wxfile://temp/19b201410f6_67b.jpeg', NULL, 'employee', 'active', '2025-12-15 11:36:12', '2025-12-15 11:36:12', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (59, 'oy1sY0aLh-OFLcWD6vfu5b7QW7d4', '阿木', 'wxfile://temp/19b20181983_a67.jpeg', NULL, 'employee', 'active', '2025-12-15 11:40:11', '2025-12-15 11:40:11', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (60, 'oy1sY0TR9IoEE3T8T1ABUhHlbCSE', '逸飞', 'wxfile://tmp_e9679e6962a525ded2c319d306fae110f39cdcc47f6bb498d62e68ee36f720d0.jpeg', NULL, 'employee', 'active', '2025-12-16 14:38:42', '2025-12-16 14:38:42', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (61, 'oy1sY0Q_w75KSKOosNRGUXjX02ZM', '朱兆永', '/images/user.png', NULL, 'employee', 'active', '2025-12-26 08:47:27', '2025-12-26 08:47:27', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (62, 'oy1sY0dyzKMcAFE6LQPl4JBodJpU', '爱你一万年', 'wxfile://tmp_4d033f3b42041eb4570ea7dba3e71515.jpg', NULL, 'employee', 'active', '2025-12-29 14:18:32', '2025-12-29 14:18:32', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (63, 'oy1sY0Vsztb4an0MQN3SucR7gojc', '口', 'wxfile://tmp_0de5502490ebeea4bbdc31933ac938ba0ccbee9699b8fc78.jpg', NULL, 'employee', 'active', '2025-12-30 12:06:36', '2026-01-06 13:55:43', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (64, 'oy1sY0f6hYx3iFsqlxJqS9CZNOqs', '刘万东', '/images/user.png', NULL, 'employee', 'active', '2026-01-01 10:59:04', '2026-01-01 15:00:38', 1, 'approved', 0, 0, NULL);
INSERT INTO `users` VALUES (65, 'oy1sY0e5OLm-ctk5EoGuhtcWtBmw', '吴开均', 'wxfile://tmp_8df5a197f2388c6ab6d47c5135cd1be578c1a53b2da33755.jpg', NULL, 'employee', 'active', '2026-01-01 14:55:27', '2026-01-01 15:02:07', 1, 'approved', 0, 0, NULL);
INSERT INTO `users` VALUES (66, 'oy1sY0f_vARVIf7pRLJtJErhGLEY', '^O^', '/images/user.png', NULL, 'employee', 'active', '2026-01-01 16:21:42', '2026-01-01 16:21:42', 0, 'none', 0, 0, NULL);
INSERT INTO `users` VALUES (67, 'oy1sY0ZSuFAnjUtZVOQww6T919a8', '凌', 'wxfile://tmp_8460c655af9adb1d76e99c462453e5e3ccfe28a81d160bc0a519ef5b479136b9.jpeg', NULL, 'employee', 'active', '2026-01-06 13:46:15', '2026-01-06 13:46:15', 0, 'none', 0, 0, NULL);

SET FOREIGN_KEY_CHECKS = 1;

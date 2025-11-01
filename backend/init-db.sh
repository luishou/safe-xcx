#!/bin/bash

# 数据库初始化脚本
echo "开始初始化数据库..."

# 执行SQL文件
mysql -h 124.223.187.95 -u xcx -pJesR3dpE4wcGaBzd xcx < init.sql

if [ $? -eq 0 ]; then
    echo "数据库初始化成功！"
    echo "已创建表："
    echo "- users (用户表)"
    echo "- sections (标段管理表)"
    echo "- safety_knowledge (安全知识表)"
    echo "- safety_documents (安全文档表)"
    echo "- reports (举报记录表)"
    echo "- report_history (举报历史表)"
    echo ""
    echo "已插入初始数据："
    echo "- 2个标段 (TJ01, TJ02)"
    echo "- 1个管理员用户"
else
    echo "数据库初始化失败！"
    exit 1
fi
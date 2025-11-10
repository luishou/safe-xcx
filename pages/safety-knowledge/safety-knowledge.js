// pages/safety-knowledge/safety-knowledge.js
const app = getApp();

Page({
    data: {
        categories: [],
        expandedCategories: {}, // 记录哪些分类是展开状态
        expandedArticles: {} // 记录哪些文章是展开状态
    },

    onLoad() {
        this.loadCategories();
    },

    // 返回上一页
    goBack() {
        wx.navigateBack();
    },

    // 加载分类和文章
    loadCategories() {
        // 先加载分类列表
        wx.request({
            url: app.globalData.baseUrl + '/safety/categories',
            method: 'GET',
            header: this._authHeader(),
            success: (res) => {
                if (res.data && res.data.success) {
                    const categories = res.data.data || [];
                    // 为每个分类加载文章
                    this.loadArticlesForCategories(categories);
                } else {
                    wx.showToast({ title: '加载安全知识分类失败', icon: 'none' });
                }
            },
            fail: () => wx.showToast({ title: '网络错误', icon: 'none' })
        });
    },

    // 为每个分类加载文章
    loadArticlesForCategories(categories) {
        if (categories.length === 0) {
            this.setData({ categories: [] });
            return;
        }

        let completed = 0;
        const updatedCategories = categories.map(category => {
            return {
                ...category,
                articles: [], // 初始化文章列表
                loading: true
            };
        });

        this.setData({ categories: updatedCategories });

        // 为每个分类加载文章
        categories.forEach((category, index) => {
            wx.request({
                url: app.globalData.baseUrl + '/safety/articles',
                method: 'GET',
                data: { categoryId: category.id },
                header: this._authHeader(),
                success: (res) => {
                    if (res.data && res.data.success) {
                        const articles = res.data.data || [];
                        // 处理文章数据，确保附件字段正确解析
                        const processedArticles = articles.map(article => ({
                            ...article,
                            attachments: article.attachments || []
                        }));

                        // 更新对应分类的文章列表
                        const updatedCategories = [...this.data.categories];
                        updatedCategories[index] = {
                            ...updatedCategories[index],
                            articles: processedArticles,
                            loading: false
                        };
                        this.setData({ categories: updatedCategories });
                    } else {
                        // 加载失败时标记为未加载状态
                        const updatedCategories = [...this.data.categories];
                        updatedCategories[index] = {
                            ...updatedCategories[index],
                            loading: false
                        };
                        this.setData({ categories: updatedCategories });
                    }
                },
                fail: () => {
                    // 网络失败时标记为未加载状态
                    const updatedCategories = [...this.data.categories];
                    updatedCategories[index] = {
                        ...updatedCategories[index],
                        loading: false
                    };
                    this.setData({ categories: updatedCategories });
                },
                complete: () => {
                    completed++;
                    if (completed === categories.length) {
                        console.log('所有分类文章加载完成:', this.data.categories);
                    }
                }
            });
        });
    },

    // 切换分类展开/收起状态
    toggleCategory(e) {
        const categoryId = e.currentTarget.dataset.id;
        const expandedCategories = this.data.expandedCategories;

        // 如果已经展开，则收起；否则展开
        if (expandedCategories[categoryId]) {
            expandedCategories[categoryId] = false;
        } else {
            // 收起其他所有分类，只展开当前分类
            for (let id in expandedCategories) {
                expandedCategories[id] = false;
            }
            expandedCategories[categoryId] = true;
        }

        this.setData({
            expandedCategories: expandedCategories
        });
    },

    // 切换文章展开/收起状态
    toggleArticle(e) {
        const articleId = e.currentTarget.dataset.id;
        const categoryId = e.currentTarget.dataset.categoryId;

        // 使用分类ID和文章ID的组合作为唯一标识
        const uniqueId = `${categoryId}_${articleId}`;
        const expandedArticles = this.data.expandedArticles || {};

        // 如果已经展开，则收起；否则展开
        if (expandedArticles[uniqueId]) {
            expandedArticles[uniqueId] = false;
        } else {
            // 收起其他所有文章，只展开当前文章
            for (let id in expandedArticles) {
                expandedArticles[id] = false;
            }
            expandedArticles[uniqueId] = true;
        }

        this.setData({
            expandedArticles: expandedArticles
        });
    },

    // 预览附件
    previewAttachment(e) {
        const attachment = e.currentTarget.dataset.attachment;
        if (attachment && attachment.path) {
            wx.downloadFile({
                url: attachment.path,
                success: (res) => {
                    if (res.statusCode === 200) {
                        wx.openDocument({
                            filePath: res.tempFilePath,
                            success: () => {
                                console.log('打开文档成功');
                            },
                            fail: (err) => {
                                console.error('打开文档失败:', err);
                                wx.showToast({
                                    title: '无法打开此文件',
                                    icon: 'none'
                                });
                            }
                        });
                    }
                },
                fail: (err) => {
                    console.error('下载文件失败:', err);
                    wx.showToast({
                        title: '下载文件失败',
                        icon: 'none'
                    });
                }
            });
        }
    },

    // 获取文件图标
    getFileIcon(fileName) {
        if (!fileName) return '📎';
        const extension = fileName.split('.').pop().toLowerCase();
        if (extension === 'pdf') return '📄';
        if (extension === 'doc' || extension === 'docx') return '📝';
        return '📎';
    },

    // 格式化文件大小
    formatFileSize(bytes) {
        if (!bytes || bytes === 0) return '未知大小';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    _authHeader() {
        const token = app.globalData.token;
        return token ? { Authorization: `Bearer ${token}` } : {};
    }
});
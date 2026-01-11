// pages/safety-knowledge/safety-knowledge.js
const app = getApp();

Page({
    data: {
        categories: [],
        expandedCategories: {},
        expandedArticles: {}
    },

    onLoad() { this.loadCategories(); },
    goBack() { wx.navigateBack(); },

    loadCategories() {
        wx.request({
            url: app.globalData.baseUrl + '/safety/categories',
            method: 'GET',
            header: this._authHeader(),
            success: (res) => {
                if (res.data?.success) {
                    this.loadArticlesForCategories(res.data.data || []);
                } else {
                    wx.showToast({ title: '加载安全知识分类失败', icon: 'none' });
                }
            },
            fail: () => wx.showToast({ title: '网络错误', icon: 'none' })
        });
    },

    loadArticlesForCategories(categories) {
        if (categories.length === 0) {
            this.setData({ categories: [] });
            return;
        }

        const updatedCategories = categories.map(category => ({ ...category, articles: [], loading: true }));
        this.setData({ categories: updatedCategories });

        categories.forEach((category, index) => {
            wx.request({
                url: app.globalData.baseUrl + '/safety/articles',
                method: 'GET',
                data: { categoryId: category.id },
                header: this._authHeader(),
                success: (res) => {
                    const cats = [...this.data.categories];
                    if (res.data?.success) {
                        cats[index] = {
                            ...cats[index],
                            articles: (res.data.data || []).map(a => ({ ...a, attachments: a.attachments || [] })),
                            loading: false
                        };
                    } else {
                        cats[index] = { ...cats[index], loading: false };
                    }
                    this.setData({ categories: cats });
                },
                fail: () => {
                    const cats = [...this.data.categories];
                    cats[index] = { ...cats[index], loading: false };
                    this.setData({ categories: cats });
                }
            });
        });
    },

    toggleCategory(e) {
        const categoryId = e.currentTarget.dataset.id;
        const expandedCategories = this.data.expandedCategories;

        if (expandedCategories[categoryId]) {
            expandedCategories[categoryId] = false;
        } else {
            for (let id in expandedCategories) expandedCategories[id] = false;
            expandedCategories[categoryId] = true;
        }
        this.setData({ expandedCategories });
    },

    toggleArticle(e) {
        const articleId = e.currentTarget.dataset.id;
        const categoryId = e.currentTarget.dataset.categoryId;
        const uniqueId = `${categoryId}_${articleId}`;
        const expandedArticles = this.data.expandedArticles || {};

        if (expandedArticles[uniqueId]) {
            expandedArticles[uniqueId] = false;
        } else {
            for (let id in expandedArticles) expandedArticles[id] = false;
            expandedArticles[uniqueId] = true;
        }
        this.setData({ expandedArticles });
    },

    previewAttachment(e) {
        const attachment = e.currentTarget.dataset.attachment;
        if (attachment?.path) {
            wx.downloadFile({
                url: attachment.path,
                success: (res) => {
                    if (res.statusCode === 200) {
                        wx.openDocument({
                            filePath: res.tempFilePath,
                            fail: () => wx.showToast({ title: '无法打开此文件', icon: 'none' })
                        });
                    }
                },
                fail: () => wx.showToast({ title: '下载文件失败', icon: 'none' })
            });
        }
    },

    getFileIcon(fileName) {
        if (!fileName) return '📎';
        const ext = fileName.split('.').pop().toLowerCase();
        if (ext === 'pdf') return '📄';
        if (ext === 'doc' || ext === 'docx') return '📝';
        return '📎';
    },

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
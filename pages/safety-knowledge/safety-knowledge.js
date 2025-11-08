// pages/safety-knowledge/safety-knowledge.js
const app = getApp();

Page({
    data: {
        articles: [],
        expandedArticles: {} // 记录哪些文章是展开状态
    },

    onLoad() {
        this.loadArticles();
    },

    // 返回上一页
    goBack() {
        wx.navigateBack();
    },

    // 加载所有文章作为分类
    loadArticles() {
        wx.request({
            url: app.globalData.baseUrl + '/safety/articles-as-categories',
            method: 'GET',
            header: this._authHeader(),
            success: (res) => {
                if (res.data && res.data.success) {
                    this.setData({ articles: res.data.data || [] });
                } else {
                    wx.showToast({ title: '加载安全知识失败', icon: 'none' });
                }
            },
            fail: () => wx.showToast({ title: '网络错误', icon: 'none' })
        });
    },

    // 切换文章展开/收起状态
    toggleArticle(e) {
        const articleId = e.currentTarget.dataset.id;
        const expandedArticles = this.data.expandedArticles;

        // 如果已经展开，则收起；否则展开
        if (expandedArticles[articleId]) {
            expandedArticles[articleId] = false;
        } else {
            // 收起其他所有文章，只展开当前文章
            for (let id in expandedArticles) {
                expandedArticles[id] = false;
            }
            expandedArticles[articleId] = true;
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
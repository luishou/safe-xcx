// pages/safety-knowledge/safety-knowledge.js
const app = getApp();

Page({
    data: {
        categories: [],
        selectedCategoryId: '',
        selectedCategoryName: '',
        showContent: false,
        knowledgeList: []
    },

    onLoad() {
        this.loadCategories();
    },

    // 返回上一页
    goBack() {
        wx.navigateBack();
    },

    // 加载分类
    loadCategories() {
        wx.request({
            url: app.globalData.baseUrl + '/safety/categories',
            method: 'GET',
            header: this._authHeader(),
            success: (res) => {
                if (res.data && res.data.success) {
                    this.setData({ categories: res.data.data || [] });
                } else {
                    wx.showToast({ title: '加载分类失败', icon: 'none' });
                }
            },
            fail: () => wx.showToast({ title: '网络错误', icon: 'none' })
        });
    },

    // 显示分类内容
    showCategory(e) {
        const id = e.currentTarget.dataset.id;
        const name = e.currentTarget.dataset.name;
        this.setData({ selectedCategoryId: id, selectedCategoryName: name });
        this.loadArticles(id);
    },

    // 加载文章
    loadArticles(categoryId) {
        wx.request({
            url: app.globalData.baseUrl + '/safety/articles',
            method: 'GET',
            data: { categoryId },
            header: this._authHeader(),
            success: (res) => {
                if (res.data && res.data.success) {
                    this.setData({ knowledgeList: res.data.data || [], showContent: true });
                } else {
                    wx.showToast({ title: '加载内容失败', icon: 'none' });
                    this.setData({ knowledgeList: [], showContent: true });
                }
            },
            fail: () => {
                wx.showToast({ title: '网络错误', icon: 'none' });
                this.setData({ knowledgeList: [], showContent: true });
            }
        });
    },

    // 关闭分类内容
    closeCategory() {
        this.setData({
            selectedCategoryId: '',
            selectedCategoryName: '',
            knowledgeList: [],
            showContent: false
        });
    },

    _authHeader() {
        const token = app.globalData.token;
        return token ? { Authorization: `Bearer ${token}` } : {};
    }
});
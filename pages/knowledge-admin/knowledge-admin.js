const app = getApp();

Page({
  data: {
    categories: [],
    form: { name: '', description: '' }
  },

  onShow() {
    this.loadCategories();
  },

  goBack() { wx.navigateBack(); },

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

  onNameInput(e) { this.setData({ 'form.name': e.detail.value }); },
  onDescInput(e) { this.setData({ 'form.description': e.detail.value }); },

  createCategory() {
    const { name, description } = this.data.form;
    if (!name) { wx.showToast({ title: '请填写分类名称', icon: 'none' }); return; }
    wx.request({
      url: app.globalData.baseUrl + '/safety/categories',
      method: 'POST',
      header: { 'Content-Type': 'application/json', ...this._authHeader() },
      data: { name, description },
      success: (res) => {
        if (res.data && res.data.success) {
          wx.showToast({ title: '新增成功', icon: 'success' });
          this.setData({ form: { name: '', description: '' } });
          this.loadCategories();
        } else { wx.showToast({ title: '新增失败', icon: 'none' }); }
      },
      fail: () => wx.showToast({ title: '网络错误', icon: 'none' })
    });
  },

  editCategory(e) {
    const id = e.currentTarget.dataset.id;
    const current = this.data.categories.find(c => c.id === id);
    if (!current) return;
    // 跳转到文章管理页并开启编辑模式（可编辑分类+文章内容）
    wx.navigateTo({
      url: `/pages/knowledge-articles/knowledge-articles?categoryId=${id}&name=${encodeURIComponent(current.name)}&edit=1`
    });
  },

  deleteCategory(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '删除后该分类下文章也会被移除，是否继续？',
      success: (r) => {
        if (r.confirm) {
          wx.request({
            url: `${app.globalData.baseUrl}/safety/categories/${id}`,
            method: 'DELETE',
            header: this._authHeader(),
            success: (res) => {
              if (res.data && res.data.success) { wx.showToast({ title: '已删除', icon: 'success' }); this.loadCategories(); }
              else { wx.showToast({ title: '删除失败', icon: 'none' }); }
            },
            fail: () => wx.showToast({ title: '网络错误', icon: 'none' })
          });
        }
      }
    });
  },

  openArticles(e) {
    const id = e.currentTarget.dataset.id;
    const name = e.currentTarget.dataset.name;
    wx.navigateTo({ url: `/pages/knowledge-articles/knowledge-articles?categoryId=${id}&name=${encodeURIComponent(name)}` });
  },

  _authHeader() {
    const token = app.globalData.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
});
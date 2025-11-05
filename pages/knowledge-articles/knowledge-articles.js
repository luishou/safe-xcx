const app = getApp();

Page({
  data: {
    categoryId: '',
    categoryName: '',
    articles: [],
    form: { title: '', content: '' },
    editMode: false,
    category: { name: '', description: '' },
    knowledge: { id: '', content: '' }
  },

  onLoad(options) {
    const { categoryId, name, edit } = options || {};
    const editMode = !!edit;
    this.setData({ categoryId, categoryName: decodeURIComponent(name || ''), editMode });
    if (editMode) {
      this.loadCategoryDetail();
    }
  },

  onShow() { this.loadArticles(); },

  goBack() { wx.navigateBack(); },

  onTitleInput(e) { this.setData({ 'form.title': e.detail.value }); },
  onContentInput(e) { this.setData({ 'form.content': e.detail.value }); },
  onKnowledgeInput(e) { this.setData({ 'knowledge.content': e.detail.value }); },

  loadArticles() {
    const { categoryId } = this.data;
    if (!categoryId) return;
    wx.request({
      url: app.globalData.baseUrl + '/safety/articles',
      method: 'GET',
      data: { categoryId },
      header: this._authHeader(),
      success: (res) => {
        if (res.data && res.data.success) {
          const list = res.data.data || [];
          this.setData({ articles: list });
          // 取最新的一条作为“安全知识”内容
          const current = list && list.length ? list[0] : null;
          if (current) {
            this.setData({ knowledge: { id: current.id, content: current.content || '' } });
          } else {
            this.setData({ knowledge: { id: '', content: '' } });
          }
        } else { wx.showToast({ title: '加载失败', icon: 'none' }); }
      },
      fail: () => wx.showToast({ title: '网络错误', icon: 'none' })
    });
  },

  loadCategoryDetail() {
    const { categoryId } = this.data;
    if (!categoryId) return;
    wx.request({
      url: app.globalData.baseUrl + '/safety/categories',
      method: 'GET',
      header: this._authHeader(),
      success: (res) => {
        if (res.data && res.data.success) {
          const list = res.data.data || [];
          const current = list.find(c => String(c.id) === String(categoryId));
          if (current) {
            this.setData({ category: { name: current.name || '', description: current.description || '' } });
          }
        }
      }
    });
  },

  onCategoryNameInput(e) { this.setData({ 'category.name': e.detail.value }); },
  // 分类仅编辑名称

  updateCategory() {
    const { categoryId, category } = this.data;
    if (!categoryId) return;
    const name = (category.name || '').trim();
    if (!name) { wx.showToast({ title: '请填写分类名称', icon: 'none' }); return; }
    wx.request({
      url: `${app.globalData.baseUrl}/safety/categories/${categoryId}`,
      method: 'PUT',
      header: { 'Content-Type': 'application/json', ...this._authHeader() },
      data: { name },
      success: (res) => {
        if (res.data && res.data.success) {
          wx.showToast({ title: '分类已保存', icon: 'success' });
          this.setData({ categoryName: name });
        } else { wx.showToast({ title: '保存失败', icon: 'none' }); }
      },
      fail: () => wx.showToast({ title: '网络错误', icon: 'none' })
    });
  },

  saveKnowledge() {
    const { categoryId, knowledge } = this.data;
    if (!categoryId) return;
    const content = (knowledge.content || '').trim();
    if (!content) { wx.showToast({ title: '请填写安全知识内容', icon: 'none' }); return; }
    if (knowledge.id) {
      // 更新现有知识内容
      wx.request({
        url: `${app.globalData.baseUrl}/safety/articles/${knowledge.id}`,
        method: 'PUT',
        header: { 'Content-Type': 'application/json', ...this._authHeader() },
        data: { content, title: '安全知识' },
        success: (res) => {
          if (res.data && res.data.success) { wx.showToast({ title: '安全知识已保存', icon: 'success' }); this.loadArticles(); }
          else { wx.showToast({ title: '保存失败', icon: 'none' }); }
        },
        fail: () => wx.showToast({ title: '网络错误', icon: 'none' })
      });
    } else {
      // 创建新的知识内容
      wx.request({
        url: `${app.globalData.baseUrl}/safety/articles`,
        method: 'POST',
        header: { 'Content-Type': 'application/json', ...this._authHeader() },
        data: { categoryId, title: '安全知识', content },
        success: (res) => {
          if (res.data && res.data.success) { wx.showToast({ title: '安全知识已保存', icon: 'success' }); this.loadArticles(); }
          else { wx.showToast({ title: '保存失败', icon: 'none' }); }
        },
        fail: () => wx.showToast({ title: '网络错误', icon: 'none' })
      });
    }
  },

  createArticle() {
    const { title, content } = this.data.form;
    const { categoryId } = this.data;
    if (!title || !content) { wx.showToast({ title: '请填写标题与内容', icon: 'none' }); return; }
    wx.request({
      url: app.globalData.baseUrl + '/safety/articles',
      method: 'POST',
      header: { 'Content-Type': 'application/json', ...this._authHeader() },
      data: { categoryId, title, content },
      success: (res) => {
        if (res.data && res.data.success) {
          wx.showToast({ title: '新增成功', icon: 'success' });
          this.setData({ form: { title: '', content: '' } });
          this.loadArticles();
        } else { wx.showToast({ title: '新增失败', icon: 'none' }); }
      },
      fail: () => wx.showToast({ title: '网络错误', icon: 'none' })
    });
  },

  editArticle(e) {
    const id = e.currentTarget.dataset.id;
    const current = this.data.articles.find(a => a.id === id);
    if (!current) return;
    wx.showModal({
      title: '编辑文章',
      content: '是否将标题追加“（更新）”？实际编辑可拓展表单。',
      confirmText: '继续',
      success: (r) => {
        if (r.confirm) {
          wx.request({
            url: `${app.globalData.baseUrl}/safety/articles/${id}`,
            method: 'PUT',
            header: { 'Content-Type': 'application/json', ...this._authHeader() },
            data: { title: current.title + '（更新）' },
            success: (res) => {
              if (res.data && res.data.success) { wx.showToast({ title: '已更新', icon: 'success' }); this.loadArticles(); }
              else { wx.showToast({ title: '更新失败', icon: 'none' }); }
            },
            fail: () => wx.showToast({ title: '网络错误', icon: 'none' })
          });
        }
      }
    });
  },

  deleteArticle(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确认删除此文章？',
      success: (r) => {
        if (r.confirm) {
          wx.request({
            url: `${app.globalData.baseUrl}/safety/articles/${id}`,
            method: 'DELETE',
            header: this._authHeader(),
            success: (res) => {
              if (res.data && res.data.success) { wx.showToast({ title: '已删除', icon: 'success' }); this.loadArticles(); }
              else { wx.showToast({ title: '删除失败', icon: 'none' }); }
            },
            fail: () => wx.showToast({ title: '网络错误', icon: 'none' })
          });
        }
      }
    });
  },

  _authHeader() {
    const token = app.globalData.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  // 单次保存分类与安全知识
  saveAll() {
    const { categoryId, category, knowledge, categoryName } = this.data;
    if (!categoryId) return;
    const name = (category.name || '').trim();
    const content = (knowledge.content || '').trim();

    if (!name && !content) {
      wx.showToast({ title: '请填写分类或安全知识内容', icon: 'none' });
      return;
    }

    // 依次执行：更新分类（如需要） -> 更新/创建安全知识（如需要）
    const updateCategoryIfNeeded = () => new Promise((resolve) => {
      if (!name || name === categoryName) return resolve(true);
      wx.request({
        url: `${app.globalData.baseUrl}/safety/categories/${categoryId}`,
        method: 'PUT',
        header: { 'Content-Type': 'application/json', ...this._authHeader() },
        data: { name },
        success: (res) => {
          if (res.data && res.data.success) { this.setData({ categoryName: name }); resolve(true); }
          else { wx.showToast({ title: '分类保存失败', icon: 'none' }); resolve(false); }
        },
        fail: () => { wx.showToast({ title: '网络错误', icon: 'none' }); resolve(false); }
      });
    });

    const saveKnowledgeIfNeeded = () => new Promise((resolve) => {
      if (!content) return resolve(true);
      if (knowledge.id) {
        wx.request({
          url: `${app.globalData.baseUrl}/safety/articles/${knowledge.id}`,
          method: 'PUT',
          header: { 'Content-Type': 'application/json', ...this._authHeader() },
          data: { content, title: '安全知识' },
          success: (res) => {
            if (res.data && res.data.success) { resolve(true); }
            else { wx.showToast({ title: '安全知识保存失败', icon: 'none' }); resolve(false); }
          },
          fail: () => { wx.showToast({ title: '网络错误', icon: 'none' }); resolve(false); }
        });
      } else {
        wx.request({
          url: `${app.globalData.baseUrl}/safety/articles`,
          method: 'POST',
          header: { 'Content-Type': 'application/json', ...this._authHeader() },
          data: { categoryId, title: '安全知识', content },
          success: (res) => {
            if (res.data && res.data.success) { resolve(true); }
            else { wx.showToast({ title: '安全知识保存失败', icon: 'none' }); resolve(false); }
          },
          fail: () => { wx.showToast({ title: '网络错误', icon: 'none' }); resolve(false); }
        });
      }
    });

    updateCategoryIfNeeded()
      .then(() => saveKnowledgeIfNeeded())
      .then(() => { wx.showToast({ title: '已保存', icon: 'success' }); this.loadArticles(); })
      .catch(() => { wx.showToast({ title: '保存出错', icon: 'none' }); });
  }
});
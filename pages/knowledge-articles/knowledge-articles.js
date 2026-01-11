const app = getApp();

Page({
  data: {
    categoryId: '',
    categoryName: '',
    articles: [],
    form: { title: '', content: '' },
    editMode: false,
    category: { name: '', description: '' },
    knowledge: { id: '', content: '' },
    attachments: []
  },

  onLoad(options) {
    const { categoryId, name, edit } = options || {};
    this.setData({ categoryId, categoryName: decodeURIComponent(name || ''), editMode: !!edit });
    if (this.data.editMode) this.loadCategoryDetail();
  },

  onShow() { this.loadArticles(); },
  goBack() { wx.navigateBack(); },
  onTitleInput(e) { this.setData({ 'form.title': e.detail.value }); },
  onContentInput(e) { this.setData({ 'form.content': e.detail.value }); },
  onKnowledgeInput(e) { this.setData({ 'knowledge.content': e.detail.value }); },
  onCategoryNameInput(e) { this.setData({ 'category.name': e.detail.value }); },

  loadArticles() {
    const { categoryId } = this.data;
    if (!categoryId) return;
    wx.request({
      url: app.globalData.baseUrl + '/safety/articles',
      method: 'GET',
      data: { categoryId },
      header: this._authHeader(),
      success: (res) => {
        if (res.data?.success) {
          const list = res.data.data || [];
          this.setData({ articles: list });
          const current = list[0] || null;
          if (current) {
            this.setData({ knowledge: { id: current.id, content: current.content || '', attachments: current.attachments || [] } });
            this._loadExistingAttachments();
          } else {
            this.setData({ knowledge: { id: '', content: '', attachments: [] }, attachments: [] });
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
        if (res.data?.success) {
          const current = (res.data.data || []).find(c => String(c.id) === String(categoryId));
          if (current) this.setData({ category: { name: current.name || '', description: current.description || '' } });
        }
      }
    });
  },

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
        if (res.data?.success) { wx.showToast({ title: '分类已保存', icon: 'success' }); this.setData({ categoryName: name }); }
        else { wx.showToast({ title: '保存失败', icon: 'none' }); }
      },
      fail: () => wx.showToast({ title: '网络错误', icon: 'none' })
    });
  },

  saveKnowledge() {
    const { categoryId, knowledge } = this.data;
    if (!categoryId) return;
    const content = (knowledge.content || '').trim();
    if (!content) { wx.showToast({ title: '请填写安全知识内容', icon: 'none' }); return; }

    const url = knowledge.id
      ? `${app.globalData.baseUrl}/safety/articles/${knowledge.id}`
      : `${app.globalData.baseUrl}/safety/articles`;
    const method = knowledge.id ? 'PUT' : 'POST';
    const data = knowledge.id
      ? { content, title: '安全知识' }
      : { categoryId, title: '安全知识', content };

    wx.request({
      url, method,
      header: { 'Content-Type': 'application/json', ...this._authHeader() },
      data,
      success: (res) => {
        if (res.data?.success) { wx.showToast({ title: '安全知识已保存', icon: 'success' }); this.loadArticles(); }
        else { wx.showToast({ title: '保存失败', icon: 'none' }); }
      },
      fail: () => wx.showToast({ title: '网络错误', icon: 'none' })
    });
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
        if (res.data?.success) { wx.showToast({ title: '新增成功', icon: 'success' }); this.setData({ form: { title: '', content: '' } }); this.loadArticles(); }
        else { wx.showToast({ title: '新增失败', icon: 'none' }); }
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
      content: '是否将标题追加"（更新）"？',
      confirmText: '继续',
      success: (r) => {
        if (r.confirm) {
          wx.request({
            url: `${app.globalData.baseUrl}/safety/articles/${id}`,
            method: 'PUT',
            header: { 'Content-Type': 'application/json', ...this._authHeader() },
            data: { title: current.title + '（更新）' },
            success: (res) => {
              if (res.data?.success) { wx.showToast({ title: '已更新', icon: 'success' }); this.loadArticles(); }
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
              if (res.data?.success) { wx.showToast({ title: '已删除', icon: 'success' }); this.loadArticles(); }
              else { wx.showToast({ title: '删除失败', icon: 'none' }); }
            },
            fail: () => wx.showToast({ title: '网络错误', icon: 'none' })
          });
        }
      }
    });
  },

  saveAll() {
    const { categoryId, category, knowledge, categoryName } = this.data;
    if (!categoryId) return;
    const name = (category.name || '').trim();
    const content = (knowledge.content || '').trim();

    if (!name && !content) {
      wx.showToast({ title: '请填写分类或安全知识内容', icon: 'none' });
      return;
    }

    const updateCategoryIfNeeded = () => new Promise((resolve) => {
      if (!name || name === categoryName) return resolve(true);
      wx.request({
        url: `${app.globalData.baseUrl}/safety/categories/${categoryId}`,
        method: 'PUT',
        header: { 'Content-Type': 'application/json', ...this._authHeader() },
        data: { name },
        success: (res) => { if (res.data?.success) { this.setData({ categoryName: name }); resolve(true); } else resolve(false); },
        fail: () => resolve(false)
      });
    });

    const saveKnowledgeIfNeeded = () => new Promise((resolve) => {
      if (!content) return resolve(true);
      const attachments = this.data.attachments.length > 0 ? this.data.attachments : null;
      const url = knowledge.id ? `${app.globalData.baseUrl}/safety/articles/${knowledge.id}` : `${app.globalData.baseUrl}/safety/articles`;
      const method = knowledge.id ? 'PUT' : 'POST';
      const data = knowledge.id ? { content, title: '安全知识', attachments } : { categoryId, title: '安全知识', content, attachments };

      wx.request({
        url, method,
        header: { 'Content-Type': 'application/json', ...this._authHeader() },
        data,
        success: (res) => resolve(res.data?.success),
        fail: () => resolve(false)
      });
    });

    updateCategoryIfNeeded()
      .then(() => saveKnowledgeIfNeeded())
      .then(() => { wx.showToast({ title: '已保存', icon: 'success' }); this.loadArticles(); })
      .catch(() => wx.showToast({ title: '保存出错', icon: 'none' }));
  },

  uploadAttachment() {
    const allowedTypes = ['doc', 'docx', 'pdf'];
    const handleFiles = (files = []) => {
      if (!files.length) { wx.showToast({ title: '未选择文件', icon: 'none' }); return; }
      files.forEach(file => {
        const ext = (file.name || '').split('.').pop().toLowerCase();
        if (!allowedTypes.includes(ext)) { wx.showToast({ title: `不支持的类型：${ext}`, icon: 'none' }); return; }
        if (file.size && file.size > 10 * 1024 * 1024) { wx.showToast({ title: `${file.name} 超过10MB`, icon: 'none' }); return; }
        this.uploadFileToServer(file);
      });
    };

    if (wx.chooseFile) {
      wx.chooseFile({ count: 9, type: 'file', extension: allowedTypes, success(res) { handleFiles(res.tempFiles || []); }, fail() { wx.showToast({ title: '选择文件失败', icon: 'none' }); } });
    } else {
      wx.chooseMessageFile({ count: 9, type: 'file', extension: allowedTypes, success(res) { handleFiles(res.tempFiles || []); }, fail() { wx.showToast({ title: '选择文件失败', icon: 'none' }); } });
    }
  },

  uploadFileToServer(file) {
    wx.showLoading({ title: '上传中...' });
    wx.uploadFile({
      url: app.globalData.baseUrl + '/upload/document',
      filePath: file.path,
      name: 'file',
      header: { 'Authorization': 'Bearer ' + app.globalData.token },
      success: (res) => {
        wx.hideLoading();
        try {
          const data = JSON.parse(res.data);
          if (data.success) {
            const newAttachment = { name: file.name, path: data.filePath || data.data.url, size: file.size, type: this._getFileType(file.name) };
            this.setData({ attachments: [...this.data.attachments, newAttachment] });
            wx.showToast({ title: '上传成功', icon: 'success' });
          } else { wx.showToast({ title: data.message || '上传失败', icon: 'none' }); }
        } catch { wx.showToast({ title: '上传失败', icon: 'none' }); }
      },
      fail: () => { wx.hideLoading(); wx.showToast({ title: '网络错误', icon: 'none' }); }
    });
  },

  _getFileType(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (ext === 'doc' || ext === 'docx') return 'word';
    return 'unknown';
  },

  _formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  _loadExistingAttachments() {
    const { knowledge } = this.data;
    if (knowledge?.attachments && Array.isArray(knowledge.attachments)) {
      this.setData({
        attachments: knowledge.attachments.map(att => ({
          name: att.name || '未知文件',
          path: att.path || att.url,
          size: att.size || 0,
          type: this._getFileType(att.name || 'unknown')
        }))
      });
    }
  },

  removeAttachment(e) {
    const index = e.currentTarget.dataset.index;
    const attachment = this.data.attachments[index];
    wx.showModal({
      title: '确认删除',
      content: `确定要删除文件 "${attachment.name}" 吗？`,
      success: (res) => {
        if (res.confirm) {
          this._removeAttachmentFromList(index);
          this._saveAttachmentsToDatabase();
        }
      }
    });
  },

  _removeAttachmentFromList(index) {
    const attachments = [...this.data.attachments];
    attachments.splice(index, 1);
    this.setData({ attachments });
  },

  _saveAttachmentsToDatabase() {
    const { knowledge } = this.data;
    if (!knowledge.id) return;
    const attachments = this.data.attachments.length > 0 ? this.data.attachments : null;
    wx.request({
      url: `${app.globalData.baseUrl}/safety/articles/${knowledge.id}`,
      method: 'PUT',
      header: { 'Content-Type': 'application/json', ...this._authHeader() },
      data: { attachments },
      success: (res) => {
        if (res.data?.success) { wx.showToast({ title: '删除成功', icon: 'success' }); }
        else { wx.showToast({ title: '保存失败，请重试', icon: 'none' }); this.loadArticles(); }
      },
      fail: () => { wx.showToast({ title: '网络错误，请重试', icon: 'none' }); this.loadArticles(); }
    });
  },

  _authHeader() {
    const token = app.globalData.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
});
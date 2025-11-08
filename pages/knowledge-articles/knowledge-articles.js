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
    attachments: [] // 存储附件信息
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
          // 取最新的一条作为"安全知识"内容
          const current = list && list.length ? list[0] : null;
          if (current) {
            this.setData({
              knowledge: {
                id: current.id,
                content: current.content || '',
                attachments: current.attachments || []
              }
            });
            // 加载现有附件
            this._loadExistingAttachments();
          } else {
            this.setData({
              knowledge: { id: '', content: '', attachments: [] },
              attachments: []
            });
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

      // 准备附件数据
      const attachments = this.data.attachments.length > 0 ? this.data.attachments : null;

      if (knowledge.id) {
        wx.request({
          url: `${app.globalData.baseUrl}/safety/articles/${knowledge.id}`,
          method: 'PUT',
          header: { 'Content-Type': 'application/json', ...this._authHeader() },
          data: { content, title: '安全知识', attachments },
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
          data: { categoryId, title: '安全知识', content, attachments },
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
  },

  // 附件上传
  uploadAttachment() {
    const that = this;

    // 检查文件类型
    const allowedTypes = ['doc', 'docx', 'pdf'];

    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: allowedTypes,
      success(res) {
        const file = res.tempFiles[0];
        const fileName = file.name;
        const fileExtension = fileName.split('.').pop().toLowerCase();

        if (!allowedTypes.includes(fileExtension)) {
          wx.showToast({
            title: '只支持Word和PDF文件',
            icon: 'none'
          });
          return;
        }

        // 检查文件大小 (限制10MB)
        if (file.size > 10 * 1024 * 1024) {
          wx.showToast({
            title: '文件大小不能超过10MB',
            icon: 'none'
          });
          return;
        }

        that.uploadFileToServer(file);
      }
    });
  },

  // 上传文件到服务器
  uploadFileToServer(file) {
    wx.showLoading({
      title: '上传中...'
    });

    const app = getApp();
    const that = this;

    wx.uploadFile({
      url: app.globalData.baseUrl + '/upload/document',
      filePath: file.path,
      name: 'file',
      header: {
        'Authorization': 'Bearer ' + app.globalData.token
      },
      success(res) {
        wx.hideLoading();

        try {
          const data = JSON.parse(res.data);
          if (data.success) {
            // 添加到附件列表
            const newAttachment = {
              name: file.name,
              path: data.filePath || data.data.url,
              size: file.size,
              type: data.data.type || that._getFileType(file.name)
            };

            const attachments = [...that.data.attachments, newAttachment];
            that.setData({
              attachments: attachments
            });

            wx.showToast({
              title: '上传成功',
              icon: 'success'
            });
          } else {
            wx.showToast({
              title: data.message || '上传失败',
              icon: 'none'
            });
          }
        } catch (err) {
          wx.showToast({
            title: '上传失败',
            icon: 'none'
          });
        }
      },
      fail(err) {
        wx.hideLoading();
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
      }
    });
  },

  // 获取文件类型图标
  _getFileType(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    if (extension === 'pdf') return 'pdf';
    if (extension === 'doc' || extension === 'docx') return 'word';
    return 'unknown';
  },

  // 格式化文件大小
  _formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // 加载现有附件（编辑时）
  _loadExistingAttachments() {
    const { knowledge } = this.data;
    if (knowledge && knowledge.attachments && Array.isArray(knowledge.attachments)) {
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

  // 删除附件
  removeAttachment(e) {
    const index = e.currentTarget.dataset.index;
    const attachment = this.data.attachments[index];

    wx.showModal({
      title: '确认删除',
      content: `确定要删除文件 "${attachment.name}" 吗？`,
      success: (res) => {
        if (res.confirm) {
          // 从本地列表移除附件
          this._removeAttachmentFromList(index);
          // 立即保存更新后的附件列表到数据库
          this._saveAttachmentsToDatabase();
        }
      }
    });
  },

  // 从本地列表中移除附件
  _removeAttachmentFromList(index) {
    const attachments = [...this.data.attachments];
    attachments.splice(index, 1);
    this.setData({
      attachments: attachments
    });
  },

  // 保存附件列表到数据库
  _saveAttachmentsToDatabase() {
    const { knowledge } = this.data;
    const attachments = this.data.attachments.length > 0 ? this.data.attachments : null;

    if (!knowledge.id) {
      console.warn('知识ID不存在，无法保存附件');
      return;
    }

    wx.request({
      url: `${app.globalData.baseUrl}/safety/articles/${knowledge.id}`,
      method: 'PUT',
      header: {
        'Content-Type': 'application/json',
        ...this._authHeader()
      },
      data: {
        attachments: attachments
      },
      success: (res) => {
        if (res.data && res.data.success) {
          console.log('附件列表已保存到数据库');
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        } else {
          console.error('保存附件列表失败:', res.data.message);
          wx.showToast({
            title: '保存失败，请重试',
            icon: 'none'
          });
          // 保存失败时重新加载附件数据
          this.loadArticles();
        }
      },
      fail: () => {
        console.error('保存附件列表网络失败');
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
        // 网络失败时重新加载附件数据
        this.loadArticles();
      }
    });
  }
});
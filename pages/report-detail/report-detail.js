// pages/report-detail/report-detail.js
Page({
  data: {
    reportId: 0,
    currentStatus: 'submitted',
    statusText: '待处理',
    statusClass: 'status-pending',
    rectifiedImages: [],
    rewardImages: [],
    processingOpinion: '',
    rewardAmount: '',
    supervisorComment: '',
    report: null,
    loading: true,
    error: '',
    canOperate: false,
    userRole: '',
    canOperate: false,
    userRole: '',
    readonly: false,
    isPublicView: false,
    isSupervisor: false,
    isAdmin: false,
    showConfirmForm: false // 控制确认表单显示
  },

  onLoad(options) {
    const { id } = options;
    if (!id) {
      this.setData({ error: '缺少举报ID参数', loading: false });
      return;
    }

    const readonly = options.readonly === '1' || options.readonly === 'true';
    const fromTodo = options.fromTodo === '1'; // 是否从待办列表进入

    this.setData({ reportId: parseInt(id), readonly });

    const app = getApp();
    const currentUser = app.globalData.currentUser;

    // 获取当前标段代码（从报告详情中获取或使用默认值）
    const currentSectionCode = app.globalData.currentSection?.section_code;
    
    // 检查用户在当前标段的角色
    const sectionRoles = currentUser?.sectionRoles || [];
    const isSupervisor = sectionRoles.some(r => r.roleType === 'supervisor' && (!currentSectionCode || r.sectionCode === currentSectionCode));
    const isAdmin = sectionRoles.some(r => r.roleType === 'section_admin' && (!currentSectionCode || r.sectionCode === currentSectionCode));

    // 如果是从待办进入，直接启用操作权限
    if (fromTodo) {
      this.setData({
        isPublicView: false,
        canOperate: true,
        hasManagementAccess: true,
        userRole: currentUser?.role || 'employee',
        isSupervisor: isSupervisor,
        isAdmin: isAdmin,
        displayUserId: currentUser ? currentUser.id || 'authorized_user' : 'default_user'
      });
      this.loadReportDetail();
      return;
    }

    // 其他情况走原有的权限判断逻辑
    const isPublicViewParam = options.isPublicView === '1' || options.isPublicView === 'true';
    const hasManagementAccess = this.checkManagementAccess(currentUser);
    const isPublicView = isPublicViewParam !== undefined ? isPublicViewParam : !hasManagementAccess;

    const canOperate = !readonly && !isPublicView;
    this.setData({
      isPublicView,
      canOperate,
      hasManagementAccess,
      userRole: currentUser?.role || 'employee',
      isSupervisor: isSupervisor,
      isAdmin: isAdmin,
      displayUserId: currentUser ? currentUser.id || 'authorized_user' : 'default_user'
    });

    this.loadReportDetail();
  },

  checkManagementAccess(user) {
    if (!user) return false;
    // 使用新的权限系统：检查是否有管理标段
    if (user.managedSections && user.managedSections.length > 0) return true;
    // 检查标段角色
    if (user.sectionRoles && user.sectionRoles.some(r => r.roleType === 'section_admin')) return true;
    if (user.role === 'admin' || user.role === 'manager') return true;
    return false;
  },

  loadReportDetail() {
    const app = getApp();
    if (!app.globalData.token) {
      this.setData({ error: '请先登录', loading: false });
      return;
    }

    this.setData({ loading: true, error: '' });

    wx.request({
      url: app.globalData.baseUrl + '/report/' + this.data.reportId,
      method: 'GET',
      header: { 'Authorization': 'Bearer ' + app.globalData.token },
      success: (res) => {
        this.setData({ loading: false });
        if (res.data.success) {
          const report = res.data.data;
          const statusClass = this.getStatusClass(report.status);
          const currentUser = app.globalData.currentUser;

          this.setData({
            report: {
              ...report,
              hazard_type_cn: this.mapHazardType(report.hazard_type),
              severity_cn: this.mapSeverity(report.severity),
              status_cn: this.mapStatus(report.status)
            },
            currentStatus: report.status,
            statusText: this.mapStatus(report.status),
            statusClass,
            userRole: currentUser?.role || 'employee'
          });
        } else {
          this.setData({ error: res.data.message || '获取举报详情失败' });
        }
      },
      fail: () => {
        this.setData({ loading: false, error: '网络错误，请重试' });
      }
    });
  },

  getStatusClass(status) {
    const classMap = {
      'submitted': 'status-pending',
      'confirmed': 'status-confirming',
      'supervisor_confirmed': 'status-processing',
      'photo_uploaded': 'status-processing',
      'completed': 'status-completed'
    };
    return classMap[status] || 'status-pending';
  },

  goBack() { wx.navigateBack(); },

  mapHazardType(type) {
    const mapping = {
      'fire': '消防安全隐患', 'electric': '电气安全隐患', 'chemical': '化学品安全隐患',
      'mechanical': '机械设备安全隐患', 'height': '高空作业安全隐患', 'edge': '临边防护安全隐患',
      'environment': '环境安全隐患', 'ppe': '个人防护装备隐患', 'other': '其他安全隐患'
    };
    return mapping[type] || type;
  },

  mapSeverity(severity) {
    const mapping = { 'low': '一般', 'medium': '紧急', 'high': '非常紧急', 'critical': '极其紧急' };
    return mapping[severity] || severity;
  },

  mapStatus(status) {
    const mapping = {
      'submitted': '待处理',
      'confirmed': '待监理确认',
      'supervisor_confirmed': '待整改',
      'photo_uploaded': '待下发奖金',
      'completed': '已办结'
    };
    return mapping[status] || status;
  },

  viewImage(e) {
    const src = e.currentTarget.dataset.src;
    const list = e.currentTarget.dataset.list;
    const urls = Array.isArray(list) ? list : (typeof list === 'string' ? list.split(',') : [src]);
    wx.previewImage({ current: src, urls });
  },

  // 输入事件
  onOpinionInput(e) { this.setData({ processingOpinion: e.detail.value }); },
  onRewardInput(e) { this.setData({ rewardAmount: e.detail.value }); },
  onSupervisorCommentInput(e) { this.setData({ supervisorComment: e.detail.value }); },

  // 显示确认表单
  showConfirmDialog() {
    this.setData({ showConfirmForm: true });
  },

  // 取消确认
  cancelConfirm() {
    this.setData({ showConfirmForm: false });
  },

  // 安全部确认处理（填写意见+奖金）
  confirmReport() {
    if (!this.data.processingOpinion?.trim()) {
      wx.showToast({ title: '请填写处理意见', icon: 'none' });
      return;
    }
    const amountValue = this.data.rewardAmount;
    const amount = parseInt(amountValue, 10);

    if (isNaN(amount) || amount <= 0 || amount.toString() !== amountValue.toString().trim()) {
      wx.showToast({ title: '奖金金额必须为大于0的整数', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认处理',
      content: `处理意见：${this.data.processingOpinion}\n奖金：${amount}元`,
      success: (res) => {
        if (res.confirm) this.submitConfirm(amount);
      }
    });
  },

  submitConfirm(amount) {
    const app = getApp();
    wx.showLoading({ title: '提交中...' });
    wx.request({
      url: app.globalData.baseUrl + '/report/' + this.data.reportId + '/confirm',
      method: 'POST',
      header: { 'Authorization': 'Bearer ' + app.globalData.token, 'Content-Type': 'application/json' },
      data: { processing_opinion: this.data.processingOpinion, reward_amount: amount },
      success: (res) => {
        wx.hideLoading();
        if (res.data.success) {
          wx.showToast({ title: '等待审批', icon: 'success' });
          setTimeout(() => wx.navigateBack(), 1500);
        } else {
          wx.showToast({ title: res.data.message || '操作失败', icon: 'none' });
        }
      },
      fail: () => { wx.hideLoading(); wx.showToast({ title: '网络错误', icon: 'none' }); }
    });
  },

  // 安全部驳回
  rejectReport() {
    wx.showModal({
      title: '驳回办结',
      content: '确认要驳回此举报吗？驳回后将直接办结。',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) this.submitReject();
      }
    });
  },

  submitReject() {
    const app = getApp();
    wx.showLoading({ title: '处理中...' });
    wx.request({
      url: app.globalData.baseUrl + '/report/' + this.data.reportId + '/confirm',
      method: 'POST',
      header: { 'Authorization': 'Bearer ' + app.globalData.token, 'Content-Type': 'application/json' },
      data: { isRejected: true },
      success: (res) => {
        wx.hideLoading();
        if (res.data.success) {
          wx.showToast({ title: '已驳回', icon: 'success' });
          setTimeout(() => wx.navigateBack(), 1500);
        } else {
          wx.showToast({ title: res.data.message || '操作失败', icon: 'none' });
        }
      },
      fail: () => { wx.hideLoading(); wx.showToast({ title: '网络错误', icon: 'none' }); }
    });
  },

  // 监理确认
  supervisorConfirmReport() {
    if (!this.data.supervisorComment?.trim()) {
      wx.showToast({ title: '请填写监理意见', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '监理确认',
      content: `监理意见：${this.data.supervisorComment}\n\n确认此举报信息准确，同意进行整改？`,
      success: (res) => {
        if (res.confirm) this.submitSupervisorConfirm();
      }
    });
  },

  submitSupervisorConfirm() {
    const app = getApp();
    wx.showLoading({ title: '确认中...' });
    wx.request({
      url: app.globalData.baseUrl + '/report/' + this.data.reportId + '/supervisor-confirm',
      method: 'POST',
      header: { 'Authorization': 'Bearer ' + app.globalData.token, 'Content-Type': 'application/json' },
      data: { supervisor_comment: this.data.supervisorComment || '' },
      success: (res) => {
        wx.hideLoading();
        if (res.data.success) {
          wx.showToast({ title: '监理已确认', icon: 'success' });
          setTimeout(() => wx.navigateBack(), 1500);
        } else {
          wx.showToast({ title: res.data.message || '操作失败', icon: 'none' });
        }
      },
      fail: () => { wx.hideLoading(); wx.showToast({ title: '网络错误', icon: 'none' }); }
    });
  },

  // 监理驳回
  supervisorRejectReport() {
    if (!this.data.supervisorComment?.trim()) {
      wx.showToast({ title: '驳回时必须填写监理意见', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '驳回处理意见',
      content: `监理意见：${this.data.supervisorComment}\n\n确认驳回安全部的处理意见？驳回后将退回安全部重新处理。`,
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) this.submitSupervisorReject();
      }
    });
  },

  submitSupervisorReject() {
    const app = getApp();
    wx.showLoading({ title: '处理中...' });
    wx.request({
      url: app.globalData.baseUrl + '/report/' + this.data.reportId + '/supervisor-confirm',
      method: 'POST',
      header: { 'Authorization': 'Bearer ' + app.globalData.token, 'Content-Type': 'application/json' },
      data: { supervisor_comment: this.data.supervisorComment || '', isRejected: true },
      success: (res) => {
        wx.hideLoading();
        if (res.data.success) {
          wx.showToast({ title: '已驳回', icon: 'success' });
          setTimeout(() => wx.navigateBack(), 1500);
        } else {
          wx.showToast({ title: res.data.message || '操作失败', icon: 'none' });
        }
      },
      fail: () => { wx.hideLoading(); wx.showToast({ title: '网络错误', icon: 'none' }); }
    });
  },

  // 添加整改照片
  addRectifiedPhoto() {
    if (this.data.rectifiedImages.length >= 3) {
      wx.showToast({ title: '最多上传3张', icon: 'none' });
      return;
    }
    wx.chooseImage({
      count: 3 - this.data.rectifiedImages.length,
      sizeType: ['compressed'],
      sourceType: ['camera', 'album'],
      success: (res) => {
        this.setData({ rectifiedImages: [...this.data.rectifiedImages, ...res.tempFilePaths].slice(0, 3) });
      }
    });
  },

  removeRectifiedPhoto(e) {
    const index = e.currentTarget.dataset.index;
    const images = [...this.data.rectifiedImages];
    images.splice(index, 1);
    this.setData({ rectifiedImages: images });
  },

  // 上传处理照片
  uploadProcessPhotos() {
    if (this.data.rectifiedImages.length === 0) {
      wx.showToast({ title: '请上传处理照片', icon: 'none' });
      return;
    }
    wx.showModal({
      title: '上传处理照片',
      content: '确认上传整改后的照片？',
      success: (res) => { if (res.confirm) this.submitProcessPhotos(); }
    });
  },

  submitProcessPhotos() {
    const app = getApp();
    wx.showLoading({ title: '上传中...' });

    const uploadPromises = this.data.rectifiedImages.map(imagePath => {
      return new Promise((resolve, reject) => {
        wx.uploadFile({
          url: app.globalData.baseUrl + '/upload',
          filePath: imagePath,
          name: 'file',
          header: { 'Authorization': 'Bearer ' + app.globalData.token },
          success: (res) => {
            try {
              const data = JSON.parse(res.data);
              if (data.success) resolve(data.filePath);
              else reject(new Error(data.message));
            } catch (err) { reject(err); }
          },
          fail: reject
        });
      });
    });

    Promise.all(uploadPromises)
      .then(filePaths => {
        wx.request({
          url: app.globalData.baseUrl + '/report/' + this.data.reportId + '/upload-photos',
          method: 'POST',
          header: { 'Authorization': 'Bearer ' + app.globalData.token, 'Content-Type': 'application/json' },
          data: { rectified_images: filePaths },
          success: (res) => {
            wx.hideLoading();
            if (res.data.success) {
              wx.showToast({ title: '上传成功', icon: 'success' });
              setTimeout(() => wx.navigateBack(), 1500);
            } else {
              wx.showToast({ title: res.data.message || '上传失败', icon: 'none' });
            }
          },
          fail: () => { wx.hideLoading(); wx.showToast({ title: '网络错误', icon: 'none' }); }
        });
      })
      .catch(() => { wx.hideLoading(); wx.showToast({ title: '上传图片失败', icon: 'none' }); });
  },

  // 添加奖金截图
  addRewardPhoto() {
    if (this.data.rewardImages.length >= 3) {
      wx.showToast({ title: '最多上传3张', icon: 'none' });
      return;
    }
    wx.chooseImage({
      count: 3 - this.data.rewardImages.length,
      sizeType: ['compressed'],
      sourceType: ['camera', 'album'],
      success: (res) => {
        this.setData({ rewardImages: [...this.data.rewardImages, ...res.tempFilePaths].slice(0, 3) });
      }
    });
  },

  removeRewardPhoto(e) {
    const index = e.currentTarget.dataset.index;
    const images = [...this.data.rewardImages];
    images.splice(index, 1);
    this.setData({ rewardImages: images });
  },

  // 上传奖金发放截图
  uploadRewardProof() {
    if (this.data.rewardImages.length === 0) {
      wx.showToast({ title: '请上传奖金发放截图', icon: 'none' });
      return;
    }
    wx.showModal({
      title: '完成办结',
      content: '确认已发放奖金并完成办结？',
      success: (res) => { if (res.confirm) this.submitRewardProof(); }
    });
  },

  submitRewardProof() {
    const app = getApp();
    wx.showLoading({ title: '上传中...' });

    const uploadPromises = this.data.rewardImages.map(imagePath => {
      return new Promise((resolve, reject) => {
        wx.uploadFile({
          url: app.globalData.baseUrl + '/upload',
          filePath: imagePath,
          name: 'file',
          header: { 'Authorization': 'Bearer ' + app.globalData.token },
          success: (res) => {
            try {
              const data = JSON.parse(res.data);
              if (data.success) resolve(data.filePath);
              else reject(new Error(data.message));
            } catch (err) { reject(err); }
          },
          fail: reject
        });
      });
    });

    Promise.all(uploadPromises)
      .then(filePaths => {
        wx.request({
          url: app.globalData.baseUrl + '/report/' + this.data.reportId + '/upload-reward',
          method: 'POST',
          header: { 'Authorization': 'Bearer ' + app.globalData.token, 'Content-Type': 'application/json' },
          data: { reward_images: filePaths },
          success: (res) => {
            wx.hideLoading();
            if (res.data.success) {
              wx.showToast({ title: '办结成功', icon: 'success' });
              setTimeout(() => wx.navigateBack(), 1500);
            } else {
              wx.showToast({ title: res.data.message || '操作失败', icon: 'none' });
            }
          },
          fail: () => { wx.hideLoading(); wx.showToast({ title: '网络错误', icon: 'none' }); }
        });
      })
      .catch(() => { wx.hideLoading(); wx.showToast({ title: '上传图片失败', icon: 'none' }); });
  },

  // 删除举报（仅Admin）
  deleteReport() {
    wx.showModal({
      title: '删除举报',
      content: '确定要删除此举报记录吗？此操作不可恢复！',
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) this.submitDelete();
      }
    });
  },

  submitDelete() {
    const app = getApp();
    wx.showLoading({ title: '删除中...' });
    wx.request({
      url: app.globalData.baseUrl + '/report/' + this.data.reportId,
      method: 'DELETE',
      header: { 'Authorization': 'Bearer ' + app.globalData.token },
      success: (res) => {
        wx.hideLoading();
        if (res.data.success) {
          wx.showToast({ title: '删除成功', icon: 'success' });
          setTimeout(() => wx.navigateBack(), 1500);
        } else {
          wx.showToast({ title: res.data.message || '删除失败', icon: 'none' });
        }
      },
      fail: () => { wx.hideLoading(); wx.showToast({ title: '网络错误', icon: 'none' }); }
    });
  }
})
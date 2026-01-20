// pages/report/report.js
Page({
  data: {
    hazardOptions: [
      { key: 'fire', name: '消防隐患', icon: '🔥' },
      { key: 'electric', name: '用电隐患', icon: '⚡' },
      { key: 'mechanical', name: '设备隐患', icon: '⚙️' },
      { key: 'height', name: '高处作业', icon: '⚠️' },
      { key: 'edge', name: '临边防护', icon: '🧱' },
      { key: 'environment', name: '环境保护', icon: '🍃' },
      { key: 'ppe', name: '个人防护装备', icon: '👷' },
      { key: 'other', name: '其他隐患', icon: '…' }
    ],
    hazardSelectedKey: null,
    location: '',
    description: '',
    urgency: '',
    photos: [],
    contact: '',
    anonymous: false,
    isVerified: false,
    canSubmit: false
  },

  onLoad(options) {
    const app = getApp();
    const currentUser = app.globalData.currentUser || {};
    const isVerified = (currentUser.is_verified === 1 || currentUser.is_verified === true) || app.globalData.isVerified || false;
    this.setData({
      currentUser,
      currentSection: app.globalData.currentSection,
      isVerified
    });
  },

  goBack() { wx.navigateBack(); },

  selectHazardType(e) {
    this.setData({ hazardSelectedKey: e.currentTarget.dataset.key });
    this.checkCanSubmit();
  },

  onLocationInput(e) {
    this.setData({ location: e.detail.value });
    this.checkCanSubmit();
  },

  onDescriptionInput(e) {
    this.setData({ description: e.detail.value });
    this.checkCanSubmit();
  },

  selectUrgency(e) {
    this.setData({ urgency: e.currentTarget.dataset.urgency });
    this.checkCanSubmit();
  },

  chooseImage() {
    if (this.data.photos.length >= 3) {
      wx.showToast({ title: '最多上传3张照片', icon: 'none' });
      return;
    }

    const that = this;
    wx.chooseImage({
      count: 3 - this.data.photos.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        const FIVE_MB = 5 * 1024 * 1024;
        const compressPromises = res.tempFilePaths.map((path, index) => {
          return new Promise((resolve) => {
            const file = res.tempFiles?.[index];
            if (file && file.size > FIVE_MB) {
              wx.compressImage({
                src: path,
                quality: 60,
                success: (cmp) => resolve(cmp.tempFilePath),
                fail: () => resolve(path)
              });
            } else {
              resolve(path);
            }
          });
        });
        Promise.all(compressPromises).then(compressedPaths => that.uploadImages(compressedPaths));
      }
    });
  },

  uploadImages(tempFilePaths) {
    const app = getApp();
    if (!app.globalData.token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '上传图片中...' });
    const limitedPaths = (tempFilePaths || []).slice(0, 3);

    const uploadPromises = limitedPaths.map(tempFilePath => {
      return new Promise((resolve, reject) => {
        wx.uploadFile({
          url: app.globalData.baseUrl + '/upload/image',
          filePath: tempFilePath,
          name: 'image',
          header: { 'Authorization': 'Bearer ' + app.globalData.token },
          timeout: 30000,
          success: (res) => {
            if (res.statusCode !== 200) {
              let msg = '上传失败';
              try { msg = JSON.parse(res.data || '{}').message || msg; } catch { }
              if (res.statusCode === 401 || res.statusCode === 403) msg = '登录已过期，请重新登录';
              if (res.statusCode === 413) msg = '图片过大（>5MB），请压缩后重试';
              reject(new Error(msg));
              return;
            }
            try {
              const data = JSON.parse(res.data);
              if (data.success) resolve(data.data.url);
              else reject(new Error(data.message || '上传失败'));
            } catch (err) { reject(err); }
          },
          fail: (err) => reject(new Error(err?.errMsg ? '上传失败：' + err.errMsg : '上传失败，请稍后重试'))
        });
      });
    });

    Promise.all(uploadPromises)
      .then(imageUrls => {
        wx.hideLoading();
        const photos = this.data.photos.concat(imageUrls).slice(0, 3);
        this.setData({ photos });
        wx.showToast({ title: '图片上传成功', icon: 'success' });
      })
      .catch(err => {
        wx.hideLoading();
        wx.showToast({ title: err.message || '图片上传失败', icon: 'none' });
      });
  },

  previewImage(e) {
    const index = e.currentTarget.dataset.index;
    wx.previewImage({ current: this.data.photos[index], urls: this.data.photos });
  },

  deletePhoto(e) {
    const index = e.currentTarget.dataset.index;
    const photos = this.data.photos;
    photos.splice(index, 1);
    this.setData({ photos });
  },

  onContactInput(e) { this.setData({ contact: e.detail.value }); },
  toggleAnonymous() { this.setData({ anonymous: !this.data.anonymous }); },

  checkCanSubmit() {
    const { hazardSelectedKey, location, description, urgency } = this.data;
    const canSubmit = !!hazardSelectedKey && location.trim() !== '' && description.trim() !== '' && urgency !== '';
    this.setData({ canSubmit });
  },

  submitReport() {
    if (!this.data.canSubmit) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '提交中...' });
    const app = getApp();

    if (!app.globalData.token) {
      wx.hideLoading();
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    const userVerified = app.globalData.currentUser?.is_verified === 1 || app.globalData.currentUser?.is_verified === true;
    if (!userVerified) {
      wx.hideLoading();
      wx.showModal({
        title: '需要认证',
        content: '您尚未认证，请联系标段负责人在后台完成认证后再提交举报。',
        showCancel: false,
        confirmText: '知道了'
      });
      return;
    }

    const reportData = {
      description: this.data.description,
      hazardType: this.mapHazardType(this.data.hazardSelectedKey),
      severity: this.mapUrgency(this.data.urgency),
      location: this.data.location,
      section: this.data.currentSection?.section_code || 'TJ01',
      initialImages: this.data.photos,
      contact: this.data.anonymous ? '' : this.data.contact,
      anonymous: this.data.anonymous
    };

    wx.request({
      url: app.globalData.baseUrl + '/report/submit',
      method: 'POST',
      header: { 'Authorization': 'Bearer ' + app.globalData.token, 'Content-Type': 'application/json' },
      data: reportData,
      success: (res) => {
        wx.hideLoading();
        if (res.data.success) {
          wx.showModal({
            title: '举报成功',
            content: '您的举报已提交成功，我们会尽快处理。感谢您对安全工作的支持！',
            showCancel: false,
            confirmText: '确定',
            success: () => wx.navigateBack()
          });
        } else {
          wx.showToast({ title: res.data.message || '提交失败', icon: 'none', duration: 2000 });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '网络错误，请重试', icon: 'none', duration: 2000 });
      }
    });
  },

  mapHazardType(type) {
    const allowed = ['fire', 'electric', 'mechanical', 'height', 'edge', 'environment', 'ppe', 'other'];
    return allowed.includes(type) ? type : 'other';
  },

  mapUrgency(urgency) {
    const mapping = { '一般': 'low', '紧急': 'medium', '非常紧急': 'high', '极其紧急': 'critical' };
    return mapping[urgency] || 'medium';
  }
})
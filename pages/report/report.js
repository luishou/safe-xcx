// pages/report/report.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 隐患类型选项
    hazardTypes: [
      '高空作业安全隐患',
      '电气安全隐患',
      '机械设备安全隐患',
      '消防安全隐患',
      '化学品安全隐患',
      '交通安全隐患',
      '环境安全隐患',
      '其他安全隐患'
    ],
    hazardTypeIndex: null,
    
    // 表单数据
    location: '',
    description: '',
    urgency: '',
    photos: [],
    contact: '',
    anonymous: false,
    
    // 计算属性
    canSubmit: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 获取全局数据
    const app = getApp();
    this.setData({
      currentUser: app.globalData.currentUser,
      currentSection: app.globalData.currentSection
    });
  },

  /**
   * 返回上一页
   */
  goBack() {
    wx.navigateBack();
  },

  /**
   * 隐患类型选择
   */
  onHazardTypeChange(e) {
    this.setData({
      hazardTypeIndex: e.detail.value
    });
    this.checkCanSubmit();
  },

  /**
   * 隐患位置输入
   */
  onLocationInput(e) {
    this.setData({
      location: e.detail.value
    });
    this.checkCanSubmit();
  },

  /**
   * 隐患描述输入
   */
  onDescriptionInput(e) {
    this.setData({
      description: e.detail.value
    });
    this.checkCanSubmit();
  },

  /**
   * 选择紧急程度
   */
  selectUrgency(e) {
    const urgency = e.currentTarget.dataset.urgency;
    this.setData({
      urgency: urgency
    });
    this.checkCanSubmit();
  },

  /**
   * 选择图片
   */
  chooseImage() {
    // 仅允许上传一张图片
    if (this.data.photos.length >= 1) {
      wx.showToast({
        title: '仅允许上传一张照片',
        icon: 'none'
      });
      return;
    }

    const that = this;
    wx.chooseImage({
      count: 1 - this.data.photos.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        console.log('选择图片成功:', res.tempFilePaths);
        // 只取第一张图片并在必要时进行压缩再上传
        const firstPath = res.tempFilePaths[0];
        const firstFile = res.tempFiles && res.tempFiles[0];

        // 如果原始大小超过5MB，先压缩再上传
        const FIVE_MB = 5 * 1024 * 1024;
        if (firstFile && firstFile.size > FIVE_MB) {
          console.log('图片超过5MB，开始压缩');
          wx.compressImage({
            src: firstPath,
            quality: 60,
            success: (cmp) => {
              console.log('压缩成功，路径:', cmp.tempFilePath);
              that.uploadImages([cmp.tempFilePath]);
            },
            fail: (err) => {
              console.error('压缩失败:', err);
              // 压缩失败则尝试直接上传
              that.uploadImages([firstPath]);
            }
          });
        } else {
          // 直接上传
          that.uploadImages([firstPath]);
        }
      }
    });
  },

  // 上传图片到后端
  uploadImages(tempFilePaths) {
    const app = getApp();

    if (!app.globalData.token) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '上传图片中...'
    });

    // 仅上传第一张图片
    const limitedPaths = (tempFilePaths || []).slice(0, 1);

    const uploadPromises = limitedPaths.map(tempFilePath => {
      return new Promise((resolve, reject) => {
        wx.uploadFile({
          url: app.globalData.baseUrl + '/upload/image',
          filePath: tempFilePath,
          name: 'image',
          header: {
            'Authorization': 'Bearer ' + app.globalData.token
          },
          timeout: 30000,
          success: (res) => {
            // 先检查HTTP状态码
            const status = res.statusCode;
            if (status !== 200) {
              let msg = '上传失败';
              // 尝试解析返回体
              try {
                const payload = JSON.parse(res.data || '{}');
                msg = payload.message || msg;
              } catch (e) {
                // 保留默认
              }
              // 根据常见状态码提示更清晰信息
              if (status === 401 || status === 403) msg = '登录已过期，请重新登录';
              if (status === 413) msg = '图片过大（>5MB），请压缩后重试';
              console.error('图片上传失败，status:', status, 'message:', msg);
              reject(new Error(msg));
              return;
            }

            // 状态码200，解析业务返回
            try {
              const data = JSON.parse(res.data);
              if (data.success) {
                console.log('图片上传成功:', data.data);
                resolve(data.data.url);
              } else {
                console.error('图片上传失败:', data.message);
                reject(new Error(data.message || '上传失败'));
              }
            } catch (err) {
              console.error('解析上传响应失败:', err);
              reject(err);
            }
          },
          fail: (err) => {
            console.error('图片上传请求失败:', err);
            const msg = (err && err.errMsg) ? ('上传失败：' + err.errMsg) : '上传失败，请稍后重试';
            reject(new Error(msg));
          }
        });
      });
    });

    Promise.all(uploadPromises)
      .then(imageUrls => {
        wx.hideLoading();
        const photos = this.data.photos.concat(imageUrls);
        // 只保留第一张照片
        const limited = photos.slice(0, 1);
        this.setData({
          photos: limited
        });
        console.log('所有图片上传成功:', imageUrls);
        wx.showToast({
          title: '图片上传成功',
          icon: 'success'
        });
      })
      .catch(err => {
        wx.hideLoading();
        console.error('图片上传失败:', err);
        wx.showToast({
          title: err.message || '图片上传失败',
          icon: 'none'
        });
      });
  },

  /**
   * 预览图片
   */
  previewImage(e) {
    const index = e.currentTarget.dataset.index;
    wx.previewImage({
      current: this.data.photos[index],
      urls: this.data.photos
    });
  },

  /**
   * 删除图片
   */
  deletePhoto(e) {
    const index = e.currentTarget.dataset.index;
    const photos = this.data.photos;
    photos.splice(index, 1);
    this.setData({
      photos: photos
    });
  },

  /**
   * 联系方式输入
   */
  onContactInput(e) {
    this.setData({
      contact: e.detail.value
    });
  },

  /**
   * 切换匿名举报
   */
  toggleAnonymous() {
    this.setData({
      anonymous: !this.data.anonymous
    });
  },

  /**
   * 检查是否可以提交
   */
  checkCanSubmit() {
    const { hazardTypeIndex, location, description, urgency } = this.data;
    const canSubmit = hazardTypeIndex !== null && 
                     location.trim() !== '' && 
                     description.trim() !== '' && 
                     urgency !== '';
    this.setData({
      canSubmit: canSubmit
    });
  },

  /**
   * 提交举报
   */
  submitReport() {
    if (!this.data.canSubmit) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }

    // 显示加载提示
    wx.showLoading({
      title: '提交中...'
    });

    const app = getApp();

    // 检查是否已登录
    if (!app.globalData.token) {
      wx.hideLoading();
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    // 构建举报数据
    const reportData = {
      description: this.data.description,
      hazardType: this.mapHazardType(this.data.hazardTypes[this.data.hazardTypeIndex]),
      severity: this.mapUrgency(this.data.urgency),
      location: this.data.location,
      section: this.data.currentSection?.section_code || 'TJ01',
      initialImages: this.data.photos,
      contact: this.data.anonymous ? '' : this.data.contact,
      anonymous: this.data.anonymous
    };

    console.log('准备提交举报数据:', reportData);

    // 调用后端接口
    wx.request({
      url: app.globalData.baseUrl + '/report/submit',
      method: 'POST',
      header: {
        'Authorization': 'Bearer ' + app.globalData.token,
        'Content-Type': 'application/json'
      },
      data: reportData,
      success: (res) => {
        wx.hideLoading();
        console.log('举报提交响应:', res);

        if (res.data.success) {
          // 显示成功提示
          wx.showModal({
            title: '举报成功',
            content: '您的举报已提交成功，我们会尽快处理。感谢您对安全工作的支持！',
            showCancel: false,
            confirmText: '确定',
            success: () => {
              // 返回到上一页
              wx.navigateBack();
            }
          });
        } else {
          console.error('举报提交失败:', res.data);
          wx.showToast({
            title: res.data.message || '提交失败',
            icon: 'none',
            duration: 2000
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('举报提交请求失败:', err);
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  // 映射隐患类型
  mapHazardType(type) {
    const mapping = {
      '高空作业安全隐患': 'height',
      '电气安全隐患': 'electric',
      '机械设备安全隐患': 'mechanical',
      '消防安全隐患': 'fire',
      '化学品安全隐患': 'chemical',
      '交通安全隐患': 'traffic',
      '环境安全隐患': 'environment',
      '其他安全隐患': 'other'
    };
    return mapping[type] || 'other';
  },

  // 映射紧急程度
  mapUrgency(urgency) {
    const mapping = {
      '一般': 'low',
      '紧急': 'medium',
      '非常紧急': 'high',
      '极其紧急': 'critical'
    };
    return mapping[urgency] || 'medium';
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})
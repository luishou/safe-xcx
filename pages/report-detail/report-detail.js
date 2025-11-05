// pages/report-detail/report-detail.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    reportId: 0,
    currentStatus: 'pending',
    statusText: '待处理',
    statusClass: 'status-pending',
    rectifiedImages: [],
    report: null,
    loading: true,
    error: '',
    canOperate: false, // 是否可以操作
    userRole: '', // 用户角色
    readonly: false // 是否只读（来自个人中心）
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const { id } = options;

    if (!id) {
      this.setData({
        error: '缺少举报ID参数',
        loading: false
      });
      return;
    }

    // 解析只读参数（来自个人中心）
    const readonly = options.readonly === '1' || options.readonly === 'true';

    this.setData({
      reportId: parseInt(id),
      readonly: readonly
    });

    // 获取用户角色
    const app = getApp();
    let currentUser = app.globalData.currentUser;

    console.log('当前用户信息:', currentUser);

    // 如果没有授权用户信息，只显示默认用户ID信息，不设置currentUser
    if (!currentUser) {
      console.log('用户未授权，不设置用户角色');

      // 仅用于显示的默认用户信息，不实际设置到全局状态
      const displayUser = {
        id: 'default_user', // 默认用户ID
        name: '未授权用户',
        role: 'guest',
        department: '未授权'
      };

      // 用于显示用户ID信息
      this.setData({
        displayUserInfo: displayUser
      });
    }

    // 根据用户角色确定权限
    let canOperate = false;
    let displayRole = 'guest';

    if (currentUser && currentUser.role) {
      // 只有admin角色可以操作，且页面非只读
      canOperate = currentUser.role === 'admin' && !readonly;
      displayRole = currentUser.role;
    } else {
      // 未授权用户无法操作
      canOperate = false;
      displayRole = 'guest';
    }

    this.setData({
      canOperate: canOperate,
      userRole: displayRole,
      displayUserId: currentUser ? currentUser.id || 'authorized_user' : 'default_user'
    });

    console.log('页面初始化 - canOperate:', canOperate, 'userRole:', currentUser ? currentUser.role : 'none');

    // 加载举报详情
    this.loadReportDetail();
  },

  // 加载举报详情
  loadReportDetail() {
    const app = getApp();

    if (!app.globalData.token) {
      this.setData({
        error: '请先登录',
        loading: false
      });
      return;
    }

    this.setData({
      loading: true,
      error: ''
    });

    wx.request({
      url: app.globalData.baseUrl + '/report/' + this.data.reportId,
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + app.globalData.token
      },
      success: (res) => {
        this.setData({
          loading: false
        });

        if (res.data.success) {
          const report = res.data.data;
          console.log('获取举报详情成功:', report);

          // 设置状态信息
          let statusText = '待处理';
          let statusClass = 'status-pending';

          if (report.status === 'processing') {
            statusText = '处理中';
            statusClass = 'status-processing';
          } else if (report.status === 'completed') {
            statusText = '已办结';
            statusClass = 'status-completed';
          } else if (report.status === 'submitted') {
            statusText = '已提交';
            statusClass = 'status-submitted';
          }

          // 重新获取用户权限信息
          const app = getApp();
          const currentUser = app.globalData.currentUser;
          console.log('重新加载详情 - 当前用户信息:', currentUser);

          // 根据用户角色确定权限
          let canOperate = false;
          if (currentUser && currentUser.role) {
            // 只有admin角色可以操作，且页面非只读
            canOperate = currentUser.role === 'admin' && !this.data.readonly;
          }

          this.setData({
            report: {
              ...report,
              hazard_type_cn: this.mapHazardType(report.hazard_type),
              severity_cn: this.mapSeverity(report.severity),
              status_cn: this.mapStatus(report.status)
            },
            currentStatus: report.status,
            statusText: this.mapStatus(report.status),
            statusClass: statusClass,
            canOperate: canOperate,
            userRole: currentUser ? currentUser.role : 'employee'
          });

          console.log('重新加载详情 - canOperate:', canOperate, 'userRole:', currentUser ? currentUser.role : 'employee');

          console.log('举报详情 - 当前状态:', report.status);
          console.log('举报详情 - 是否显示待处理操作:', report.status === 'pending' || report.status === 'submitted');
          console.log('举报详情 - 是否显示处理中操作:', report.status === 'processing' || report.status === 'assigned');
        } else {
          console.error('获取举报详情失败:', res.data);
          this.setData({
            error: res.data.message || '获取举报详情失败'
          });
        }
      },
      fail: (err) => {
        console.error('获取举报详情请求失败:', err);
        this.setData({
          loading: false,
          error: '网络错误，请重试'
        });
      }
    });
  },

  goBack() {
    wx.navigateBack();
  },

  // 映射隐患类型为中文
  mapHazardType(type) {
    const mapping = {
      'fire': '消防安全隐患',
      'electric': '电气安全隐患',
      'chemical': '化学品安全隐患',
      'mechanical': '机械设备安全隐患',
      'height': '高空作业安全隐患',
      'traffic': '交通安全隐患',
      'environment': '环境安全隐患',
      'other': '其他安全隐患'
    };
    return mapping[type] || type;
  },

  // 映射紧急程度为中文
  mapSeverity(severity) {
    const mapping = {
      'low': '一般',
      'medium': '紧急',
      'high': '非常紧急',
      'critical': '极其紧急'
    };
    return mapping[severity] || severity;
  },

  // 映射状态为中文
  mapStatus(status) {
    const mapping = {
      'submitted': '已提交',
      'pending': '待处理',
      'assigned': '已分配',
      'processing': '处理中',
      'completed': '已办结',
      'rejected': '已驳回'
    };
    return mapping[status] || status;
  },

  // 查看大图
  viewImage(e) {
    const src = e.currentTarget.dataset.src;
    const list = e.currentTarget.dataset.list;
    const urls = Array.isArray(list) ? list : (typeof list === 'string' ? list.split(',') : [src]);
    wx.previewImage({
      current: src,
      urls: urls
    });
  },

  // 确认处理
  confirmReport() {
    wx.showModal({
      title: '确认处理',
      content: '确认要处理此举报吗？确认后将进入处理中状态，需要后续上传处理照片。',
      success: (res) => {
        if (res.confirm) {
          this.updateReportStatus('processing');

          // 延迟返回上一页，让状态更新完成
          setTimeout(() => {
            wx.navigateBack();
          }, 2500);
        }
      }
    });
  },

  // 驳回办结
  rejectReport() {
    wx.showModal({
      title: '驳回办结',
      content: '确认要将此举报直接办结吗？驳回后无需上传照片。',
      success: (res) => {
        if (res.confirm) {
          this.updateReportStatus('rejected');

          // 延迟返回上一页，让状态更新完成
          setTimeout(() => {
            wx.navigateBack();
          }, 2500);
        }
      }
    });
  },

  // 添加处理照片
  addPhoto() {
    if (this.data.rectifiedImages.length >= 3) {
      wx.showToast({
        title: '最多上传3张照片',
        icon: 'none'
      });
      return;
    }

    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera', 'album'],
      success: (res) => {
        const tempFilePaths = res.tempFilePaths;

        // 将临时文件路径添加到本地图片列表
        const newImages = [...this.data.rectifiedImages, ...tempFilePaths];
        this.setData({
          rectifiedImages: newImages
        });

        wx.showToast({
          title: '图片已选择',
          icon: 'success'
        });
      }
    });
  },

  // 删除照片
  removePhoto(e) {
    const index = e.currentTarget.dataset.index;
    const images = [...this.data.rectifiedImages];
    images.splice(index, 1);
    this.setData({
      rectifiedImages: images
    });
  },

  // 完成办结
  completeReport() {
    if (this.data.rectifiedImages.length === 0) {
      wx.showToast({
        title: '请上传处理照片',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '完成办结',
      content: '确认要完成此举报的处理吗？',
      success: (res) => {
        if (res.confirm) {
          // 提交处理数据
          this.submitCompletion();
        }
      }
    });
  },

  // 提交完成数据
  submitCompletion() {
    const app = getApp();

    if (!app.globalData.token) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    if (this.data.rectifiedImages.length === 0) {
      wx.showToast({
        title: '请上传处理照片',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '上传照片中...'
    });

    // 先上传所有图片到服务器
    const uploadPromises = this.data.rectifiedImages.map(imagePath => {
      return new Promise((resolve, reject) => {
        wx.uploadFile({
          url: app.globalData.baseUrl + '/upload',
          filePath: imagePath,
          name: 'file',
          header: {
            'Authorization': 'Bearer ' + app.globalData.token
          },
          success: (res) => {
            try {
              const data = JSON.parse(res.data);
              if (data.success) {
                resolve(data.filePath);
              } else {
                reject(new Error(data.message));
              }
            } catch (err) {
              reject(err);
            }
          },
          fail: reject
        });
      });
    });

    Promise.all(uploadPromises)
      .then(filePaths => {
        wx.showLoading({
          title: '提交处理中...'
        });

        // 所有图片上传成功，提交完成数据到后端
        wx.request({
          url: app.globalData.baseUrl + '/report/' + this.data.reportId + '/complete',
          method: 'POST',
          header: {
            'Authorization': 'Bearer ' + app.globalData.token,
            'Content-Type': 'application/json'
          },
          data: {
            rectified_images: filePaths
          },
          success: (res) => {
            wx.hideLoading();
            if (res.data.success) {
              wx.showToast({
                title: '处理完成',
                icon: 'success',
                duration: 2000
              });

              setTimeout(() => {
                wx.navigateBack();
              }, 2000);
            } else {
              wx.showToast({
                title: res.data.message || '提交失败',
                icon: 'none'
              });
            }
          },
          fail: (err) => {
            wx.hideLoading();
            console.error('提交完成数据失败:', err);
            wx.showToast({
              title: '网络错误',
              icon: 'none'
            });
          }
        });
      })
      .catch(err => {
        wx.hideLoading();
        console.error('上传图片失败:', err);
        wx.showToast({
          title: '上传图片失败',
          icon: 'none'
        });
      });
  },

  // 更新举报状态
  updateReportStatus(newStatus) {
    const app = getApp();

    if (!app.globalData.token) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '处理中...'
    });

    wx.request({
      url: app.globalData.baseUrl + '/report/' + this.data.reportId + '/status',
      method: 'PUT',
      header: {
        'Authorization': 'Bearer ' + app.globalData.token,
        'Content-Type': 'application/json'
      },
      data: {
        status: newStatus
      },
      success: (res) => {
        wx.hideLoading();
        if (res.data.success) {
          console.log('更新举报状态成功:', newStatus);
          wx.showToast({
            title: '操作成功',
            icon: 'success',
            duration: 2000
          });

          // 重新加载举报详情以更新状态
          setTimeout(() => {
            this.loadReportDetail();
          }, 1000);
        } else {
          console.error('更新举报状态失败:', res.data.message);
          wx.showToast({
            title: res.data.message || '操作失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('更新举报状态请求失败:', err);
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
      }
    });
  }
})
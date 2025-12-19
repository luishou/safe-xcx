// pages/employee-center/employee-center.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentUser: {},
    currentSection: null,
    reports: [], // 从后端获取的举报数据
    loading: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('个人中心onLoad - 页面参数:', options);
    this.loadUserInfo();
    this.loadCurrentSection(options);
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadUserInfo();
    this.loadCurrentSection();
  },

  // 加载当前选择的标段
  loadCurrentSection(options = {}) {
    const app = getApp();
    const currentSection = app.globalData.currentSection;

    console.log('个人中心 - 全局currentSection:', currentSection);
    console.log('个人中心 - 页面参数:', options);
    console.log('个人中心 - app.globalData:', app.globalData);

    if (currentSection) {
      this.setData({
        currentSection: currentSection
      });
      console.log('个人中心设置当前标段:', currentSection);
      // 加载当前标段的举报记录
      this.loadReports(currentSection.section_code);
    } else {
      console.log('个人中心 - 未选择标段，尝试从URL参数获取');
      // 尝试从页面参数获取标段信息
      console.log('从URL获取页面参数:', options);

      if (options && options.section) {
        const sectionCode = options.section;
        console.log('从URL获取标段代码:', sectionCode);

        // 从全局标段列表中查找对应标段
        const sections = app.globalData.sections;
        if (sections && sections.length > 0) {
          const foundSection = sections.find(s => s.section_code === sectionCode);
          if (foundSection) {
            this.setData({
              currentSection: foundSection
            });
            app.globalData.currentSection = foundSection;
            console.log('找到标段并设置:', foundSection);
            this.loadReports(sectionCode);
            return;
          }
        }
      }

      console.log('个人中心 - 确实未选择标段');
      this.setData({
        loading: false
      });
    }
  },

  // 映射隐患类型为中文
  mapHazardType(type) {
    const mapping = {
      'fire': '消防安全隐患',
      'electric': '电气安全隐患',
      'chemical': '化学品安全隐患',
      'mechanical': '机械设备安全隐患',
      'height': '高空作业安全隐患',
      'edge': '临边防护安全隐患',
      'environment': '环境安全隐患',
      'ppe': '个人防护装备隐患',
      'other': '其他安全隐患'
    };
    return mapping[type] || type;
  },

  // 映射状态为中文
  mapStatus(status) {
    const mapping = {
      'submitted': '待处理',
      'processing': '处理中',
      'completed': '已办结'
    };
    return mapping[status] || status;
  },

  // 从后端加载举报记录
  loadReports(sectionCode) {
    const app = getApp();

    if (!app.globalData.token) {
      console.log('未登录，无法加载举报记录');
      this.setData({
        loading: false
      });
      return;
    }

    this.setData({
      loading: true
    });
    wx.showNavigationBarLoading();

    wx.request({
      url: app.globalData.baseUrl + '/report/personal-reports',
      method: 'GET',
      header: {
        'Authorization': 'Bearer ' + app.globalData.token
      },
      data: {
        section: sectionCode
      },
      success: (res) => {
        this.setData({
          loading: false
        });

        if (res.data.success) {
          const { formatBeijing } = require('../../utils/time.js');
          console.log('获取举报记录成功:', res.data.data.reports);
          // 为每个举报添加中文映射
          const reportsWithMapping = res.data.data.reports.map(report => ({
            ...report,
            hazard_type_cn: this.mapHazardType(report.hazard_type),
            status_cn: this.mapStatus(report.status),
            created_at: formatBeijing(report.created_at),
            updated_at: formatBeijing(report.updated_at)
          }));

          // 前端双保险：仅保留本人举报
          const currentUser = app.globalData.currentUser || {};
          const myReports = reportsWithMapping.filter(r => r.reporter_id === currentUser.id || r.reporter_openid === currentUser.openid);

          this.setData({
            reports: myReports
          });
        } else {
          console.error('获取举报记录失败:', res.data.message);
          wx.showToast({
            title: '获取举报记录失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('获取举报记录请求失败:', err);
        this.setData({
          loading: false
        });
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
      },
      complete: () => {
        wx.hideNavigationBarLoading();
      }
    });
  },

  /**
   * 加载用户信息
   */
  loadUserInfo() {
    const app = getApp();
    const currentUser = app.globalData.currentUser;

    // 如果用户未授权，显示默认用户ID信息但不设置用户角色
    if (!currentUser) {
      this.setData({
        displayUserId: 'default_user',
        userRole: 'guest'
      });
      return;
    }

    const currentSection = app.globalData.currentSection || 'TJ01';

    this.setData({
      currentUser: currentUser,
      currentSection: currentSection
    });
  },

  goBack: function () {
    wx.navigateBack();
  },

  /**
   * 查看举报详情
   */
  viewReportDetail(e) {
    const id = e.currentTarget.dataset.id;
    console.log('点击举报详情，ID:', id);
    wx.navigateTo({
      url: `/pages/report-detail/report-detail?id=${id}&readonly=1`
    });
  }
})
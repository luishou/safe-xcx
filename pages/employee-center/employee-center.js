// pages/employee-center/employee-center.js
Page({
  data: {
    currentUser: {},
    currentSection: null,
    reports: [],
    loading: true
  },

  onLoad(options) {
    this.loadUserInfo();
    this.loadCurrentSection(options);
  },

  onShow() {
    this.loadUserInfo();
    this.loadCurrentSection();
  },

  loadCurrentSection(options = {}) {
    const app = getApp();
    const currentSection = app.globalData.currentSection;

    if (currentSection) {
      this.setData({ currentSection });
      this.loadReports(currentSection.section_code);
    } else if (options?.section) {
      const sectionCode = options.section;
      const sections = app.globalData.sections;
      if (sections?.length > 0) {
        const foundSection = sections.find(s => s.section_code === sectionCode);
        if (foundSection) {
          this.setData({ currentSection: foundSection });
          app.globalData.currentSection = foundSection;
          this.loadReports(sectionCode);
          return;
        }
      }
      this.setData({ loading: false });
    } else {
      this.setData({ loading: false });
    }
  },

  mapHazardType(type) {
    const mapping = {
      'fire': '消防安全隐患', 'electric': '电气安全隐患', 'chemical': '化学品安全隐患',
      'mechanical': '机械设备安全隐患', 'height': '高空作业安全隐患', 'edge': '临边防护安全隐患',
      'environment': '环境安全隐患', 'ppe': '个人防护装备隐患', 'other': '其他安全隐患'
    };
    return mapping[type] || type;
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

  loadReports(sectionCode) {
    const app = getApp();
    if (!app.globalData.token) {
      this.setData({ loading: false });
      return;
    }

    this.setData({ loading: true });
    wx.showNavigationBarLoading();

    wx.request({
      url: app.globalData.baseUrl + '/report/personal-reports',
      method: 'GET',
      header: { 'Authorization': 'Bearer ' + app.globalData.token },
      data: { section: sectionCode },
      success: (res) => {
        this.setData({ loading: false });
        if (res.data.success) {
          const { formatBeijing } = require('../../utils/time.js');
          const reportsWithMapping = res.data.data.reports.map(report => ({
            ...report,
            hazard_type_cn: this.mapHazardType(report.hazard_type),
            status_cn: this.mapStatus(report.status),
            created_at: formatBeijing(report.created_at),
            updated_at: formatBeijing(report.updated_at)
          }));

          const currentUser = app.globalData.currentUser || {};
          const myReports = reportsWithMapping.filter(r =>
            r.reporter_id === currentUser.id || r.reporter_openid === currentUser.openid
          );
          this.setData({ reports: myReports });
        } else {
          wx.showToast({ title: '获取举报记录失败', icon: 'none' });
        }
      },
      fail: () => {
        this.setData({ loading: false });
        wx.showToast({ title: '网络错误', icon: 'none' });
      },
      complete: () => wx.hideNavigationBarLoading()
    });
  },

  loadUserInfo() {
    const app = getApp();
    const currentUser = app.globalData.currentUser;

    if (!currentUser) {
      this.setData({ displayUserId: 'default_user', userRole: 'guest' });
      return;
    }

    this.setData({
      currentUser,
      currentSection: app.globalData.currentSection || 'TJ01'
    });
  },

  goBack: function () { wx.navigateBack(); },

  viewReportDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/report-detail/report-detail?id=${id}&readonly=1` });
  }
})